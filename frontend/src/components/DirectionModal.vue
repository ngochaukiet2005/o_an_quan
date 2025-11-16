<template>
  <div class="overlay">
    <div class="modal">
      <h3>Chọn hướng rải</h3>
      <button @click="$emit('choose', 'left')">← Trái</button>
      <button @click="$emit('choose', 'right')">→ Phải</button>
      <button class="cancel" @click="$emit('cancel')">Hủy</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
}
.modal {
  background: white; padding: 20px; border-radius: 10px;
  text-align: center;
}
button { margin: 5px; padding: 6px 12px; }
.cancel { color: red; }
</style>
