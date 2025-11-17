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
import { onMounted, shallowRef } from 'vue';
// Đảm bảo đường dẫn này đúng với cấu trúc thư mục của bạn
import RockIcon from './icons/RockIcon.vue';
import PaperIcon from './icons/PaperIcon.vue';
import ScissorsIcon from './icons/ScissorsIcon.vue';

const props = defineProps({
  // XÓA 'show: Boolean' khỏi đây
  myChoice: String,   // 'rock', 'paper', 'scissors'
  oppChoice: String, // 'rock', 'paper', 'scissors'
});

const emit = defineEmits(['animation-finished']);

const getChoiceComponent = (choice) => {
  if (choice === 'rock') return shallowRef(RockIcon);
  if (choice === 'paper') return shallowRef(PaperIcon);
  if (choice === 'scissors') return shallowRef(ScissorsIcon);
  return null;
};

// onMounted sẽ CHỈ CHẠY khi component được hiển thị (do v-if ở cha)
onMounted(() => {
  // XÓA 'if (props.show)'
  setTimeout(() => {
    emit('animation-finished');
  }, 3000); // Đợi 3 giây cho animation (bạn có thể đổi thời gian này)
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
  color: white; /* Đặt màu mặc định cho icon (nếu SVG dùng 'currentColor') */
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

  /* ĐỊNH KÍCH THƯỚC ICON Ở ĐÂY */
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
.opponent-choice :deep(svg) { /* :deep để style vào component con */
  /* Lật hình ảnh của đối thủ */
  transform: rotate(180deg);
}


/* Định nghĩa Keyframes (giữ nguyên) */
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