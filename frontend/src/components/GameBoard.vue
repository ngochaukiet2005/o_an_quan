<template>
  <div class="game-wrapper" ref="gameWrapperRef">
    
    <HandActor 
      :x="handState.x" 
      :y="handState.y" 
      :holdingCount="handState.holdingCount" 
      :show="handState.show"
      :duration="handState.duration"
      :handType="handState.handType" 
      :isRotated="isOpponentTurn"
    />
    <div class="board" v-if="displayBoard.length === 12" :class="playerViewClass">
       <div
            :ref="(el) => cellRefs[0] = el" 
            :class="['cell', 'quan-cell', 'quan-left', { clickable: false }]"
            @click="handleClick(0)"
        >
            <CellStones 
            :quanCount="displayBoard[0].quan" 
            :danCount="displayBoard[0].dan" 
            :seed="0"
            />
            <span class="label">Ô 0 (Quan P2)</span>
            <div class="stone-counter">
            <span v-if="displayBoard[0].quan > 0" class="counter-quan">{{ displayBoard[0].quan }}</span>
            <span v-if="displayBoard[0].dan > 0" class="counter-dan">{{ displayBoard[0].dan }}</span>
            </div>
        </div>

        <div class="board-row cell-row-a">
            <div
            v-for="i in 5"
            :key="11 - i + 1"
            :ref="(el) => cellRefs[11 - i + 1] = el" 
            :class="['cell', 'dan-cell', { clickable: isClickable(11 - i + 1) }]"
            @click="handleClick(11 - i + 1)"
            >
            <CellStones 
                :quanCount="0" 
                :danCount="displayBoard[11 - i + 1].dan" 
                :seed="11 - i + 1"
            />
            <span class="label">Ô {{ 11 - i + 1 }}</span>
            <div class="stone-counter">{{ displayBoard[11 - i + 1].dan }}</div>
            </div>
        </div>

        <div class="board-row cell-row-b">
            <div
            v-for="i in 5"
            :key="i"
            :ref="(el) => cellRefs[i] = el" 
            :class="['cell', 'dan-cell', { clickable: isClickable(i) }]"
            @click="handleClick(i)"
            >
            <CellStones 
                :quanCount="0" 
                :danCount="displayBoard[i].dan" 
                :seed="i"
            />
            <span class="label">Ô {{ i }}</span>
            <div class="stone-counter">{{ displayBoard[i].dan }}</div>
            </div>
        </div>

        <div
            :ref="(el) => cellRefs[6] = el" 
            :class="['cell', 'quan-cell', 'quan-right', { clickable: false }]"
            @click="handleClick(6)"
        >
            <CellStones 
            :quanCount="displayBoard[6].quan" 
            :danCount="displayBoard[6].dan" 
            :seed="6"
            />
            <span class="label">Ô 6 (Quan P1)</span>
            <div class="stone-counter">
            <span v-if="displayBoard[6].quan > 0" class="counter-quan">{{ displayBoard[6].quan }}</span>
            <span v-if="displayBoard[6].dan > 0" class="counter-dan">{{ displayBoard[6].dan }}</span>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, watch } from "vue";
import CellStones from "./CellStones.vue";
import HandActor from "./HandActor.vue";

const props = defineProps({
  board: { type: Array, default: () => [] },
  players: { type: Array, default: () => [] },
  currentTurnId: { type: String, default: "" },
  playerId: { type: String, default: "" },
});

const emits = defineEmits(["move", "score-update"]);

const gameWrapperRef = ref(null);
const cellRefs = reactive({});

// === SỬA STATE ===
const handState = reactive({
  x: 0, 
  y: 0, 
  holdingCount: 0, 
  show: false, 
  duration: 500,
  handType: 'normal' // Chỉ dùng biến này để điều khiển ảnh
});
// 👇 TÍNH TOÁN: Nếu người đang đi (currentTurnId) KHÁC với bản thân mình (playerId) 
// => Đó là đối thủ đang đi => Cần xoay tay
const isOpponentTurn = computed(() => {
  return props.currentTurnId && props.playerId && (props.currentTurnId !== props.playerId);
});
const displayBoard = ref([]);

watch(() => props.board, (newVal) => {
  if (newVal && newVal.length > 0) {
    displayBoard.value = JSON.parse(JSON.stringify(newVal));
  }
}, { immediate: true, deep: true });

