<template>
  <div class="hand-actor" :style="style">
    <img :src="currentHandImage" alt="Hand" class="hand-img" />
    <div v-if="holdingCount > 0" class="holding-stones" :style="counterStyle">
      <img src="/img/stone-dan.png" class="stone-icon" />
      <span>x{{ holdingCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  holdingCount: { type: Number, default: 0 },
  show: { type: Boolean, default: false },
  duration: { type: Number, default: 400 },
  // Nhận prop loại tay (normal hoặc slap)
  handType: { type: String, default: 'normal' },
  isRotated: { type: Boolean, default: false } 
});

const currentHandImage = computed(() => {
  // 👇 Kiểm tra: nếu handType là 'slap' thì trả về ảnh đập tay
  if (props.handType === 'slap') {
    return '/img/hand-slap.png'; 
  }
  // Mặc định trả về ảnh tay thường
  return '/img/hand.png'; 
});

const style = computed(() => ({
  transform: `translate(${props.x}px, ${props.y}px) rotate(${props.isRotated ? 180 : 0}deg)`,
  opacity: props.show ? 1 : 0,
  transition: `transform ${props.duration}ms linear, opacity 0.2s`
}));
// 👇 LOGIC MỚI: Style riêng cho số đá để xoay ngược lại
const counterStyle = computed(() => ({
  // Nếu cha xoay 180, con xoay -180 để trở về vị trí đứng thẳng
  transform: `rotate(${props.isRotated ? -180 : 0}deg)`,
  // Thêm transition để số xoay mượt mà (nếu muốn)
  transition: 'transform 0.2s' 
}));
</script>

<style scoped>
.hand-actor {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: 9999;
  pointer-events: none;
}

.hand-img {
  width: 80px;
  height: auto;
  transform: translate(-50%, -60%);
  filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.4));
}

.holding-stones {
  position: absolute;
  top: -40px;
  left: 20px;
  background: rgba(255,255,255,0.9);
  padding: 4px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  font-weight: bold;
  color: #333;
  white-space: nowrap;
  z-index: 10000;
}
.stone-icon {
  width: 16px;
  height: 16px;
}
/* 👇👇👇 THÊM VÀO CUỐI 👇👇👇 */

/* Responsive cho bàn tay */
@media (max-width: 850px) {
  .hand-img { width: 70px; }
}

@media (max-width: 650px) {
  .hand-img { width: 55px; }
  .holding-stones {
    top: -30px;
    left: 10px;
    padding: 2px 6px;
    font-size: 0.8rem;
  }
  .stone-icon { width: 12px; height: 12px; }
}

@media (max-width: 480px) {
  .hand-img { width: 40px; } /* Tay nhỏ xíu cho mobile */
  .holding-stones {
    top: -25px;
    left: 5px;
    font-size: 0.7rem;
    border-radius: 8px;
  }
}
</style>