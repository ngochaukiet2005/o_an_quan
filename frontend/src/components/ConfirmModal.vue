<template>
  <div v-if="show" class="modal-overlay">
    <div class="confirm-card">
      <div class="icon">⚠️</div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="actions">
        <button class="btn-cancel" @click="$emit('cancel')">Ở lại</button>
        <button class="btn-confirm" @click="$emit('confirm')">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: { type: String, default: "Xác nhận" },
  message: { type: String, default: "Bạn có chắc chắn muốn thực hiện hành động này?" },
  confirmText: { type: String, default: "Thoát & Chấp nhận thua" }
});
defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.2s ease;
}

.confirm-card {
  background: white;
  padding: 30px;
  border-radius: 20px;
  text-align: center;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  border-top: 6px solid #ef4444;
  animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.icon { font-size: 3rem; margin-bottom: 10px; }
h3 { margin: 0 0 10px; color: #333; }
p { color: #666; margin-bottom: 25px; line-height: 1.5; }

.actions { display: flex; gap: 15px; justify-content: center; }

button {
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}
button:hover { transform: translateY(-2px); }

.btn-cancel { background: #f3f4f6; color: #333; }
.btn-confirm { background: #ef4444; color: white; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>