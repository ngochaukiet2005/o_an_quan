<template>
  <div class="room-page">
    <div class="room-header">
      <button class="back-btn" @click="handleLeaveRequest">
        ← Rời phòng
      </button>
      
      <div class="room-info-pill" v-if="!isQuickPlay">
        <span class="label">Phòng:</span>
        <span class="code">{{ roomId }}</span>
      </div>
      <div class="room-info-pill quick-mode" v-else>
        <span>⚡ Đấu ngẫu nhiên</span>
      </div>
    </div>

    <div v-if="gamePhase === 'playing'" class="game-layout">
      <div class="main-column">
        <div v-if="rpsResult" class="rps-result-toast">
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
        <div v-else class="status-card">
          <div class="loader"></div>
          <p>Đang đồng bộ bàn cờ...</p>
        </div>
      </div>

      <div class="side-column">
        <ChatBox :messages="messages" @send="sendMessage" class="chat-box-styled" />
      </div>
    </div>

    <div v-if="gamePhase === 'loading' || gamePhase === 'rps'" class="full-screen-loader">
      <div class="loader-content">
        
        <div v-if="gamePhase === 'loading'">
           <div v-if="!isQuickPlay" class="waiting-room-info">
              <h3>Đang đợi người chơi khác...</h3>
              <p>Mã phòng của bạn là:</p>
              <div class="big-room-code" @click="copyRoomId">
                {{ roomId }}
                <span class="copy-hint">(Chạm để sao chép)</span>
              </div>
              <div class="spinner"></div>
           </div>
           
           <div v-else>
              <div class="spinner"></div>
              <p>Đang thiết lập bàn cờ...</p>
           </div>
        </div>

        <div v-if="gamePhase === 'rps'">
          <h3>Oẳn Tù Tì!</h3>
          <p>Chuẩn bị chọn lượt đi...</p>
        </div>
      </div>
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
      :show="showNotificationModal"
      :title="notificationTitle"
      :message="notificationMessage"
      @close="handleNotificationClose"
    />

    <ConfirmModal
      :show="showConfirmLeave"
      title="Rời phòng đấu?"
      message="Nếu bạn rời đi ngay bây giờ, bạn sẽ bị xử thua. Bạn có chắc chắn không?"
      @cancel="showConfirmLeave = false"
      @confirm="confirmLeaveRoom"
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

import ChatBox from "../components/ChatBox.vue";
import PlayerInfo from "../components/PlayerInfo.vue";
import GameBoard from "../components/GameBoard.vue";
import DirectionModal from "../components/DirectionModal.vue";
import NotificationModal from "../components/NotificationModal.vue";
import ConfirmModal from "../components/ConfirmModal.vue"; 
import RpsModal from "../components/RpsModal.vue";
import RpsAnimation from '@/components/RpsAnimation.vue';

const route = useRoute();
const router = useRouter();

const isQuickPlay = computed(() => route.query.mode === 'quick');
const roomId = computed(() => route.params.roomId);
const playerName = computed(() => route.query.playerName);
const playerId = socketService.getSocketIdReactive();

const gameBoardRef = ref(null);
const players = ref([]);
const board = ref([]);
const currentTurnId = ref(null);
const messages = ref([]);
const gamePhase = ref("loading");

// State RPS & Animation
const rpsRound = ref(0);
const isRpsRetry = ref(false);
const rpsResult = ref(null);
const rpsChoices = ref({ my: null, opp: null });
const rpsResultData = ref(null);
const animationFinished = ref(false);
const pendingGameState = ref(null); 
const timerValue = ref(null);
const timerInterval = ref(null);
const isAnimating = ref(false);
const pendingTimerData = ref(null);

// State Modals
const showDirectionModal = ref(false);
const selectedCellIndex = ref(null);

// --- State mới cho Notification ---
const showNotificationModal = ref(false);
const notificationTitle = ref("");
const notificationMessage = ref("");
const notificationAction = ref(null); // callback khi đóng modal

// --- State mới cho Confirm ---
const showConfirmLeave = ref(false);

