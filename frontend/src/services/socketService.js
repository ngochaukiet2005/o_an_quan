// src/services/socketService.js
import { io } from "socket.io-client";
import { ref } from "vue"; // <-- THÊM DÒNG NÀY

const SOCKET_URL = "http://localhost:3000";

let socket = null;
const socketId = ref(null); // <-- TẠO MỘT REF CHO SOCKET ID

function connect() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🔌 Connected:", socket.id);
      socketId.value = socket.id; // <-- CẬP NHẬT REF KHI KẾT NỐI
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected");
      socketId.value = null; // <-- XÓA REF KHI MẤT KẾT NỐI
    });
  }

  return socket;
}

function getSocket() {
  return socket ?? connect();
}

// === THÊM HÀM MỚI NÀY ===
function getSocketIdReactive() {
  connect(); // Đảm bảo socket đã được khởi tạo
  return socketId;
}
// =======================

/* ================= EMIT ================= */
function quickPlay(playerName) {
  getSocket().emit("room:quickplay", { name: playerName });
}
function createRoom(playerName) {
  getSocket().emit("room:create", { name: playerName });
}

function joinRoom(roomId, playerName) {
  getSocket().emit("room:join", { roomId, name: playerName });
}

/* ================= ON ================= */

function onRoomCreated(cb) {
  getSocket().on("room:created", cb);
}

function onRoomJoined(cb) {
  getSocket().on("room:joined", cb);
}

function onUpdateGameState(cb) {
  getSocket().on("update_game_state", cb);
}

function onPlayerJoined(cb) {
  getSocket().on("room:player-joined", cb);
}

function onError(cb) {
  getSocket().on("error", cb);
}
function onGameStart(cb) {
  getSocket().on("game_start", cb);
}

function requestGameState() {
  getSocket().emit("game:request_state");
}

function makeMove(payload) {
  getSocket().emit("make_move", payload);
}
function sendMessage(roomId, playerName, text) {
  getSocket().emit("chat:send", {
    roomId,
    message: text,
    senderName: playerName,
  });
}

function onNewMessage(cb) {
  getSocket().on("chat:receive", cb);
}

// Sửa hàm offAll để xóa đúng các listener
function offAll() {
  if (!socket) return;
  socket.off("game_start");
  socket.off("update_game_state");
  socket.off("game_over");
  socket.off("chat:receive");
  socket.off("room:player-joined");
  socket.off("error");
  
  // KHÔNG off "room:created" và "room:joined"
  // vì chúng được quản lý bởi Play.vue
}

export default {
  connect,
  createRoom,
  joinRoom,
  quickPlay,
  requestGameState,
  makeMove,
  onRoomCreated,
  onRoomJoined,
  onNewMessage,
  sendMessage,
  onUpdateGameState,
  onPlayerJoined,
  onError,
  onGameStart,
  offAll,
  getSocket,
  getSocketIdReactive, // <-- XUẤT (EXPORT) HÀM MỚI
};