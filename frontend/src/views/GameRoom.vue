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
        
        <div v-if="rpsResult" class="rps-result-message">
          {{ rpsResult }}
        </div>

        <PlayerInfo
          :players="players"
          :currentTurnId="currentTurnId"
          :timerValue="timerValue" 
          class="player-box"
        />

        <GameBoard
          ref="gameBoardRef"
          v-if="board.length"
          :board="board"
          :players="players"
          :currentTurnId="currentTurnId"
          :playerId="playerId"
          @move="handleMove"
          @score-update="handleLiveScoreUpdate"
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
      :key="rpsRound" :show="gamePhase === 'rps'"
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
    <RpsAnimation
      v-if="gamePhase === 'animation'" :myChoice="rpsChoices.my"
      :oppChoice="rpsChoices.opp"
      @animation-finished="handleRpsAnimationEnd"
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
import RpsModal from "../components/RpsModal.vue";
import RpsAnimation from '@/components/RpsAnimation.vue';

// ===============================
//           STATE
// ===============================
const route = useRoute();
const router = useRouter();

// Thông tin phòng & người chơi
const roomId = computed(() => route.params.roomId);
const playerName = computed(() => route.query.playerName);
const playerId = socketService.getSocketIdReactive();

// Ref tới Component con
const gameBoardRef = ref(null);

// State Game Logic
const players = ref([]);
const board = ref([]);
const currentTurnId = ref(null);
const messages = ref([]);
const gamePhase = ref("loading");

// State Oẳn tù tì (RPS)
const rpsRound = ref(0);
const isRpsRetry = ref(false);
const rpsResult = ref(null);
const showRpsAnimation = ref(false);
const rpsChoices = ref({ my: null, opp: null });
const rpsResultData = ref(null);
const animationFinished = ref(false);
const pendingGameState = ref(null); 

// State Timer & Animation Control
const timerValue = ref(null);
const timerInterval = ref(null);
const isAnimating = ref(false); // Kiểm soát xem có đang diễn hoạt không
const pendingTimerData = ref(null); // Lưu timer của lượt sau nếu đang diễn hoạt

// State Modal
const showDirectionModal = ref(false);
const selectedCellIndex = ref(null);
const showGameOverModal = ref(false);
const gameOverTitle = ref("");
const gameOverMessage = ref("");

