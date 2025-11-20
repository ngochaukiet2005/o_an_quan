<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <h2>{{ isRetry ? 'Hòa rồi!' : title }}</h2>

      <div v-if="isRetry" class="retry-alert">
        <span>🤝</span> Hai bên chọn giống nhau. Vui lòng chọn lại!
      </div>

      <p v-else>{{ message }}</p>

      <div v-if="!myChoice" class="choices">
        <button @click="makeChoice('rock')" class="rps-button">
          <span style="font-size: 1.8rem;">✊</span> <span>Búa</span> </button>
        <button @click="makeChoice('paper')" class="rps-button">
          <span style="font-size: 1.8rem;">✋</span>
          <span>Bao</span>
        </button>
        <button @click="makeChoice('scissors')" class="rps-button">
          <span style="font-size: 1.8rem;">✌️</span>
          <span>Kéo</span>
        </button>
      </div>
      <div v-else class="waiting">
        <p>Bạn đã chọn {{ choiceToEmoji(myChoice) }}. Đang chờ đối thủ...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  show: Boolean,
  isRetry: Boolean,
});

const emits = defineEmits(["choose"]);

const title = ref("Quyết định lượt đi đầu!");
const message = ref("Hãy chọn Oẳn tù tì để xác định người đi trước.");
const myChoice = ref(null);

watch(() => props.show, (newVal) => {
  if (newVal) {
    // Reset khi modal mở lại
    myChoice.value = null; 
    if (props.isRetry) {
      // Logic cũ vẫn giữ để backup, nhưng UI sẽ ưu tiên hiển thị thẻ .retry-alert
      title.value = "Hòa! Chơi lại nào!";
    } else {
      title.value = "Quyết định lượt đi đầu!";
      message.value = "Hãy chọn Oẳn tù tì để xác định người đi trước.";
    }
  }
});

function makeChoice(choice) {
  myChoice.value = choice;
  emits("choose", choice);
}

function choiceToEmoji(choice) {
  if (choice === 'rock') return '✊';
  if (choice === 'paper') return '✋';
  if (choice === 'scissors') return '✌️';
  return '';
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 25px 30px; /* Tăng padding một chút cho thoáng */
  border-radius: 16px; /* Bo tròn mềm mại hơn */
  text-align: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  max-width: 400px;
  width: 90%;
  animation: popIn 0.3s ease;
}

/* [THÊM MỚI] Style cho thông báo hòa */
.retry-alert {
  background-color: #e3f2fd; /* Xanh dương rất nhạt */
  color: #1565c0;           /* Chữ xanh đậm */
  border: 1px solid #90caf9;
  padding: 12px;
  border-radius: 8px;
  margin: 15px 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: slideDown 0.3s ease;
}

.choices {
  display: flex;
  gap: 15px;
  margin-top: 20px;
  justify-content: center;
}
.rps-button {
  font-size: 2.5rem;
  width: 80px;       /* Cố định kích thước nút cho đẹp */
  height: 80px;
  cursor: pointer;
  border: 2px solid #eee;
  background: #f9f9f9;
  border-radius: 16px;
  transition: all 0.2s;
  /* --- SỬA ĐOẠN NÀY --- */
  display: flex;
  flex-direction: column; /* Xếp icon và chữ theo chiều dọc */
  align-items: center;
  justify-content: center;
  font-size: 0.9rem; /* Giảm cỡ chữ xuống (cũ là 2.5rem) */
  font-weight: 700;
  gap: 5px; /* Khoảng cách giữa icon và chữ */
  /* -------------------- */
}
.rps-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  border-color: #1565c0; /* Hover hiện viền xanh cùng tông */
  background: white;
}
.waiting {
  margin-top: 20px;
  font-size: 1.1em;
  color: #666;
}

/* Animation hiệu ứng xuất hiện */
@keyframes popIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>