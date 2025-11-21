<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        
        <div class="modal-header">
          <div class="header-decoration left"></div>
          <h3>Chọn Hướng Đi</h3>
          <div class="header-decoration right"></div>
        </div>

        <p class="modal-instruction">Bạn muốn rải quân về phía nào?</p>

        <div class="direction-buttons">
          <button class="dir-btn btn-left" @click="choose('left')">
            <div class="icon-circle">
              <span class="arrow-icon">←</span>
            </div>
            <span class="btn-label">Rải Trái</span>
          </button>

          <div class="divider"></div>

          <button class="dir-btn btn-right" @click="choose('right')">
            <div class="icon-circle">
              <span class="arrow-icon">→</span>
            </div>
            <span class="btn-label">Rải Phải</span>
          </button>
        </div>

        <button class="close-text-btn" @click="close">Hủy bỏ</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
// --- PHẦN LOGIC GIỮ NGUYÊN 100% TỪ FILE CỦA BẠN ---
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
/* --- 1. HIỆU ỨNG XUẤT HIỆN (ANIMATION) --- */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-content {
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-fade-leave-active .modal-content {
  animation: popOut 0.3s ease-in;
}
@keyframes popIn {
  0% { transform: scale(0.8) translateY(20px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes popOut {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.8) translateY(20px); opacity: 0; }
}

/* --- 2. CONTAINER & LAYOUT --- */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px); /* Làm mờ nền phía sau */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000; /* Z-index cao để đè lên bàn cờ */
}

.modal-content {
  /* Nền giấy cũ */
  background: #fff8e1; 
  background-image: radial-gradient(#fdfbf7 20%, transparent 20%),
      radial-gradient(#fdfbf7 20%, transparent 20%);
  background-position: 0 0, 10px 10px;
  background-size: 20px 20px;
  
  width: 90%;
  max-width: 420px;
  padding: 30px 20px;
  border-radius: 20px;
  
  /* Viền gỗ nâu */
  border: 4px solid #8d6e63; 
  box-shadow: 0 20px 50px rgba(0,0,0,0.4), 
              inset 0 0 0 4px rgba(255,255,255,0.5);
  text-align: center;
  position: relative;
}

/* --- 3. HEADER --- */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}
.modal-header h3 {
  font-family: 'Inter', sans-serif;
  font-size: 1.6rem;
  color: #5d4037; /* Màu chữ nâu đậm */
  margin: 0;
  font-weight: 800;
  text-transform: uppercase;
}
.header-decoration {
  width: 30px; height: 4px;
  background: #8d6e63;
  border-radius: 2px;
}
.modal-instruction {
  color: #795548;
  margin-bottom: 25px;
  font-size: 1rem;
  font-style: italic;
}

/* --- 4. BUTTONS (QUAN TRỌNG NHẤT) --- */
.direction-buttons {
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  gap: 15px;
  margin-bottom: 20px;
}

.dir-btn {
  flex: 1;
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  border: 2px solid #e0e0e0;
  border-radius: 16px;
  padding: 15px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

/* Icon tròn bao quanh mũi tên */
.icon-circle {
  width: 50px; height: 50px;
  background: rgba(255,255,255,0.8);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}

.btn-label {
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
}

/* --- STYLE RIÊNG CHO TỪNG NÚT --- */

/* Nút Trái (Xanh dương) */
.btn-left:hover {
  border-color: #2196F3;
  background: #e3f2fd;
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(33, 150, 243, 0.2);
}
.btn-left .arrow-icon { color: #2196F3; }
.btn-left .btn-label { color: #1565c0; }

/* Nút Phải (Xanh lá) */
.btn-right:hover {
  border-color: #4CAF50;
  background: #e8f5e9;
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(76, 175, 80, 0.2);
}
.btn-right .arrow-icon { color: #4CAF50; }
.btn-right .btn-label { color: #2e7d32; }

/* Đường kẻ giữa */
.divider {
  width: 2px;
  background: #d7ccc8;
  border-radius: 2px;
  margin: 10px 0;
}

/* Nút Hủy */
.close-text-btn {
  background: none;
  border: none;
  color: #9e9e9e;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 8px 20px;
  border-radius: 20px;
  transition: color 0.2s;
}
.close-text-btn:hover {
  color: #d32f2f;
  background-color: rgba(211, 47, 47, 0.05);
}

/* Responsive cho điện thoại nhỏ */
@media (max-width: 480px) {
  .modal-content {
    width: 85%;
    padding: 20px 15px;
  }
  .icon-circle {
    width: 40px; height: 40px;
    font-size: 1.4rem;
  }
}
</style>