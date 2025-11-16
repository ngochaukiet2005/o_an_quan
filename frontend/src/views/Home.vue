<template>
  <div class="home-page">
    <!-- ================= BANNER ================= -->
    <section class="banner">
      <div class="banner-overlay"></div>

      <div class="banner-content">
        <h1>CHƠI Ô ĂN QUAN ONLINE</h1>
        <p>Thử thách Ô Ăn Quan</p>
        <button class="cta-btn" @click="scrollToSection">Bắt đầu chơi</button>
      </div>
    </section>

    <!-- ================= FORM TẠO / VÀO PHÒNG ================= -->
    <section class="join-section" ref="formSection">
      <h2>Tạo phòng hoặc tham gia phòng</h2>

      <div class="form-container">
        <!-- Chơi ngay -->
        <div class="card">
          <h3>Chơi ngay</h3>

          <label>
            Tên của bạn:
            <input v-model="quickName" type="text" placeholder="Người chơi A" />
          </label>

          <button class="btn-create" @click="handleQuickPlay">Chơi ngay</button>
        </div>

        <!-- Tạo phòng -->
        <div class="card">
          <h3>Tạo phòng mới</h3>

          <label>
            Tên của bạn:
            <input
              v-model="createName"
              type="text"
              placeholder="Người chơi A"
            />
          </label>

          <button class="btn-create" @click="handleCreateRoom">
            Tạo phòng
          </button>
        </div>

        <!-- Vào phòng -->
        <div class="card">
          <h3>Vào phòng</h3>

          <label>
            ID phòng:
            <input v-model="joinRoomId" type="text" placeholder="VD: abc12" />
          </label>

          <label>
            Tên của bạn:
            <input v-model="joinName" type="text" placeholder="Người chơi B" />
          </label>

          <button class="btn-join" @click="handleJoinRoom">Vào phòng</button>
        </div>
      </div>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <div v-if="lastRoomId" class="info-box">
        <p>
          ID phòng bạn vừa tạo: <strong>{{ lastRoomId }}</strong>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import socketService from "../services/socketService";

const router = useRouter();

const quickName = ref("");
const createName = ref("");
const joinRoomId = ref("");
const joinName = ref("");

// tên người tạo phòng (quick play hoặc create room)
const currentPlayerName = ref("");

const errorMessage = ref("");
const lastRoomId = ref("");

const formSection = ref(null);

function scrollToSection() {
  formSection.value.scrollIntoView({ behavior: "smooth" });
}

onMounted(() => {
  socketService.onRoomCreated((payload) => {
    lastRoomId.value = payload.roomId;

    router.push({
      name: "GameRoom",
      params: { roomId: payload.roomId },
      query: {
        playerName: currentPlayerName.value, // ⭐ SỬA Ở ĐÂY
        playerId: payload.playerId,
        playerSymbol: payload.playerSymbol,
      },
    });
  });

  socketService.onError((payload) => {
    errorMessage.value = payload?.message || "Có lỗi xảy ra.";
  });
});

onBeforeUnmount(() => {
  socketService.offAll();
});

// ================= XỬ LÝ =================

// Chơi ngay
function handleQuickPlay() {
  if (!quickName.value.trim()) {
    errorMessage.value = "Vui lòng nhập tên.";
    return;
  }

  currentPlayerName.value = quickName.value.trim(); // ⭐ Lưu tên
  errorMessage.value = "";

  socketService.createRoom(quickName.value.trim());
}

// Tạo phòng
function handleCreateRoom() {
  if (!createName.value.trim()) {
    errorMessage.value = "Vui lòng nhập tên.";
    return;
  }

  currentPlayerName.value = createName.value.trim(); // ⭐ Lưu tên
  errorMessage.value = "";

  socketService.createRoom(createName.value.trim());
}

// Vào phòng
function handleJoinRoom() {
  if (!joinRoomId.value.trim() || !joinName.value.trim()) {
    errorMessage.value = "Vui lòng nhập đầy đủ ID phòng và tên.";
    return;
  }

  errorMessage.value = "";

  socketService.joinRoom(joinRoomId.value.trim(), joinName.value.trim());

  router.push({
    name: "GameRoom",
    params: { roomId: joinRoomId.value.trim() },
    query: {
      playerName: joinName.value.trim(),
    },
  });
}
</script>

<style scoped>
/* ===================== RESET ===================== */
:global(html, body) {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  height: 100%;
  font-family: system-ui, sans-serif;

  background: url("/img/background.jpg") center/cover no-repeat fixed;
}

.home-page {
  width: 100%;
  overflow-x: hidden;
}

/* ================= BANNER ================= */
.banner {
  margin-top: 70px;
  height: 80vh;
  display: flex;
  align-items: center;
  padding-left: 90px;
  color: white;
  position: relative;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: transparent !important;
}

.banner-content {
  z-index: 2;
  max-width: 50%;
  animation: fadeUp 0.8s ease forwards;
  opacity: 0;
  transform: translateY(30px);
}

.banner-content h1 {
  font-size: 52px;
  font-weight: 800;
  margin-bottom: 15px;
  text-shadow: 0 5px 14px rgba(0, 0, 0, 0.6);
}

.banner-content p {
  font-size: 22px;
  margin-bottom: 28px;
}

.cta-btn {
  background: linear-gradient(45deg, #e53935, #d32f2f);
  color: white;
  padding: 15px 32px;
  font-size: 18px;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.25s;
  border: none;
}

.cta-btn:hover {
  transform: scale(1.08);
}

/* ================= FORM ================= */
.join-section {
  margin-top: -120px;
  padding: 100px 20px 70px;
  text-align: center;
}

.join-section h2 {
  font-size: 32px;
  margin-bottom: 30px;
  font-weight: 700;
}

.form-container {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

/* Card */
.card {
  width: 380px;
  padding: 32px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  transition: 0.35s;
}

.card:hover {
  transform: translateY(-10px);
}

.card h3 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 16px;
}

.card input {
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 10px;
  border-radius: 10px;
  border: 1px solid #ccc;
}

.btn-create,
.btn-join {
  width: 100%;
  background: #2563eb;
  color: white;
  padding: 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: 0.25s;
}

.btn-create:hover,
.btn-join:hover {
  background: #1e4ed8;
}

.error {
  color: #d50000;
  margin-top: 16px;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
