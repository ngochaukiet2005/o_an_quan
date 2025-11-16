<template>
  <div class="play-page">
    <div class="form-container">
      <div class="card name-card">
        <h3>Nhập tên của bạn</h3>
        <label>
          Tên hiển thị:
          <input
            v-model="playerName"
            type="text"
            placeholder="Người chơi"
            class="name-input"
          />
        </label>
      </div>

      <div class="card">
        <h3>Chơi ngay</h3>
        <p>Ghép cặp ngẫu nhiên với một người chơi ngẫu nhiên</p>
        <button class="btn-create" @click="handleQuickPlay">Tìm trận</button>
      </div>

      <div class="card">
        <h3>Tạo phòng</h3>
        <p>Tạo phòng riêng và mời bạn bè qua mã phòng.</p>
        <button class="btn-create" @click="handleCreateRoom">Tạo phòng</button>
      </div>

      <div class="card">
        <h3>Vào phòng</h3>
        <label>
          <input
            v-model="roomIdToJoin"
            type="text"
            placeholder="Nhập mã phòng"
          />
        </label>
        <button class="btn-join" @click="handleJoinRoom">Vào phòng</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import socketService from "../services/socketService";

const router = useRouter();

// === STATE CHUNG ===
const playerName = ref(""); // Chỉ 1 ô tên
const roomIdToJoin = ref("");

// === HÀNH ĐỘNG (Sử dụng 1 tên duy nhất) ===
function handleQuickPlay() {
  if (!playerName.value.trim()) return alert("Vui lòng nhập tên của bạn!");
  socketService.quickPlay(playerName.value);
}

function handleCreateRoom() {
  if (!playerName.value.trim()) return alert("Vui lòng nhập tên của bạn!");
  socketService.createRoom(playerName.value);
}

function handleJoinRoom() {
  if (!playerName.value.trim()) return alert("Vui lòng nhập tên của bạn!");
  if (!roomIdToJoin.value.trim()) return alert("Vui lòng nhập mã phòng!");
  socketService.joinRoom(roomIdToJoin.value, playerName.value);
}

// === LẮNG NGHE SOCKET ===
// (Những listener này sẽ điều hướng người dùng khi thành công)
onMounted(() => {
  // 1. Khi tạo phòng thành công
  socketService.onRoomCreated((data) => {
    router.push({
      name: "GameRoom",
      params: { roomId: data.roomId },
      query: { playerName: playerName.value },
    });
  });

  // 2. Khi vào phòng thành công
  socketService.onRoomJoined((data) => {
    router.push({
      name: "GameRoom",
      params: { roomId: data.roomId },
      query: { playerName: playerName.value },
    });
  });

  // 3. Khi tìm trận (quick play) thành công
  // (Backend sẽ gửi 'game_start' khi tìm được 2 người)
  socketService.onGameStart((data) => {
    router.push({
      name: "GameRoom",
      params: { roomId: data.roomId },
      query: { playerName: playerName.value },
    });
  });

  // 4. Khi có lỗi
  socketService.onError((err) => {
    alert(err.message);
  });
});

onBeforeUnmount(() => {
  socketService.offAll();
});
</script>

<style scoped>
/* --- Bố cục trang --- */
.play-page {
  padding: 120px 20px 70px;
  text-align: center;
  min-height: 100vh;
  /* Bạn có thể sao chép nền gradient từ Home.vue vào đây nếu muốn */
  background: linear-gradient(
      180deg,
      rgba(243, 237, 229, 0.9) 0%,
      rgba(224, 213, 202, 0.95) 100%
    ),
    url("/img/background.jpg");
  background-size: cover;
}

.form-container {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
  max-width: 1200px;
  margin: 0 auto;
}

/* --- Thẻ Card (sao chép từ Home.vue) --- */
.card {
  width: 380px;
  padding: 32px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  text-align: left;
}
.card h3 {
  font-size: 24px;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 20px;
}
.card p {
  font-size: 16px;
  color: #555;
  margin-bottom: 25px;
  min-height: 40px;
}
.name-card {
  width: 100%;
  max-width: 800px;
  text-align: center;
}

/* --- Form (sao chép từ Home.vue) --- */
label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}
input[type="text"] {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  margin-bottom: 20px;
}
.name-input {
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
  font-weight: bold;
  font-size: 18px;
}

/* --- Nút (sao chép từ Home.vue) --- */
button {
  width: 100%;
  padding: 14px;
  font-size: 17px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s;
  border: none;
}
.btn-create {
  background: #10b981;
  color: white;
}
.btn-create:hover {
  background: #059669;
}
.btn-join {
  background: #3b82f6;
  color: white;
}
.btn-join:hover {
  background: #2563eb;
}
</style>