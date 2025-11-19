<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="logo" @click="goHome">
        <img src="/img/logo.jpg" alt="Logo" />
        <span>Ô Ăn Quan</span>
      </div>
      <div class="nav-links">
        <router-link v-if="route.path !== '/'" to="/" class="nav-item">Trang chủ</router-link>
        <router-link to="/about" class="nav-item">Giới thiệu</router-link>
        <router-link to="/guide" class="nav-item">Hướng dẫn</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter, useRoute } from "vue-router";
const router = useRouter();
const route = useRoute();

function goHome() {
  router.push("/");
}
</script>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  height: 70px;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 1.5rem;
  color: #8d6e63;
  cursor: pointer;
}

.logo img {
  height: 40px;
  border-radius: 8px;
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-item {
  text-decoration: none;
  color: #555;
  font-weight: 600;
  transition: color 0.2s;
}

.nav-item:hover,
.router-link-active {
  color: #d32f2f;
}
</style>