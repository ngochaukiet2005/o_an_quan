<template>
  <div class="chat-box">
    <div class="chat-header">
      <h3>Chat trong phòng</h3>
    </div>

    <div class="messages">
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
import { ref } from "vue";

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
});

const emits = defineEmits(["send"]);

const text = ref("");

function send() {
  if (!text.value.trim()) return;
  emits("send", text.value.trim());
  text.value = "";
}
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
  max-height: 260px;
}

.chat-header h3 {
  margin: 0;
  font-size: 15px;
}

.messages {
  flex: 1;
  overflow-y: auto;
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
