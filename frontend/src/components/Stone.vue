<template>
  <div class="stone" :class="{ 'quan-stone': isQuan }" :style="style"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

defineProps({
  isQuan: { type: Boolean, default: false },
});

// Lưu trữ vị trí cục bộ để nó không thay đổi khi re-render
const style = ref({});

// Tạo vị trí ngẫu nhiên CHỈ MỘT LẦN khi component được tạo
onMounted(() => {
  const top = Math.random() * 60 + 10; // 10% - 70%
  const left = Math.random() * 60 + 10; // 10% - 70%
  style.value = {
    top: `${top}%`,
    left: `${left}%`,
  };
});
</script>

<style scoped>
.stone {
  position: absolute;
  width: 18px;
  height: 18px;
  background-color: #795548; /* Màu sỏi dân */
  border-radius: 50%;
  box-shadow: inset 0 -2px 2px rgba(0, 0, 0, 0.3);
}
.stone.quan-stone {
  width: 40px;
  height: 40px;
  background-color: #e53935; /* Màu sỏi quan (đỏ) */
  border: 2px solid #fff;
  transform: translate(-10px, -10px); /* Căn giữa viên quan to */
}
</style>