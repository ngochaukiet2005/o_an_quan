<template>
  <div class="chat-container">
    <div class="chat-header">
      <h3>💬 Trò chuyện</h3>
    </div>
    
    <div class="messages-list" ref="msgList">
      <div 
        v-for="(msg, index) in messages" 
        :key="index" 
        class="message-item"
        :class="{ 'system-msg': msg.senderName === 'Hệ thống' }"
      >
        <span v-if="msg.senderName !== 'Hệ thống'" class="sender">{{ msg.senderName }}:</span>
        <span class="content" :class="{ highlight: isImportant(msg.message) }">
           {{ msg.message }}
        </span>
      </div>
    </div>

    <div class="chat-input">
      <input 
        v-model="text" 
        @keyup.enter="send" 
        placeholder="Nhập tin nhắn..." 
        type="text"
      />
      <button @click="send">Gửi</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps(['messages']);
const emits = defineEmits(['send']);
const text = ref("");
const msgList = ref(null);

function send() {
  if(!text.value.trim()) return;
  emits('send', text.value);
  text.value = "";
}

function isImportant(msg) {
  const keywords = ["vay", "thắng", "gây giống", "ăn"];
  return keywords.some(k => msg.toLowerCase().includes(k));
}

watch(() => props.messages.length, () => {
  nextTick(() => {
    if(msgList.value) msgList.value.scrollTop = msgList.value.scrollHeight;
  });
});
</script>

<style scoped>
.chat-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  height: 500px; /* Chiều cao cố định */
  border: 1px solid #eee;
  overflow: hidden;
}

.chat-header {
  padding: 15px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}
.chat-header h3 { margin: 0; font-size: 1.1rem; color: #444; }

.messages-list {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-item {
  font-size: 0.95rem;
  line-height: 1.4;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 12px;
  border-bottom-left-radius: 2px;
  align-self: flex-start;
  max-width: 90%;
}

.message-item.system-msg {
  align-self: center;
  background: transparent;
  color: #888;
  font-size: 0.85rem;
  font-style: italic;
  border: none;
  padding: 0;
  text-align: center;
}

.message-item .sender {
  font-weight: 700;
  color: #3b82f6;
  margin-right: 5px;
}

/* Highlight các từ khóa quan trọng trong game */
.content.highlight {
  color: #d97706;
  font-weight: 600;
}

.chat-input {
  padding: 10px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 8px;
  background: #fafafa;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
}
.chat-input input:focus { border-color: #3b82f6; }

.chat-input button {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
}
.chat-input button:hover { background: #2563eb; }
</style>