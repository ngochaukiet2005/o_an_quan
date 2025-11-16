<template>
  <div class="game-wrapper">
    <h2>Bàn chơi Ô Ăn Quan</h2>

    <div class="board" v-if="board.length === 12">
      <div
        :class="['cell', 'quan-left', { clickable: isClickable(5) }]"
        @click="handleClick(5)"
      >
        <span>{{ board[5] }}</span>
      </div>

      <div class="board-row cell-row-a">
        <div
          v-for="(cell, index) in board.slice(0, 5)"
          :key="index"
          :class="['cell', { clickable: isClickable(index) }]"
          @click="handleClick(index)"
        >
          <span>{{ cell }}</span>
        </div>
      </div>

      <div class="board-row cell-row-b">
        <div
          v-for="(cell, index) in board.slice(6, 11)"
          :key="index + 6"
          :class="['cell', { clickable: isClickable(index + 6) }]"
          @click="handleClick(index + 6)"
        >
          <span>{{ cell }}</span>
        </div>
      </div>

      <div
        :class="['cell', 'quan-right', { clickable: isClickable(11) }]"
        @click="handleClick(11)"
      >
        <span>{{ board[11] }}</span>
      </div>
    </div>

    <div class="turn-box"><strong>Lượt của:</strong> {{ currentTurnName }}</div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  board: { type: Array, required: true },
  players: { type: Array, required: true },
  playerId: { type: String, required: true },
  currentTurnId: { type: String, required: true },
});

const emits = defineEmits(["move"]);

// Tên người đang chơi
const currentTurnName = computed(() => {
  const p = props.players.find((x) => x.id === props.currentTurnId);
  return p ? p.name : "Đang chờ";
});

// Ô có thể bấm được không
function isClickable(index) {
  // Không cho bấm vào 2 ô Quan
  if (index === 0 || index === props.board.length - 1) return false;

  // Chỉ được bấm khi tới lượt mình
  return props.playerId === props.currentTurnId;
}

function handleClick(index) {
  if (!isClickable(index)) return;
  emits("move", index);
}
</script>

<style scoped>
.game-wrapper {
  margin-top: 20px;
  text-align: center;
}

/* Trong <style scoped> của GameBoard.vue */

.board {
  display: grid;
  grid-template-columns: 1fr 5fr 1fr; /* Cột Quan | 5 ô Dân | Cột Quan */
  grid-template-rows: 1fr 1fr; /* Hàng A | Hàng B */
  gap: 10px;
  max-width: 900px;
  margin: 20px auto;
}

.board-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

/* Gán các ô vào đúng vị trí */
.cell {
  padding: 14px 8px;
  background: white;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 18px;
  min-height: 50px; /* Thêm chiều cao */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Định vị các ô quan */
.cell.quan-left {
  grid-row: 1 / 3; /* Chạy từ hàng 1 đến hàng 3 */
  grid-column: 1 / 2; /* Cột 1 */
  min-height: 120px; /* Cao gấp đôi */
}

.cell.quan-right {
  grid-row: 1 / 3; /* Chạy từ hàng 1 đến hàng 3 */
  grid-column: 3 / 4; /* Cột 3 */
  min-height: 120px; /* Cao gấp đôi */
}

/* Hàng A (ô 1-5) */
.cell-row-a {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
}

/* Hàng B (ô 6-10) */
.cell-row-b {
  grid-row: 2 / 3;
  grid-column: 2 / 3;
}

/* ... các style .clickable khác giữ nguyên ... */

.cell.clickable {
  background: #d1fae5;
  cursor: pointer;
}

.cell.clickable:hover {
  background: #bbf7d0;
}

.turn-box {
  margin-top: 12px;
  font-size: 18px;
}
</style>
