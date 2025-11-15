// src/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
// Import các hàm điều phối từ gameManager
import {
  handleCreateRoom,
  handleJoinRoom,
  handleMakeMove,
  handleSendMessage,
  handleDisconnect,
  handleLeaveRoom,
  handleJoinMatchmaking,
} from "./gameManager.js";

// ---- 1. Khởi tạo Server ----
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ---- 2. Lắng nghe sự kiện Socket.IO ----
io.on("connection", (socket) => {
  console.log(`Client đã kết nối: ${socket.id}`);

  socket.on("create_room", (payload) => {
    handleCreateRoom(socket, payload.playerName);
  });

  socket.on("join_room", (payload) => {
    handleJoinRoom(io, socket, payload.roomId, payload.playerName);
  });

  socket.on("join_matchmaking", (payload) => {
    handleJoinMatchmaking(io, socket, payload.playerName);
  });

  socket.on("make_move", (payload) => {
    handleMakeMove(io, socket, payload);
  });

  socket.on("send_message", (payload) => {
    handleSendMessage(io, socket, payload);
  });

  socket.on("leave_room", () => {
    handleLeaveRoom(io, socket);
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client đã ngắt kết nối: ${socket.id} (Lý do: ${reason})`);
    handleDisconnect(io, socket, reason);
  });
});

// ---- 3. Chạy Server ----
httpServer.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});