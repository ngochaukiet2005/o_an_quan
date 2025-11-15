<template>
  <div class="modal-overlay" @click="emit('close')">
    <div class="modal-content" :class="type" @click.stop>
      <slot>
        <h3>{{ title }}</h3>
        <p class="status-text">{{ message }}</p>
      </slot>
      <button @click="emit('close')" class="modal-btn">
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: "Thông báo" },
  message: { type: String, default: "" },
  type: { type: String, default: "notification" }, // 'winner', 'error'
  buttonText: { type: String, default: "Đã hiểu" },
});
const emit = defineEmits(["close"]);
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: white; padding: 30px 40px; border-radius: 12px;
  text-align: center; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  min-width: 300px;
}
.modal-content h3 { margin-top: 0; }
.modal-content.winner h3 { color: #42b983; }
.modal-content.error h3 { color: #f44336; }
.status-text {
  font-size: 1.3rem; font-weight: bold;
  color: #333; margin: 15px 0;
}
.modal-btn {
  margin-top: 20px; padding: 12px 25px; color: white;
  border: none; border-radius: 8px; cursor: pointer;
  font-size: 1.1rem; transition: background-color 0.2s;
}
/* Style nút bấm dựa theo type */
.modal-content.winner .modal-btn { background-color: #42b983; }
.modal-content.winner .modal-btn:hover { background-color: #33a06f; }
.modal-content.error .modal-btn { background-color: #f44336; }
.modal-content.error .modal-btn:hover { background-color: #d32f2f; }
.modal-content.notification .modal-btn { background-color: #448aff; }
.modal-content.notification .modal-btn:hover { background-color: #2962ff; }
</style>