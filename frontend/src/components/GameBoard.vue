<template>
  <div class="game-wrapper" ref="gameWrapperRef">

    <div style="display: none; position: absolute; width: 0; height: 0; overflow: hidden;">
       <img src="/img/hand-slap.png" alt="preload" />
       <img src="/img/hand.png" alt="preload" />
       <img src="/img/stone-dan.png" alt="preload" />
       <img src="/img/stone-quan.png" alt="preload" />
    </div>

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
const isProcessing = ref(false); // <--- THÊM DÒNG NÀY
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
    isProcessing.value = false;
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

// Trong frontend/src/components/GameBoard.vue

// 👇 Sửa dòng khai báo để nhận thêm tham số skipTime (mặc định là 0)
const runMoveAnimation = async (history, skipTime = 0, movingPlayerId = null) => {
  if (!history || history.length === 0) return;
  // === 🛠️ FIX LỖI XOAY TAY 🛠️ ===
  // Bắt buộc sử dụng chế độ xoay thủ công cho toàn bộ chuỗi animation này
  handState.useCustomRotation = true;
  
  if (movingPlayerId) {
      // Nếu người đi KHÔNG phải là tôi -> Xoay tay 180 độ (đối thủ)
      handState.customIsRotated = (movingPlayerId !== props.playerId);
  } else {
      // Fallback nếu không truyền ID (giữ logic cũ nhưng rủi ro)
      handState.customIsRotated = isOpponentTurn.value;
  }
  // ==============================
  // Biến theo dõi thời gian đã trôi qua trong animation
  let timePassed = 0;

  handState.show = true;
  handState.holdingCount = 0;
  handState.handType = 'normal'; 

  // Di chuyển tay đến vị trí đầu tiên
  if (history[0]) {
      let startIdx = 0;
      if (history[0].type === 'pickup') startIdx = history[0].index;
      else if (history[0].type === 'spread') startIdx = history[0].start;
      else if (history[0].type === 'borrow') startIdx = history[0].indices[0];
      
      const firstPos = getCellPos(startIdx);
      handState.x = firstPos.x;
      handState.y = firstPos.y;
      
      // Chỉ wait nếu chưa bị tua qua
      if (timePassed >= skipTime) await wait(200);
      timePassed += 200;
  }

  for (const action of history) {
    const { type, index, count, direction, start, eatenDan, eatenQuan } = action;

    // --- LOGIC 1: XỬ LÝ VAY MƯỢN (BORROW) ---
    if (type === 'borrow') {
        // Nếu đã qua thời gian này -> Thực hiện ngay lập tức (SKIP)
        if (timePassed + 2000 < skipTime) { 
             // (Giả định animation này tốn khoảng 2000ms)
             // Cập nhật data ngay lập tức mà không hiện tay
             action.indices.forEach(idx => {
                 if (displayBoard.value[idx]) displayBoard.value[idx].dan = 1;
             });
             timePassed += 2000;
             continue; // Bỏ qua diễn hoạt
        }

        handState.show = false;
        // Nếu đang tua thì không hiện popup confirm nữa (coi như đã đồng ý)
        if (skipTime === 0) {
            await new Promise((resolve) => {
                emits('show-borrow-confirm', { player: action.player, callback: resolve });
            });
        }

        handState.holdingCount = 5;
        handState.show = true;
        
        // Tạm ẩn sỏi để diễn hoạt
        action.indices.forEach(idx => {
            if (displayBoard.value[idx]) displayBoard.value[idx].dan = 0;
        });

        for (const idx of action.indices) {
            const pos = getCellPos(idx);
            handState.x = pos.x;
            handState.y = pos.y;
            
            // Logic Skip từng bước nhỏ
            if (timePassed < skipTime) { 
                // Skip
            } else {
                await wait(450); 
            }
            timePassed += 450;
            // 2. DỪNG TRƯỚC KHI THẢ (200ms - Bằng với spread)
            // (Tạo cảm giác tay khựng lại nhịp nhàng chuẩn bị thả)
            if (timePassed < skipTime) {
                // Skip
            } else {
                await wait(200);
            }
            timePassed += 200;

            if (handState.holdingCount > 0) handState.holdingCount--;
            if (displayBoard.value[idx]) displayBoard.value[idx].dan = 1;
            
            if (timePassed < skipTime) {
                // Skip
            } else {
                await wait(200);
            }
            timePassed += 200;
        }
        if (timePassed >= skipTime) await wait(500);
        timePassed += 500;
    }

    // --- LOGIC 2: CÁC LOẠI DI CHUYỂN KHÁC ---
    // Chúng ta sẽ bọc hàm wait() bằng logic kiểm tra skipTime
    
    // Hàm wait thông minh: Nếu chưa đến thời gian skipTime thì không chờ (0ms), ngược lại chờ bình thường
    const smartWait = async (ms) => {
        if (timePassed < skipTime) {
            // Không chờ, nhưng cần nextTick để UI kịp cập nhật nếu cần
            // (Ở đây ta bỏ qua luôn để chạy nhanh nhất có thể)
            await new Promise(resolve => setTimeout(resolve, 0));
        } else {
            await wait(ms);
        }
        timePassed += ms;
    };

    if (type === 'move_to_empty') {
        const pos = getCellPos(index);
        handState.x = pos.x;
        handState.y = pos.y;
        await smartWait(500);
        handState.handType = 'slap'; 
        await smartWait(600);
    }
    else if (type === 'pickup') {
        handState.handType = 'normal'; 
        const pos = getCellPos(index);
        handState.x = pos.x;
        handState.y = pos.y;
        
        await smartWait(450);
        await smartWait(200);

        handState.holdingCount += count;
        if (displayBoard.value[index]) displayBoard.value[index].dan = 0;
        await smartWait(300);
    }
    else if (type === 'spread') {
        let currentCell = start;
        let remaining = count;
        handState.handType = 'normal';

        while (remaining > 0) {
            const pos = getCellPos(currentCell);
            handState.x = pos.x;
            handState.y = pos.y;
            
            await smartWait(450); // Thời gian bay
            await smartWait(200); // Thời gian thả

            if (handState.holdingCount > 0) handState.holdingCount--;
            remaining--;

            if (displayBoard.value[currentCell]) {
                displayBoard.value[currentCell].dan += 1;
            }
            await smartWait(200); // Nghỉ
            currentCell = (currentCell + direction + 12) % 12;
        }
    }
    else if (type === 'capture') {
        handState.handType = 'normal';
        const pos = getCellPos(index);
        handState.x = pos.x;
        handState.y = pos.y;
        
        await smartWait(500);
        await smartWait(200);
        
        if (displayBoard.value[index]) {
            displayBoard.value[index].dan = 0;
            displayBoard.value[index].quan = 0;
        }
        
        const points = (eatenQuan * 5) + eatenDan;
        emits('score-update', { points });
        await smartWait(600);
    }
    else if (type === 'final_sweep') {
        handState.useCustomRotation = true; 
        if (action.player !== myPlayerNumber.value) handState.customIsRotated = true; 
        else handState.customIsRotated = false; 
        
        handState.handType = 'normal';
        const pos = getCellPos(index);
        handState.x = pos.x;
        handState.y = pos.y;
        
        await smartWait(450);
        // 2. KHỰNG LẠI TRƯỚC KHI THU (Thêm mới 200ms)
        await smartWait(200);
        if (displayBoard.value[index]) {
            const totalStones = displayBoard.value[index].dan + (displayBoard.value[index].quan || 0);
            displayBoard.value[index].dan = 0;
            displayBoard.value[index].quan = 0;
            handState.holdingCount += totalStones;
        }
        await smartWait(300);
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
  if (!isClickable(index) || isProcessing.value) return;
  isProcessing.value = true;
  emits("move", index);
  // Mở khóa an toàn sau 1s (phòng hờ server không phản hồi)
  setTimeout(() => { isProcessing.value = false; }, 1000);
}
</script>

<style scoped>
.game-wrapper {
  margin-top: 10px;
  text-align: center;
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
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
  
  /* Hiệu ứng xoay bàn cờ mượt mà */
  transition: transform 0.6s ease-in-out;
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

/* --- CẤU HÌNH SỐ LƯỢNG SỎI (STONE COUNTER) --- */
.stone-counter {
  position: absolute;
  z-index: 200;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 0.8rem;
  font-weight: bold;
  pointer-events: none;
  
  /* Vị trí mặc định cho các ô Dân (góc phải dưới) */
  bottom: 5px;
  right: 5px;
  
  /* Hiệu ứng xoay số mượt mà */
  transition: transform 0.6s ease-in-out;
}

/* Ô QUAN */
.quan-cell {
  background: #ffecb3;
  border: 4px solid #8d6e63;
  box-shadow: inset 0 0 20px rgba(141, 110, 99, 0.3);
}

.quan-left {
  grid-row: 1 / span 2; 
  grid-column: 1;
  border-radius: 60px 12px 12px 60px; /* Cong bên trái */
}
/* Số của Quan trái (0): Mặc định nằm góc phải dưới (sát đường thẳng) */
.quan-left .stone-counter {
    right: 10px;
    bottom: 10px;
}

.quan-right {
  grid-row: 1 / span 2; 
  grid-column: 3;
  border-radius: 12px 60px 60px 12px; /* Cong bên phải */
}
/* Số của Quan phải (6): Chuyển sang góc TRÁI dưới (sát đường thẳng) */
.quan-right .stone-counter {
    right: auto;
    left: 10px;
    bottom: 10px;
}


/* =========================================
   CẤU HÌNH GÓC NHÌN NGƯỜI CHƠI 2 (P2)
   ========================================= */

/* 1. Xoay toàn bộ bàn cờ 180 độ */
.p2-view {
  transform: rotate(180deg);
}

/* 2. KHÔNG xoay ngược ô cờ (giữ nguyên 0deg hoặc bỏ dòng này)
      Để ô cờ xoay theo bàn, giữ đúng hướng cong ra ngoài */
.p2-view .cell {
  /* transform: rotate(180deg);  <-- DÒNG CŨ SAI, ĐÃ XÓA */
  transform: rotate(0deg); 
}

/* 3. Xoay con số 180 độ để đứng thẳng (đọc được) 
      Vì ô cờ đang lộn ngược nên số cũng lộn ngược, cần xoay lại */
.p2-view .stone-counter {
  transform: rotate(180deg); 
}

/* 4. Xoay số chỉ mục (index) tương tự */
.p2-view .cell-index {
   transform: rotate(180deg);
   /* Điều chỉnh lại vị trí số index cho đẹp khi xoay */
   top: auto; bottom: 2px; left: auto; right: 5px; 
}

/* 5. Xoay hiệu ứng hover cho đúng hướng */
.p2-view .cell.clickable:hover {
  background-color: #f7f3e8;
  /* Vì ô đang lộn ngược, translateY âm sẽ đẩy nó xuống dưới, cần đổi thành dương */
  transform: translateY(2px); 
}


/* Responsive Scale */
@media (max-width: 850px) {
  .board-container {
    transform-origin: top center;
    transform: scale(0.85);
    margin-bottom: -30px;
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
    transform: scale(0.48);
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