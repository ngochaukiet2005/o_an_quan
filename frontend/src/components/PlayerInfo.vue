<template>
  <div class="player-info-container">
    <div class="player-box" :class="{ 'current-turn': isMyTurn }">
      <div class="turn-indicator" v-if="isMyTurn">
        <span></span>
        Lượt Của Bạn
      </div>
      <h3>Bạn ({{ mySymbol }})</h3>
      <div class="player-score">Điểm: {{ myScore }}</div>
    </div>

    <div class="player-box" :class="{ 'current-turn': !isMyTurn }">
      <div class="turn-indicator" v-if="!isMyTurn">
        <span></span>
        Lượt Đối Thủ
      </div>
      <h3>Đối thủ ({{ opponentSymbol }})</h3>
      <div class="player-score">Điểm: {{ opponentScore }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  mySymbol: { type: String, required: true },
  nextTurnSymbol: { type: String, required: true },
  scores: { type: Object, required: true }, // <-- Nhận object MỚI
});

const opponentSymbol = computed(() => {
  return props.mySymbol === "P1" ? "P2" : "P1";
});

const isMyTurn = computed(() => {
  return props.mySymbol === props.nextTurnSymbol;
});

// --- CẬP NHẬT LOGIC TÍNH ĐIỂM ---
const myScoreData = computed(() => {
  if (!props.scores) return { quan: 0, dan: 0 };
  return props.mySymbol === "P1" ? props.scores.player1 : props.scores.player2;
});

const opponentScoreData = computed(() => {
  if (!props.scores) return { quan: 0, dan: 0 };
  return props.mySymbol === "P1" ? props.scores.player2 : props.scores.player1;
});

/**
 * Tính TỔNG ĐIỂM
 * Đây là nơi duy nhất dùng luật "1 Quan = 5 Dân"
 */
const myTotalPoints = computed(() => {
  if (!myScoreData.value) return 0;
  return (myScoreData.value.quan * 5) + myScoreData.value.dan;
});

const opponentTotalPoints = computed(() => {
  if (!opponentScoreData.value) return 0;
  return (opponentScoreData.value.quan * 5) + opponentScoreData.value.dan;
});

// --- SỬA LỖI TƯƠNG THÍCH (fallback) ---
// (Các computed cũ này sẽ giữ lại điểm nếu data chưa đúng)
const myScore = computed(() => {
  return myTotalPoints.value;
});
const opponentScore = computed(() => {
  return opponentTotalPoints.value;
});
</script>

<style scoped>
.player-info-container {
  display: flex;
  justify-content: center;
  gap: 50px;
  margin: 20px auto 40px auto;
  max-width: 600px;
}
.player-box {
  width: 250px;
  padding: 15px;
  border: 3px solid #ccc;
  border-radius: 12px;
  background-color: #fff;
  transition: all 0.3s ease;
  opacity: 0.5; /* Mặc định làm mờ */
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}
.player-score {
  font-size: 2.5rem;
  font-weight: bold;
  color: #2c3e50;
}
h3 {
  margin-top: 5px;
  margin-bottom: 10px;
  color: #555;
}

/* --- Hiệu ứng Lượt đi --- */
.player-box.current-turn {
  opacity: 1; /* Nổi bật */
  border-color: #42b983;
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(66, 185, 131, 0.5);
}

.turn-indicator {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #42b983;
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
  animation: pulse 2s infinite;
}

.turn-indicator span {
  width: 10px;
  height: 10px;
  background-color: #fff;
  border-radius: 50%;
}

@keyframes pulse {
  0% {
    transform: translateX(-50%) scale(1);
    box-shadow: 0 0 0 0 rgba(66, 185, 131, 0.7);
  }
  70% {
    transform: translateX(-50%) scale(1);
    box-shadow: 0 0 0 10px rgba(66, 185, 131, 0);
  }
  100% {
    transform: translateX(-50%) scale(1);
    box-shadow: 0 0 0 0 rgba(66, 185, 131, 0);
  }
}
</style>