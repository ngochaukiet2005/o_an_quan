<template>
  <div class="home-container">
    <h1>👋 Chào mừng đến với Ô Ăn Quan!</h1>

    <div class="action-card name-input-card">
      <h2>Tên Của Bạn</h2>
      <input
        type="text"
        v-model="playerName"
        placeholder="Nhập Tên Của Bạn"
        :disabled="!isConnected"
      />
    </div>

    <div class="action-card">
      <h2>Tạo Phòng Mới</h2>
      <p>Bắt đầu một phòng chơi mới và mời bạn bè của bạn.</p>
      <button
        @click="handleCreateRoom"
        :disabled="!isConnected || !playerName.trim()"
      >
        {{ !isConnected ? "Đang kết nối..." : "Tạo Phòng" }}
      </button>
    </div>

    <div class="action-card">
      <h2>Chơi Ngay</h2>
      <p>Tự động tìm đối thủ đang chờ.</p>
      <button
        @click="handlePlayNow"
        :disabled="!isConnected || !playerName.trim()"
      >
        Tìm Trận Nhanh
      </button>
      <p v-if="queueMessage" class="queue-message">{{ queueMessage }}</p>
    </div>
    <hr />

    <div class="action-card">
      <h2>Vào Phòng Đã Có</h2>
      <input
        type="text"
        v-model="roomId"
        placeholder="Nhập Mã Phòng (ID)"
        :disabled="!isConnected"
      />
      <button
        @click="handleJoinRoom"
        :disabled="!roomId.trim() || !playerName.trim() || !isConnected"
      >
        Vào Phòng
      </button>
      <p v-if="error" class="error-message">{{ error }}</p>
    </div>

    <p class="status">
      Trạng thái kết nối:
      <span :class="{ connected: isConnected, disconnected: !isConnected }">
        {{ isConnected ? "✅ Đã kết nối" : "❌ Đã ngắt kết nối" }}
      </span>
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import socketService from "../services/socketService";

const router = useRouter();
const roomId = ref("");
const error = ref("");
// SỬA LỖI MẤT KẾT NỐI (Bug 3): Khởi tạo trạng thái từ socket
const isConnected = ref(socketService.socket.connected);
const playerName = ref("");
const queueMessage = ref(""); // Thêm cho Tính năng 1

const handleCreateRoom = () => {
  const trimmedPlayerName = playerName.value.trim();
  if (!trimmedPlayerName) return;
  error.value = "";
  socketService.emit("create_room", { playerName: trimmedPlayerName });
};

const handleJoinRoom = () => {
  const trimmedRoomId = roomId.value.trim();
  const trimmedPlayerName = playerName.value.trim();
  if (trimmedRoomId && trimmedPlayerName) {
    error.value = "";
    socketService.emit("join_room", {
      roomId: trimmedRoomId,
      playerName: trimmedPlayerName,
    });
  }
};

// --- SỬA LỖI 1 (Người tham gia) & TÍNH NĂNG 1 (Matchmaking) ---
const onGameStart = (data) => {
  console.log("Game bắt đầu, chuyển trang...", data);
  // Lấy roomId từ input (nếu join) hoặc từ data (nếu matchmaking)
  const targetRoomId = roomId.value.trim() || data.roomId;
  
  // Đính kèm data vào state của router
  router.push({
    name: "GameRoom",
    params: { roomId: targetRoomId },
    state: { initialData: data }, // Đây là chìa khóa
  });
};
// ---------------

const onRoomCreated = (data) => {
  console.log("Phòng đã được tạo:", data.roomId);
  router.push({ name: "GameRoom", params: { roomId: data.roomId } });
};

const onRoomError = (data) => {
  error.value = data.message;
};
const onConnect = () => {
  isConnected.value = true;
};
const onDisconnect = () => {
  isConnected.value = false;
};

// --- THÊM TÍNH NĂNG 1 ---
const handlePlayNow = () => {
  const trimmedPlayerName = playerName.value.trim();
  if (!trimmedPlayerName) return;
  queueMessage.value = ""; // Xóa thông báo cũ
  error.value = "";
  socketService.emit("join_matchmaking", { playerName: trimmedPlayerName });
};

const onQueueUpdate = (data) => {
  queueMessage.value = data.message;
};
// --------------------

onMounted(() => {
  // SỬA LỖI 3: Đảm bảo socket kết nối
  socketService.connect();
  
  socketService.on("connect", onConnect);
  socketService.on("disconnect", onDisconnect);
  socketService.on("room_created", onRoomCreated);
  socketService.on("game_start", onGameStart);
  socketService.on("error", onRoomError);

  // Thêm listener cho matchmaking
  socketService.on("queue_update", onQueueUpdate);
});

onUnmounted(() => {
  socketService.off("connect", onConnect);
  socketService.off("disconnect", onDisconnect);
  socketService.off("room_created", onRoomCreated);
  socketService.off("game_start", onGameStart);
  socketService.off("error", onRoomError);

  // Hủy listener
  socketService.off("queue_update", onQueueUpdate);
});
</script>

<style scoped>
/* Thêm style cho thông báo chờ */
.queue-message {
  color: #007bff;
  font-weight: bold;
  margin-top: 10px;
}
.home-container {
  max-width: 500px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.action-card {
  margin: 20px 0;
  padding: 15px;
}
.name-input-card {
  background-color: #f9f9f9;
  border-radius: 8px;
}
input,
button {
  padding: 10px;
  margin: 5px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 1rem;
  width: 80%;
}
button {
  background-color: #42b983;
  color: white;
  cursor: pointer;
  border: none;
  width: auto;
}
button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}
.error-message {
  color: red;
  margin-top: 10px;
}
.status {
  margin-top: 20px;
  font-size: small;
}
.connected {
  color: #42b983;
}
.disconnected {
  color: #a0a0a0;
}
hr {
  border: 0;
  border-top: 1px dashed #ccc;
  margin: 30px 0;
}
</style>