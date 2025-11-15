<template>
  <div class="game-room">
    <NotificationModal
      v-if="notification"
      :title="notificationTitle"
      :message="notificationMessage"
      :type="notificationType"
      :buttonText="notificationButtonText"
      @close="onNotificationClose"
    />

    <NotificationModal
      v-if="gameWinner"
      title="Trò chơi kết thúc!"
      :message="gameStatus"
      type="winner"
      buttonText="Về Trang chủ"
      @close="goHome"
    >
      <h2 style="color: #42b983">Trò chơi kết thúc!</h2>
      <p class="status-text">{{ gameStatus }}</p>
      <div v-if="finalScores" class="final-scores">
        <strong>Kết quả cuối cùng:</strong>
        <p v-if="players.length > 0">
          {{ players[0].name }} (P1): {{ finalScores.player1 }} điểm
        </p>
        <p v-if="players.length > 1">
          {{ players[1].name }} (P2): {{ finalScores.player2 }} điểm
        </p>
      </div>
    </NotificationModal>

    <h1>Phòng Game: {{ roomId }}</h1>
    <template v-if="mySymbol">
      <PlayerInfo
        :mySymbol="mySymbol"
        :nextTurnSymbol="nextTurnSymbol"
        :scores="scores"
      />
      <GameBoard
        :board="boardState"
        :mySymbol="mySymbol"
        :myTurn="isMyTurn"
        @make-move="handleMove"
        @animation-start="isClientAnimating = true"
        @animation-end="isClientAnimating = false"
      />
    </template>
    
    <p v-else class="game-status">{{ gameStatus }}</p>

    <button @click="goHome" class="leave-btn" v-if="!gameWinner">
      Rời khỏi phòng
    </button>
    
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import socketService from "../services/socketService";
import GameBoard from "../components/GameBoard.vue";
import PlayerInfo from "../components/PlayerInfo.vue";
import NotificationModal from "../components/NotificationModal.vue";

const route = useRoute();
const router = useRouter();
const roomId = ref(route.params.roomId);

// --- State (CẬP NHẬT THEO CẤU TRÚC MỚI) ---
const boardState = ref([]); // <-- Sẽ được điền bởi server
const scores = ref({ // <-- Cấu trúc MỚI
  player1: { quan: 0, dan: 0 },
  player2: { quan: 0, dan: 0 }
});
const finalScores = ref(null); // <-- Sẽ là object
const nextTurnPlayerId = ref(null);
const gameWinner = ref(null);
const gameStatus = ref("Đang đợi người chơi thứ 2...");
const mySymbol = ref(null);
const players = ref([]);
const isClientAnimating = ref(false);

// --- State cho Modal Thông báo Mới ---
const notification = ref(false);
const notificationTitle = ref("Thông báo");
const notificationMessage = ref("");
const notificationType = ref("notification");
const notificationButtonText = ref("Đã hiểu");
const autoCloseAction = ref(null);

// --- Hàm Hiển thị Thông báo ---
const showNotification = (
  title,
  message,
  type = "notification",
  buttonText = "Đã hiểu",
  onClose = null
) => {
  notificationTitle.value = title;
  notificationMessage.value = message;
  notificationType.value = type;
  notificationButtonText.value = buttonText;
  autoCloseAction.value = onClose;
  notification.value = true;
};

const onNotificationClose = () => {
  notification.value = false;
  if (autoCloseAction.value) {
    autoCloseAction.value();
    autoCloseAction.value = null;
  }
};

// --- Các hàm lắng nghe sự kiện (ĐÃ CẬP NHẬT) ---
const onGameStart = (data) => {
  gameStatus.value = "Game đã bắt đầu!";
  players.value = data.players;
  boardState.value = data.board; // <-- Nhận board MỚI
  scores.value = data.scores; // <-- Nhận score MỚI
  nextTurnPlayerId.value = data.startingPlayerId;
  const myPlayerInfo = data.players.find(
    (p) => p.id === socketService.socket.id
  );
  if (myPlayerInfo) {
    mySymbol.value = myPlayerInfo.symbol === "X" ? "P1" : "P2";
  }
};

