<template>
  <div class="rps-animation-overlay">
    <div class="hand opp-hand">{{ oppIcon }}</div>

    <div class="hand my-hand">{{ myIcon }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'

// 1. Nhận lựa chọn 'my' (của tôi) và 'opp' (đối thủ)
const props = defineProps({
  myChoice: {
    type: String,
    required: true, // 'rock', 'paper', 'scissors'
  },
  oppChoice: {
    type: String,
    required: true,
  },
})

// 2. Báo cho GameRoom khi hiệu ứng kết thúc
const emit = defineEmits(['animation-finished'])

// 3. Map để chuyển chữ thành Emoji
const iconMap = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
}

// 4. Tính toán emoji để hiển thị
const myIcon = computed(() => iconMap[props.myChoice] || '？')
const oppIcon = computed(() => iconMap[props.oppChoice] || '？')

// 5. Tự động chạy và kết thúc hiệu ứng
onMounted(() => {
  // Yêu cầu của bạn là 5 giây
  setTimeout(() => {
    emit('animation-finished')
  }, 5000) // 5 giây
})
</script>

<style scoped>
.rps-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 100;
  overflow: hidden; /* Rất quan trọng để icon ẩn khi ở ngoài màn hình */
}

.hand {
  position: absolute;
  left: 50%;
  font-size: 300px;
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  
  /* Thêm hiệu ứng mờ dần khi xuất hiện và biến mất */
  animation-duration: 5s; /* Tổng thời gian 5s */
  animation-timing-function: ease-in-out;
  animation-fill-mode: forwards; /* Giữ trạng thái cuối */
}

/* Tay của bạn */
.my-hand {
  transform: translateX(-50%);
  animation-name: slide-from-bottom;
}

/* Tay của đối thủ */
.opp-hand {
  /* Lật ngược biểu tượng để mô phỏng góc nhìn của đối thủ */
  transform: translateX(-50%) scaleY(-1);
  animation-name: slide-from-top;
}

/* Keyframes cho tay BẠN (dưới lên) */
@keyframes slide-from-bottom {
  0% {
    bottom: -200px; /* Bắt đầu bên dưới màn hình */
    opacity: 0;
  }
  10% {
    opacity: 1; /* Hiện ra */
  }
  40% {
    /* Di chuyển đến vị trí ngay dưới trung tâm */
    bottom: calc(50% - 10px); 
    opacity: 1;
  }
  80% {
    bottom: calc(50% - 10px); /* Giữ nguyên 2 giây */
    opacity: 1;
  }
  100% {
    bottom: -200px; /* Biến mất */
    opacity: 0;
  }
}

/* Keyframes cho tay ĐỐI THỦ (trên xuống) */
@keyframes slide-from-top {
  0% {
    top: -200px; /* Bắt đầu bên trên màn hình */
    opacity: 0;
  }
  10% {
    opacity: 1; /* Hiện ra */
  }
  40% {
    /* Di chuyển đến vị trí ngay trên trung tâm */
    top: calc(50% - 10px);
    opacity: 1;
  }
  80% {
    top: calc(50% - 10px); /* Giữ nguyên 2 giây */
    opacity: 1;
  }
  100% {
    top: -200px; /* Biến mất */
    opacity: 0;
  }
}
</style>