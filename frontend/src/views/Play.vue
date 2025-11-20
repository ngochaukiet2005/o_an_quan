<template>
  <div class="play-page">
    <div class="main-container">
      <div class="game-title">
        <h1>Ô Ăn Quan</h1>
        <p>Trí tuệ dân gian - Đối đầu online</p>
      </div>

      <div class="glass-panel">
        <div class="input-group name-group">
          <label>Tên của bạn</label>
          <input
            v-model="playerName"
            type="text"
            placeholder="Nhập tên hiển thị..."
            maxlength="15"
            :disabled="isSearching" 
          />
        </div>

        <div class="tabs">
          <button 
            :class="{ active: currentTab === 'quick' }" 
            @click="currentTab = 'quick'"
            :disabled="isSearching"
          >
            ⚡ Chơi ngay
          </button>
          <button 
            :class="{ active: currentTab === 'create' }" 
            @click="currentTab = 'create'"
            :disabled="isSearching"
          >
            🏠 Tạo phòng
          </button>
          <button 
            :class="{ active: currentTab === 'join' }" 
            @click="currentTab = 'join'"
            :disabled="isSearching"
          >
            🔑 Vào phòng
          </button>
        </div>

        <div class="tab-content">
          
          <div v-if="currentTab === 'quick'" class="tab-pane">
            <div v-if="isSearching" class="searching-box">
              <div class="spinner"></div>
              <p class="status-text">{{ searchStatus }}</p>
              <button class="cancel-btn" @click="cancelSearch">Hủy tìm</button>
            </div>
            <div v-else>
              <p class="hint">Hệ thống sẽ tự động tìm đối thủ xứng tầm cho bạn.</p>
              <button class="action-btn btn-quick" @click="handleQuickPlay">
                Tìm trận đấu
              </button>
            </div>
          </div>

          <div v-if="currentTab === 'create'" class="tab-pane">
            <p class="hint">Tạo phòng riêng và gửi mã cho bạn bè.</p>
            <button class="action-btn btn-create" @click="handleCreateRoom">
              Tạo phòng mới
            </button>
          </div>

          <div v-if="currentTab === 'join'" class="tab-pane">
            <div class="input-group">
              <input
                v-model="roomIdToJoin"
                type="text"
                placeholder="Nhập mã phòng (VD: abc12)"
                class="room-input"
              />
            </div>
            <button class="action-btn btn-join" @click="handleJoinRoom">
              Vào phòng
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import socketService from "../services/socketService";

const router = useRouter();

// State
const playerName = ref("");
const roomIdToJoin = ref("");
const currentTab = ref("quick");
const isSearching = ref(false);
const searchStatus = ref("");

// Actions
function handleQuickPlay() {
  if (!checkName()) return;
  isSearching.value = true;
  searchStatus.value = "Đang kết nối server...";
  socketService.quickPlay(playerName.value);
}

function cancelSearch() {
  isSearching.value = false;
  searchStatus.value = "";
  
  const socket = socketService.getSocket();
  
  // 1. Ngắt kết nối để Server tự động xóa khỏi hàng chờ (matchmakingQueue)
  socket.disconnect();
  
  // 2. Kết nối lại ngay lập tức (quan trọng)
  // Sửa lỗi: Gọi trực tiếp socket.connect() thay vì socketService.connect()
  socket.connect();
}

function handleCreateRoom() {
  if (!checkName()) return;
  socketService.createRoom(playerName.value);
}

function handleJoinRoom() {
  if (!checkName()) return;
  if (!roomIdToJoin.value.trim()) return alert("Vui lòng nhập mã phòng!");
  socketService.joinRoom(roomIdToJoin.value, playerName.value);
}

function checkName() {
  if (!playerName.value.trim()) {
    alert("Vui lòng nhập tên của bạn trước!");
    return false;
  }
  return true;
}

// Listeners
onMounted(() => {
  // Lắng nghe cập nhật hàng chờ
  socketService.onQueueUpdate((data) => {
    if (isSearching.value) {
       searchStatus.value = data.message; 
    }
  });

  socketService.onRoomCreated((data) => {
    router.push({
      name: "GameRoom",
      params: { roomId: data.roomId },
      query: { playerName: playerName.value, mode: 'custom' },
    });
  });

  socketService.onRoomJoined((data) => {
    const mode = isSearching.value ? 'quick' : 'custom';
    router.push({
      name: "GameRoom",
      params: { roomId: data.roomId },
      query: { playerName: playerName.value, mode: mode },
    });
  });

  socketService.onGameStart((data) => {
    router.push({
      name: "GameRoom",
      params: { roomId: data.roomId },
      query: { playerName: playerName.value, mode: 'quick' },
    });
  });

  socketService.onError((err) => {
    alert(err.message);
    isSearching.value = false;
  });
});

onBeforeUnmount(() => {
  socketService.offAll();
});
</script>

<style scoped>
.play-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url("/img/background.jpg") no-repeat center center;
  background-size: cover;
  padding: 20px;
}

.main-container {
  width: 100%;
  max-width: 500px;
  text-align: center;
}

.game-title h1 {
  font-size: 3.5rem;
  color: white;
  text-shadow: 0 4px 10px rgba(0,0,0,0.5);
  margin: 0;
  font-weight: 800;
}
.game-title p {
  color: rgba(255,255,255,0.9);
  font-size: 1.1rem;
  margin-bottom: 30px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  backdrop-filter: blur(10px);
}

/* Inputs */
.input-group { margin-bottom: 20px; text-align: left; }
.input-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #5d4037; }
input[type="text"] {
  width: 100%; padding: 14px 16px; border: 2px solid #e0e0e0;
  border-radius: 12px; font-size: 16px; box-sizing: border-box;
}
input[type="text"]:focus { outline: none; border-color: #8d6e63; }
input:disabled { background: #f5f5f5; cursor: not-allowed; }

/* Tabs */
.tabs { display: flex; background: #f0f0f0; border-radius: 12px; padding: 4px; margin-bottom: 24px; }
.tabs button {
  flex: 1; padding: 10px; border: none; background: transparent;
  border-radius: 8px; font-weight: 600; color: #666; cursor: pointer; transition: all 0.3s;
}
.tabs button.active { background: white; color: #333; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.tabs button:disabled { opacity: 0.5; cursor: not-allowed; }

/* Action Buttons */
.tab-pane { animation: fadeIn 0.3s ease; }
.hint { color: #666; font-size: 0.95rem; margin-bottom: 20px; }
.action-btn {
  width: 100%; padding: 16px; border: none; border-radius: 12px;
  font-size: 1.1rem; font-weight: 700; cursor: pointer; color: white;
  transition: transform 0.2s, box-shadow 0.2s;
}
.action-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }

.btn-quick { background: linear-gradient(135deg, #f59e0b, #d97706); }
.btn-create { background: linear-gradient(135deg, #10b981, #059669); }
.btn-join { background: linear-gradient(135deg, #3b82f6, #2563eb); }

/* === STYLE MỚI CHO HỘP TÌM KIẾM === */
.searching-box {
  padding: 30px 20px;
  background: #fff8e1;
  border: 2px dashed #f59e0b;
  border-radius: 16px;
  color: #d97706;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  animation: fadeIn 0.3s ease;
}

.status-text {
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0;
  animation: pulseText 1.5s infinite;
}

.cancel-btn {
  background: white;
  border: 1px solid #d97706;
  color: #d97706;
  padding: 8px 24px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.cancel-btn:hover {
  background: #d97706;
  color: white;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #fcd34d;
  border-top-color: #d97706;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulseText { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
</style>