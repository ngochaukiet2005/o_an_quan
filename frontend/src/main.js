// frontend/src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { initializeSocket } from "./services/socketService"; // <-- Import service

import "./assets/main.css";

// 🚀 KHỞI TẠO KẾT NỐI SOCKET NGAY LẬP TỨC
// Thay đổi IP này thành IP LAN của máy backend của bạn
const YOUR_SERVER_IP = "192.168.1.10"; // <--- ⚠️ THAY ĐỔI IP NÀY
initializeSocket(`http://${YOUR_SERVER_IP}:3000`);

const app = createApp(App);
app.use(router);
app.mount("#app");