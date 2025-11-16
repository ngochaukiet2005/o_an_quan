<template>
  <div class="home-container">
    <h1>Ô Ăn Quan</h1>
    
    <div class="menu">
      <input 
        v-model="playerName" 
        placeholder="Nhập tên của bạn"
        @keyup.enter="joinMatchmaking"
      />
      <button @click="joinMatchmaking" :disabled="isLoading">
        {{ isLoading ? "Đang tìm trận..." : "Chơi Ngay" }}
      </button>
      <p v-if="queueMessage" class="message">{{ queueMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { emit, on, off, getSocket } from '../services/socketService';
import { store, resetStore } from '../store';

const router = useRouter();
const playerName = ref(localStorage.getItem('playerName') || '');
const isLoading = ref(false);
const queueMessage = ref('');

// --- Xử lý sự kiện Socket ---

const onGameStart = (data) => {
  console.log('Trận đấu bắt đầu!', data);
  isLoading.value = false;

  // Cập nhật store với dữ liệu ban đầu
  store.roomId = data.roomId;
  store.players = data.players;
  store.myPlayerId = getSocket().id;
  
  const myIndex = data.players.findIndex(p => p.id === store.myPlayerId);
  store.myPlayerNumber = myIndex === 0 ? 1 : 2;

  // Cập nhật state game
  store.board = data.board;
  store.scores = data.scores;
  store.debt = data.debt;
  store.nextTurnPlayerId = data.startingPlayerId;
  store.gameMessage = "Trận đấu bắt đầu!";

  // Lưu tên người chơi
  localStorage.setItem('playerName', playerName.value);

  // Chuyển sang phòng game
  router.push('/game-room');
};

const onQueueUpdate = (data) => {
  isLoading.value = true;
  queueMessage.value = data.message;
};

const onKicked = (data) => {
  // Xử lý khi bị kick (ví dụ: đối thủ rời phòng trước khi game bắt đầu)
  isLoading.value = false;
  queueMessage.value = data.message || "Đã xảy ra lỗi, vui lòng thử lại.";
  resetStore();
};

// --- Vòng đời Component ---

onMounted(() => {
  // Đảm bảo state được reset khi vào Home
  resetStore();
  
  // Lắng nghe các sự kiện
  on('game_start', onGameStart);
  on('queue_update', onQueueUpdate);
  on('kicked_to_menu', onKicked);
});

onUnmounted(() => {
  // Hủy lắng nghe khi rời component
  off('game_start', onGameStart);
  off('queue_update', onQueueUpdate);
  off('kicked_to_menu', onKicked);
});

// --- Hành động của người dùng ---

const joinMatchmaking = () => {
  if (!playerName.value.trim()) {
    queueMessage.value = 'Vui lòng nhập tên của bạn.';
    return;
  }
  
  isLoading.value = true;
  queueMessage.value = 'Đang kết nối tới hàng chờ...';
  emit('join_matchmaking', { playerName: playerName.value.trim() });
};
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
}
.menu {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 300px;
}
input {
  padding: 10px;
  font-size: 16px;
}
button {
  padding: 12px;
  font-size: 18px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
}
button:disabled {
  background-color: #aaa;
}
.message {
  text-align: center;
  color: #333;
}
</style>