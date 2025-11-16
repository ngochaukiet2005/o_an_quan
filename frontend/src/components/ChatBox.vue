<template>
  <div class="chat-box">
    <div class="chat-header">
      <h3>Chat trong phòng</h3>
    </div>

    <div class="messages" ref="messagesContainer">
      <div v-for="(msg, index) in messages" :key="index" class="message">
        <strong>{{ msg.senderName }}:</strong> {{ msg.message }}
      </div>
    </div>

    <div class="input-row">
      <input
        v-model="text"
        type="text"
        placeholder="Nhập tin nhắn..."
        @keyup.enter="send"
      />
      <button @click="send">Gửi</button>
    </div>
  </div>
</template>

<script setup>
// Thêm 'watch' và 'nextTick' để tự động cuộn
import { ref, watch, nextTick } from "vue";

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
});

const emits = defineEmits(["send"]);

const text = ref("");
// Tạo một ref để tham chiếu đến div.messages
const messagesContainer = ref(null);

function send() {
  if (!text.value.trim()) return;
  emits("send", text.value.trim());
  text.value = "";
}

// === THÊM KHỐI NÀY ===
// Theo dõi khi có tin nhắn mới
watch(
  () => props.messages,
  async () => {
    // Đợi DOM cập nhật
    await nextTick();
    // Cuộn xuống dưới cùng
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  },
  { deep: true } // Theo dõi sâu vào trong mảng
);
// ======================
</script>

<style scoped>
.chat-box {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #f9fafb;
  
  /* === THAY ĐỔI CHÍNH === */
  /* Xóa 'max-height: 260px' */
  /* Đặt một chiều cao cố định. 
     60vh = 60% chiều cao màn hình, bạn có thể đổi thành 500px, 600px, v.v.
     nếu muốn một giá trị pixel tuyệt đối.
  */
  height: 60vh; 
  min-height: 300px; /* Đảm bảo nó không quá nhỏ trên màn hình hẹp */
}

.chat-header h3 {
  margin: 0;
  font-size: 15px;
}

.messages {
  flex: 1; /* Quan trọng: làm cho nó lấp đầy không gian */
  min-height: 0; /* Cần thiết cho flexbox co giãn đúng */
  overflow-y: auto; /* Quan trọng: Chỉ cuộn khu vực này */
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px;
  background: white;
  font-size: 14px;
}

.message + .message {
  margin-top: 4px;
}

.input-row {
  display: flex;
  gap: 6px;
  /* Đảm bảo thanh input không bị co lại */
  flex-shrink: 0;
}

input {
  flex: 1;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}

button {
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: #10b981;
  color: white;
  font-size: 14px;
}
button:hover {
  background: #059669;
}
</style>