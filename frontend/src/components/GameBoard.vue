<template>
  <div class="board-container" ref="boardEl">
    
    <div
      class="sow-hand"
      :class="{ hidden: !handVisible }"
      :style="handStyle"
    >
      🤚
      <span class="hand-stone-count" v-if="handStones > 0">{{
        handStones
      }}</span>
    </div>

    <div
      v-for="stone in animatingStones"
      :key="stone.id"
      class="animating-stone"
      :style="stone.style"
    ></div>

    <div class="player-row opponent-row">
      <div
        v-for="cellIndex in opponentCellIndices"
        :key="'opp-' + cellIndex"
        class="cell dan"
        :data-index="cellIndex"
      >
        <div class="stone-container">
          <Stone
            v-for="stone in getStonesForCell(cellIndex)"
            :key="stone.id"
            :is-quan="stone.isQuan"
          />
        </div>
        <span class="stone-count-label" v-if="localBoard[cellIndex]">{{
          localBoard[cellIndex].dan
        }}</span>
      </div>
    </div>

    <div class="quan-row">
      <div class="cell quan" :data-index="quanCellIndices[0]">
        <div class="stone-container">
          <Stone
            v-for="stone in getStonesForCell(quanCellIndices[0])"
            :key="stone.id"
            :is-quan="stone.isQuan"
          />
        </div>
        <span class="stone-count-label quan-label" v-if="localBoard[quanCellIndices[0]]"
          >Quan: {{ localBoard[quanCellIndices[0]].quan }}<br>Dân: {{ localBoard[quanCellIndices[0]].dan }}</span
        >
      </div>
      <div class="cell quan" :data-index="quanCellIndices[1]">
        <div class="stone-container">
          <Stone
            v-for="stone in getStonesForCell(quanCellIndices[1])"
            :key="stone.id"
            :is-quan="stone.isQuan"
          />
        </div>
        <span class="stone-count-label quan-label" v-if="localBoard[quanCellIndices[1]]"
          >Quan: {{ localBoard[quanCellIndices[1]].quan }}<br>Dân: {{ localBoard[quanCellIndices[1]].dan }}</span
        >
      </div>
    </div>

    <div class="player-row my-row">
      <div
        v-for="cellIndex in myCellIndices"
        :key="'my-' + cellIndex"
        class="cell dan"
        :class="{ clickable: myTurn && (localBoard[cellIndex] && (localBoard[cellIndex].quan > 0 || localBoard[cellIndex].dan > 0)) }"
        :data-index="cellIndex"
        @click="onCellClick(cellIndex, localBoard[cellIndex])"
      >
        <div class="stone-container">
          <Stone
            v-for="stone in getStonesForCell(cellIndex)"
            :key="stone.id"
            :is-quan="stone.isQuan"
          />
        </div>
        <span class="stone-count-label" v-if="localBoard[cellIndex]">{{
          localBoard[cellIndex].dan
        }}</span>
      </div>
    </div>

    <DirectionModal
      v-if="selectedCellIndex !== null"
      :stones="selectedCellStones"
      @select="submitMove"
      @cancel="selectedCellIndex = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useSowAnimation } from "@/composables/useSowAnimation.js";
import DirectionModal from "./DirectionModal.vue";
import Stone from "./Stone.vue";

const props = defineProps({
  board: { type: Array, required: true },
  mySymbol: { type: String, required: true },
  myTurn: { type: Boolean, required: true },
});

const emit = defineEmits(["make-move", "animation-start", "animation-end"]);

// --- State ---
const localBoard = ref([]);
const boardEl = ref(null);
const selectedCellIndex = ref(null);
const selectedCellStones = ref(0);

// --- Import Logic Animation (Tạm thời không dùng) ---
const { handVisible, handStyle, handStones, animatingStones, runSowAnimation } =
  useSowAnimation();

// Đồng bộ 'prop.board' vào 'localBoard' (Giữ nguyên logic "snap")
watch(
  () => props.board,
  (newBoard) => {
    localBoard.value = [...newBoard];
  },
  { immediate: true, deep: true }
);

// (Các computed cơ bản giữ nguyên)
const quanCellIndices = [0, 6];
const myCellIndices = computed(() =>
  props.mySymbol === "P1" ? [1, 2, 3, 4, 5] : [7, 8, 9, 10, 11]
);
const opponentCellIndices = computed(() =>
  props.mySymbol === "P1" ? [7, 8, 9, 10, 11] : [1, 2, 3, 4, 5]
);

// --- LOGIC HIỂN THỊ MỚI (QUAN LÀ QUAN, DÂN LÀ DÂN) ---
const MAX_STONES_TO_DISPLAY = 15;

