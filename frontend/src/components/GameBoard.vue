<template>
  <div class="game-board">
    <div class="row top-row">
      <div
        class="pit quan-pit"
        :class="{ active: activePit === 0 }"
        @click="() => onPitClick(0)"
      >
        <div class="stone-summary-text">
          <div>Ô 0</div>
          <div class="count">{{ boardState[0].stones }}</div>
          <div class="type">QUAN</div>
        </div>
      </div>
      <div
        v-for="i in 5"
        :key="i"
        class="pit square-pit"
        :class="{ active: activePit === i }"
        @click="() => onPitClick(i)"
      >
        <div class="stone-summary-text">
          <div>Ô {{ i }}</div>
          <div class="count">{{ boardState[i].stones }}</div>
          <div class="type">DÂN</div>
        </div>
      </div>
    </div>

    <div class="row bottom-row">
      <div
        v-for="i in 5"
        :key="11 - i + 1"
        class="pit square-pit"
        :class="{ active: activePit === 11 - i + 1 }"
        @click="() => onPitClick(11 - i + 1)"
      >
        <div class="stone-summary-text">
          <div>Ô {{ 11 - i + 1 }}</div>
          <div class="count">{{ boardState[11 - i + 1].stones }}</div>
          <div class="type">DÂN</div>
        </div>
      </div>
      <div
        class="pit quan-pit"
        :class="{ active: activePit === 6 }"
        @click="() => onPitClick(6)"
      >
        <div class="stone-summary-text">
          <div>Ô 6</div>
          <div class="count">{{ boardState[6].stones }}</div>
          <div class="type">QUAN</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
// import Stone from './Stone.vue'; // <-- Đã xóa, không cần hiển thị đá nữa

const store = useStore();
const boardState = computed(() => store.state.boardState);
const activePit = computed(() => store.state.activePit);

const emit = defineEmits(['pit-click']);

const onPitClick = (index) => {
  // Chỉ emit nếu ô đó không phải ô quan rỗng
  if (boardState.value[index].isQuan && boardState.value[index].stones === 0) {
    console.log("Không thể chọn ô quan rỗng");
    return;
  }
  // Chỉ emit nếu ô dân đó có đá
  if (!boardState.value[index].isQuan && boardState.value[index].stones === 0) {
    console.log("Không thể chọn ô dân rỗng");
    return;
  }
  emit('pit-click', index);
};
</script>

<style scoped>
/* GIỮ NGUYÊN CSS CŨ CHO BỐ CỤC BÀN CỜ 
  VÀ THÊM CSS MỚI CHO HIỂN THỊ TEXT 
*/

.game-board {
  display: flex;
  flex-direction: column;
  width: 900px;
  margin: 20px auto;
  background-color: #f0e6d2; /* Màu bàn cờ gỗ sáng */
  border: 5px solid #8d6e63; /* Viền gỗ đậm */
  border-radius: 20px;
  padding: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.row {
  display: flex;
}

.bottom-row {
  /* Hàng dưới đi từ phải sang trái (ô 7 đến 11) */
  flex-direction: row-reverse;
}

.pit {
  border: 2px solid #a1887f; /* Viền ô */
  margin: 5px;
  cursor: pointer;
  position: relative;
  background-color: #fffbf2; /* Màu trong ô */
  
  /* Căn giữa text */
  display: flex; 
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
}

.pit.active {
  border-color: #e53935; /* Màu đỏ khi active */
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
/* Làm cho ô quan có hình bán nguyệt */
.top-row .quan-pit {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-top-left-radius: 125px; /* (width / 2) */
  border-top-right-radius: 125px;
}
.bottom-row .quan-pit {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 125px;
  border-bottom-right-radius: 125px;
}


/* === CSS MỚI ĐỂ HIỂN THỊ TEXT === */
.stone-summary-text {
  font-family: Arial, sans-serif;
  text-align: center;
  color: #333;
  font-weight: bold;
}

.stone-summary-text .count {
  font-size: 2.5rem;
  font-weight: bold;
}

.stone-summary-text .type {
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Màu cho ô Dân */
.square-pit .stone-summary-text .count {
  color: #388e3c; /* Màu xanh lá */
}
.square-pit .stone-summary-text .type {
  color: #5d4037; /* Màu nâu */
}

/* Màu cho ô Quan */
.quan-pit .stone-summary-text .count {
  color: #d32f2f; /* Màu đỏ */
}
.quan-pit .stone-summary-text .type {
  color: #333;
}
</style>