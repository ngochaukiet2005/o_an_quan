<template>
  <div class="room-page">
    <h1>Phòng: {{ roomId }}</h1>
    <p>
      Bạn là: <strong>{{ playerName }}</strong>
    </p>

    <!-- ===== PLAYER LIST ===== -->
    <PlayerInfo
      :players="players"
      :currentTurnId="currentTurnId"
      class="player-box"
    />

    <!-- ===== GAME BOARD ===== -->
    <GameBoard
      v-if="board.length"
      :board="board"
      :players="players"
      :currentTurnId="currentTurnId"
      :playerId="playerId"
      @move="handleMove"
    />

    <!-- ===== CHAT ===== -->
    <ChatBox :messages="messages" @send="sendMessage" class="chat-box" />
    <DirectionModal
      :show="showDirectionModal"
      @choose="onDirectionChosen"
      @close="showDirectionModal = false"
    />
    <NotificationModal
      :show="showGameOverModal"
      :title="gameOverTitle"
      :message="gameOverMessage"
      @close="goToHome"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute } from "vue-router";
import socketService from "../services/socketService";

import ChatBox from "../components/ChatBox.vue";
import PlayerInfo from "../components/PlayerInfo.vue";
import GameBoard from "../components/GameBoard.vue";
import DirectionModal from "../components/DirectionModal.vue"; // <-- THÊM MỚI
import NotificationModal from "../components/NotificationModal.vue"; // <-- THÊM MỚI
import { useRouter } from "vue-router"; // <-- THÊM MỚI

/* ===============================
            STATE
================================= */

const route = useRoute();

const roomId = route.params.roomId;
const playerName = route.query.playerName;
const router = useRouter();
const playerId = ref("");
const playerSymbol = ref("");

const players = ref([]);
const board = ref([]);

const currentTurnId = ref("");

const messages = ref([]);
const showDirectionModal = ref(false);
const selectedCellIndex = ref(null);
const showGameOverModal = ref(false);
const gameOverTitle = ref('');
const gameOverMessage = ref('');
/* ===============================
        SOCKET HANDLERS
================================= */

onMounted(() => {
  console.log("▶ Join room:", roomId, "as", playerName);

  // Gửi join_room (đúng theo backend của bạn)
  socketService.getSocket().emit("room:join", {
    roomId,
    playerName,
  });

  // Backend trả về khi join thành công
  socketService.getSocket().on("room:joined", (data) => {
    console.log("✔ room:joined", data);
    playerId.value = data.playerId;
    playerSymbol.value = data.playerSymbol;
  });

  // Backend gửi state game
  socketService.getSocket().on("update_game_state", (state) => {
    console.log("📌 update_game_state", state);

    board.value = state.board;
    players.value = state.players;
    currentTurnId.value = state.currentTurnId;
  });

  // Chat message mới
  socketService.getSocket().on("chat:receive", (msg) => {
    messages.value.push(msg);
  });

  // Người chơi mới vào phòng
  socketService.getSocket().on("room:player-joined", (data) => {
    messages.value.push({
      senderName: "Hệ thống",
      message: `${data.name} đã vào phòng.`,
    });
  });

  socketService.getSocket().on("error", (err) => {
    alert(err.message);
  socketService.getSocket().on("game_over", onGameOver);
  });
});

onBeforeUnmount(() => {
  socketService.offAll();
});

/* ===============================
        USER ACTIONS
================================= */

// gửi nước đi
function handleMove(index) {
  socketService.makeMove({
    roomId,
    playerId: playerId.value,
    startIndex: index,
  });
}

// gửi chat
function sendMessage(text) {
  socketService.sendMessage(roomId, playerName.value, text);
}
// === THÊM MỚI: Các hàm xử lý ===

// 1. Hàm này được gọi khi click vào ô cờ
function handleMove(index) {
  // (Bạn có thể thêm kiểm tra `isMyTurn` ở đây nếu muốn)

  // Không gửi đi vội, mà mở modal chọn hướng
  selectedCellIndex.value = index;
  showDirectionModal.value = true;
}

// 2. Hàm này được gọi khi người dùng chọn hướng (Trái/Phải)
function onDirectionChosen(direction) {
  showDirectionModal.value = false;
  if (selectedCellIndex.value === null || !direction) {
    return;
  }

  // Đây mới là lúc gửi nước đi lên server
  socketService.makeMove({
    cellIndex: selectedCellIndex.value,
    direction: direction, // 'left' hoặc 'right'
  });

  selectedCellIndex.value = null;
}

// 3. Hàm xử lý khi game kết thúc
const onGameOver = (data) => {
  console.log('Game Over:', data);

  let winnerName = 'Hòa!';
  const p1 = players.value[0];
  const p2 = players.value[1];

  if (data.winner === p1.id) winnerName = `${p1.name} thắng!`;
  if (data.winner === p2.id) winnerName = `${p2.name} thắng!`;

  gameOverTitle.value = winnerName;
  gameOverMessage.value = `${data.gameMessage} | Điểm cuối: P1 (${data.finalScores.player1}) - P2 (${data.finalScores.player2})`;
  showGameOverModal.value = true;
};

// 4. Hàm để về trang chủ
const goToHome = () => {
  // (Bạn có thể cần reset state ở đây)
  router.push('/');
};
</script>

<style scoped>
.room-page {
  padding: 20px 30px;
}

.player-box {
  margin-bottom: 20px;
}

.chat-box {
  margin-top: 30px;
}
</style>
