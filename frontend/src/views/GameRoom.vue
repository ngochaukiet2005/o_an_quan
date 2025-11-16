<template>
  <div class="room-page">
    <div class="room-header">
      <div class="header-info">
        <h1>Phòng: {{ roomId }}</h1>
        <p>
          Bạn là: <strong>{{ playerName }}</strong> (ID: {{ playerId }})
        </p>
      </div>
      <button @click="onLeaveRoomClick" class="leave-button">Thoát phòng</button>
    </div>

    <div v-if="gamePhase === 'playing'" class="game-layout">
      <div class="main-column">
        <div v-if="timerValue !== null" class="timer-display">
          Thời gian còn lại: <span>{{ timerValue }}s</span>
        </div>

        <div v-if="rpsResult" class="rps-result-message">
          {{ rpsResult }}
        </div>

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

    <div v-if="gamePhase === 'loading' || gamePhase === 'rps'" class="loading-board">
      <span v-if="gamePhase === 'loading'">Đang tải phòng...</span>
      <span v-if="gamePhase === 'rps'">Đang chờ Oẳn tù tì...</span>
    </div>

    <RpsModal
      :show="gamePhase === 'rps'"
      :is-retry="isRpsRetry"
      @choose="handleRpsChoice"
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
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import socketService from "../services/socketService";

// Import components
import ChatBox from "../components/ChatBox.vue";
import PlayerInfo from "../components/PlayerInfo.vue";
import GameBoard from "../components/GameBoard.vue";
import DirectionModal from "../components/DirectionModal.vue";
import NotificationModal from "../components/NotificationModal.vue";
import RpsModal from "../components/RpsModal.vue"; // <-- IMPORT MODAL MỚI

/* ===============================
            STATE
================================= */

const route = useRoute();
const router = useRouter();

const roomId = computed(() => route.params.roomId);
const playerName = computed(() => route.query.playerName);
const playerId = socketService.getSocketIdReactive();

// --- State mới ---
const gamePhase = ref("loading"); // 'loading', 'rps', 'playing', 'game_over'
const isRpsRetry = ref(false);
const rpsResult = ref(null); // Lưu tin nhắn kết quả RPS
const timerValue = ref(null);
const timerInterval = ref(null);
// --- State cũ ---
const players = ref([]);
const board = ref([]);
const currentTurnId = ref(null);
const messages = ref([]);
const showDirectionModal = ref(false);
const selectedCellIndex = ref(null);
const showGameOverModal = ref(false);
const gameOverTitle = ref("");
const gameOverMessage = ref("");

/* ===============================
        HÀM XỬ LÝ SỰ KIỆN
================================= */

// Xử lý khi nhận state (từ 'game_start' hoặc 'update_game_state')
function handleStateUpdate(state) {
  console.log("📌 Nhận state:", state);

  gamePhase.value = "playing"; // Chuyển sang trạng thái chơi game

  if (state.board) {
    board.value = state.board;
  }

  if (state.players && state.scores) {
    players.value = state.players.map((p) => {
      const scoreData =
        p.symbol === "X" ? state.scores.player1 : state.scores.player2;
      return {
        ...p,
        score: scoreData ? scoreData.quan * 5 + scoreData.dan : 0,
      };
    });
  }

  currentTurnId.value = state.nextTurnPlayerId || state.startingPlayerId;

  if (state.gameMessage) {
    messages.value.push({ senderName: "Hệ thống", message: state.gameMessage });
  }

  // Xử lý tin nhắn kết quả RPS (chỉ chạy 1 lần khi game_start)
  if (state.rpsResult) {
    const { p1Choice, p2Choice, winnerId } = state.rpsResult;
    const p1 = players.value.find((p) => p.symbol === "X");
    const p2 = players.value.find((p) => p.symbol === "O");
    
    if (p1 && p2) {
      let winnerName = winnerId === p1.id ? p1.name : p2.name;
      rpsResult.value = `${p1.name} chọn ${p1Choice}, ${p2.name} chọn ${p2Choice}. ${winnerName} đi trước!`;

      // Tự động xóa tin nhắn sau 5 giây
      setTimeout(() => {
        rpsResult.value = null;
      }, 5000);
    }
  }
}

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
const onKicked = (data) => {
  alert(data.message);
  router.push("/play");
};

// --- HÀM MỚI CHO LOGIC MỚI ---
function onStartRps(data) {
  isRpsRetry.value = data.isRetry;
  gamePhase.value = "rps";
}

