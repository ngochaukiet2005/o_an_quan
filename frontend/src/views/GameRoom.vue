<template>
  <div class="room-page">
    <div class="room-header">
      <h1>Phòng: {{ roomId }}</h1>
      <p>
        Bạn là: <strong>{{ playerName }}</strong> (ID: {{ playerId }})
      </p>
    </div>

    <div class="game-layout">
      <div class="main-column">
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
      </div>

      <div class="side-column">
        <ChatBox :messages="messages" @send="sendMessage" class="chat-box" />
      </div>
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
  </div>
</template>

<script setup>
// THÊM 'computed' và 'watch'
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import socketService from "../services/socketService";

import ChatBox from "../components/ChatBox.vue";
import PlayerInfo from "../components/PlayerInfo.vue";
import GameBoard from "../components/GameBoard.vue";
import DirectionModal from "../components/DirectionModal.vue";
import NotificationModal from "../components/NotificationModal.vue";

/* ===============================
            STATE
================================= */

const route = useRoute();
const router = useRouter();

// Lấy roomId và playerName một cách "phản ứng" (reactive)
const roomId = computed(() => route.params.roomId);
const playerName = computed(() => route.query.playerName);

// Lấy playerId từ service (SỬA LỖI 2 & 3)
// Đây là một ref, nó sẽ tự động cập nhật khi socket kết nối lại
const playerId = socketService.getSocketIdReactive();

const playerSymbol = ref("");
const players = ref([]);
const board = ref([]);
const currentTurnId = ref(null);
const messages = ref([]);

// State cho Modals
const showDirectionModal = ref(false);
const selectedCellIndex = ref(null);
const showGameOverModal = ref(false);
const gameOverTitle = ref("");
const gameOverMessage = ref("");

/* ===============================
        HÀM XỬ LÝ
================================= */

// (Hàm này giữ nguyên)
function handleStateUpdate(state) {
  console.log("📌 Nhận state:", state);

  if (state.board) {
    board.value = state.board;
  }

  if (state.players && state.scores) {
    players.value = state.players.map((p) => {
      const scoreData = p.symbol === "X" ? state.scores.player1 : state.scores.player2;
      return {
        ...p,
        score: scoreData ? (scoreData.quan * 5 + scoreData.dan) : 0,
      };
    });
  }

  currentTurnId.value = state.nextTurnPlayerId || state.startingPlayerId;

  if (state.gameMessage) {
    messages.value.push({ senderName: "Hệ thống", message: state.gameMessage });
  }
}

// Tách các hàm xử lý sự kiện ra riêng
const onChatReceive = (msg) => {
  messages.value.push(msg);
};

const onPlayerJoined = (data) => {
  messages.value.push({
    senderName: "Hệ thống",
    message: `${data.name} đã vào phòng.`,
  });
};

const onError = (err) => {
  alert(err.message);
  console.error(err.message);
};

// Hàm dọn dẹp state (SỬA LỖI 1)
function resetState() {
  board.value = [];
  players.value = [];
  currentTurnId.value = null;
  messages.value = [];
  playerSymbol.value = "";
  showDirectionModal.value = false;
  selectedCellIndex.value = null;
  showGameOverModal.value = false;
}

// Hàm cài đặt listener
function setupSocketListeners() {
  socketService.offAll(); // Xóa listener cũ trước
  socketService.getSocket().on("game_start", handleStateUpdate);
  socketService.getSocket().on("update_game_state", handleStateUpdate);
  socketService.getSocket().on("game_over", onGameOver);
  socketService.getSocket().on("chat:receive", onChatReceive);
  socketService.getSocket().on("room:player-joined", onPlayerJoined);
  socketService.getSocket().on("error", onError);
}

/* ===============================
        VÒNG ĐỜI (LIFECYCLE)
================================= */

onMounted(() => {
  resetState(); // Dọn dẹp state cũ
  setupSocketListeners(); // Gắn listener mới
  socketService.requestGameState(); // Yêu cầu state của phòng
});

onBeforeUnmount(() => {
  socketService.offAll();
});

// SỬA LỖI 1: Theo dõi khi roomId thay đổi
// (Khi điều hướng từ /room/A -> /room/B)
watch(roomId, (newRoomId, oldRoomId) => {
  if (newRoomId && newRoomId !== oldRoomId) {
    console.log(`Đổi phòng: ${oldRoomId} -> ${newRoomId}. Đang reset...`);
    resetState();
    setupSocketListeners();
    socketService.requestGameState();
  }
});


/* ===============================
        USER ACTIONS
================================= */

// 1. Nhấp vào ô cờ (từ GameBoard.vue)
function handleMove(index) {
  if (currentTurnId.value !== playerId.value) {
    alert("Chưa đến lượt của bạn!");
    return;
  }
  selectedCellIndex.value = index;
  showDirectionModal.value = true;
}

// 2. Đã chọn hướng (từ DirectionModal.vue)
function onDirectionChosen(direction) {
  showDirectionModal.value = false;
  if (selectedCellIndex.value === null || !direction) {
    return;
  }
  socketService.makeMove({
    cellIndex: selectedCellIndex.value,
    direction: direction,
  });
  selectedCellIndex.value = null;
}

// 3. Xử lý Game Over (từ server)
const onGameOver = (data) => {
  console.log("Game Over:", data);
  let winnerName = "Hòa!";
  
  // Lấy tên người chơi một cách an toàn
  const p1 = players.value.find((p) => p.symbol === "X");
  const p2 = players.value.find((p) => p.symbol === "O");
  const p1Name = p1 ? p1.name : "Người chơi 1";
  const p2Name = p2 ? p2.name : "Người chơi 2";

  if (p1 && data.winner === p1.id) winnerName = `${p1Name} thắng!`;
  if (p2 && data.winner === p2.id) winnerName = `${p2Name} thắng!`;

  gameOverTitle.value = winnerName;
  gameOverMessage.value = `${data.gameMessage} | Điểm cuối: ${p1Name} (${data.finalScores.player1}) - ${p2Name} (${data.finalScores.player2})`;
  showGameOverModal.value = true;
};

// 4. Về trang chủ (từ NotificationModal.vue)
const goToHome = () => {
  router.push("/");
};

// 5. Gửi tin nhắn (từ ChatBox.vue)
function sendMessage(text) {
  // Đảm bảo playerName là giá trị (không phải computed object)
  socketService.sendMessage(roomId.value, playerName.value, text);
}
</script>

<style scoped>
.room-page {
  max-width: 1300px; /* Tăng độ rộng để chứa 2 cột */
  margin: 30px auto 30px; /* Giảm lề trên */
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}
.room-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
  margin-bottom: 20px;
}
.room-header h1 {
  margin-top: 0;
}

/* BỐ CỤC 2 CỘT MỚI */
.game-layout {
  display: flex;
  flex-direction: row;
  gap: 24px;
  align-items: flex-start;
}

.main-column {
  flex: 3; /* Cột game chiếm 3 phần */
  min-width: 0;
}

.side-column {
  flex: 1; /* Cột chat chiếm 1 phần */
  min-width: 300px;
  
  /* Cố định cột chat khi cuộn */
  position: sticky;
  top: 90px; /* 70px (navbar) + 20px (padding) */
}
/* =================== */

.player-box {
  margin-bottom: 20px;
}
.chat-box {
  margin-top: 0; /* Xóa lề cũ */
  width: 100%;
}
.loading-board {
  padding: 40px;
  text-align: center;
  font-size: 1.2em;
  color: #666;
  background: #f0f0f0;
  border-radius: 10px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>