<template>
  <div class="room-page">
    <h1>Phòng: {{ roomId }}</h1>
    <p>
      Bạn là: <strong>{{ playerName }}</strong> (ID: {{ playerId }})
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
    <div v-else class="loading-board">
      Đang chờ dữ liệu bàn cờ từ server...
    </div>

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
// Thêm 'computed'
import { ref, onMounted, onBeforeUnmount, computed } from "vue"; 
import { useRoute, useRouter } from "vue-router"; // Thêm useRouter
import socketService from "../services/socketService";

import ChatBox from "../components/ChatBox.vue";
import PlayerInfo from "../components/PlayerInfo.vue";
import GameBoard from "../components/GameBoard.vue";
// Thêm 2 Modal
import DirectionModal from "../components/DirectionModal.vue";
import NotificationModal from "../components/NotificationModal.vue";

/* ===============================
            STATE
================================= */

const route = useRoute();
const router = useRouter(); // Khởi tạo router

const roomId = route.params.roomId;
const playerName = route.query.playerName;

const playerId = ref("");
const playerSymbol = ref("");
const players = ref([]);
const board = ref([]); // Bắt đầu là mảng rỗng
const currentTurnId = ref(null);
const messages = ref([]);

// State cho Modals
const showDirectionModal = ref(false);
const selectedCellIndex = ref(null);
const showGameOverModal = ref(false);
const gameOverTitle = ref('');
const gameOverMessage = ref('');

/* ===============================
        SOCKET LISTENERS
================================= */

/**
 * (HÀM MỚI)
 * Hàm này xử lý cập nhật state từ server.
 * Nó dùng cho cả 'game_start' và 'update_game_state'.
 */
function handleStateUpdate(state) {
  console.log("📌 Nhận state (từ " + (state.nextTurnPlayerId ? 'update' : 'game_start') + "):", state);

  // 1. Cập nhật bàn cờ
  if (state.board) {
    board.value = state.board;
  }

  // 2. Cập nhật người chơi và điểm số
  if (state.players) {
    players.value = state.players.map(p => ({
      ...p,
      // Tính toán điểm số từ backend
      score: (p.symbol === 'X' ? state.scores?.player1 : state.scores?.player2)
        ? (p.symbol === 'X' 
            ? (state.scores.player1.quan * 5 + state.scores.player1.dan) 
            : (state.scores.player2.quan * 5 + state.scores.player2.dan))
        : 0,
    }));
  }
  
  // 3. Cập nhật lượt đi
  // (Backend gửi 'startingPlayerId' khi game_start,
  //  và 'nextTurnPlayerId' khi update_game_state)
  currentTurnId.value = state.nextTurnPlayerId || state.startingPlayerId; 
  
  // 4. Cập nhật tin nhắn hệ thống
  if (state.gameMessage) {
     messages.value.push({ senderName: "Hệ thống", message: state.gameMessage });
  }
}

onMounted(() => {
  socketService.requestGameState();
  // Trả về khi join thành công
  socketService.getSocket().on("room:joined", (data) => {
    console.log("✔ room:joined", data);
    playerId.value = data.playerId;
    playerSymbol.value = data.playerSymbol;
  });

  // === SỬA LỖI CHÍNH LÀ Ở ĐÂY ===
  // 1. Lắng nghe trạng thái BAN ĐẦU
  socketService.getSocket().on("game_start", handleStateUpdate);
  // 2. Lắng nghe trạng thái CẬP NHẬT
  socketService.getSocket().on("update_game_state", handleStateUpdate);
  // ===============================

  // Lắng nghe game over
  socketService.getSocket().on("game_over", onGameOver);

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
    // Cập nhật lại danh sách người chơi nếu cần
    if (players.value.length < 2) {
      // (Backend nên gửi lại list player trong 'game_start' hoặc 'update_game_state')
    }
  });

  // Lỗi từ server
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

// 1. Nhấp vào ô cờ (từ GameBoard.vue)
function handleMove(index) {
  // Kiểm tra có đúng lượt mình không
  if (currentTurnId.value !== playerId.value) {
    alert("Chưa đến lượt của bạn!");
    return;
  }
  
  // (Bạn có thể thêm kiểm tra ô hợp lệ ở đây)
  
  // Mở modal chọn hướng
  selectedCellIndex.value = index;
  showDirectionModal.value = true;
}

// 2. Đã chọn hướng (từ DirectionModal.vue)
function onDirectionChosen(direction) {
  showDirectionModal.value = false;
  if (selectedCellIndex.value === null || !direction) {
    return;
  }

  // Gửi nước đi lên server
  socketService.makeMove({
    cellIndex: selectedCellIndex.value,
    direction: direction, // 'left' hoặc 'right'
  });

  selectedCellIndex.value = null;
}

// 3. Xử lý Game Over (từ server)
const onGameOver = (data) => {
  console.log('Game Over:', data);

  let winnerName = 'Hòa!';
  const p1 = players.value.find(p => p.symbol === 'X');
  const p2 = players.value.find(p => p.symbol === 'O');

  if (p1 && data.winner === p1.id) winnerName = `${p1.name} thắng!`;
  if (p2 && data.winner === p2.id) winnerName = `${p2.name} thắng!`;
  
  gameOverTitle.value = winnerName;
  gameOverMessage.value = `${data.gameMessage} | Điểm cuối: P1 (${data.finalScores.player1}) - P2 (${data.finalScores.player2})`;
  showGameOverModal.value = true;
};

// 4. Về trang chủ (từ NotificationModal.vue)
const goToHome = () => {
  router.push('/');
};

// 5. Gửi tin nhắn (từ ChatBox.vue)
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
.loading-board {
  padding: 40px;
  text-align: center;
  font-size: 1.2em;
  color: #666;
  background: #f0f0f0;
  border-radius: 10px;
}
</style>