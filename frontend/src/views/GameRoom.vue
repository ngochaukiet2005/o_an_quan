<template>
  <div class="room-page">
    <div class="room-container">
      
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

      <div v-if="rpsResult" class="rps-result-container">
        <div class="rps-result-toast">
          {{ rpsResult }}
        </div>
      </div>

      <div v-if="gamePhase === 'playing'" class="game-layout">
        <div class="main-column">

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
            :currentTurnId="canInteract ? currentTurnId : null"
            :playerId="playerId"
            @move="handleMove"
            @score-update="handleLiveScoreUpdate"
            @show-borrow-confirm="handleShowBorrowConfirm"
          />
          <div v-else class="status-card">
            <div class="loader"></div>
            <p>Đang đồng bộ bàn cờ...</p>
          </div>
        </div>

        <div class="side-column desktop-chat">
          <ChatBox :messages="messages" @send="sendMessage" class="chat-box-styled" />
        </div>
      </div>

    </div>

    <button v-if="gamePhase === 'playing'" class="mobile-chat-btn" @click="showMobileChat = true">
      💬
      <span v-if="hasUnreadMessages" class="unread-badge">!</span>
    </button>

    <div v-if="showMobileChat" class="mobile-chat-overlay" @click.self="showMobileChat = false">
      <div class="mobile-chat-content">
        <div class="mobile-chat-header">
          <h3>Trò chuyện</h3>
          <button @click="showMobileChat = false">✕</button>
        </div>
        <ChatBox :messages="messages" @send="sendMessage" class="chat-box-styled mobile-style" />
      </div>
    </div>

    <div v-if="gamePhase === 'loading'" class="full-screen-loader">
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
              <button class="cancel-wait-btn" @click="handleLeaveRequest">
                Hủy phòng
              </button>
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

    <NotificationModal
      :show="showBorrowModal"
      :title="borrowTitle"
      :message="borrowMessage"
      @close="confirmBorrow"
    />

    <ConfirmModal
      :show="showConfirmLeave"
      :title="leaveTitle" 
      :message="leaveMessage"
      :confirmText="leaveConfirmText"
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
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from "vue";
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

// --- State cơ bản ---
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

// --- State Chat Mobile (Mới) ---
const showMobileChat = ref(false);
const hasUnreadMessages = ref(false);

// --- State RPS & Animation ---
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

// --- State Modals & Popup ---
const showDirectionModal = ref(false);
const selectedCellIndex = ref(null);

// Notification Modal
const showNotificationModal = ref(false);
const notificationTitle = ref("");
const notificationMessage = ref("");
const notificationAction = ref(null);

// Borrow Modal (Vay mượn)
const showBorrowModal = ref(false);
const borrowTitle = ref("");
const borrowMessage = ref("");
const borrowConfirmCallback = ref(null);

// Confirm Modal (Rời phòng)
const showConfirmLeave = ref(false);
const leaveTitle = ref("Rời phòng đấu?");
const leaveMessage = ref("Nếu bạn rời đi ngay bây giờ, bạn sẽ bị xử thua. Bạn có chắc chắn không?");
const leaveConfirmText = ref("Thoát & Chấp nhận thua");
const isServerWaiting = ref(false);

const canInteract = computed(() => {
  return timerValue.value !== null && !isServerWaiting.value && !isAnimating.value;
});