function setupSocketListeners() {
  socketService.offAll();
  const socket = socketService.getSocket();

  const onGameStateHandler = async (data) => {
    if (data.moveHistory && data.moveHistory.length > 0) {
      if (gamePhase.value === 'animation' && !animationFinished.value) {
        pendingGameState.value = data;
        return;
      }
      if (gameBoardRef.value) {
        // Logic diễn hoạt cũ giữ nguyên
        const actingPlayerId = data.startingPlayerId || currentTurnId.value;
        const earnedPoints = calculateTurnPoints(data.moveHistory);
        const pIndex = players.value.findIndex(p => p.id === actingPlayerId);
        if (pIndex !== -1) {
           let finalScoreObj = (players.value[pIndex].symbol === 'X') ? data.scores.player1 : data.scores.player2;
           const finalTotalScore = finalScoreObj ? (finalScoreObj.quan * 5 + finalScoreObj.dan) : 0;
           players.value[pIndex].score = finalTotalScore - earnedPoints;
        }
        isAnimating.value = true;
        await gameBoardRef.value.runMoveAnimation(data.moveHistory);
        isAnimating.value = false;
        if (pendingTimerData.value) {
            startTimerCountDown(pendingTimerData.value);
            pendingTimerData.value = null;
        }
      }
    }
    handleStateUpdate(data);
  };

  socket.on("game_start", onGameStateHandler);
  socket.on("update_game_state", onGameStateHandler);
  socket.on("timer:start", (data) => {
    if (isAnimating.value) pendingTimerData.value = data; 
    else startTimerCountDown(data); 
  });
  socket.on("timer:clear", () => {
    clearInterval(timerInterval.value);
    timerValue.value = null;
    pendingTimerData.value = null;
  });
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
    } else {
      rpsChoices.value = { my: data.player2Choice, opp: data.player1Choice };
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
  
  // --- Thay thế alert mặc định bằng Modal ---
  socket.on("error", (err) => {
      showCustomNotification("Lỗi", err.message);
  });
  
  socket.on("kicked_to_menu", (data) => {
      // Khi bị đá ra menu (đối thủ thoát hoặc mình thoát)
      showCustomNotification("Kết thúc", data.message, () => {
          router.push("/play");
      });
  });
}

function startTimerCountDown(data) {
    clearInterval(timerInterval.value);
    timerValue.value = data.duration;
    timerInterval.value = setInterval(() => {
      if (timerValue.value !== null && timerValue.value > 0) timerValue.value--;
      else {
        clearInterval(timerInterval.value);
        timerValue.value = 0;
      }
    }, 1000);
}

function calculateTurnPoints(history) {
  let total = 0;
  history.forEach(step => {
    if (step.type === 'capture') total += (step.eatenQuan * 5) + step.eatenDan;
  });
  return total;
}

