// frontend/src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { initializeSocket } from "./services/socketService"; // <-- Import service

import "./assets/main.css";

// 🚀 TỰ ĐỘNG KẾT NỐI SOCKET
// Tự động lấy IP/hostname của server từ thanh địa chỉ trình duyệt
// và kết nối đến cổng 3000 (cổng backend)
const SERVER_URL = `http://${window.location.hostname}:3000`;

console.log(`Đang kết nối tới server tại: ${SERVER_URL}`);
initializeSocket(SERVER_URL);

const app = createApp(App);
app.use(router);
app.mount("#app");