<template>
  <div class="game-wrapper" ref="gameWrapperRef">
    
    <HandActor 
      :x="handState.x" 
      :y="handState.y" 
      :holdingCount="handState.holdingCount" 
      :show="handState.show"
      :duration="handState.duration"
      :handType="handState.handType" 
      :isRotated="handState.useCustomRotation ? handState.customIsRotated : isOpponentTurn"
    />
    
    <div class="board-container" v-if="displayBoard.length === 12">
      <div class="board" :class="playerViewClass">
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
              <div class="stone-counter" v-if="displayBoard[0].quan > 0 || displayBoard[0].dan > 0">
                 {{ displayBoard[0].quan * 5 + displayBoard[0].dan }}
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
              <div class="stone-counter" v-if="displayBoard[11 - i + 1].dan > 0">
                {{ displayBoard[11 - i + 1].dan }}
              </div>
              <div class="cell-index">{{ 11 - i + 1 }}</div>
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
              <div class="stone-counter" v-if="displayBoard[i].dan > 0">{{ displayBoard[i].dan }}</div>
              <div class="cell-index">{{ i }}</div>
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
              <div class="stone-counter" v-if="displayBoard[6].quan > 0 || displayBoard[6].dan > 0">
                {{ displayBoard[6].quan * 5 + displayBoard[6].dan }}
              </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* Logic script giữ nguyên 100% như file cũ của bạn 
  (Chỉ copy lại phần script từ file GameBoard.vue cũ vào đây)
*/
import { computed, ref, reactive, watch } from "vue";
import CellStones from "./CellStones.vue";
import HandActor from "./HandActor.vue";

const props = defineProps({
  board: { type: Array, default: () => [] },
  players: { type: Array, default: () => [] },
  currentTurnId: { type: String, default: "" },
  playerId: { type: String, default: "" },
});

const emits = defineEmits(["move", "score-update", "show-borrow-confirm"]);

const gameWrapperRef = ref(null);
const cellRefs = reactive({});

const handState = reactive({
  x: 0, 
  y: 0, 
  holdingCount: 0, 
  show: false, 
  duration: 500,
  handType: 'normal', 
  useCustomRotation: false, 
  customIsRotated: false,   
});

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

