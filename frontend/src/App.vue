<template>
  <Navbar v-if="showNavbar" />

  <div class="app-content">
    <router-view v-slot="{ Component }">
      <transition name="fade-slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    </div>
</template>

<script setup>
import Navbar from "./components/Navbar.vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const showNavbar = computed(() => {
  // Chỉ hiện navbar ở trang chủ '/' và trang sảnh chờ '/play'
  // Các trang trong game (/room/:id) hoặc trang khác có thể ẩn nếu muốn
  // Theo yêu cầu: "Hiện ở tab home và play"
  return ['/', '/play'].includes(route.path);
});
</script>

<style>
body,
html {
  margin: 0;
  font-family: "Inter", sans-serif;
}

.app-content {
  padding-top: 70px;
}

/* Transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: 0.35s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>