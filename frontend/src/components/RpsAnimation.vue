<template>
  <div class="animation-overlay">
    <div class="choice-container">
      
      <div class="choice opponent-choice">
        <component :is="getChoiceComponent(oppChoice)" />
      </div>

      <div class="choice my-choice">
        <component :is="getChoiceComponent(myChoice)" />
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'; 
// 🔽 QUAN TRỌNG: Các đường dẫn này phải chính xác
import RockIcon from './icons/RockIcon.vue';
import PaperIcon from './icons/PaperIcon.vue';
import ScissorsIcon from './icons/ScissorsIcon.vue';

const props = defineProps({
  myChoice: String,
  oppChoice: String,
});

const emit = defineEmits(['animation-finished']);

// Trả về component (không dùng shallowRef)
const getChoiceComponent = (choice) => {
  if (choice === 'rock') return RockIcon;
  if (choice === 'paper') return PaperIcon;
  if (choice === 'scissors') return ScissorsIcon;
  return null;
};

// onMounted sẽ chạy khi component được hiển thị
onMounted(() => {
  // Gửi tín hiệu sau 3 giây
  setTimeout(() => {
    emit('animation-finished');
  }, 3000); 
});
</script>

<style scoped>
.animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow: hidden;
  color: white; /* Màu cho icon SVG */
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

/* Animation của bạn */
.my-choice {
  animation: move-up 1.5s ease-out forwards;
}

/* Animation của đối thủ */
.opponent-choice {
  animation: move-down 1.5s ease-out forwards;
}
.opponent-choice :deep(svg) { 
  transform: rotate(180deg); /* Lật icon của đối thủ */
}

/* Keyframes */
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