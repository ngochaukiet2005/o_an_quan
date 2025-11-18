<template>
  <div class="game-wrapper">
    <HandActor 
      :x="handState.x" 
      :y="handState.y" 
      :holdingCount="handState.holdingCount" 
      :show="handState.show"
    />
    <div class="board" v-if="board.length === 12" :class="playerViewClass">
      
      <div
        :ref="(el) => cellRefs[0] = el" :class="['cell', 'quan-cell', 'quan-left', { clickable: false }]"
        @click="handleClick(0)"
      >
        <CellStones 
          :quanCount="board[0].quan" 
          :danCount="board[0].dan" 
          :seed="0"
        />
        
        <span class="label">Ô 0 (Quan P2)</span>
        
        <div class="stone-counter">
          <span v-if="board[0].quan > 0" class="counter-quan">{{ board[0].quan }}</span>
          <span v-if="board[0].dan > 0" class="counter-dan">{{ board[0].dan }}</span>
        </div>
      </div>

      <div class="board-row cell-row-a">
        <div
          v-for="i in 5"
          :key="11 - i + 1"
          :ref="(el) => cellRefs[11 - i + 1] = el" :class="['cell', 'dan-cell', { clickable: isClickable(11 - i + 1) }]"
          @click="handleClick(11 - i + 1)"
        >
          <CellStones 
            :quanCount="0" 
            :danCount="board[11 - i + 1].dan" 
            :seed="11 - i + 1"
          />

          <span class="label">Ô {{ 11 - i + 1 }}</span>
          
          <div class="stone-counter">
            {{ board[11 - i + 1].dan }}
          </div>
        </div>
      </div>

      <div class="board-row cell-row-b">
        <div
          v-for="i in 5"
          :key="i"
          :ref="(el) => cellRefs[i] = el" :class="['cell', 'dan-cell', { clickable: isClickable(i) }]"
          @click="handleClick(i)"
        >
          <CellStones 
            :quanCount="0" 
            :danCount="board[i].dan" 
            :seed="i"
          />

          <span class="label">Ô {{ i }}</span>
          
          <div class="stone-counter">
            {{ board[i].dan }}
          </div>
        </div>
      </div>

      <div
        :ref="(el) => cellRefs[6] = el" :class="['cell', 'quan-cell', 'quan-right', { clickable: false }]"
        @click="handleClick(6)"
      >
        <CellStones 
          :quanCount="board[6].quan" 
          :danCount="board[6].dan" 
          :seed="6"
        />

        <span class="label">Ô 6 (Quan P1)</span>
        
        <div class="stone-counter">
          <span v-if="board[6].quan > 0" class="counter-quan">{{ board[6].quan }}</span>
          <span v-if="board[6].dan > 0" class="counter-dan">{{ board[6].dan }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 1. SỬA LỖI IMPORT: Thêm ref, reactive
import { computed, ref, reactive } from "vue";
import CellStones from "./CellStones.vue";
import HandActor from "./HandActor.vue";

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

// === LOGIC ANIMATION ===
const boardRef = ref(null);
const cellRefs = ref({});
const handState = reactive({ x: 0, y: 0, holdingCount: 0, show: false });

// Hàm lấy tọa độ (x, y) chính xác của 1 ô
const getCellPos = (index) => {
  const cellEl = cellRefs.value[index];
  if (!cellEl) return { x: 0, y: 0 };

  const rect = cellEl.getBoundingClientRect();
  
  // Tính vị trí tương đối so với container cha (game-wrapper)
  const wrapper = document.querySelector('.game-wrapper');
  const wrapperRect = wrapper ? wrapper.getBoundingClientRect() : { left: 0, top: 0 };

  return {
    // Cộng thêm nửa chiều rộng/cao để bàn tay trỏ vào tâm ô
    x: rect.left - wrapperRect.left + rect.width / 2,
    y: rect.top - wrapperRect.top + rect.height / 2
  };
};

// Hàm Animation chính sẽ được gọi từ GameRoom
const animateMove = async (startIdx, direction, count) => {
  if (!count) return;

  // 1. Di chuyển tay đến ô bắt đầu
  const startPos = getCellPos(startIdx);
  handState.x = startPos.x;
  handState.y = startPos.y;
  handState.show = true;
  handState.holdingCount = 0; 

  // Chờ tay bay đến ô bắt đầu
  await new Promise(r => setTimeout(r, 400));

  // 2. "Bốc" quân
  handState.holdingCount = count;
  await new Promise(r => setTimeout(r, 200));

  // 3. Bắt đầu vòng lặp Rải quân
  let currentIdx = startIdx;
  let remaining = count;
  const dir = direction; 

  while (remaining > 0) {
    // Tính chỉ số ô tiếp theo
    currentIdx = (currentIdx + dir + 12) % 12;
    
    // Lấy vị trí ô tiếp theo & cập nhật tay
    const pos = getCellPos(currentIdx);
    handState.x = pos.x;
    handState.y = pos.y;
    
    // Thời gian bay giữa các ô
    await new Promise(r => setTimeout(r, 300));
    
    // Thả 1 quân
    remaining--;
    handState.holdingCount = remaining;
    
    // Hiệu ứng thị giác: Tự tăng quân ở ô dưới bàn cờ lên 1
    if (props.board[currentIdx]) {
      props.board[currentIdx].dan += 1;
    }
  } // <--- 2. SỬA LỖI: Đã thêm dấu đóng ngoặc cho vòng lặp while

  // 4. Kết thúc
  await new Promise(r => setTimeout(r, 300));
  handState.show = false;
};

defineExpose({ animateMove });

// === LOGIC GAME CŨ ===
const myPlayerNumber = computed(() => {
  const me = props.players.find((p) => p.id === props.playerId);
  return me?.symbol === "X" ? 1 : 2;
});

const playerViewClass = computed(() => {
  return myPlayerNumber.value === 2 ? 'p2-view' : 'p1-view';
});

const isMyTurn = computed(() => props.currentTurnId === props.playerId);

const isMySquare = (index) => {
  if (myPlayerNumber.value === 1) {
    return index >= 1 && index <= 5; 
  } else {
    return index >= 7 && index <= 11; 
  }
};

const isClickable = (index) => {
  if (!isMyTurn.value || !props.board[index] || index === 0 || index === 6) return false;
  if (!isMySquare(index)) return false;
  return props.board[index].dan > 0 && props.board[index].quan === 0;
};

function handleClick(index) {
  if (!isClickable(index)) {
    if (!isMyTurn.value) alert("Chưa đến lượt của bạn!");
    else if (index === 0 || index === 6) alert("Không thể bốc từ ô Quan.");
    else if (!isMySquare(index)) alert("Bạn chỉ có thể chọn ô dân ở phía của mình.");
    else if (props.board[index].dan === 0) alert("Không thể bốc từ ô dân rỗng.");
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
  grid-template-columns: 1fr 5fr 1fr; 
  grid-template-rows: auto auto; 
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

/* === 4. CẬP NHẬT STYLE CHO Ô === */
.cell {
  /* Thêm relative để chứa đá (absolute) */
  position: relative; 
  padding: 0; /* Xóa padding để đá có không gian */
  overflow: hidden; /* Cắt phần đá tràn ra */
  
  background: white;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 16px;
  min-height: 100px;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Đẩy label lên trên cùng */
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

/* Label nằm mờ ở trên */
.cell .label {
  margin-top: 5px;
  font-size: 0.7rem;
  font-weight: bold;
  color: #5d4037;
  z-index: 200; /* Nổi trên đá */
  opacity: 0.8;
  pointer-events: none; /* Click xuyên qua label */
}

/* === 5. STYLE CHO SỐ ĐẾM NHỎ Ở GÓC === */
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

.counter-quan {
  color: #d32f2f;
  margin-right: 3px;
}
.counter-dan {
  color: #388e3c;
}

/* XÓA style cũ của .cell .stones (nếu không dùng nữa) */
.cell .stones {
  display: none; 
}

/* Style ô Quan (Bán nguyệt) - Giữ nguyên logic cũ */
.quan-cell {
  width: 90px; 
  min-height: 120px;
  background-color: #fcd34d !important; 
  border: 4px solid #b45309;
  
  justify-content: flex-start; /* Sửa lại thành flex-start để label lên trên */
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

/* Layout Hàng */
.cell-row-a {
  grid-row: 1;
  grid-column: 2;
}
.cell-row-b {
  grid-row: 2;
  grid-column: 2;
}

/* --- Bố cục Xoay cho P2 (Giữ nguyên logic fix lỗi) --- */
.p2-view {
  transform: rotate(180deg);
  transition: transform 0.5s ease;
}

.p2-view .cell {
  transform: rotate(180deg);
}

.p2-view .cell.clickable:hover {
  transform: rotate(180deg) translateY(2px);
  background-color: #f7f3e8;
}

.p2-view .quan-left {
  border-radius: 0 100px 100px 0 !important; 
}

.p2-view .quan-right {
  border-radius: 100px 0 0 100px !important;
}
</style>