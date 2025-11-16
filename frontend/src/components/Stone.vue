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
  // Tạo một giá trị ngẫu nhiên từ 0 đến 1
  const randTop = Math.random();
  const randLeft = Math.random();
  
  // Truyền các giá trị ngẫu nhiên này vào CSS qua Biến (CSS Variables)
  style.value = {
    '--rand-top': randTop,
    '--rand-left': randLeft,
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

  /* Sử dụng calc() để tính toán vị trí.
    Công thức: (Giá trị ngẫu nhiên) * (100% của cha - kích thước của viên đá)
    Điều này đảm bảo vị trí tối đa của viên đá sẽ là 100% - 18px, 
    giữ nó luôn nằm trong lề.
  */
  top: calc(var(--rand-top) * (100% - 18px));
  left: calc(var(--rand-left) * (100% - 18px));
}

.stone.quan-stone {
  width: 40px;
  height: 40px;
  background-color: #e53935; /* Màu sỏi quan (đỏ) */
  border: 2px solid #fff;
  
  /* Áp dụng logic tương tự cho sỏi quan, nhưng với kích thước 40px
  */
  top: calc(var(--rand-top) * (100% - 40px));
  left: calc(var(--rand-left) * (100% - 40px));
  
  /* Xóa bỏ transform này vì nó gây lệch vị trí */
  /* transform: translate(-10px, -10px); */
}
</style>