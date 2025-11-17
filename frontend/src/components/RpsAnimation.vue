<template>
  <div class="animation-overlay">
    <div class="choice-container">
      
      </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'; 

// <--- VÔ HIỆU HÓA 3 DÒNG IMPORT GÂY LỖI --->
// import RockIcon from './icons/RockIcon.vue';
// import PaperIcon from './icons/PaperIcon.vue';
// import ScissorsIcon from './icons/ScissorsIcon.vue';

const props = defineProps({
  myChoice: String,
  oppChoice: String,
});

const emit = defineEmits(['animation-finished']);

// <--- HÀM NÀY GIỜ KHÔNG QUAN TRỌNG VÌ ĐÃ BỊ VÔ HIỆU HÓA Ở TRÊN --->
// const getChoiceComponent = (choice) => {
//   if (choice === 'rock') return RockIcon;
//   if (choice === 'paper') return PaperIcon;
//   if (choice === 'scissors') return ScissorsIcon;
//   return null;
// };

// onMounted sẽ chạy khi component được hiển thị
onMounted(() => {
  console.log("RpsAnimation.vue: Đã mount! Bắt đầu đếm 3 giây."); // <--- Thêm log
  setTimeout(() => {
    console.log("RpsAnimation.vue: 3 giây kết thúc! Gửi animation-finished."); // <--- Thêm log
    emit('animation-finished');
  }, 3000); // Đợi 3 giây cho animation
});
</script>

<style scoped>
/* CSS giữ nguyên như cũ */
.animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow: hidden;
  color: white; 
}

.choice-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.choice {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 150px;
  height: 150px;
}
.my-choice {
  animation: move-up 1.5s ease-out forwards;
}
.opponent-choice {
  animation: move-down 1.5s ease-out forwards;
}
.opponent-choice :deep(svg) { 
  transform: rotate(180deg);
}
@keyframes move-up {
  from {
    bottom: -200px;
    opacity: 0;
  }
  to {
    bottom: 50%;
    opacity: 1;
    transform: translateX(-50%) translateY(20px);
  }
}
@keyframes move-down {
  from {
    top: -200px;
    opacity: 0;
  }
  to {
    top: 50%;
    opacity: 1;
    transform: translateX(-50%) translateY(-170px);
  }
}
</style>