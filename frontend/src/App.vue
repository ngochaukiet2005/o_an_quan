<script setup>
// 1. Chỉ cần import RouterView
import { RouterView } from "vue-router";
</script>

<template>
  <RouterView />
</template>

<style>
/* 3. Xóa "scoped" để các style này áp dụng toàn cục.
  Đây là nơi tốt để đặt các style chung 
  cho toàn bộ ứng dụng (ví dụ: font chữ, màu nền...)
*/
body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  background-color: #f4f4f5;
  margin: 0;
  padding: 10px;
  text-align: center;
}
</style>