const runMoveAnimation = async (history) => {
  if (!history || history.length === 0) return;

  handState.show = true;
  handState.holdingCount = 0;
  handState.handType = 'normal'; 

  if (history[0]) {
      let startIdx = 0;
      if (history[0].type === 'pickup') startIdx = history[0].index;
      else if (history[0].type === 'spread') startIdx = history[0].start;
      else if (history[0].type === 'borrow') startIdx = history[0].indices[0]; // <--- Thêm dòng này
      // 👆👆👆 ------------------ 👆👆👆
      const firstPos = getCellPos(startIdx);
      handState.x = firstPos.x;
      handState.y = firstPos.y;
      await wait(200);
  }

  for (const action of history) {
    const { type, index, count, direction, start, eatenDan, eatenQuan } = action;
    // === 👇👇👇 LOGIC MỚI: DIỄN HOẠT GÂY GIỐNG/VAY DÂN 👇👇👇 ===
    if (type === 'borrow') {
        // Ẩn tay để hiện Modal xác nhận trước
        handState.show = false;
        
        // Gọi sự kiện ra ngoài GameRoom để hiện Popup
        // await để chờ người dùng bấm "Đồng ý" mới chạy tiếp
        await new Promise((resolve) => {
            emits('show-borrow-confirm', { 
                player: action.player, 
                callback: resolve 
            });
        });

        // Sau khi xác nhận: Hiện tay cầm 5 viên
        handState.holdingCount = 5;
        handState.show = true;
        handState.handType = 'normal';

        // Mẹo: Lúc này data bàn cờ thật đã có sỏi rồi (do server gửi về).
        // Ta cần tạm ẩn visual sỏi trên 5 ô đó đi để diễn hoạt tay rải ra.
        action.indices.forEach(idx => {
            if (displayBoard.value[idx]) displayBoard.value[idx].dan = 0;
        });

        // Diễn hoạt rải từng viên vào 5 ô
        for (const idx of action.indices) {
            const pos = getCellPos(idx);
            handState.duration = 400; // Tốc độ bay
            handState.x = pos.x;
            handState.y = pos.y;
            
            await wait(400); // Chờ tay bay đến
            
            // Giả lập rải: giảm trên tay, tăng dưới ô
            if (handState.holdingCount > 0) handState.holdingCount--;
            if (displayBoard.value[idx]) displayBoard.value[idx].dan = 1;
            
            await wait(150); // Dừng một chút ở mỗi ô
        }
        await wait(500); // Nghỉ sau khi rải xong
    }
    // === 👆👆👆 KẾT THÚC LOGIC MỚI 👆👆👆 ===
    if (type === 'move_to_empty') {
        const pos = getCellPos(index);
        handState.duration = 500;
        handState.x = pos.x;
        handState.y = pos.y;
        
        await wait(500);
        handState.handType = 'slap'; 
        await wait(600);
    }
    else if (type === 'pickup') {
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
    else if (type === 'capture') {
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
    else if (type === 'final_sweep') {
        handState.useCustomRotation = true; 
        if (action.player !== myPlayerNumber.value) {
            handState.customIsRotated = true; 
        } else {
            handState.customIsRotated = false; 
        }
        handState.handType = 'normal';
        const pos = getCellPos(index);
        handState.duration = 400; 
        handState.x = pos.x;
        handState.y = pos.y;
        await wait(400); 
        if (displayBoard.value[index]) {
            const totalStones = displayBoard.value[index].dan + (displayBoard.value[index].quan || 0);
            displayBoard.value[index].dan = 0;
            displayBoard.value[index].quan = 0;
            handState.holdingCount += totalStones;
        }
        await wait(300); 
    }
  }
  handState.show = false;
  handState.handType = 'normal'; 
  handState.useCustomRotation = false;
};

defineExpose({ runMoveAnimation });

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
.game-wrapper {
  margin-top: 10px;
  text-align: center;
  position: relative; 
}

/* Container để tạo bóng đổ cho cả bàn */
.board-container {
  padding: 20px;
  display: inline-block;
  background: #8d6e63; /* Màu gỗ ngoài cùng */
  border-radius: 50px;
  box-shadow: 0 20px 30px rgba(0,0,0,0.3), inset 0 0 20px rgba(0,0,0,0.2);
}

.board {
  display: grid;
  grid-template-columns: 100px 500px 100px; 
  grid-template-rows: 100px 100px; 
  gap: 12px;
  
  /* Nền bàn cờ chính */
  background-color: #eecfa1;
  border: 2px solid #6d4c41;
  border-radius: 40px;
  padding: 10px;
  user-select: none; 
}

.board-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

/* STYLE CHUNG CHO Ô */
.cell {
  position: relative; 
  overflow: hidden;
  
  /* Tạo hiệu ứng lõm xuống */
  background: #d7ccc8; 
  box-shadow: inset 3px 3px 8px rgba(0,0,0,0.15), inset -3px -3px 8px rgba(255,255,255,0.5);
  
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: not-allowed;
  transition: all 0.2s ease;
}

.cell.clickable {
  cursor: grab;
  background: #fffde7; /* Màu sáng hơn để mời gọi click */
  border: 2px solid #8bc34a;
  box-shadow: 0 5px 10px rgba(0,0,0,0.1); /* Nổi lên */
}

.cell.clickable:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.cell.clickable:hover {
  background: #ffffff;
  transform: translateY(-2px);
}

/* Số hiệu ô (nhỏ, mờ) */
.cell-index {
  position: absolute;
  top: 2px;
  left: 5px;
  font-size: 0.6rem;
  color: #8d6e63;
  opacity: 0.5;
  pointer-events: none;
}

/* Số lượng sỏi */
.stone-counter {
  position: absolute;
  bottom: 5px;
  right: 5px;
  z-index: 200;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 0.8rem;
  font-weight: bold;
  pointer-events: none;
}

/* Ô QUAN */
.quan-cell {
  background: #ffecb3; /* Màu vàng nhạt sang trọng cho Quan */
  border: 4px solid #8d6e63;
  box-shadow: inset 0 0 20px rgba(141, 110, 99, 0.3);
}

.quan-left {
  grid-row: 1 / span 2; 
  grid-column: 1;
  border-radius: 60px 12px 12px 60px; 
}

.quan-right {
  grid-row: 1 / span 2; 
  grid-column: 3;
  border-radius: 12px 60px 60px 12px;
}

.cell-row-a { grid-row: 1; grid-column: 2; }
.cell-row-b { grid-row: 2; grid-column: 2; }

/* Xoay bàn cờ cho P2 */
.p2-view {
  transform: rotate(180deg);
}
.p2-view .cell {
  transform: rotate(180deg);
}
.p2-view .stone-counter {
  transform: rotate(0deg); 
}
.p2-view .cell-index {
   transform: rotate(180deg);
   top: auto; bottom: 2px; left: auto; right: 5px; /* Điều chỉnh vị trí số khi xoay */
}
.p2-view .cell.clickable:hover {
  background-color: #f7f3e8;
  transform: rotate(180deg) translateY(-2px); 
}
/* 👇👇👇 SỬA & THÊM VÀO CUỐI 👇👇👇 */

.game-wrapper {
  margin-top: 10px;
  text-align: center;
  position: relative;
  /* Đảm bảo wrapper bao trọn để tính toán tọa độ tay chính xác */
  width: 100%;
  display: flex;
  justify-content: center;
}

/* Responsive Scale cho bàn cờ */
@media (max-width: 850px) {
  .board-container {
    transform-origin: top center; /* Thu nhỏ từ trên xuống */
    transform: scale(0.85); /* Thu nhỏ 85% */
    margin-bottom: -30px; /* Bù lại khoảng trống do thu nhỏ */
  }
}

@media (max-width: 650px) {
  .board-container {
    transform: scale(0.65);
    margin-bottom: -80px;
  }
}

@media (max-width: 480px) {
  .board-container {
    transform: scale(0.48); /* Thu nhỏ 48% cho điện thoại dọc */
    margin-bottom: -120px;
  }
}

@media (max-width: 380px) {
  .board-container {
    transform: scale(0.4);
    margin-bottom: -140px;
  }
}
</style>