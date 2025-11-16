<template>
  <div class="player-info" :class="{ 'active-turn': isMyTurn }">
    <h3 class="player-name">
      {{ player.name }}
      <span v-if="isMyTurn">(Đang tới lượt)</span>
    </h3>
    <div class="scores">
      <div class="score-box">
        <span class="label">Tổng Điểm</span>
        <span class="value">{{ totalScore }}</span>
      </div>
      <div class="score-box">
        <span class="label">Kho Dân</span>
        <span class="value">{{ score.dan }}</span>
      </div>
      <div class="score-box">
        <span class="label">Kho Quan</span>
        <span class="value">{{ score.quan }}</span>
      </div>
      <div v-if="debt > 0" class="score-box debt">
        <span class="label">Đang nợ</span>
        <span class="value">{{ debt }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  player: {
    type: Object,
    required: true,
  },
  score: { // là store.scores.player1 hoặc player2
    type: Object,
    required: true,
  },
  debt: {
    type: Number,
    default: 0,
  },
  isMyTurn: {
    type: Boolean,
    default: false,
  }
});

// Tính tổng điểm dựa trên luật (Quan * 5 + Dân)
const totalScore = computed(() => {
  return (props.score.quan * 5) + props.score.dan;
});
</script>

<style scoped>
.player-info {
  width: 900px;
  padding: 15px;
  background-color: #f5f5f5;
  border: 2px solid #ccc;
  border-radius: 8px;
  margin-bottom: 15px;
  box-sizing: border-box;
}
.active-turn {
  border-color: #4CAF50;
  background-color: #E8F5E9;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}
.player-name {
  margin: 0 0 10px 0;
  text-align: center;
  color: #333;
}
.scores {
  display: flex;
  justify-content: space-around;
  gap: 10px;
}
.score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background-color: white;
  border-radius: 5px;
  border: 1px solid #ddd;
  min-width: 100px;
}
.label {
  font-size: 12px;
  color: #777;
  font-weight: bold;
}
.value {
  font-size: 24px;
  font-weight: bold;
  color: #3E2723;
}
.debt .value {
  color: #D32F2F;
}
</style>