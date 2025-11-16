<template>
  <div class="game-board">
    <div class="row top-row">
      <div
        class="pit quan-pit"
        :class="{ active: activePit === 0 }"
        @click="() => onPitClick(0)"
      >
        <div class="stone-summary-text">
          <div class="label">Ô 0 (Quan P2)</div>
          <div class="counts">
            <span class="quan-count">Q: {{ boardState[0]?.quan || 0 }}</span>
            <span class="dan-count">D: {{ boardState[0]?.dan || 0 }}</span>
          </div>
        </div>
      </div>

      <div
        v-for="i in 5"
        :key="i"
        class="pit square-pit"
        :class="{ active: activePit === i, 'clickable': isClickable(i) }"
        @click="() => onPitClick(i)"
      >
        <div class="stone-summary-text">
          <div class="label">Ô {{ i }} (P1)</div>
          <div class="counts">
            <span class="quan-count">Q: {{ boardState[i]?.quan || 0 }}</span>
            <span class="dan-count">D: {{ boardState[i]?.dan || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="row bottom-row">
       <div
        class="pit quan-pit"
        :class="{ active: activePit === 6 }"
        @click="() => onPitClick(6)"
      >
        <div class="stone-summary-text">
          <div class="label">Ô 6 (Quan P1)</div>
          <div class="counts">
            <span class="quan-count">Q: {{ boardState[6]?.quan || 0 }}</span>
            <span class="dan-count">D: {{ boardState[6]?.dan || 0 }}</span>
          </div>
        </div>
      </div>
      
      <div
        v-for="i in 5"
        :key="11 - i + 1"
        class="pit square-pit"
        :class="{ active: activePit === 11 - i + 1, 'clickable': isClickable(11 - i + 1) }"
        @click="() => onPitClick(11 - i + 1)"
      >
        <div class="stone-summary-text">
          <div class="label">Ô {{ 11 - i + 1 }} (P2)</div>
          <div class="counts">
            <span class="quan-count">Q: {{ boardState[11 - i + 1]?.quan || 0 }}</span>
            <span class="dan-count">D: {{ boardState[11 - i + 1]?.dan || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { store } from '../store.js';

const boardState = computed(() => store.board);
const activePit = computed(() => store.activePit);
const isMyTurn = computed(() => store.nextTurnPlayerId === store.myPlayerId);

// SỬA LỖI 2: Đổi tên emit thành 'cell-click'
const emit = defineEmits(['cell-click']);

// Hàm kiểm tra xem ô có thể được nhấp hay không
const isClickable = (index) => {
  if (!isMyTurn.value || !boardState.value[index]) {
    return false;
  }
  // Theo luật, chỉ được nhấp vào ô Dân (không phải 0 hoặc 6)
  if (index === 0 || index === 6) {
    return false;
  }
  // Và ô đó phải có Dân và không có Quan
  return boardState.value[index].dan > 0 && boardState.value[index].quan === 0;
};

const onPitClick = (index) => {
  // SỬA LỖI 3: Kiểm tra logic hợp lệ trước khi emit
  if (isClickable(index)) {
    emit('cell-click', index);
  } else {
    // (GameRoom.vue cũng sẽ hiển thị lỗi, nhưng đây là phản hồi tức thì)
    console.log("Không thể chọn ô này.");
  }
};
</script>

<style scoped>
/* GIỮ NGUYÊN CSS CŨ CHO BỐ CỤC BÀN CỜ */
.game-board {
  display: flex;
  flex-direction: column;
  width: 900px;
  margin: 20px auto;
  background-color: #f0e6d2;
  border: 5px solid #8d6e63;
  border-radius: 20px;
  padding: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.row {
  display: flex;
}

.top-row {
  flex-direction: row-reverse; /* Để ô 0 (Quan P2) ở bên trái */
}

.pit {
  border: 2px solid #a1887f;
  margin: 5px;
  cursor: not-allowed; /* Mặc định là không cho phép */
  position: relative;
  background-color: #fffbf2;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
  min-height: 120px; /* Đảm bảo chiều cao tối thiểu */
}

/* CSS MỚI: Chỉ khi 'clickable' mới đổi con trỏ */
.pit.clickable {
  cursor: pointer;
}
.pit.clickable:hover {
  background-color: #f7f3e8;
}

.pit.active {
  border-color: #e53935;
  box-shadow: 0 0 15px #e53935;
  transform: scale(1.05);
}

.square-pit {
  width: 120px;
  height: 120px;
  border-radius: 10px;
}

.quan-pit {
  width: 250px;
  height: 120px;
  margin: 5px 10px;
}
.top-row .quan-pit {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-top-left-radius: 125px;
  border-top-right-radius: 125px;
}
.bottom-row .quan-pit {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 125px;
  border-bottom-right-radius: 125px;
}


/* === CSS MỚI ĐỂ HIỂN THỊ DÂN VÀ QUAN === */
.stone-summary-text {
  font-family: Arial, sans-serif;
  text-align: center;
  color: #333;
  font-weight: bold;
  padding: 10px;
}

.stone-summary-text .label {
  font-size: 0.9rem;
  color: #5d4037;
  margin-bottom: 10px;
}

.stone-summary-text .counts {
  font-size: 1.8rem;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  justify-content: center;
}

.quan-count {
  color: #d32f2f; /* Màu đỏ cho Quan */
  font-weight: bold;
}

.dan-count {
  color: #388e3c; /* Màu xanh lá cho Dân */
}

/* Tùy chỉnh cho ô Dân (chỉ hiển thị Dân) */
.square-pit .stone-summary-text .counts {
  font-size: 2.5rem;
}
.square-pit .quan-count {
  display: none; /* Ẩn số lượng Quan ở ô Dân */
}

/* Tùy chỉnh cho ô Quan */
.quan-pit .stone-summary-text .counts {
  flex-direction: row; /* Quan và Dân nằm ngang */
  font-size: 2rem;
  gap: 20px;
}
</style>