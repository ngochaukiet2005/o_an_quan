<template>
  <div class="room-page">
    <h1>Phòng: {{ roomId }}</h1>
    <p>
      Bạn là: <strong>{{ playerName }}</strong>
    </p>

    <PlayerInfo
      :players="players"
      :currentTurnId="currentTurnId"
      class="player-box"
    />

    <GameBoard
      v-if="board.length"
      :board="board"
      :players="players"
      :currentTurnId="currentTurnId"
      :playerId="playerId"
      @move="handleMove"
    />
    
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

    <ChatBox :messages="messages" @send="sendMessage" class="chat-box" />
  </div>
</template>

<script setup>
// --- SỬA 1: Thêm 'computed' ---
import { ref, onMounted, onBeforeUnmount, computed } from "vue"; 
// --- SỬA 2: Thêm 3 import này ---
import { useRouter } from "vue-router"; 
import DirectionModal from "../components/DirectionModal.vue";
import NotificationModal from "../components/NotificationModal.vue";

import { useRoute } from "vue-router";
import socketService from "../services/socketService";

import ChatBox from "../components/ChatBox.vue";
import PlayerInfo from "../components/PlayerInfo.vue";
import GameBoard from "../components/GameBoard.vue";

/* ===============================
            STATE
================================= */

const route = useRoute();
// --- SỬA 3: Thêm router ---
const router = useRouter(); 

const roomId = route.params.roomId;
const playerName = route.query.playerName;

const playerId = ref("");
const playerSymbol = ref("");
const players = ref([]);
const board = ref([]);
const currentTurnId = ref(null);
const messages = ref([]);

// --- SỬA 4: Thêm state cho Modals ---
const showDirectionModal = ref(false);
const selectedCellIndex = ref(null);
const showGameOverModal = ref(false);
const gameOverTitle = ref('');
const gameOverMessage = ref('');
// ------------------------------------

/* ===============================
        SOCKET LISTENERS
================================= */

// --- SỬA 5: Tạo hàm xử lý state chung ---
// (Hàm này sẽ dùng cho cả 'game_start' và 'update_game_state')
function handleStateUpdate(state) {
  console.log("📌 Nhận state:", state);

  // Cập nhật tất cả state từ server
  board.value = state.board;
  players.value = state.players.map(p => ({
    ...p,
    // Gán điểm cho PlayerInfo (nếu backend gửi 'scores')
    score: (p.symbol === 'X' ? state.scores?.player1 : state.scores?.player2) 
           ? (p.symbol === 'X' ? (state.scores.player1.quan * 5 + state.scores.player1.dan) 
                              : (state.scores.player2.quan * 5 + state.scores.player2.dan))
           : 0,
  }));
  
  // Backend cũ gửi `nextTurnPlayerId`, backend mới gửi `startingPlayerId`
  currentTurnId.value = state.nextTurnPlayerId || state.startingPlayerId; 
  socketService.getSocket().on("update_game_state", handleStateUpdate);

  // === THÊM DÒNG NÀY ĐỂ NHẬN BÀN CỜ KHI MỚI VÀO ===
  socketService.getSocket().on("game_start", handleStateUpdate);
  // ===============================================
  // Cập nhật tin nhắn (nếu có)
  if (state.gameMessage) {
     messages.value.push({ senderName: "Hệ thống", message: state.gameMessage });
  }
}
// ------------------------------------

onMounted(() => {
  // Trả về khi join thành công
  socketService.getSocket().on("room:joined", (data) => {
    console.log("✔ room:joined", data);
    playerId.value = data.playerId;
    playerSymbol.value = data.playerSymbol;
  });

  // --- SỬA 6: Sửa lại listener ---
  // Backend gửi state game (SỰ KIỆN CŨ)
  socketService.getSocket().on("update_game_state", handleStateUpdate);

  // Backend gửi state game (SỰ KIỆN MỚI KHI VÀO PHÒNG)
  socketService.getSocket().on("game_start", handleStateUpdate);
  // ---------------------------------
  
  // --- SỬA 7: Thêm listener cho game over ---
  socketService.getSocket().on("game_over", onGameOver);
  // ---------------------------------

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
  });
});

onBeforeUnmount(() => {
  socketService.offAll();
});

/* ===============================
        USER ACTIONS
================================= */

// --- SỬA 8: Đây là hàm handleMove (mở modal) ---
function handleMove(index) {
  // Kiểm tra có đúng lượt mình không
  if (currentTurnId.value !== playerId.value) {
    alert("Chưa đến lượt của bạn!");
    return;
  }
  
  // (Bạn có thể thêm kiểm tra ô hợp lệ ở đây)
  
  selectedCellIndex.value = index;
  showDirectionModal.value = true;
}
// -----------------------------------------

// --- SỬA 9: Đây là hàm gửi nước đi LÊN SERVER ---
function onDirectionChosen(direction) {
  showDirectionModal.value = false;
  if (selectedCellIndex.value === null || !direction) {
    return;
  }

  // Gửi sự kiện 'make_move' (backend đang lắng nghe cái này)
  socketService.makeMove({
    cellIndex: selectedCellIndex.value,
    direction: direction, // 'left' hoặc 'right'
  });

  selectedCellIndex.value = null;
}
// -----------------------------------------

// --- SỬA 10: Thêm các hàm xử lý Game Over ---
const onGameOver = (data) => {
  console.log('Game Over:', data);

  let winnerName = 'Hòa!';
  const p1 = players.value[0];
  const p2 = players.value[1];

  if (p1 && data.winner === p1.id) winnerName = `${p1.name} thắng!`;
  if (p2 && data.winner === p2.id) winnerName = `${p2.name} thắng!`;
  
  gameOverTitle.value = winnerName;
  gameOverMessage.value = `${data.gameMessage} | Điểm cuối: P1 (${data.finalScores.player1}) - P2 (${data.finalScores.player2})`;
  showGameOverModal.value = true;
};

const goToHome = () => {
  router.push('/');
};
// -----------------------------------------

function sendMessage(text) {
  socketService.sendMessage(roomId, playerName, text);
}
</script>

<style scoped>
.room-page {
  max-width: 900px;
  margin: 100px auto 30px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}
.player-box {
  margin-bottom: 20px;
}
.chat-box {
  margin-top: 25px;
}
</style>