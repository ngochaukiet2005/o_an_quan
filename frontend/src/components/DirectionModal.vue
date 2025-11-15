<template>
  <div class="direction-modal-overlay">
    <div class="direction-modal-content">
      <h3>Chọn hướng rải quân</h3>
      <p>Bạn đã chọn ô có {{ stones }} quân.</p>
      <div class="direction-buttons">
        <button @click="emit('select', 'left')" class="dir-btn left">
          <span>⬅️</span> Rải Trái
        </button>
        <button @click="emit('select', 'right')" class="dir-btn right">
          Rải Phải <span>➡️</span>
        </button>
      </div>
      <button @click="emit('cancel')" class="cancel-btn">Hủy chọn</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stones: { type: Number, required: true },
});
const emit = defineEmits(["select", "cancel"]);
</script>

<style scoped>
.direction-modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex; justify-content: center; align-items: center;
  z-index: 100;
}
.direction-modal-content {
  background-color: white; padding: 30px; border-radius: 10px;
  text-align: center; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
.direction-modal-content h3 { margin-top: 0; color: #333; }
.direction-buttons {
  display: flex; justify-content: center;
  gap: 20px; margin: 20px 0;
}
.dir-btn {
  padding: 15px 25px; font-size: 1.1rem; font-weight: bold;
  border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;
}
.dir-btn.left { background-color: #448aff; color: white; }
.dir-btn.left:hover { background-color: #2962ff; }
.dir-btn.right { background-color: #ff5252; color: white; }
.dir-btn.right:hover { background-color: #d50000; }
.cancel-btn {
  background-color: transparent; border: none;
  color: #777; cursor: pointer; text-decoration: underline;
}
</style>