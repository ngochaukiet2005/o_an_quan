<template>
  <div class="home-page">
    <section class="banner">
      <div class="banner-overlay"></div>

      <div class="banner-content">
        <h1>CHƠI Ô ĂN QUAN ONLINE</h1>
        <p>Thử thách Ô Ăn Quan</p>
        <button class="cta-btn" @click="goToPlayPage">Bắt đầu chơi</button>
      </div>
    </section>

    </div>
</template>

<script setup>
// Chỉ import useRouter để điều hướng
import { useRouter } from "vue-router";

const router = useRouter();

// Hàm mới để chuyển đến trang /play
function goToPlayPage() {
  router.push("/play");
}

// Tất cả các ref (quickName, createName, v.v.)
// và các hàm (handleQuickPlay, handleCreateRoom, v.v.)
// cũng như onMounted/onBeforeUnmount đã được xóa khỏi đây.
</script>

<style scoped>
/* Giữ nguyên CSS cho banner */
.banner {
  height: 100vh;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: white;
  background: url("/img/background.jpg") no-repeat center center;
  background-size: cover;
}

.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 1;
}

.banner-content {
  position: relative;
  z-index: 2;
  animation: fadeInContent 1s ease-out;
}

@keyframes fadeInContent {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.banner-content h1 {
  font-size: 52px;
  font-weight: 800;
  margin-bottom: 12px;
}

.banner-content p {
  font-size: 22px;
  margin-bottom: 35px;
  opacity: 0.9;
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
  font-weight: 600;
}

.cta-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 5px 20px rgba(229, 57, 53, 0.4);
}

/* Toàn bộ CSS cho .join-section, .form-container, .card, v.v. đã được xóa */
</style>