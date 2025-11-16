<template>
  <Navbar />

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
</script>

<style>
body,
html {
  margin: 0;
  font-family: "Inter", sans-serif;
}

/* đảm bảo nội dung nằm dưới navbar */
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
