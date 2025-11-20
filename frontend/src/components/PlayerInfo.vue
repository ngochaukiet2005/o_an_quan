<template>
  <div class="players-hud">
    <div 
      v-for="player in displayPlayers" 
      :key="player.id"
      class="player-card"
      :class="{ 'active-turn': player.id === currentTurnId }"
    >
      <div class="avatar">
        {{ player.symbol === 'X' ? '🥷' : '🤖' }}
      </div>
      <div class="info">
        <div class="name">{{ player.name }} <span v-if="player.isMe">(Bạn)</span></div>
        <div class="score-badge">
          <span class="label">Điểm:</span>
          <span class="value">{{ player.score }}</span>
        </div>
      </div>
      
      <div v-if="player.id === currentTurnId && timerValue !== null" class="turn-timer">
        {{ timerValue }}s
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import socketService from "../services/socketService";

const props = defineProps({
  players: Array,
  currentTurnId: String,
  timerValue: Number,
});

const myId = socketService.getSocketIdReactive();

const displayPlayers = computed(() => {
  if (!props.players) return [];
  return props.players.map(p => ({
    ...p,
    isMe: p.id === myId.value
  }));
});
</script>

<style scoped>
.players-hud {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.player-card {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

/* Hiệu ứng khi đến lượt */
.player-card.active-turn {
  border-color: #d32f2f;
  background: #fff5f5;
  transform: scale(1.02);
  box-shadow: 0 8px 20px rgba(211, 47, 47, 0.15);
}

.avatar {
  width: 45px;
  height: 45px;
  background: #eee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.info {
  flex-grow: 1;
}

.name {
  font-weight: 700;
  color: #333;
  font-size: 1rem;
  margin-bottom: 4px;
}

.score-badge {
  background: #8d6e63;
  color: white;
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  align-items: center;
  gap: 5px;
}
.score-badge .value {
  font-weight: 800;
  font-size: 1rem;
  color: #fbbf24; /* Màu vàng gold */
}

.turn-timer {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #d32f2f;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style>