<template>
  <div class="game-room">
    <PlayerInfo 
      :player="player2"
      :score="player2Score"
      :debt="store.debt.player2"
      :isMyTurn="isPlayer2Turn"
    />

    <GameBoard
      :board="store.board"
      :myPlayerNumber="store.myPlayerNumber"
      :isMyTurn="isMyTurn"
      @cell-click="onCellClick"
    />

    <PlayerInfo 
      :player="player1"
      :score="player1Score"
      :debt="store.debt.player1"
      :isMyTurn="isPlayer1Turn"
    />

    <div class="game-messages">
      <p v-if="store.gameMessage" class="message">{{ store.gameMessage }}</p>
      <p v-if="store.errorMessage" class="error">{{ store.errorMessage }}</p>
      <button @click="leaveRoom">Rời phòng</button>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { store, updateStateFromServer, resetStore } from '../store';
import { emit, on, off } from '../services/socketService';

// Import components
import GameBoard from '../components/GameBoard.vue';
import PlayerInfo from '../components/PlayerInfo.vue';
import DirectionModal from '../components/DirectionModal.vue';
import NotificationModal from '../components/NotificationModal.vue';

const router = useRouter();

// --- Trạng thái local cho UI (Modals) ---
const showDirectionModal = ref(false);
const selectedCellIndex = ref(null);
const showGameOverModal = ref(false);
const gameOverTitle = ref('');
const gameOverMessage = ref('');

// --- Dữ liệu Computed (Lấy từ store) ---
const isMyTurn = computed(() => store.nextTurnPlayerId === store.myPlayerId);
const isPlayer1Turn = computed(() => store.players[0] && store.nextTurnPlayerId === store.players[0].id);
const isPlayer2Turn = computed(() => store.players[1] && store.nextTurnPlayerId === store.players[1].id);

// Định nghĩa P1 và P2 (P1 luôn là index 0, P2 là index 1)
const player1 = computed(() => store.players[0] || { name: 'Player 1' });
const player2 = computed(() => store.players[1] || { name: 'Player 2' });

const player1Score = computed(() => store.scores.player1);
const player2Score = computed(() => store.scores.player2);

// --- Xử lý sự kiện Socket ---

const onUpdateState = (newState) => {
  console.log('Nhận update state:', newState);
  updateStateFromServer(newState);
};

const onInvalidMove = (data) => {
  console.warn('Nước đi không hợp lệ:', data.message);
  store.errorMessage = data.message;
};

const onGameOver = (data) => {
  console.log('Game Over:', data);
  
  // Cập nhật state lần cuối
  if(data.finalState) {
    updateStateFromServer(data.finalState);
  }

  // Hiển thị modal
  let winnerName = 'Hòa!';
  if (data.winner === player1.value.id) winnerName = `${player1.value.name} thắng!`;
  if (data.winner === player2.value.id) winnerName = `${player2.value.name} thắng!`;
  
  gameOverTitle.value = winnerName;
  gameOverMessage.value = `${data.gameMessage} | Điểm cuối: P1 (${data.finalScores.player1}) - P2 (${data.finalScores.player2})`;
  showGameOverModal.value = true;
};

const onKicked = (data) => {
  // Xử lý khi đối thủ rời phòng
  alert(data.message);
  goToHome();
};

// --- Vòng đời Component ---

onMounted(() => {
  if (!store.roomId) {
    // Nếu F5 trang hoặc vào trực tiếp, đá về Home
    router.push('/');
    return;
  }
  
  // Lắng nghe các sự kiện
  on('update_game_state', onUpdateState);
  on('invalid_move', onInvalidMove);
  on('game_over', onGameOver);
  on('kicked_to_menu', onKicked);
});

onUnmounted(() => {
  // Hủy lắng nghe
  off('update_game_state', onUpdateState);
  off('invalid_move', onInvalidMove);
  off('game_over', onGameOver);
  off('kicked_to_menu', onKicked);
});

// --- Hành động của người dùng ---

const onCellClick = (index) => {
  if (!isMyTurn.value) {
    store.errorMessage = "Không phải lượt của bạn!";
    return;
  }

  // Logic kiểm tra ô hợp lệ (dan > 0, quan = 0) nằm ở server, 
  // nhưng ta có thể kiểm tra sơ bộ ở client để tránh gửi yêu cầu thừa
  const cell = store.board[index];
  if (cell.dan === 0 || cell.quan > 0) {
     store.errorMessage = "Không thể bốc từ ô này (Phải có dân và không có quan).";
     return;
  }
  
  store.errorMessage = "";
  selectedCellIndex.value = index;
  showDirectionModal.value = true;
};

const onDirectionChosen = (direction) => {
  showDirectionModal.value = false;
  if (selectedCellIndex.value === null || !direction) {
    return;
  }

  // GỬI NƯỚC ĐI LÊN SERVER
  emit('make_move', {
    cellIndex: selectedCellIndex.value,
    direction: direction, // 'left' hoặc 'right'
  });

  selectedCellIndex.value = null;
};

const leaveRoom = () => {
  if (confirm('Bạn có chắc muốn rời phòng? Bạn sẽ bị xử thua.')) {
    emit('leave_room', {});
    goToHome();
  }
};

const goToHome = () => {
  resetStore();
  router.push('/');
};

</script>

<style scoped>
.game-room {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  width: 100%;
}
.game-messages {
  margin-top: 20px;
  text-align: center;
}
.message {
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
}
.error {
  font-size: 1.1em;
  color: #D32F2F;
  font-weight: bold;
}
button {
  margin-top: 10px;
  padding: 8px 15px;
  font-size: 16px;
  cursor: pointer;
}
</style>