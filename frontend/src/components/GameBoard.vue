<template>
  <div class="game-wrapper">
    <div class="board" v-if="board.length === 12" :class="playerViewClass">
      <div
        :class="['cell', 'quan-cell', 'quan-left', { clickable: false }]"
        @click="handleClick(0)"
      >
        <span class="label">Ô 0 (Quan P2)</span>
        <div class="stones">
          <span class="quan-count">Q: {{ board[0].quan }}</span>
          <span class="dan-count">D: {{ board[0].dan }}</span>
        </div>
      </div>

      <div class="board-row cell-row-a">
        <div
          v-for="i in 5"
          :key="11 - i + 1"
          :class="['cell', 'dan-cell', { clickable: isClickable(11 - i + 1) }]"
          @click="handleClick(11 - i + 1)"
        >
          <span class="label">Ô {{ 11 - i + 1 }}</span>
          <div class="stones">
            <span class="dan-count">D: {{ board[11 - i + 1].dan }}</span>
          </div>
        </div>
      </div>

      <div class="board-row cell-row-b">
        <div
          v-for="i in 5"
          :key="i"
          :class="['cell', 'dan-cell', { clickable: isClickable(i) }]"
          @click="handleClick(i)"
        >
          <span class="label">Ô {{ i }}</span>
          <div class="stones">
            <span class="dan-count">D: {{ board[i].dan }}</span>
          </div>
        </div>
      </div>

      <div
        :class="['cell', 'quan-cell', 'quan-right', { clickable: false }]"
        @click="handleClick(6)"
      >
        <span class="label">Ô 6 (Quan P1)</span>
        <div class="stones">
          <span class="quan-count">Q: {{ board[6].quan }}</span>
          <span class="dan-count">D: {{ board[6].dan }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  board: {
    type: Array,
    default: () => [],
  },
  players: {
    type: Array,
    default: () => [],
  },
  currentTurnId: {
    type: String,
    default: "",
  },
  playerId: {
    type: String,
    default: "",
  },
});

const emits = defineEmits(["move"]);

const myPlayerNumber = computed(() => {
  const me = props.players.find((p) => p.id === props.playerId);
  return me?.symbol === "X" ? 1 : 2;
});
// === THÊM DÒNG NÀY VÀO ===
const playerViewClass = computed(() => {
  return myPlayerNumber.value === 2 ? 'p2-view' : 'p1-view';
});
// =========================
const isMyTurn = computed(() => props.currentTurnId === props.playerId);

// Hàm kiểm tra xem ô có phải của phe mình không
const isMySquare = (index) => {
  if (myPlayerNumber.value === 1) {
    return index >= 1 && index <= 5; // P1 sở hữu ô 1-5
  } else {
    return index >= 7 && index <= 11; // P2 sở hữu ô 7-11
  }
};

const isClickable = (index) => {
  if (
    !isMyTurn.value ||
    !props.board[index] ||
    index === 0 ||
    index === 6
  ) {
    return false;
  }
  // Chỉ được nhấp vào ô của mình
  if (!isMySquare(index)) {
    return false;
  }
  // Phải có Dân và không có Quan
  return props.board[index].dan > 0 && props.board[index].quan === 0;
};

function handleClick(index) {
  if (!isClickable(index)) {
    if (!isMyTurn.value) {
      alert("Chưa đến lượt của bạn!");
    } else if (index === 0 || index === 6) {
      alert("Không thể bốc từ ô Quan.");
    } else if (!isMySquare(index)) {
      alert("Bạn chỉ có thể chọn ô dân ở phía của mình.");
    } else if (props.board[index].dan === 0) {
      alert("Không thể bốc từ ô dân rỗng.");
    }
    return;
  }
  emits("move", index);
}
</script>

<style scoped>
.game-wrapper {
  margin-top: 20px;
  text-align: center;
}

.board {
  display: grid;
  grid-template-columns: 1fr 5fr 1fr; /* Cột Quan | 5 ô Dân | Cột Quan */
  grid-template-rows: auto auto; /* Hàng A | Hàng B */
  gap: 10px;
  max-width: 900px;
  margin: 20px auto;
  padding: 15px;
  background-color: #f0e6d2;
  border: 5px solid #8d6e63;
  border-radius: 20px;
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
  font-size: 16px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  cursor: not-allowed;
  transition: all 0.2s ease;
}

.cell.clickable {
  cursor: pointer;
  border-color: #10b981;
}
.cell.clickable:hover {
  background-color: #f7f3e8;
  transform: translateY(-2px);
}

.cell .label {
  font-size: 0.8rem;
  font-weight: bold;
  color: #5d4037;
}

.cell .stones {
  font-size: 1.5rem;
  font-weight: bold;
}
.dan-cell .stones {
  font-size: 2rem;
}

.quan-count {
  color: #d32f2f;
  margin-right: 10px;
}
.dan-count {
  color: #388e3c;
}

/* Định vị các ô quan */
.quan-cell {
  border-radius: 40px;
  min-height: 120px;
  justify-content: center;
}
.quan-left {
  grid-row: 1 / span 2; /* Nằm ở hàng 1, kéo dài 2 hàng */
  grid-column: 1;
}
.quan-right {
  grid-row: 1 / span 2; /* Nằm ở hàng 1, kéo dài 2 hàng */
  grid-column: 3;
}

/* Định vị hàng dân */
.cell-row-a {
  grid-row: 1;
  grid-column: 2;
}
.cell-row-b {
  grid-row: 2;
  grid-column: 2;
}
/* --- Bố cục Xoay cho P2 --- */
.p2-view {
  /* Xoay toàn bộ bàn cờ 180 độ */
  transform: rotate(180deg);
  transition: transform 0.5s ease;
}

.p2-view .cell {
  /* Xoay ngược chữ và các-thành-phần-con lại để đọc được */
  transform: rotate(180deg);
}
/* ================================= */
</style>