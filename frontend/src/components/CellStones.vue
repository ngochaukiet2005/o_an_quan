<template>
  <div class="stones-container">
    <img 
      v-if="quanCount > 0" 
      src="/img/stone-quan.png" 
      class="stone-img stone-quan" 
      alt="Quan"
    />

    <img 
      v-for="i in danCount" 
      :key="i"
      src="/img/stone-dan.png" 
      class="stone-img stone-dan"
      :style="getStoneStyle(i)" 
      alt="Dan"
    />
  </div>
</template>

<script setup>

import { defineProps } from 'vue';

const props = defineProps({
  danCount: { type: Number, default: 0 },
  quanCount: { type: Number, default: 0 },
  // Thêm seed để mỗi ô có kiểu sắp xếp hơi khác nhau một chút nếu muốn (optional)
  seed: { type: Number, default: 0 } 
});

// Hàm tạo vị trí ngẫu nhiên nhưng CỐ ĐỊNH theo index (i).
// Điều này giúp khi sỏi tăng/giảm, các viên cũ vẫn nằm im, không bị giật.
function getStoneStyle(index) {
  // Dùng phép toán sin/cos với index để tạo số giả ngẫu nhiên
  // Điều chỉnh các hệ số nhân để sỏi rải đều trong ô
  const randomX = (Math.sin(index * 12.9898 + props.seed) * 0.5 + 0.5) * 60 + 10; // 10% -> 70% width
  const randomY = (Math.cos(index * 78.233 + props.seed) * 0.5 + 0.5) * 60 + 15; // 15% -> 75% height
  const rotation = (index * 137) % 360; // Xoay ngẫu nhiên

  return {
    left: `${randomX}%`,
    top: `${randomY}%`,
    transform: `rotate(${rotation}deg)`,
    zIndex: index // Viên mới nằm đè lên viên cũ
  };
}
</script>

<style scoped>
.stones-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Để click xuyên qua đá vào ô bên dưới */
  overflow: hidden; /* Không cho đá tràn ra ngoài ô */
}

.stone-img {
  position: absolute;
  transition: all 0.3s ease; /* Hiệu ứng mượt khi thêm/bớt đá */
  filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.3)); /* Tạo bóng cho đá thật hơn */
}

.stone-dan {
  width: 20px;  /* Kích thước đá Dân - Chỉnh lại cho vừa mắt */
  height: 20px; 
  object-fit: contain;
}

.stone-quan {
  width: 50px; /* Kích thước Quan to hơn */
  height: 50px;
  /* Quan nằm giữa */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100; /* Quan luôn nổi lên trên cùng */
}
</style>