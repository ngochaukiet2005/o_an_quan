// src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import socketService from "./services/socketService";

// Khởi tạo kết nối Socket.IO một lần
socketService.connect();

const app = createApp(App);
app.use(router);
app.mount("#app");