function onTimerStart(data) {
  clearInterval(timerInterval.value);
  timerValue.value = data.duration;

  timerInterval.value = setInterval(() => {
    if (timerValue.value !== null && timerValue.value > 0) {
      timerValue.value--;
    } else {
      clearInterval(timerInterval.value);
      timerValue.value = 0; // Hiển thị 0s trước khi server tự chuyển
    }
  }, 1000);
}

function onTimerClear() {
  clearInterval(timerInterval.value);
  timerValue.value = null;
}
// -----------------------------

function resetState() {
  board.value = [];
  players.value = [];
  currentTurnId.value = null;
  messages.value = [];
  showDirectionModal.value = false;
  selectedCellIndex.value = null;
  showGameOverModal.value = false;

  // Reset state mới
  clearInterval(timerInterval.value);
  timerValue.value = null;
  gamePhase.value = "loading";
  isRpsRetry.value = false;
  rpsResult.value = null;
}

function setupSocketListeners() {
  socketService.offAll();

  socketService.getSocket().on("game:start_rps", onStartRps);
  socketService.getSocket().on("game_start", handleStateUpdate);
  socketService.getSocket().on("update_game_state", handleStateUpdate);

  socketService.getSocket().on("timer:start", onTimerStart);
  socketService.getSocket().on("timer:clear", onTimerClear);

  socketService.getSocket().on("game_over", onGameOver);
  socketService.getSocket().on("chat:receive", onChatReceive);
  socketService.getSocket().on("room:player-joined", onPlayerJoined);
  socketService.getSocket().on("error", onError);
  socketService.getSocket().on("kicked_to_menu", onKicked);
}

/* ===============================
        VÒNG ĐỜI (LIFECYCLE)
================================= */

onMounted(() => {
  resetState();
  setupSocketListeners();
  socketService.requestGameState();
});

onBeforeUnmount(() => {
  socketService.leaveRoom();
  socketService.offAll();
});

watch(roomId, (newRoomId, oldRoomId) => {
  if (newRoomId && newRoomId !== oldRoomId) {
    resetState();
    setupSocketListeners();
    socketService.requestGameState();
  }
});

/* ===============================
        USER ACTIONS
================================= */

function onLeaveRoomClick() {
  const confirmed = confirm(
    "Bạn chắc chắn muốn rời phòng? Bạn sẽ bị xử thua."
  );
  if (confirmed) {
    router.push("/play");
  }
}

// (HÀM MỚI) Gửi lựa chọn Oẳn tù tì
function handleRpsChoice(choice) {
  socketService.submitRps(choice);
  // UI "Đang chờ" được xử lý bên trong RpsModal.vue
}

function handleMove(index) {
  if (currentTurnId.value !== playerId.value) {
    alert("Chưa đến lượt của bạn!");
    return;
  }
  selectedCellIndex.value = index;
  showDirectionModal.value = true;
}

function onDirectionChosen(direction) {
  showDirectionModal.value = false;
  if (selectedCellIndex.value === null || !direction) {
    return;
  }
  // Timer sẽ được server xóa
  socketService.makeMove({
    cellIndex: selectedCellIndex.value,
    direction: direction,
  });
  selectedCellIndex.value = null;
}

const onGameOver = (data) => {
  gamePhase.value = "game_over"; // Dừng game
  onTimerClear(); // Xóa timer

  console.log("Game Over:", data);
  let winnerName = "Hòa!";

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

const goToHome = () => {
  router.push("/");
};

function sendMessage(text) {
  socketService.sendMessage(roomId.value, playerName.value, text);
}
</script>

<style scoped>
.room-page {
  max-width: 1300px;
  margin: 30px auto 30px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
  margin-bottom: 20px;
}
.room-header h1 {
  margin-top: 0;
}
.header-info {
  flex-grow: 1;
}
.header-info p {
  margin-bottom: 0;
}

.leave-button {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 15px;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
  margin-left: 20px;
}
.leave-button:hover {
  background-color: #dc2626;
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
  position: sticky;
  top: 90px; /* 70px (navbar) + 20px (padding) */
}
/* =================== */

.player-box {
  margin-bottom: 20px;
}
.chat-box {
  margin-top: 0;
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

/* === STYLE MỚI CHO TIMER & RPS RESULT === */
.timer-display {
  font-size: 1.25rem;
  font-weight: bold;
  color: #333;
  background-color: #fffbeB;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 10px 16px;
  margin-bottom: 20px;
  text-align: center;
}
.timer-display span {
  color: #d97706;
  font-size: 1.5rem;
}

.rps-result-message {
  font-size: 1.1rem;
  font-weight: 500;
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  padding: 10px 16px;
  margin-bottom: 20px;
  text-align: center;
}
</style>