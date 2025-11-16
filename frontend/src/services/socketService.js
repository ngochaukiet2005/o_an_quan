// src/services/socketService.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";

let socket = null;

function connect() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🔌 Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected");
    });
  }

  return socket;
}

function getSocket() {
  return socket ?? connect();
}

/* ================= EMIT ================= */
function quickPlay(playerName) {
  // Gửi { name: ... } thay vì { playerName: ... }
  getSocket().emit("room:quickplay", { name: playerName });
}
function createRoom(playerName) {
  getSocket().emit("room:create", { playerName });
}

function joinRoom(roomId, playerName) {
  getSocket().emit("room:join", { roomId, playerName });
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
  // FIX: backend emit "error"
  getSocket().on("error", cb);
}
function onGameStart(cb) {
  getSocket().on("game_start", cb);
}
function makeMove(payload) {
  // payload sẽ có dạng { roomId, playerId, startIndex }
  getSocket().emit("make_move", payload);
}
function sendMessage(roomId, playerName, text) {
  // Thêm playerName
  getSocket().emit("chat:send", {
    roomId,
    message: text,
    senderName: playerName, // <--- Gửi kèm tên
  });
}

// Thêm hàm này
function onNewMessage(cb) {
  getSocket().on("chat:receive", cb); // <--- Lắng nghe sự kiện "chat:receive"
}
function offAll() {
  if (!socket) return;
  socket.off("chat:receive");

  socket.off("room:created");
  socket.off("room:joined");
  socket.off("update_game_state");
  socket.off("room:player-joined");
  socket.off("error"); // FIX
}

export default {
  connect,
  createRoom,
  joinRoom,
  quickPlay,
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
};