// --- SOCKET LISTENERS ---
function setupSocketListeners() {
  socketService.offAll(); // Dùng offAll để an toàn với file socketService hiện tại của bạn
  const socket = socketService.getSocket();

  // Tìm đoạn này trong setupSocketListeners và thay thế:

  const onGameStateHandler = async (data) => {
    if (gamePhase.value === 'animation' && !animationFinished.value) {
        console.log("⏳ Animation đang chạy, tạm hoãn update game state...");
        pendingGameState.value = data;
        return;
    }
    // Kiểm tra xem có lịch sử diễn hoạt không
    const hasAnimationData = data.moveHistory && data.moveHistory.length > 0;

    // 👇👇👇 [QUAN TRỌNG] Bật cờ đang diễn hoạt NGAY LẬP TỨC 👇👇👇
    if (hasAnimationData) {
        isAnimating.value = true; 
    }
    // 👆👆👆 ------------------------------------------------- 👆👆👆
    // 1. Fix hiển thị khi F5 (Đã có)
    if (board.value.length === 0) {
        handleStateUpdate(data); 
        await nextTick(); 
    }
    
    // 2. Xử lý Animation
    if (data.moveHistory && data.moveHistory.length > 0) {
      await nextTick();
      if (gameBoardRef.value) {
        // ... (Đoạn logic tính điểm và chạy animation giữ nguyên) ...
        const actingPlayerId = data.startingPlayerId || currentTurnId.value;
        const earnedPoints = calculateTurnPoints(data.moveHistory);
        const pIndex = players.value.findIndex(p => p.id === actingPlayerId);
        if (pIndex !== -1) {
           let finalScoreObj = (players.value[pIndex].symbol === 'X') ? data.scores.player1 : data.scores.player2;
           const finalTotalScore = finalScoreObj ? (finalScoreObj.quan * 5 + finalScoreObj.dan) : 0;
           players.value[pIndex].score = finalTotalScore - earnedPoints;
        }

        try {
            isAnimating.value = true;
            console.log(`🎬 Running live animation...`);
            await gameBoardRef.value.runMoveAnimation(data.moveHistory, false, actingPlayerId); 
        } catch (error) {
            console.error("⚠️ Animation error (F5 Replay):", error);
        } finally {
            handleStateUpdate(data);
            socket.emit("game:animation_finished", roomId.value);
            isAnimating.value = false;
            
            // 👇👇👇 [SỬA LẠI ĐOẠN NÀY] 👇👇👇
            // Kiểm tra nếu có dữ liệu timer đang chờ thì chạy ngay
            if (pendingTimerData.value) {
                console.log("⏱️ Starting pending timer...", pendingTimerData.value);
                // Gọi đúng tên hàm startTimerCountDown
                startTimerCountDown(pendingTimerData.value); 
                pendingTimerData.value = null; // Reset biến chờ
            }
            // 👆👆👆 --------------------- 👆👆👆
        }
      } else {
          // Trường hợp không tìm thấy ref bàn cờ (hiếm gặp), cập nhật luôn
          handleStateUpdate(data);
      }
    } else {
        if (data.isWaitingForAnimation) {
          // Logic mới: Nếu Server đang chờ mà mình không có gì để diễn (do F5)
          // Thì mình chỉ khóa bàn, tắt timer và NGỒI CHỜ sự kiện 'timer:start' từ server
          console.log("🛑 Đã F5: Hiện kết quả và chờ đối thủ diễn hoạt xong...");
          isServerWaiting.value = true;       // Khóa bàn cờ
          timerValue.value = null;            // Tắt đồng hồ đếm ngược
          clearInterval(timerInterval.value); // Đảm bảo không đếm bậy
          
          // TUYỆT ĐỐI KHÔNG gọi socket.emit("game:animation_finished")
          // Hãy để máy của đối thủ (đang chạy animation) gửi tín hiệu đó.
        }
        handleStateUpdate(data);
      }
  };

  socket.on("game_start", onGameStateHandler);
  socket.on("update_game_state", onGameStateHandler);
  socket.on("timer:start", (data) => {
    isServerWaiting.value = false; // Mở khóa bàn cờ
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

  // 👇 Cập nhật Logic Chat: Hiện thông báo đỏ nếu đang đóng chat mobile
  socket.on("chat:receive", (msg) => {
    messages.value.push(msg);
    if (!showMobileChat.value) {
      hasUnreadMessages.value = true;
    }
  });

  socket.on("room:player-joined", (data) => {
    messages.value.push({ senderName: "Hệ thống", message: `${data.name} đã vào phòng.` });
  });
  socket.on("room:joined", (data) => {
    if (data.players) {
        players.value = data.players.map(p => ({ ...p, score: p.score || 0 }));
    }
  });
  
  socket.on("error", (err) => {
      showCustomNotification("Lỗi", err.message);
  });
  
  socket.on("kicked_to_menu", (data) => {
      showCustomNotification("Kết thúc", data.message, () => {
          router.push("/play");
      });
  });
}

function startTimerCountDown(data) {
    clearInterval(timerInterval.value);
    
    if (!data.deadline) {
        timerValue.value = data.duration;
        timerInterval.value = setInterval(() => {
            if (timerValue.value > 0) timerValue.value--;
            else clearInterval(timerInterval.value);
        }, 1000);
        return;
    }
    
    const deadline = data.deadline;
    const update = () => {
        const now = Date.now();
        const remainingMs = deadline - now;
        if (remainingMs > 0) {
            timerValue.value = Math.ceil(remainingMs / 1000);
        } else {
            timerValue.value = 0;
            clearInterval(timerInterval.value);
        }
    };
    update();
    timerInterval.value = setInterval(update, 100);
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
  
  if (typeof state.isWaitingForAnimation !== 'undefined') {
      isServerWaiting.value = state.isWaitingForAnimation;
  }
  
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
  // 👇👇👇 [SỬA ĐOẠN NÀY: Logic chặn Timer] 👇👇👇
  let timerData = null;
  if (state.currentTurnDeadline) {
      timerData = { deadline: state.currentTurnDeadline };
  } else if (state.remainingTime) {
      timerData = { duration: state.remainingTime };
  }

  if (timerData) {
      // Nếu đang diễn hoạt thì ĐỪNG chạy timer ngay, hãy lưu lại
      if (isAnimating.value) {
          pendingTimerData.value = timerData;
      } else {
          // Nếu không diễn hoạt thì chạy luôn
          startTimerCountDown(timerData);
      }
  }
  // 👆👆👆 ------------------------------------ 👆👆👆
  if (state.currentTurnDeadline) {
      startTimerCountDown({ deadline: state.currentTurnDeadline });
  } 
  else if (state.remainingTime) {
      startTimerCountDown({ duration: state.remainingTime });
  }
  
  if (state.gameMessage) {
    messages.value.push({ senderName: "Hệ thống", message: state.gameMessage });
  }
}

function handleRpsAnimationEnd() {
  animationFinished.value = true;
  
  if (rpsResultData.value) {
    const { message, player1Choice, player2Choice, player1Id, player2Id } = rpsResultData.value;
    const p1 = players.value.find((p) => p.id === player1Id) || players.value[0];
    const p2 = players.value.find((p) => p.id === player2Id) || players.value[1];
    const name1 = p1 ? p1.name : "Người chơi 1";
    const name2 = p2 ? p2.name : "Người chơi 2";

    const map = { rock: "Búa", paper: "Bao", scissors: "Kéo" };
    
    rpsResult.value = `${name1} ra ${map[player1Choice]}, ${name2} ra ${map[player2Choice]}. ${message}`;
    
    rpsResultData.value = null;
    setTimeout(() => { rpsResult.value = null; }, 5000);
  } else {
    console.warn("RPS Data is missing!");
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
  } else {
    gamePhase.value = 'playing'; 
  }
}

function handleShowBorrowConfirm({ player, callback }) {
    const p1 = players.value.find(p => p.symbol === 'X');
    const p2 = players.value.find(p => p.symbol === 'O');
    
    let actorId = null;
    if (player === 1) actorId = p1 ? p1.id : null;
    if (player === 2) actorId = p2 ? p2.id : null;

    const isMe = actorId === playerId.value;

    borrowTitle.value = "Hết quân!";
    if (isMe) {
        borrowMessage.value = "Bạn đã hết quân trên 5 ô dân! Hệ thống sẽ tự động lấy 5 điểm (hoặc vay nợ) để rải quân.";
    } else {
        borrowMessage.value = "Đối thủ đã hết quân và phải thực hiện gây giống/vay quân.";
    }
    
    borrowConfirmCallback.value = callback;
    showBorrowModal.value = true;
}

function confirmBorrow() {
    showBorrowModal.value = false;
    if (borrowConfirmCallback.value) {
        borrowConfirmCallback.value(); 
        borrowConfirmCallback.value = null;
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
  showBorrowModal.value = false;
  borrowConfirmCallback.value = null;
  isServerWaiting.value = false;
  
  // Reset chat mobile state
  showMobileChat.value = false;
  hasUnreadMessages.value = false;
}

function handleRpsChoice(choice) {
  socketService.submitRps(roomId.value, choice);
}

function handleMove(index) {
  if (currentTurnId.value !== playerId.value) return; 
  if (gamePhase.value !== 'playing') return;

  if (!timerValue.value && timerValue.value !== 0) {
      showCustomNotification("Đợi chút...", "Đang đồng bộ thời gian từ máy chủ.");
      return;
  }
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
            console.error(`Animation error: ${err}`);
            isAnimating.value = false;
            showFinalModal(data);
        });
  } else {
      showFinalModal(data);
  }
}

