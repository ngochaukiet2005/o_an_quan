// src/server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  handleCreateRoom,
  handleJoinRoom,
  handleMakeMove,
  handleSendMessage,
  handleDisconnect
} from './gameManager.js';

// ---- 1. Khởi tạo Server ----
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors()); // Cho phép kết nối từ frontend [cite: 104]

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Cho phép tất cả các nguồn (để phát triển)
    methods: ["GET", "POST"]
  }
});

// ---- 2. Lắng nghe sự kiện Socket.IO ----
// Sự kiện 'connection' được kích hoạt khi một client kết nối [cite: 12]
io.on('connection', (socket) => {
  console.log(`Client đã kết nối: ${socket.id}`);

  // ---- Quản lý phòng [cite: 20] ----
  
  // (C -> S) Lắng nghe sự kiện tạo phòng [cite: 21]
  socket.on('create_room', (payload) => {
    // payload mong đợi: { playerName: 'Tên' } [cite: 23]
    handleCreateRoom(socket, payload.playerName);
  });

  // (C -> S) Lắng nghe sự kiện vào phòng [cite: 27]
  socket.on('join_room', (payload) => {
    // payload mong đợi: { roomId: 'abc12', playerName: 'Tên' } [cite: 28]
    handleJoinRoom(io, socket, payload.roomId, payload.playerName);
  });

  // ---- Game Play [cite: 32] ----

  // (C -> S) Lắng nghe sự kiện thực hiện nước đi [cite: 46]
  socket.on('make_move', (payload) => {
    // payload mong đợi: { cellIndex: 5 } (ví dụ)
    // Tệp API nói (x, y) hoặc (choice)[cite: 50, 51], nhưng với Ô Ăn Quan, 
    // một chỉ số (index) của ô dân sẽ hợp lý hơn.
    handleMakeMove(io, socket, payload);
  });

  // ---- (Optional) Chat [cite: 78] ----
  
  // (C -> S) Lắng nghe sự kiện gửi tin nhắn [cite: 79]
  socket.on('send_message', (payload) => {
    // payload mong đợi: { message: 'Chào!' } [cite: 81]
    handleSendMessage(io, socket, payload);
  });

  // ---- Ngắt kết nối [cite: 17] ----
  
  // Tự động kích hoạt khi client ngắt kết nối [cite: 17]
  socket.on('disconnect', (reason) => {
    console.log(`Client đã ngắt kết nối: ${socket.id} (Lý do: ${reason})`);
    handleDisconnect(io, socket, reason);
  });
});

// ---- 3. Chạy Server ----
httpServer.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});