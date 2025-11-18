// src/services/socketService.js
import { io } from "socket.io-client";
import { ref } from "vue";

const SOCKET_URL = "http://localhost:3000";

let socket = null;
const socketId = ref(null);

function connect() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🔌 Connected:", socket.id);
      socketId.value = socket.id;
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected");
      socketId.value = null;
    });
  }

  return socket;
}

function getSocket() {
  return socket ?? connect();
}

function getSocketIdReactive() {
  connect();
  return socketId;
}

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

function leaveRoom() {
  getSocket().emit("leave_room");
}

// === CÁC HÀM ĐÃ SỬA: Thêm roomId ===
function requestGameState(roomId) {
  getSocket().emit("game:request_state", roomId); // Gửi roomId
}

function makeMove(roomId, payload) {
  getSocket().emit("make_move", { roomId, ...payload }); // Gửi roomId và payload
}

function submitRps(roomId, choice) {
  getSocket().emit("game:submit_rps", { roomId, choice }); // Gửi roomId và choice
}
// ==================================

function sendMessage(roomId, playerName, text) {
  getSocket().emit("chat:send", {
    roomId, // roomId đã có sẵn
    message: text,
    senderName: playerName,
  });
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

function onNewMessage(cb) {
  getSocket().on("chat:receive", cb);
}
function onAnimate(cb) {
  getSocket().on("game:perform_animation", cb);
}
function offAll() {
  if (!socket) return;
  socket.off("game_start");
  socket.off("update_game_state");
  socket.off("game_over");
  socket.off("chat:receive");
  socket.off("room:player-joined");
  socket.off("error");
  socket.off("kicked_to_menu");
  socket.off("room:joined"); // <-- Quan trọng: Thêm dọn dẹp cho room:joined

  // === THÊM DỌN DẸP MỚI ===
  socket.off("game:start_rps");
  socket.off("timer:start");
  socket.off("timer:clear");
  // ======================
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
  getSocketIdReactive,
  leaveRoom,
  submitRps,
  onAnimate, // <-- EXPORT HÀM MỚI
};