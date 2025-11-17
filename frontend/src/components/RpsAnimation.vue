<template>
  <div class="animation-overlay">
    </div>
</template>

<script setup>
import { onMounted } from 'vue'; 
const emit = defineEmits(['animation-finished']);

// onMounted sẽ chạy ngay khi component này được hiển thị
onMounted(() => {
  // Thêm log để chúng ta biết nó đã chạy
  console.log("RpsAnimation.vue [TEST 2]: Đã mount! Bắt đầu đếm 3 giây.");
  
  setTimeout(() => {
    // Thêm log để biết nó đã gửi sự kiện
    console.log("RpsAnimation.vue [TEST 2]: 3 giây kết thúc! Gửi animation-finished.");
    emit('animation-finished');
  }, 3000); // Đợi 3 giây
});
</script>

<style scoped>
.animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7); /* Nền đen mờ */
  z-index: 1000;
}
</style>