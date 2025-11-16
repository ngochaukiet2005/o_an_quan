<template>
  <div class="player-info">
    <div
      v-for="player in players"
      :key="player.id"
      :class="['player-card', { 'is-turn': player.id === currentTurnId }]"
    >
      <div class="player-details">
        <span class="player-name">
          {{ player.name }}
          <span v-if="player.id === currentTurnId" class="turn-indicator">(Đang đi...)</span>
        </span>
        <span class="player-score">Điểm: {{ player.score || 0 }}</span>
      </div>
      
      <div v-if="player.id === currentTurnId && timerValue !== null" class="timer">
        {{ timerValue }}s
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  players: Array,
  currentTurnId: String,
  timerValue: Number, // <-- NHẬN PROP TỪ GAMEROOM
});
</script>

<style scoped>
.player-info {
  display: flex;
  gap: 16px;
  justify-content: space-around;
}

.player-card {
  flex: 1;
  display: flex; /* Dàn hàng ngang */
  justify-content: space-between; /* Đẩy tên/điểm và timer ra 2 bên */
  align-items: center; /* Căn giữa theo chiều dọc */
  background: #fff;
  border: 2px solid #e5e7eb;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.player-card.is-turn {
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  transform: scale(1.03); /* Phóng to nhẹ khi đến lượt */
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.turn-indicator {
  font-size: 0.9rem;
  font-weight: 500;
  color: #10b981;
  margin-left: 8px;
}

.player-score {
  font-size: 1.1rem;
  font-weight: 500;
  color: #4b5563;
}

/* STYLE CHO TIMER MỚI */
.timer {
  font-size: 1.75rem;
  font-weight: 700;
  color: #d97706; /* Màu cam */
  background: #fffbeB; /* Màu vàng nhạt */
  border-radius: 50%; /* Hiển thị hình tròn */
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fde68a;
  flex-shrink: 0; /* Không co lại */
}
</style>