const getStonesForCell = (cellIndex) => {
  if (localBoard.value.length === 0) return [];
  
  const cell = localBoard.value[cellIndex];
  if (!cell) return []; // Tránh lỗi nếu cell chưa tồn tại

  const stones = [];
  
  // 1. Hiển thị tất cả Quan (đỏ)
  // (Giới hạn hiển thị để tránh lag)
  const quanCount = Math.min(cell.quan, MAX_STONES_TO_DISPLAY);
  for (let i = 0; i < quanCount; i++) {
    stones.push({ id: `${cellIndex}-quan-${i}`, isQuan: true });
  }

  // 2. Hiển thị tất cả Dân (nâu)
  // (Giới hạn hiển thị)
  const danCount = Math.min(cell.dan, MAX_STONES_TO_DISPLAY - quanCount);
  for (let i = 0; i < danCount; i++) {
    stones.push({ id: `${cellIndex}-dan-${i}`, isQuan: false });
  }
  
  return stones;
};
// ------------------------------------

// --- Xử lý Nước đi (Đã sửa ở bước trước) ---
const onCellClick = (index, cell) => { // <-- Nhận 'cell' thay vì 'currentStoneCount'
  if (!props.myTurn) return; // <-- Chỉ check 'myTurn'

  const totalStones = cell ? (cell.quan + cell.dan) : 0;
  
  selectedCellIndex.value = index;
  selectedCellStones.value = totalStones;
};

// --- Submit (Đã sửa ở bước trước) ---
const submitMove = async (direction) => {
  const startIndex = selectedCellIndex.value;
  
  selectedCellIndex.value = null;
  selectedCellStones.value = 0;

  emit("animation-start");
  
  emit("make-move", {
    cellIndex: startIndex,
    direction: direction,
  });
  
  emit("animation-end");
};
</script>

<style scoped>
/* (CSS cũ của bàn cờ giữ nguyên) */
.board-container {
  max-width: 1000px; margin: 20px auto; border: 5px solid #8d6e63;
  border-radius: 15px; background-color: #efebe9; padding: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  position: relative; height: 280px; padding-left: 130px; padding-right: 130px;
}
.player-row, .quan-row { display: flex; justify-content: space-between; }
.quan-row { padding: 10px 0; }
.cell {
  border: 3px solid #a1887f; background-color: #d7ccc8; height: 120px;
  display: flex; justify-content: center; align-items: center; flex-direction: column;
  position: relative; overflow: hidden;
}
.cell.dan { width: 120px; border-radius: 10px; }
.cell.quan {
  width: 100px; height: 250px; position: absolute; top: 15px;
  writing-mode: vertical-rl;
}
.cell.quan:first-child { border-radius: 120px 0 0 120px; left: 15px; }
.cell.quan:last-child { border-radius: 0 120px 120px 0; right: 15px; }
.player-row { width: calc(100% - 240px); margin: 0 auto; }
.my-row { order: 3; }
.opponent-row { order: 1; }
.quan-row { order: 2; }
.opponent-row + .quan-row .quan { border-radius: 0 0 120px 120px; }
.quan-row + .my-row .quan { border-radius: 120px 120px 0 0; }
.stone-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

/* Bỏ style .stone và .quan-stone (đã chuyển sang Stone.vue) */

.stone-count-label { position: absolute; bottom: 5px; right: 8px; font-weight: bold; font-size: 1.2rem; color: #3e2723; opacity: 0.7; }
.quan-label { bottom: auto; right: auto; position: relative; transform: rotate(180deg); margin: 10px; font-size: 1rem; opacity: 1; background-color: rgba(255, 255, 255, 0.5); padding: 5px 2px; border-radius: 4px; }
.cell.clickable { cursor: pointer; background-color: #c8e6c9; border-color: #4caf50; }
.cell.clickable:hover { background-color: #a5d6a7; transform: scale(1.02); }

/* --- CSS Bàn Tay (YÊU CẦU: To hơn) --- */
.sow-hand {
  position: absolute;
  font-size: 6rem; /* Tăng từ 5.5rem -> 6rem */
  z-index: 50;
  /* --- YÊU CẦU: Tốc độ lia tay (chậm lại) --- */
  transition: all 0.6s ease-out; /* Tăng từ 0.5s -> 0.6s */
  pointer-events: none;
  transform: translate(-50%, -50%); 
}
.sow-hand.hidden {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}
.hand-stone-count {
  position: absolute;
  top: 0px;
  right: -10px;
  background-color: #d50000;
  color: white;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid white;
}

/* --- CSS cho viên sỏi đang animation --- */
.animating-stone {
  position: absolute; /* Rất quan trọng: Phải absolute so với board-container */
  top: 0; left: 0; /* Bắt đầu từ (0,0) của board */
  width: 18px;
  height: 18px;
  background-color: #c8e6c9; /* Màu sỏi đang rơi (xanh lá) */
  border: 1px solid #795548;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  z-index: 40; 
  pointer-events: none;
  /* Transition sẽ được JS thêm vào (trong useSowAnimation.js) */
}
</style>