function handleLeaveRequest() {
    if (gamePhase.value === 'loading') {
        leaveTitle.value = "Hủy phòng?";
        leaveMessage.value = "Bạn có chắc chắn muốn hủy phòng và quay lại trang chủ không?";
        leaveConfirmText.value = "Đồng ý hủy";
    } else {
        leaveTitle.value = "Rời phòng đấu?";
        leaveMessage.value = "Nếu bạn rời đi ngay bây giờ, bạn sẽ bị xử thua. Bạn có chắc chắn không?";
        leaveConfirmText.value = "Thoát & Chấp nhận thua";
    }
    showConfirmLeave.value = true;
}

function confirmLeaveRoom() {
    showConfirmLeave.value = false;
    socketService.leaveRoom();
    router.push("/play"); 
}

function goToHome() {
  router.push("/");
}

function copyRoomId() {
  const textToCopy = roomId.value;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(textToCopy)
      .then(() => showCustomNotification("Đã sao chép", "Mã phòng đã được lưu vào clipboard."))
      .catch(() => fallbackCopyText(textToCopy));
  } else {
    fallbackCopyText(textToCopy);
  }
}

function fallbackCopyText(text) {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      showCustomNotification("Đã sao chép", "Mã phòng đã được lưu vào clipboard.");
    } else {
      showCustomNotification("Lỗi", "Trình duyệt chặn quyền sao chép.");
    }
  } catch (err) {
    console.error("Copy error:", err);
    showCustomNotification("Lỗi", "Không thể sao chép mã phòng.");
  }
}

