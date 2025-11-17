<template>
  <div class="rps-animation-overlay">
    <div class="hand player1">{{ player1Icon }}</div>

    <div class="hand player2">{{ player2Icon }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'

// 1. Nhận lựa chọn của 2 người chơi
const props = defineProps({
  player1Choice: {
    type: String,
    required: true, // 'rock', 'paper', 'scissors'
  },
  player2Choice: {
    type: String,
    required: true,
  },
})

// 2. Báo cho component cha khi hiệu ứng kết thúc
const emit = defineEmits(['animation-finished'])

// 3. TẠO MAP CHUYỂN ĐỔI:
// Chuyển 'rock' -> '✊', 'paper' -> '✋', 'scissors' -> '✌️'
const iconMap = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
}

// 4. Tính toán icon nào sẽ hiển thị
const player1Icon = computed(() => iconMap[props.player1Choice] || '？')
const player2Icon = computed(() => iconMap[props.player2Choice] || '？')

// 5. Khi component được mount, tự động chạy hiệu ứng
onMounted(() => {
  // Tổng thời gian của hiệu ứng là 1.5s
  setTimeout(() => {
    // Sau 1.5s, báo cho GameRoom biết là đã xong
    emit('animation-finished')
  }, 1500)
})
</script>

<style scoped>
.rps-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6); /* Nền mờ */
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100; /* Luôn nằm trên cùng */
  overflow: hidden; /* Tránh bị vỡ layout khi tay di chuyển */
  padding: 0 10vw;
  box-sizing: border-box;
}

.hand {
  /* Căn giữa biểu tượng emoji */
  display: flex;
  justify-content: center;
  align-items: center;

  /* Kích thước của emoji */
  font-size: 150px;

  /* Giữ nguyên kích thước khu vực */
  width: 200px;
  height: 200px;
}

/* * -------------------
 * PHẦN HIỆU ỨNG (Animation)
 * -------------------
 */

/* Tay người chơi 1 (bên trái) */
.player1 {
  transform: rotate(15deg);
  animation:
    shake-left 1s ease-in-out,
    move-in-left 0.5s 1s forwards;
}

/* Tay người chơi 2 (bên phải) */
.player2 {
  /* Lật ngược emoji để đối diện với người 1 */
  transform: scaleX(-1) rotate(15deg);
  animation:
    shake-right 1s ease-in-out,
    move-in-right 0.5s 1s forwards;
}

/* Keyframes cho hiệu ứng "lắc" của P1 */
@keyframes shake-left {
  0%,
  100% {
    transform: translateY(0) rotate(15deg);
  }
  25%,
  75% {
    transform: translateY(-30px) rotate(15deg);
  }
  50% {
    transform: translateY(30px) rotate(15deg);
  }
}

/* Keyframes cho hiệu ứng "lắc" của P2 */
@keyframes shake-right {
  0%,
  100% {
    transform: scaleX(-1) translateY(0) rotate(15deg);
  }
  25%,
  75% {
    transform: scaleX(-1) translateY(-30px) rotate(15deg);
  }
  50% {
    transform: scaleX(-1) translateY(30px) rotate(15deg);
  }
}

/* Keyframes cho P1 "ra búa" (di chuyển vào) */
@keyframes move-in-left {
  from {
    transform: translateY(0) rotate(15deg) translateX(0);
  }
  to {
    /* Di chuyển tay vào giữa (25% chiều rộng màn hình) */
    transform: translateY(0) rotate(0deg) translateX(25vw);
  }
}

/* Keyframes cho P2 "ra búa" (di chuyển vào) */
@keyframes move-in-right {
  from {
    transform: scaleX(-1) translateY(0) rotate(15deg) translateX(0);
  }
  to {
    transform: scaleX(-1) translateY(0) rotate(0deg) translateX(25vw);
  }
}
</style>