// ===============================
//        SOCKET LISTENERS
// ===============================
function setupSocketListeners() {
  socketService.offAll();
  const socket = socketService.getSocket();

  // 1. Xử lý nhận State Game
  const onGameStateHandler = async (data) => {
    console.log("📥 Nhận game state:", data);

    if (data.moveHistory && data.moveHistory.length > 0) {
      
      if (gamePhase.value === 'animation' && !animationFinished.value) {
        pendingGameState.value = data;
        return;
      }

      if (gameBoardRef.value) {
        // 👇👇👇 BẮT ĐẦU ĐOẠN CODE MỚI 👇👇👇
        // Tính toán: Lấy điểm cuối cùng - tổng điểm ăn được = điểm lúc bắt đầu
        // Giúp hiển thị ngay việc bị trừ điểm (nếu có vay/gây giống)
        const actingPlayerId = data.startingPlayerId || currentTurnId.value;
        const earnedPoints = calculateTurnPoints(data.moveHistory);
        
        const pIndex = players.value.findIndex(p => p.id === actingPlayerId);
        
        if (pIndex !== -1) {
           // Lấy điểm cuối cùng Server gửi về để tính ngược
           let finalScoreObj = null;
           if (players.value[pIndex].symbol === 'X') finalScoreObj = data.scores.player1;
           else finalScoreObj = data.scores.player2;
           
           const finalTotalScore = finalScoreObj ? (finalScoreObj.quan * 5 + finalScoreObj.dan) : 0;
           
           // Cập nhật điểm lùi lại để chuẩn bị cộng dần lên khi ăn
           players.value[pIndex].score = finalTotalScore - earnedPoints;
        }
        // 👆👆👆 KẾT THÚC ĐOẠN CODE MỚI 👆👆👆
        // BẮT ĐẦU DIỄN HOẠT
        isAnimating.value = true;
        console.log("🎬 Bắt đầu diễn hoạt...");
        
        // Chạy animation (await đợi cho đến khi xong hết)
        await gameBoardRef.value.runMoveAnimation(data.moveHistory);
        
        // KẾT THÚC DIỄN HOẠT
        isAnimating.value = false;
        console.log("✅ Diễn hoạt xong.");
        
        // Nếu có timer của lượt sau đang chờ, giờ mới cho hiện lên
        if (pendingTimerData.value) {
            console.log("⏰ Kích hoạt timer lượt mới (sau khi animation xong)");
            startTimerCountDown(pendingTimerData.value);
            pendingTimerData.value = null;
        }
      }
    }

    // Cập nhật dữ liệu bàn cờ chính thức
    handleStateUpdate(data);
  };

  socket.on("game_start", onGameStateHandler);
  socket.on("update_game_state", onGameStateHandler);

  // 2. Xử lý Timer
  socket.on("timer:start", (data) => {
    // QUAN TRỌNG: Nếu đang có animation chạy, TUYỆT ĐỐI KHÔNG hiện đồng hồ
    if (isAnimating.value) {
        console.log("⏳ Đang animation, hoãn hiển thị timer...");
        pendingTimerData.value = data; // Lưu lại để dùng sau
    } else {
        startTimerCountDown(data); // Không vướng gì thì hiện luôn
    }
  });

  socket.on("timer:clear", () => {
    clearInterval(timerInterval.value);
    timerValue.value = null;
    pendingTimerData.value = null;
  });

  // 3. Các sự kiện khác (RPS, Chat, Join, Over)
  socket.on("game:start_rps", (data) => {
    isRpsRetry.value = data.isRetry;
    gamePhase.value = "rps";
    rpsRound.value++;
    animationFinished.value = false;
  });

  socket.on("rpsResult", (data) => {
    rpsResultData.value = data; 
    const myId = playerId.value;
    if (myId === data.player1Id) {
      rpsChoices.value = { my: data.player1Choice, opp: data.player2Choice };
    } else if (myId === data.player2Id) {
      rpsChoices.value = { my: data.player2Choice, opp: data.player1Choice };
    } else {
      rpsChoices.value = { my: data.player1Choice, opp: data.player2Choice };
    }
    gamePhase.value = 'animation'; 
  });

  socket.on("game_over", onGameOver);
  socket.on("chat:receive", (msg) => messages.value.push(msg));
  
  socket.on("room:player-joined", (data) => {
    messages.value.push({ senderName: "Hệ thống", message: `${data.name} đã vào phòng.` });
  });
  
  socket.on("room:joined", (data) => {
    if (data.players) {
        players.value = data.players.map(p => ({ ...p, score: p.score || 0 }));
    }
  });

  socket.on("error", (err) => alert(err.message));
  socket.on("kicked_to_menu", (data) => {
    alert(data.message);
    router.push("/play");
  });
}

// ===============================
//      LOGIC TIMER
// ===============================
function startTimerCountDown(data) {
    clearInterval(timerInterval.value);
    timerValue.value = data.duration;
    timerInterval.value = setInterval(() => {
      if (timerValue.value !== null && timerValue.value > 0) {
        timerValue.value--;
      } else {
        clearInterval(timerInterval.value);
        timerValue.value = 0;
      }
    }, 1000);
}

// ===============================
//      LOGIC CẬP NHẬT UI
// ===============================
// === THÊM MỚI 2 HÀM NÀY ===

// 1. Hàm tính tổng điểm sẽ ăn được trong lượt này (dựa vào lịch sử)
function calculateTurnPoints(history) {
  let total = 0;
  history.forEach(step => {
    if (step.type === 'capture') {
      total += (step.eatenQuan * 5) + step.eatenDan;
    }
  });
  return total;
}

