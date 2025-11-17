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
// 🔽 BƯỚC 1: Xóa 'shallowRef' khỏi import
import { onMounted } from 'vue'; 
import RockIcon from './icons/RockIcon.vue';
import PaperIcon from './icons/PaperIcon.vue';
import ScissorsIcon from './icons/ScissorsIcon.vue';

const props = defineProps({
  myChoice: String,
  oppChoice: String,
});

const emit = defineEmits(['animation-finished']);

// 🔽 BƯỚC 2: Trả về component trực tiếp, KHÔNG DÙNG shallowRef
const getChoiceComponent = (choice) => {
  if (choice === 'rock') return RockIcon;
  if (choice === 'paper') return PaperIcon;
  if (choice === 'scissors') return ScissorsIcon;
  return null;
};
// 🔼 KẾT THÚC SỬA LỖI

// onMounted sẽ chạy khi component được hiển thị
onMounted(() => {
  setTimeout(() => {
    emit('animation-finished');
  }, 3000); // Đợi 3 giây cho animation
});
</script>

<style scoped>
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

/* Animation của bạn */
.my-choice {
  animation: move-up 1.5s ease-out forwards;
}

/* Animation của đối thủ */
.opponent-choice {
  animation: move-down 1.5s ease-out forwards;
}
.opponent-choice :deep(svg) { 
  transform: rotate(180deg);
}

/* Keyframes giữ nguyên */
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