const getCellPos = (index) => {
  const cellEl = cellRefs[index];
  if (!cellEl || !gameWrapperRef.value) return { x: 0, y: 0 };
  const rect = cellEl.getBoundingClientRect();
  const wrapperRect = gameWrapperRef.value.getBoundingClientRect();
  return {
    x: rect.left - wrapperRect.left + rect.width / 2,
    y: rect.top - wrapperRect.top + rect.height / 2
  };
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// === LOGIC ANIMATION ĐÃ CHỈNH SỬA ===
const runMoveAnimation = async (history) => {
  if (!history || history.length === 0) return;

  handState.show = true;
  handState.holdingCount = 0;
  handState.handType = 'normal'; // Reset về tay thường

  // Di chuyển đến vị trí đầu tiên
  if (history[0]) {
      const startIdx = (history[0].type === 'pickup') ? history[0].index : history[0].start;
      const firstPos = getCellPos(startIdx);
      handState.x = firstPos.x;
      handState.y = firstPos.y;
      await wait(200);
  }

  for (const action of history) {
    const { type, index, count, direction, start, eatenDan, eatenQuan } = action;

    // --- XỬ LÝ: DI CHUYỂN TỚI Ô TRỐNG (Move to Empty) ---
    if (type === 'move_to_empty') {
        const pos = getCellPos(index);
        handState.duration = 500; // Bay tới
        handState.x = pos.x;
        handState.y = pos.y;
        
        await wait(500); // Đợi bay tới nơi

        // ĐỔI ICON TAY (Hiệu ứng đập tay/chỉ tay)
        handState.handType = 'slap'; 
        
        // Dừng lại lâu hơn một chút để người chơi nhận ra hành động
        await wait(600);
    }

    // --- A. BỐC QUÂN ---
    else if (type === 'pickup') {
      // Đảm bảo tay về trạng thái thường
      handState.handType = 'normal'; 

      const pos = getCellPos(index);
      handState.duration = 500;
      handState.x = pos.x;
      handState.y = pos.y;
      
      await wait(500); 
      await wait(150); 

      handState.holdingCount += count;
      if (displayBoard.value[index]) {
        displayBoard.value[index].dan = 0;
      }

      await wait(300); 
    }

    // --- B. RẢI QUÂN ---
    else if (type === 'spread') {
      let currentCell = start;
      let remaining = count;
      handState.duration = 450;
      handState.handType = 'normal';

      while (remaining > 0) {
        const pos = getCellPos(currentCell);
        handState.x = pos.x;
        handState.y = pos.y;
        
        await wait(450); 
        await wait(200); 

        if (handState.holdingCount > 0) handState.holdingCount--;
        remaining--;

        if (displayBoard.value[currentCell]) {
          displayBoard.value[currentCell].dan += 1;
        }
        
        await wait(200);
        currentCell = (currentCell + direction + 12) % 12;
      }
    }

    // --- C. ĂN QUÂN ---
    else if (type === 'capture') {
      // Chuyển lại tay thường trước khi bay sang ô ăn
      handState.handType = 'normal';

      const pos = getCellPos(index);
      handState.duration = 500;
      handState.x = pos.x;
      handState.y = pos.y;
      
      await wait(500);
      await wait(200);
      
      if (displayBoard.value[index]) {
         displayBoard.value[index].dan = 0;
         displayBoard.value[index].quan = 0;
      }
      
      const points = (eatenQuan * 5) + eatenDan;
      emits('score-update', { points });
      
      await wait(600); 
    }
  }

  handState.show = false;
  handState.handType = 'normal'; // Reset cuối cùng
};

defineExpose({ runMoveAnimation });

// === 4. LOGIC GAMEPLAY (Giữ nguyên) ===
const myPlayerNumber = computed(() => {
  const me = props.players.find((p) => p.id === props.playerId);
  return me?.symbol === "X" ? 1 : 2;
});

const playerViewClass = computed(() => {
  return myPlayerNumber.value === 2 ? 'p2-view' : 'p1-view';
});

const isMyTurn = computed(() => props.currentTurnId === props.playerId);

const isMySquare = (index) => {
  return myPlayerNumber.value === 1 ? (index >= 1 && index <= 5) : (index >= 7 && index <= 11);
};

const isClickable = (index) => {
  if (!isMyTurn.value || !displayBoard.value[index] || index === 0 || index === 6) return false;
  if (!isMySquare(index)) return false;
  return displayBoard.value[index].dan > 0 && displayBoard.value[index].quan === 0;
};

function handleClick(index) {
  if (!isClickable(index)) return;
  emits("move", index);
}
</script>

<style scoped>
/* Giữ nguyên toàn bộ style của bạn */
.game-wrapper {
  margin-top: 20px;
  text-align: center;
  position: relative; 
}

.board {
  display: grid;
  grid-template-columns: 1fr 5fr 1fr; 
  grid-template-rows: auto auto; 
  gap: 10px;
  max-width: 900px;
  margin: 20px auto;
  padding: 15px;
  background-color: #f0e6d2;
  border: 5px solid #8d6e63;
  border-radius: 20px;
  user-select: none; 
}

.board-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.cell {
  position: relative; 
  padding: 0; 
  overflow: hidden; 
  background: white;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 16px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; 
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
  margin-top: 5px;
  font-size: 0.7rem;
  font-weight: bold;
  color: #5d4037;
  z-index: 200; 
  opacity: 0.8;
  pointer-events: none; 
}

.stone-counter {
  position: absolute;
  bottom: 5px;
  right: 5px;
  z-index: 200;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #ccc;
  border-radius: 50%;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
  color: #333;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.counter-quan { color: #d32f2f; margin-right: 3px; }
.counter-dan { color: #388e3c; }

.quan-cell {
  width: 90px; 
  min-height: 120px;
  background-color: #fcd34d !important; 
  border: 4px solid #b45309;
  justify-content: flex-start; 
  border-radius: 0; 
}

.quan-left {
  grid-row: 1 / span 2; 
  grid-column: 1;
  justify-self: end; 
  border-radius: 100px 0 0 100px; 
}

.quan-right {
  grid-row: 1 / span 2; 
  grid-column: 3;
  justify-self: start;
  border-radius: 0 100px 100px 0;
}

.cell-row-a { grid-row: 1; grid-column: 2; }
.cell-row-b { grid-row: 2; grid-column: 2; }

.p2-view {
  transform: rotate(180deg);
}
.p2-view .cell {
  transform: rotate(180deg);
}
.p2-view .cell.clickable:hover {
  background-color: #f7f3e8;
  transform: rotate(180deg) translateY(-2px); 
}
.p2-view .stone-counter {
  transform: rotate(0deg); 
}
.p2-view .quan-left { border-radius: 0 100px 100px 0 !important; }
.p2-view .quan-right { border-radius: 100px 0 0 100px !important; }
</style>