// 2. Hàm xử lý cộng điểm trực tiếp khi Animation đang chạy
function handleLiveScoreUpdate({ points }) {
  // Cộng ngay điểm vào người đang chơi (dựa trên currentTurnId)
  const player = players.value.find(p => p.id === currentTurnId.value);
  if (player) {
    player.score += points;
  }
}
function handleStateUpdate(state) {
  gamePhase.value = "playing";

  if (state.board) board.value = state.board;

  if (state.players && state.scores) {
    players.value = state.players.map((p) => {
      const scoreData = p.symbol === "X" ? state.scores.player1 : state.scores.player2;
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
}

function handleRpsAnimationEnd() {
  animationFinished.value = true;

  if (rpsResultData.value) {
    const { message, player1Choice, player2Choice } = rpsResultData.value;
    const p1 = players.value.find((p) => p.symbol === "X");
    const p2 = players.value.find((p) => p.symbol === "O");
    const map = { rock: "Búa", paper: "Bao", scissors: "Kéo" };
    
    rpsResult.value = `${p1?.name} ra ${map[player1Choice]}, ${p2?.name} ra ${map[player2Choice]}. ${message}`;
    rpsResultData.value = null;

    setTimeout(() => { rpsResult.value = null; }, 5000);
  }

  if (pendingGameState.value) {
    if (gameBoardRef.value && pendingGameState.value.moveHistory) {
         isAnimating.value = true;
         gameBoardRef.value.runMoveAnimation(pendingGameState.value.moveHistory)
            .then(() => {
                isAnimating.value = false;
                if (pendingTimerData.value) {
                    startTimerCountDown(pendingTimerData.value);
                    pendingTimerData.value = null;
                }
            });
    }
    handleStateUpdate(pendingGameState.value);
    pendingGameState.value = null;
  }
}

// ===============================
//       ACTIONS / HANDLERS
// ===============================

function resetState() {
  board.value = [];
  players.value = [];
  currentTurnId.value = null;
  messages.value = [];
  showDirectionModal.value = false;
  selectedCellIndex.value = null;
  showGameOverModal.value = false;
  clearInterval(timerInterval.value);
  timerValue.value = null;
  gamePhase.value = "loading";
  isRpsRetry.value = false;
  rpsResult.value = null;
  isAnimating.value = false;
  pendingTimerData.value = null;
}

function handleRpsChoice(choice) {
  socketService.submitRps(roomId.value, choice);
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
  if (selectedCellIndex.value === null || !direction) return;
  
  // 1. Gửi nước đi lên server
  socketService.makeMove(roomId.value, {
    cellIndex: selectedCellIndex.value,
    direction: direction,
  });

  // 2. TẮT NGAY ĐỒNG HỒ CỦA MÌNH (Người chơi thoải mái xem animation)
  clearInterval(timerInterval.value);
  timerValue.value = null;

  selectedCellIndex.value = null;
}

function sendMessage(text) {
  socketService.sendMessage(roomId.value, playerName.value, text);
}
// THÊM HÀM TRỢ GIÚP ĐỂ HIỂN THỊ MODAL SAU KHI ANIMATION XONG
function showFinalModal(data) {
    const p1 = players.value.find((p) => p.symbol === "X");
    const p2 = players.value.find((p) => p.symbol === "O");
    let winnerName = "Hòa!";
    
    if (p1 && data.winner === p1.id) winnerName = `${p1.name} thắng!`;
    if (p2 && data.winner === p2.id) winnerName = `${p2.name} thắng!`;
    gamePhase.value = "game_over";
    gameOverTitle.value = winnerName;
    gameOverMessage.value = `${data.gameMessage}`;
    showGameOverModal.value = true;
}
function onGameOver(data) {
  clearInterval(timerInterval.value);
  
  // Nếu có lịch sử nước đi (bao gồm thu quân), chạy animation trước
  if (data.lastMoveHistory && data.lastMoveHistory.length > 0 && gameBoardRef.value) {
      console.log("🎬 Kích hoạt animation thu quân cuối ván...");
      isAnimating.value = true;
      
      // Chạy animation, ĐỢI xong (.then) mới hiện bảng kết quả
      gameBoardRef.value.runMoveAnimation(data.lastMoveHistory)
        .then(() => {
            isAnimating.value = false;
            showFinalModal(data); // <--- Chỉ hiện khi animation đã xong
        })
        .catch(err => {
            console.error("Animation error:", err);
            isAnimating.value = false;
            showFinalModal(data);
        });
  } else {
      // Nếu không có animation, hiện luôn
      showFinalModal(data);
  }
}

function onLeaveRoomClick() {
  if (confirm("Bạn muốn rời phòng? Sẽ bị xử thua.")) {
    router.push("/play");
  }
}

function goToHome() {
  router.push("/");
}

// ===============================
//        LIFECYCLE
// ===============================

onMounted(() => {
  resetState();
  setupSocketListeners();
  socketService.requestGameState(roomId.value);
});

onBeforeUnmount(() => {
  socketService.leaveRoom();
  socketService.offAll();
  clearInterval(timerInterval.value);
});

watch(roomId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    resetState();
    setupSocketListeners();
    socketService.requestGameState(newId);
  }
});
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
  top: 90px; 
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

/* === STYLE MỚI CHO RPS RESULT === */
/* Đã xóa .timer-display */
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