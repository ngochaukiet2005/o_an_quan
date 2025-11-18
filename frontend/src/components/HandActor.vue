<template>
  <div class="hand-actor" :style="style">
    <img src="/img/hand.png" alt="Hand" class="hand-img" />
    
    <div v-if="holdingCount > 0" class="holding-stones">
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
  duration: { type: Number, default: 400 } // Thêm prop này
});

const style = computed(() => ({
  transform: `translate(${props.x}px, ${props.y}px)`,
  opacity: props.show ? 1 : 0,
  // Dùng transition để tạo hiệu ứng lướt đi
  transition: `transform ${props.duration}ms linear, opacity 0.2s` // Dùng linear cho rải quân đều hơn 
}));
</script>

<style scoped>
.hand-actor {
  position: absolute;
  top: 0;
  left: 0;
  width: 0; /* Size 0 để x,y là tâm điểm */
  height: 0;
  z-index: 9999; /* Luôn nổi lên trên cùng */
  pointer-events: none;
}

.hand-img {
  width: 80px; /* Kích thước bàn tay */
  height: auto;
  /* Căn chỉnh để mũi trỏ của bàn tay trùng với tọa độ x,y */
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
}
.stone-icon {
  width: 16px;
  height: 16px;
}
</style>