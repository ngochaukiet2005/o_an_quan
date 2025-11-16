<template>
  <div class="board-container">
    <div class="row p2-row">
      <div 
        v-for="i in [11, 10, 9, 8, 7]" 
        :key="i"
        class="cell civilian"
        :class="{ 'my-cell': isMyCell(i), 'clickable': isClickable(i) }"
        @click="onClick(i)"
      >
        <span>Ô {{ i }}</span>
        <div class="stones">
          <Stone v-if="board[i]?.quan" type="quan" />
          <Stone v-for="d in board[i]?.dan" :key="d" type="dan" />
        </div>
      </div>
    </div>

    <div class="row quan-row">
      <div class="cell quan quan-p2">
        <span>Quan P2 (0)</span>
        <div class="stones">
          <Stone v-if="board[0]?.quan" type="quan" />
          <Stone v-for="d in board[0]?.dan" :key="d" type="dan" />
        </div>
      </div>
      
      <div class="cell quan quan-p1">
        <span>Quan P1 (6)</span>
        <div class="stones">
          <Stone v-if="board[6]?.quan" type="quan" />
          <Stone v-for="d in board[6]?.dan" :key="d" type="dan" />
        </div>
      </div>
    </div>

    <div class="row p1-row">
      <div 
        v-for="i in [1, 2, 3, 4, 5]" 
        :key="i"
        class="cell civilian"
        :class="{ 'my-cell': isMyCell(i), 'clickable': isClickable(i) }"
        @click="onClick(i)"
      >
        <span>Ô {{ i }}</span>
        <div class="stones">
          <Stone v-if="board[i]?.quan" type="quan" />
          <Stone v-for="d in board[i]?.dan" :key="d" type="dan" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Stone from './Stone.vue';

const props = defineProps({
  board: {
    type: Array,
    required: true,
  },
  myPlayerNumber: { // 1 hoặc 2
    type: Number,
    required: true,
  },
  isMyTurn: {
    type: Boolean,
    required: true,
  }
});

const emit = defineEmits(['cell-click']);

// Ô này có thuộc 5 ô dân của mình không
const isMyCell = (index) => {
  if (props.myPlayerNumber === 1) {
    return index >= 1 && index <= 5;
  } else if (props.myPlayerNumber === 2) {
    return index >= 7 && index <= 11;
  }
  return false;
};

// Có được phép bấm vào ô này không
const isClickable = (index) => {
  if (!props.isMyTurn || !isMyCell(index)) {
    return false;
  }
  // Kiểm tra sơ bộ (logic chính vẫn ở server)
  const cell = props.board[index];
  return cell && cell.dan > 0 && cell.quan === 0;
};

const onClick = (index) => {
  // Chỉ emit nếu là ô dân (không phải ô quan)
  if (index !== 0 && index !== 6) {
    emit('cell-click', index);
  }
};
</script>

<style scoped>
.board-container {
  border: 2px solid #6D4C41;
  border-radius: 10px;
  background-color: #A1887F;
  padding: 10px;
  width: 900px;
}
.row {
  display: flex;
  justify-content: space-between;
}
.quan-row {
  margin: 10px 0;
}
.cell {
  border: 2px solid #4E342E;
  border-radius: 8px;
  background-color: #EFEBE9;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px;
  box-sizing: border-box;
}
.cell span {
  font-size: 12px;
  font-weight: bold;
  color: #3E2723;
}
.civilian {
  width: 150px;
}
.quan {
  width: 49%;
  height: 140px;
  background-color: #D7CCC8;
}
.stones {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  overflow-y: auto;
  padding: 5px;
}
/* Style cho ô của mình */
.my-cell {
  background-color: #FFF9C4; /* Màu vàng nhạt */
}
/* Style khi có thể click */
.clickable {
  cursor: pointer;
  border-color: #4CAF50;
  border-width: 3px;
}
.clickable:hover {
  background-color: #C8E6C9;
}
</style>