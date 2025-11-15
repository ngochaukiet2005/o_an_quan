// src/services/socketService.js (NỘI DUNG ĐÚNG)

import { io } from "socket.io-client";

// --- Đây là phần tự động ---
// 1. Xác định cổng của backend
const BACKEND_PORT = 3000;

// 2. Tự động lấy hostname (IP) mà trình duyệt đang truy cập
const hostname = window.location.hostname;

// 3. Tự động tạo URL
const SOCKET_SERVER_URL = `http://${hostname}:${BACKEND_PORT}`;
// -----------------------------

console.log("Đang kết nối tới Backend Socket tại:", SOCKET_SERVER_URL);

const socket = io(SOCKET_SERVER_URL, {
  autoConnect: false, // Tắt tự động kết nối
});

// Hàm kết nối
const connect = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

// Hàm ngắt kết nối
const disconnect = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Hàm gửi sự kiện (emit)
const emit = (event, data) => {
  socket.emit(event, data);
};

// Hàm lắng nghe sự kiện (on)
const on = (event, callback) => {
  socket.on(event, callback);
};

// Hàm hủy lắng nghe sự kiện (off)
const off = (event, callback) => {
  socket.off(event, callback);
};

// Tự động log khi kết nối hoặc mất kết nối
socket.on("connect", () => {
  console.log("Đã kết nối tới server Socket.IO:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Đã ngắt kết nối khỏi server Socket.IO");
});

// Export các hàm để các component khác có thể sử dụng
export default {
  socket,
  connect,
  disconnect,
  emit,
  on,
  off,
};