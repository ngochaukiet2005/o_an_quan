<template>
  <div class="animation-overlay" @click="skipAnimation">
    <div class="animation-container">
      
      <div class="choice-wrapper opponent-choice">
        <component 
          :is="oppIcon" 
          class="icon-image icon-opponent" 
        />
      </div>

      <div class="choice-wrapper my-choice">
        <component 
          :is="myIcon" 
          class="icon-image" 
        />
      </div>

    </div>
  </div>
</template>

<script setup>
// === SỬA LỖI TẠI ĐÂY ===
// Đã xóa 'defineEmits' (và 'defineProps') khỏi import
import { computed, onMounted, ref } from 'vue';
// ======================

import RockIcon from './icons/RockIcon.vue';
import PaperIcon from './icons/PaperIcon.vue';
import ScissorsIcon from './icons/ScissorsIcon.vue';

const props = defineProps({
  myChoice: String,
  oppChoice: String,
});

const emit = defineEmits(['animation-finished']);

const iconMap = {
  rock: RockIcon,
  paper: PaperIcon,
  scissors: ScissorsIcon,
};

const myIcon = computed(() => iconMap[props.myChoice]);
const oppIcon = computed(() => iconMap[props.oppChoice]);

const animationTimer = ref(null);

function finishAnimation() {
  clearTimeout(animationTimer.value);
  emit('animation-finished');
  console.log("Animation finished, emitted event.");
}

onMounted(() => {
  animationTimer.value = setTimeout(() => {
    finishAnimation();
  }, 3500); 
});

function skipAnimation() {
  finishAnimation();
}
</script>

<style scoped>
/* Lớp phủ toàn màn hình */
.animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 1000;
  overflow: hidden; 
}

/* CĂN GIỮA KHUNG CHỨA */
.animation-container {
  position: absolute;
  top: 50%;    /* Căn giữa theo chiều dọc */
  left: 50%;   /* Căn giữa theo chiều ngang */
  transform: translate(-50%, -50%); /* Dịch chuyển về tâm */

  width: 400px;
  height: 600px; 
}

/* TĂNG KÍCH THƯỚC ICON */
.choice-wrapper {
  position: absolute;
  left: 50%;   
  
  width: 250px;  /* <-- Kích thước icon to */
  height: 250px; /* <-- Kích thước icon to */
  
  animation-duration: 0.8s;
  animation-delay: 0.2s;
  animation-fill-mode: forwards;
  animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
  opacity: 0; /* Bắt đầu ẩn */
}

/* Icon (ảnh) bên trong wrapper */
.icon-image {
  width: 100%;
  height: 100%;
}

/* SỬA LẠI LOGIC ANIMATION */

/* LỰA CHỌN CỦA BẠN (Từ dưới) */
.my-choice {
  top: 100%; 
  transform: translate(-50%, 0); /* Căn giữa ngang */
  animation-name: slideUp;
}

/* LỰA CHỌN CỦA ĐỐI THỦ (Từ trên) */
.opponent-choice {
  bottom: 100%;
  transform: translate(-50%, 0); /* Căn giữa ngang */
  animation-name: slideDown;
}

/* Xoay icon của đối thủ 180 độ */
.icon-opponent {
  transform: rotate(180deg);
}

/* KEYFRAMES MỚI (FIX LỖI CĂN CHỈNH) */

@keyframes slideUp {
  from {
    top: 100%;
    transform: translate(-50%, 0);
    opacity: 0;
  }
  to {
    /* Dừng ở NỬA DƯỚI màn hình */
    top: 50%;
    transform: translate(-50%, 20px); /* 20px DƯỚI tâm */
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    bottom: 100%;
    transform: translate(-50%, 0);
    opacity: 0;
  }
  to {
    /* Dừng ở NỬA TRÊN màn hình */
    bottom: 50%;
    transform: translate(-50%, -20px); /* 20px TRÊN tâm */
    opacity: 1;
  }
}
</style>