// Trong script setup của GameRoom.vue

// Watcher: Tắt thông báo tin nhắn mới khi mở chat mobile
watch(showMobileChat, (val) => {
  if (val) hasUnreadMessages.value = false;
});

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
/* --- STYLE NỀN FULL SCREEN --- */
.room-page {
  min-height: 100vh;
  width: 100%;
  background: url("/img/background-gameroom.png") no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  margin-top: -70px;
  padding-top: 90px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

.room-container {
  width: 100%;
  max-width: 1200px;
  padding: 0 20px;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.back-btn {
  background: white;
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
.side-column { flex: 1; min-width: 300px; position: sticky; top: 90px; }

/* --- CSS CHO CHAT MOBILE (New) --- */
.desktop-chat {
  display: block;
}
.mobile-chat-btn {
  display: none; /* Mặc định ẩn trên Desktop */
}

/* Overlay Chat Mobile */
.mobile-chat-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); z-index: 3000;
  display: flex; align-items: center; justify-content: center;
}
.mobile-chat-content {
  width: 90%; max-width: 400px; height: 70vh;
  background: white; border-radius: 16px;
  display: flex; flex-direction: column; overflow: hidden;
  animation: slideUp 0.3s ease;
}
.mobile-chat-header {
  padding: 15px; background: #f5f5f5; border-bottom: 1px solid #ddd;
  display: flex; justify-content: space-between; align-items: center;
}
.mobile-chat-header h3 { margin: 0; font-size: 1.1rem; color: #333; }
.mobile-chat-header button { border: none; background: none; font-size: 1.5rem; cursor: pointer; color: #666; }

/* Override ChatBox khi ở trong popup */
.chat-box-styled.mobile-style { height: 100%; border: none; box-shadow: none; }

@keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

/* ----------------------- */

.rps-result-container {
  position: absolute;
  top: 90px;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  z-index: 2000 !important;
  pointer-events: none;
}

.rps-result-toast {
  background-color: #e8f5e9; 
  color: #2e7d32; 
  padding: 12px 24px;
  border-radius: 50px; 
  text-align: center; 
  font-weight: 700;
  font-size: 1.1rem;
  border: 2px solid #a5d6a7; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  animation: slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  min-width: 300px;
  pointer-events: auto;
}

.full-screen-loader {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255,255,255,0.95);
  z-index: 999; display: flex; align-items: center; justify-content: center;
}
.loader-content { text-align: center; }
.spinner {
  width: 40px; height: 40px; border: 4px solid #ddd;
  border-top-color: #d32f2f; border-radius: 50%;
  animation: spin 1s linear infinite; margin: 20px auto;
}

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

.cancel-wait-btn {
  margin-top: 25px;
  padding: 10px 28px;
  background-color: white;
  color: #d32f2f;
  border: 2px solid #d32f2f;
  border-radius: 30px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.cancel-wait-btn:hover {
  background-color: #d32f2f;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(211, 47, 47, 0.2);
}

.cancel-wait-btn:active {
  transform: scale(0.95);
}

/* --- RESPONSIVE & MOBILE --- */
@media (max-width: 1024px) {
  .room-page {
    padding-top: 80px;
    align-items: flex-start;
    height: auto;
  }

  .game-layout {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .main-column {
    width: 100%;
    order: 1;
  }

  /* Ẩn chat desktop khi màn hình nhỏ */
  .desktop-chat {
    display: none; 
  }

  .room-header {
    flex-wrap: wrap;
    gap: 10px;
  }

  /* Hiện nút chat mobile */
  .mobile-chat-btn {
    display: flex; align-items: center; justify-content: center;
    position: fixed; bottom: 20px; right: 20px;
    width: 60px; height: 60px; border-radius: 50%;
    background: linear-gradient(45deg, #2196F3, #21CBF3);
    color: white; border: none; font-size: 1.8rem;
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
    z-index: 2500; cursor: pointer;
    transition: transform 0.2s;
  }
  .mobile-chat-btn:active { transform: scale(0.9); }
  
  /* Chấm đỏ thông báo */
  .unread-badge {
    position: absolute; top: 0; right: 0;
    width: 18px; height: 18px; background: #ff3d00;
    border-radius: 50%; border: 2px solid white;
    font-size: 0.8rem; font-weight: bold;
    display: flex; align-items: center; justify-content: center;
  }
}

@media (max-width: 600px) {
  .room-container {
    padding: 0 10px;
  }
  
  .back-btn {
    padding: 6px 12px;
    font-size: 0.9rem;
  }

  .room-info-pill {
    padding: 6px 12px;
  }
}
</style>