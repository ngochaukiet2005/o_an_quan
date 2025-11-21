// backend/src/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { setupSocketHandlers } from "./gameManager.js"; 

// Cấu hình đường dẫn cho ES Modules (cần thiết để tìm folder frontend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Cấu hình CORS mở rộng để Frontend (port 5173 hoặc từ điện thoại) gọi vào được
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST"]
}));

const server = http.createServer(app);
// --- SỬA ĐOẠN NÀY ---
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
  // Thêm cấu hình tối ưu cho LAN:
  transports: ['websocket'], // Bắt buộc dùng WebSocket ngay, bỏ qua Polling
  pingTimeout: 10000,        // 10 giây không thấy phản hồi là coi như mất kết nối
  pingInterval: 25000        // Gửi gói tin kiểm tra mỗi 25 giây
});
// --------------------

// Gắn toàn bộ logic game (Socket Handlers)
setupSocketHandlers(io);

// 2. Cấu hình phục vụ Frontend (Nếu bạn đã chạy 'npm run build' ở frontend)
// Đường dẫn này trỏ từ 'backend/src' ra 'frontend/dist'
const frontendDistPath = path.join(__dirname, "../../frontend/dist");

// Phục vụ file tĩnh (JS, CSS, Ảnh)
app.use(express.static(frontendDistPath));

// Với mọi đường dẫn khác không phải API, trả về file index.html (để Vue Router hoạt động)
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

const PORT = process.env.PORT || 3000;

// 3. Lắng nghe '0.0.0.0' thay vì localhost để mở cổng ra mạng LAN
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✔ Server Ô Ăn Quan đang chạy tại port ${PORT}`);
  console.log(`  -> Local:   http://localhost:${PORT}`);
  console.log(`  -> Network: Hãy xem IP máy tính của bạn (ví dụ: http://192.168.1.x:${PORT})`);
});