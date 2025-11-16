// frontend/src/services/socketService.js
import { io } from "socket.io-client";

let socket = null;

export const initializeSocket = (url) => {
  if (!socket) {
    socket = io(url);

    socket.on("connect", () => {
      console.log("✔ Đã kết nối tới server với ID:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Đã ngắt kết nối khỏi server.");
    });

    socket.on("error", (error) => {
      console.error("Lỗi Socket:", error.message);
    });
  }
};

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket chưa được khởi tạo!");
  }
  return socket;
};

// Hàm chung để gửi sự kiện
export const emit = (eventName, payload) => {
  getSocket().emit(eventName, payload);
};

// Hàm chung để lắng nghe sự kiện
export const on = (eventName, callback) => {
  getSocket().on(eventName, callback);
};

// Hàm chung để tắt lắng nghe sự kiện
export const off = (eventName, callback) => {
  getSocket().off(eventName, callback);
};