const onUpdateGameState = (data) => {
  boardState.value = data.board; // <-- Nhận board MỚI
  scores.value = data.scores; // <-- Nhận score MỚI
  nextTurnPlayerId.value = data.nextTurnPlayerId;
  gameStatus.value = `Lượt của: ${nextTurnSymbol.value}`;
};

const onGameOver = (data) => {
  finalScores.value = data.finalScores; // <-- Nhận score MỚI
  if (data.reason === "draw") {
    gameWinner.value = "draw";
    gameStatus.value = "Hòa cờ!";
  } else if (data.winner === socketService.socket.id) {
    gameWinner.value = mySymbol.value;
    gameStatus.value = "Bạn đã thắng!";
  } else {
    gameWinner.value = mySymbol.value === "P1" ? "P2" : "P1";
    gameStatus.value = "Bạn đã thua!";
  }
};

const onKicked = (data) => {
  showNotification(
    "Thông báo",
    data.message,
    "notification",
    "Về Trang chủ",
    () => {
      router.push({ name: "Home" });
    }
  );
};

const onInvalidMove = (data) => {
  showNotification("Nước đi không hợp lệ!", data.message, "error");
};

// --- Computed ---
const isMyTurn = computed(() => {
  return (
    nextTurnPlayerId.value === socketService.socket.id &&
    !gameWinner.value &&
    !isClientAnimating.value
  );
});

const nextTurnSymbol = computed(() => {
  if (!players.value.length) return null;
  const nextPlayer = players.value.find(
    (p) => p.id === nextTurnPlayerId.value
  );
  if (!nextPlayer) return null;
  return nextPlayer.symbol === "X" ? "P1" : "P2";
});

// --- Actions (Giữ nguyên các bản sửa lỗi trước) ---
const handleMove = (moveData) => {
  // if (isClientAnimating.value) return; // <-- Dòng này đã được xóa (ĐÚNG)
  
  socketService.emit("make_move", {
    cellIndex: moveData.cellIndex,
    direction: moveData.direction,
  });
};

const goHome = () => {
  if (gameWinner.value) {
    router.push({ name: "Home" });
    return;
  }
  if (confirm("Bạn có chắc muốn rời phòng? Bạn sẽ bị xử thua.")) {
    socketService.emit("leave_room");
  }
};

// --- Vòng đời ---
onMounted(() => {
  if (!socketService.socket.connected) {
    socketService.connect();
  }
  const initialData = window.history.state.initialData;
  if (initialData) {
    onGameStart(initialData);
  }
  socketService.on("game_start", onGameStart);
  socketService.on("update_game_state", onUpdateGameState);
  socketService.on("game_over", onGameOver);
  socketService.on("invalid_move", onInvalidMove);
  socketService.on("kicked_to_menu", onKicked);
});

onUnmounted(() => {
  socketService.off("game_start", onGameStart);
  socketService.off("update_game_state", onUpdateGameState);
  socketService.off("game_over", onGameOver);
  socketService.off("invalid_move", onInvalidMove);
  socketService.off("kicked_to_menu", onKicked);
});
</script>

<style scoped>
/* (CSS cũ đã được chuyển sang NotificationModal.vue) */
.game-room {
  padding: 20px;
}
.game-status {
  font-size: 1.2rem;
  font-weight: bold;
  min-height: 1.5em;
  margin-bottom: 20px;
}
.leave-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: block;
  margin: 40px auto;
  font-size: 1rem;
  transition: background-color 0.2s;
}
.leave-btn:hover {
  background-color: #d32f2f;
}

/* Các style này được dùng trong Modal (chèn qua slot) */
.final-scores {
  text-align: left;
  margin-top: 20px;
  padding: 15px;
  background-color: #f4f4f5;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}
.status-text {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  margin: 15px 0;
}
</style>