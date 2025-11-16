<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>

      <div v-if="!myChoice" class="choices">
        <button @click="makeChoice('rock')" class="rps-button">✊ Kéo</button>
        <button @click="makeChoice('paper')" class="rps-button">✋ Bao</button>
        <button @click="makeChoice('scissors')" class="rps-button">✌️ Búa</button>
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
      title.value = "Hòa! Chơi lại nào!";
      message.value = "Bạn và đối thủ đã chọn giống nhau. Hãy chọn lại.";
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
  padding: 20px 30px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
.choices {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}
.rps-button {
  font-size: 2.5rem;
  padding: 10px 20px;
  cursor: pointer;
  border: 2px solid #ddd;
  background: #f9f9f9;
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.rps-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.waiting {
  margin-top: 20px;
  font-size: 1.2em;
}
</style>