function handleLiveScoreUpdate({ points }) {
  const player = players.value.find(p => p.id === currentTurnId.value);
  if (player) player.score += points;
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

function resetState() {
  board.value = [];
  players.value = [];
  currentTurnId.value = null;
  messages.value = [];
  showDirectionModal.value = false;
  selectedCellIndex.value = null;
  showNotificationModal.value = false;
  showConfirmLeave.value = false;
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
  if (currentTurnId.value !== playerId.value) return; 
  selectedCellIndex.value = index;
  showDirectionModal.value = true;
}

function onDirectionChosen(direction) {
  showDirectionModal.value = false;
  if (selectedCellIndex.value === null || !direction) return;
  socketService.makeMove(roomId.value, {
    cellIndex: selectedCellIndex.value,
    direction: direction,
  });
  clearInterval(timerInterval.value);
  timerValue.value = null;
  selectedCellIndex.value = null;
}

function sendMessage(text) {
  socketService.sendMessage(roomId.value, playerName.value, text);
}

// --- LOGIC NOTIFICATION MỚI ---
function showCustomNotification(title, message, onClosed = null) {
    notificationTitle.value = title;
    notificationMessage.value = message;
    notificationAction.value = onClosed;
    showNotificationModal.value = true;
}

function handleNotificationClose() {
    showNotificationModal.value = false;
    if (notificationAction.value) {
        notificationAction.value();
        notificationAction.value = null;
    }
}

function showFinalModal(data) {
    const p1 = players.value.find((p) => p.symbol === "X");
    const p2 = players.value.find((p) => p.symbol === "O");
    let winnerName = "Hòa!";
    if (p1 && data.winner === p1.id) winnerName = `${p1.name} thắng!`;
    if (p2 && data.winner === p2.id) winnerName = `${p2.name} thắng!`;
    
    showCustomNotification(winnerName, data.gameMessage, goToHome);
}

function onGameOver(data) {
  clearInterval(timerInterval.value);
  if (data.lastMoveHistory && data.lastMoveHistory.length > 0 && gameBoardRef.value) {
      isAnimating.value = true;
      gameBoardRef.value.runMoveAnimation(data.lastMoveHistory)
        .then(() => {
            isAnimating.value = false;
            showFinalModal(data);
        })
        .catch(err => {
            // SỬA LỖI: Thêm backtick (`) bao quanh chuỗi template
            console.error(`Animation error: ${err}`);
            isAnimating.value = false;
            showFinalModal(data);
        });
  } else {
      showFinalModal(data);
  }
}

// --- LOGIC THOÁT PHÒNG MỚI ---
function handleLeaveRequest() {
    showConfirmLeave.value = true;
}

function confirmLeaveRoom() {
    showConfirmLeave.value = false;
    // Điều hướng về Play page trước khi ngắt kết nối để tránh lỗi UI
    socketService.leaveRoom(); // Gọi hàm rời phòng để server xử lý
    router.push("/play"); 
}

function goToHome() {
  router.push("/");
}

function copyRoomId() {
  navigator.clipboard.writeText(roomId.value);
  // Thay alert bằng notification đẹp
  showCustomNotification("Đã sao chép", "Mã phòng đã được lưu vào clipboard.");
}

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
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', sans-serif;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.back-btn {
  background: transparent;
  color: #666;
  border: 2px solid #ddd;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}
.back-btn:hover {
  border-color: #d32f2f;
  color: #d32f2f;
}

.room-info-pill {
  background: white;
  padding: 8px 20px;
  border-radius: 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  display: flex;
  gap: 8px;
  align-items: center;
}
.room-info-pill.quick-mode {
  background: linear-gradient(90deg, #f59e0b, #d97706);
  color: white;
}
.room-info-pill .label { color: #888; font-size: 0.9rem; }
.room-info-pill .code { font-weight: 800; color: #333; font-size: 1.1rem; letter-spacing: 1px; }

.game-layout {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.main-column { flex: 3; display: flex; flex-direction: column; gap: 20px; }
.side-column { flex: 1; min-width: 300px; position: sticky; top: 20px; }

.rps-result-toast {
  background-color: #e8f5e9; color: #2e7d32; padding: 12px;
  border-radius: 12px; text-align: center; font-weight: 600;
  border: 1px solid #a5d6a7; animation: slideDown 0.5s ease;
}

.full-screen-loader {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255,255,255,0.95); /* Nền đục hơn chút để che nội dung */
  z-index: 999; display: flex; align-items: center; justify-content: center;
}
.loader-content { text-align: center; }
.spinner {
  width: 40px; height: 40px; border: 4px solid #ddd;
  border-top-color: #d32f2f; border-radius: 50%;
  animation: spin 1s linear infinite; margin: 20px auto;
}

/* Style mới cho màn hình chờ phòng */
.waiting-room-info h3 { font-size: 1.8rem; color: #444; margin-bottom: 10px; }
.waiting-room-info p { color: #666; margin-bottom: 5px; font-size: 1.1rem; }
.big-room-code {
  font-size: 3.5rem; font-weight: 900; color: #8d6e63;
  letter-spacing: 4px; cursor: pointer;
  padding: 10px 30px; border-radius: 20px;
  border: 3px dashed #8d6e63; display: inline-block;
  position: relative; transition: all 0.2s; background: #fff8e1;
}
.big-room-code:hover { transform: scale(1.05); background: #fff; }
.copy-hint {
  position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%);
  font-size: 0.8rem; color: #999; font-weight: normal; letter-spacing: 0; width: 100%;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.status-card { background: #fff; padding: 40px; border-radius: 16px; text-align: center; color: #666; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
</style>