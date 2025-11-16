<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <h4>Chọn hướng rải quân</h4>
      <div class="button-group">
        <button @click="choose('left')" class="btn-left">⬅️ Rải Trái</button>
        <button @click="choose('right')" class="btn-right">Rải Phải ➡️</button>
      </div>
      <button @click="close" class="btn-close">Hủy</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['choose', 'close']);

const choose = (direction) => {
  emit('choose', direction);
};

const close = () => {
  emit('close');
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
}
.button-group {
  display: flex;
  gap: 20px;
  margin: 20px 0;
}
button {
  padding: 12px 20px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  color: white;
}
.btn-left {
  background-color: #2196F3;
}
.btn-right {
  background-color: #4CAF50;
}
.btn-close {
  background-color: #f44336;
}
</style>