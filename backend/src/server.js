// backend/src/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { setupSocketHandlers } from "./gameManager.js"; // <-- CHỈ IMPORT TRÌNH QUẢN LÝ MỚI

const app = express();
app.use(cors()); // Cho phép cross-origin

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép tất cả
    methods: ["GET", "POST"],
  },
});

// Gắn tất cả các trình xử lý sự kiện (create_room, join_room, make_move...)
setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✔ Server Ô Ăn Quan đang chạy tại http://localhost:${PORT}`);
});