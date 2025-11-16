<template>
  <div class="game-board" :class="playerViewClass">
    
    <div class="row top-row">
      <div
        v-for="i in 5"
        :key="playerViewClass === 'p1-view' ? 11 - i + 1 : i"
        class="pit square-pit"
        :class="{ 
          active: activePit === (playerViewClass === 'p1-view' ? 11 - i + 1 : i), 
          'clickable': isClickable(playerViewClass === 'p1-view' ? 11 - i + 1 : i) 
        }"
        @click="() => onPitClick(playerViewClass === 'p1-view' ? 11 - i + 1 : i)"
      >
        <div class="stone-summary-text">
          <div class="label">Ô {{ playerViewClass === 'p1-view' ? 11 - i + 1 : i }}</div>
          <div class="counts">
            <span class="dan-count">D: {{ boardState[playerViewClass === 'p1-view' ? 11 - i + 1 : i]?.dan || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="row quan-row">
      <div
        class="pit quan-pit quan-p2"
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
        class="pit quan-pit quan-p1"
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
    </div>

    <div class="row bottom-row">
      <div
        v-for="i in 5"
        :key="playerViewClass === 'p1-view' ? i : 11 - i + 1"
        class="pit square-pit"
        :class="{ 
          active: activePit === (playerViewClass === 'p1-view' ? i : 11 - i + 1), 
          'clickable': isClickable(playerViewClass === 'p1-view' ? i : 11 - i + 1) 
        }"
        @click="() => onPitClick(playerViewClass === 'p1-view' ? i : 11 - i + 1)"
      >
        <div class="stone-summary-text">
          <div class="label">Ô {{ playerViewClass === 'p1-view' ? i : 11 - i + 1 }}</div>
          <div class="counts">
            <span class="dan-count">D: {{ boardState[playerViewClass === 'p1-view' ? i : 11 - i + 1]?.dan || 0 }}</span>
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
const myPlayerNumber = computed(() => store.myPlayerNumber);

// 💡 XOAY BÀN CỜ (QUAN TRỌNG)
// Nếu tôi là P1, tôi xem bình thường.
// Nếu tôi là P2, bàn cờ sẽ xoay 180 độ.
const playerViewClass = computed(() => {
  return myPlayerNumber.value === 2 ? 'p2-view' : 'p1-view';
});

const emit = defineEmits(['cell-click']);

// Hàm kiểm tra xem ô có phải của phe mình không
const isMySquare = (index) => {
  if (!myPlayerNumber.value) return false;
  if (index === 0 || index === 6) return false; // Không phải ô dân

  if (myPlayerNumber.value === 1) {
    return index >= 1 && index <= 5; // P1 sở hữu ô 1-5
  } else {
    return index >= 7 && index <= 11; // P2 sở hữu ô 7-11
  }
};

const isClickable = (index) => {
  if (!isMyTurn.value || !boardState.value[index]) {
    return false;
  }
  // Chỉ được nhấp vào ô của mình
  if (!isMySquare(index)) {
    return false;
  }
  // Phải có Dân và không có Quan
  return boardState.value[index].dan > 0 && boardState.value[index].quan === 0;
};

const onPitClick = (index) => {
  if (isClickable(index)) {
    store.errorMessage = ""; // Xóa lỗi cũ
    emit('cell-click', index);
  } else {
    // Gửi lỗi rõ ràng hơn nếu người chơi nhấp sai
    if (!isMyTurn.value) {
        store.errorMessage = "Không phải lượt của bạn!";
    } else if (index === 0 || index === 6) {
        store.errorMessage = "Không thể bốc từ ô Quan.";
    } else if (!isMySquare(index)) {
        store.errorMessage = "Bạn chỉ có thể chọn ô dân ở phía của mình.";
    } else if (boardState.value[index]?.dan === 0) {
        store.errorMessage = "Không thể bốc từ ô dân rỗng.";
    }
  }
};
</script>

<style scoped>
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
  justify-content: center;
}

/* --- Bố cục cho P1 (Mặc định) --- */
.p1-view .top-row { flex-direction: row-reverse; } /* Ô 11 -> 7 */
.p1-view .quan-row { flex-direction: row; }      /* Quan 0 (trái), Quan 6 (phải) */
.p1-view .bottom-row { flex-direction: row; }    /* Ô 1 -> 5 */

/* 💡 Bố cục cho P2 (Xoay 180 độ) --- */
.p2-view { flex-direction: column-reverse; } /* Đảo hàng trên và dưới */
.p2-view .top-row { flex-direction: row; } /* (Bây giờ là hàng dưới) Ô 1 -> 5 */
.p2-view .quan-row { flex-direction: row-reverse; } /* Quan 6 (trái), Quan 0 (phải) */
.p2-view .bottom-row { flex-direction: row-reverse; } /* (Bây giờ là hàng trên) Ô 11 -> 7 */


.pit {
  border: 2px solid #a1887f;
  margin: 5px;
  cursor: not-allowed;
  position: relative;
  background-color: #fffbf2;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
  min-height: 120px;
}

.pit.clickable {
  cursor: pointer;
}
.pit.clickable:hover {
  background-color: #f7f3e8;
  border-color: #388e3c;
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
  border-radius: 60px; /* Hình bầu dục */
  margin: 5px 20px; /* Tách 2 ô quan xa nhau hơn */
}

/* --- Hiển thị Dân / Quan --- */
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
  color: #d32f2f;
  font-weight: bold;
}
.dan-count {
  color: #388e3c;
}
.square-pit .stone-summary-text .counts {
  font-size: 2.5rem;
}
.quan-pit .stone-summary-text .counts {
  flex-direction: row;
  font-size: 2rem;
  gap: 20px;
}
</style>