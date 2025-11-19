<template>
  <div v-if="show" class="overlay">
    <div class="victory-card">
      <div class="icon">🔔</div> <h2>{{ title }}</h2>
      <div class="divider"></div>
      <p>{{ message }}</p>
      <button @click="$emit('close')">
        {{ title === 'Lỗi' ? 'Đóng' : 'Đồng ý' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: String,
  message: String,
});
</script>

<style scoped>
.overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
}

.victory-card {
  background: white;
  padding: 40px;
  border-radius: 24px;
  text-align: center;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-top: 8px solid #fbbf24;
}

.icon {
  font-size: 4rem;
  margin-bottom: 10px;
  animation: bounce 1s infinite;
}

h2 {
  color: #333;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
}

.divider {
  height: 4px;
  width: 50px;
  background: #f3f4f6;
  margin: 15px auto;
  border-radius: 2px;
}

p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 30px;
  line-height: 1.5;
}

button {
  background: #10b981;
  color: white;
  border: none;
  padding: 12px 30px;
  font-size: 1.1rem;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  transition: transform 0.2s;
}
button:hover {
  transform: scale(1.05);
}

@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
</style>