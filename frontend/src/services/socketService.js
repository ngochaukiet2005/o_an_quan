import { io } from "socket.io-client";
import { ref } from "vue";

// === TỰ ĐỘNG CẤU HÌNH URL ===
// 1. import.meta.env.PROD: Nếu đang chạy bản build (npm run build), dùng đường dẫn tương đối "/"
// 2. window.location.hostname: Tự động lấy "localhost" hoặc IP (ví dụ "192.168.1.15") từ thanh địa chỉ trình duyệt
const SOCKET_URL = import.meta.env.PROD 
  ? "/" 
  : `http://${window.location.hostname}:3000`;
// ============================

let socket = null;
const socketId = ref(null);

function connect() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🔌 Connected to:", SOCKET_URL, "| ID:", socket.id);
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

function requestGameState(roomId) {
  getSocket().emit("game:request_state", roomId);
}

function makeMove(roomId, payload) {
  getSocket().emit("make_move", { roomId, ...payload });
}

function submitRps(roomId, choice) {
  getSocket().emit("game:submit_rps", { roomId, choice });
}

function sendMessage(roomId, playerName, text) {
  getSocket().emit("chat:send", {
    roomId,
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
function onQueueUpdate(cb) {
  getSocket().on("queue_update", cb);
}

// 👇 Đổi tên hàm này từ offAll -> cleanupGameEvents
function cleanupGameEvents() {
  if (!socket) return;
  // Chỉ xóa các sự kiện cụ thể của màn chơi
  const gameEvents = [
    "game_start", "update_game_state", "game_over", 
    "chat:receive", "room:player-joined", "room:joined",
    "game:start_rps", "rpsResult", 
    "timer:start", "timer:clear", "queue_update",
    "kicked_to_menu", "invalid_move"
    // Lưu ý: KHÔNG xóa "error" hoặc "connect/disconnect" nếu App.vue dùng chung
  ];
  
  gameEvents.forEach(event => socket.off(event));
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
  cleanupGameEvents,
  getSocket,
  getSocketIdReactive,
  leaveRoom,
  submitRps,
  onAnimate,
  onQueueUpdate,
};