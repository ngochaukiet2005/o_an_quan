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

// === HÀM MỚI ===
function submitRps(choice) {
  getSocket().emit("game:submit_rps", choice);
}
// ==============

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

function offAll() {
  if (!socket) return;
  socket.off("game_start");
  socket.off("update_game_state");
  socket.off("game_over");
  socket.off("chat:receive");
  socket.off("room:player-joined");
  socket.off("error");
  socket.off("kicked_to_menu");

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
  submitRps, // <-- EXPORT HÀM MỚI
};