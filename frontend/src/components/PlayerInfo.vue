<!-- src/components/PlayerInfo.vue -->
<template>
  <div class="players">
    <div
      v-for="p in players"
      :key="p.id"
      class="player"
      :class="{ active: p.id === currentTurnId }"
    >
      <div class="row1">
        <strong>{{ p.name }}</strong>
        <span>({{ p.symbol || "P" }})</span>
      </div>
      <div class="row2">
        ID: <code>{{ p.id }}</code>
      </div>
      <div class="row2">
        Điểm: <strong>{{ p.score ?? 0 }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  players: {
    type: Array,
    default: () => [],
  },
  currentTurnId: {
    type: String,
    default: "",
  },
});
</script>

<style scoped>
.players {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.player {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 8px 10px;
  min-width: 180px;
  background: #f9fafb;
}

.player.active {
  border-color: #16a34a;
  background: #ecfdf3;
}

.row1 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.row2 {
  font-size: 13px;
}

code {
  font-size: 12px;
}
</style>
