import { io } from "socket.io-client";
import { ref } from "vue";

// === LOGGING UTILS (Cải tiến để dễ nhìn hơn) ===
const log = (direction, type, data = '') => {
  const color = direction === 'SEND' ? '#3498db' : '#2ecc71'; // Xanh dương: Gửi, Xanh lá: Nhận
  const arrow = direction === 'SEND' ? '⬆️' : '⬇️';
  console.log(`%c${arrow} [${type}]`, `color: ${color}; font-weight: bold;`, data);
};

// === CẤU HÌNH URL (Giữ nguyên logic của bạn) ===
const SOCKET_URL = import.meta.env.PROD 
  ? "/" 
  : `http://${window.location.hostname}:3000`;

// === STATE ===
let socket = null;
const socketId = ref(null);

// === CONNECTION ===
function connect() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log("🔌 Connected to:", SOCKET_URL, "| ID:", socket.id);
      socketId.value = socket.id;
    });

    socket.on("disconnect", (reason) => {
      console.warn("❌ Disconnected:", reason);
      socketId.value = null;
    });
    
    socket.on("connect_error", (err) => {
      console.error("⚠️ Connection Error:", err.message);
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

/* =================================================================
   1. ACTIONS (GỬI ĐI - EMIT)
   ================================================================= */

function quickPlay(playerName) {
  log('SEND', 'room:quickplay', { name: playerName });
  getSocket().emit("room:quickplay", { name: playerName });
}

function createRoom(playerName) {
  log('SEND', 'room:create', { name: playerName });
  getSocket().emit("room:create", { name: playerName });
}

function joinRoom(roomId, playerName) {
  log('SEND', 'room:join', { roomId, name: playerName });
  getSocket().emit("room:join", { roomId, name: playerName });
}

function leaveRoom() {
  log('SEND', 'leave_room');
  getSocket().emit("leave_room");
}

function requestGameState(roomId) {
  log('SEND', 'game:request_state', roomId);
  getSocket().emit("game:request_state", roomId);
}

function makeMove(roomId, { cellIndex, direction }) {
  const payload = { roomId, cellIndex, direction };
  log('SEND', 'make_move', payload);
  getSocket().emit("make_move", payload);
}

function submitRps(roomId, choice) {
  const payload = { roomId, choice };
  log('SEND', 'game:submit_rps', payload);
  getSocket().emit("game:submit_rps", payload);
}

function sendMessage(roomId, playerName, text) {
  // Backend dùng socket.id để định danh, nhưng ta cứ gửi đúng format cũ của bạn
  const payload = { roomId, message: text, senderName: playerName };
  getSocket().emit("chat:send", payload);
}

// [QUAN TRỌNG] Hàm báo cho server biết Animation đã xong
function notifyAnimationFinished(roomId) {
  log('SEND', 'game:animation_finished', roomId);
  getSocket().emit("game:animation_finished", roomId);
}

// Thêm hàm này vào vùng ACTIONS
function forceReconnect() {
  if (socket) {
    log('INFO', 'Force Reconnecting...');
    socket.disconnect();
    socket.connect();
  }
}

function disconnect() {
  if (socket) {
    log('INFO', 'Disconnecting manually...');
    socket.disconnect();
  }
}
/* =================================================================
   2. LISTENERS (NHẬN VỀ - ON)
   ================================================================= */

function onRoomCreated(cb) {
  getSocket().on("room:created", cb);
}

function onRoomJoined(cb) {
  getSocket().on("room:joined", cb);
}

function onPlayerJoined(cb) {
  getSocket().on("room:player-joined", (data) => {
    log('RECV', 'room:player-joined', data);
    cb(data);
  });
}

function onGameStart(cb) {
  getSocket().on("game_start", (data) => {
    log('RECV', 'game_start', 'Data received');
    cb(data);
  });
}

function onUpdateGameState(cb) {
  getSocket().on("update_game_state", (data) => {
    log('RECV', 'update_game_state', `Next Turn: ${data.nextTurnPlayerId}`);
    cb(data);
  });
}

// Sự kiện nhận kết quả Oẳn tù tì
function onRpsResult(cb) {
  getSocket().on("rpsResult", (data) => {
    log('RECV', 'rpsResult', data);
    cb(data);
  });
}

// Sự kiện bắt đầu Oẳn tù tì
function onStartRps(cb) {
  getSocket().on("game:start_rps", cb);
}

// Sự kiện Timer
function onTimerStart(cb) {
  getSocket().on("timer:start", cb);
}

function onTimerClear(cb) {
  getSocket().on("timer:clear", cb);
}

// Sự kiện Game Over
function onGameOver(cb) {
  getSocket().on("game_over", cb);
}

// Sự kiện Chat
function onNewMessage(cb) {
  getSocket().on("chat:receive", cb);
}

function onError(cb) {
  getSocket().on("error", (err) => {
    console.error("Server Error:", err);
    cb(err);
  });
}

function onKicked(cb) {
  getSocket().on("kicked_to_menu", cb);
}

function onQueueUpdate(cb) {
  getSocket().on("queue_update", cb);
}

// Cleanup
function offAll() {
  if (!socket) return;
  const events = [
    "room:created", "room:joined", "room:player-joined", "queue_update",
    "game_start", "update_game_state", "game:perform_animation", "game_over",
    "rpsResult", "game:start_rps",
    "chat:receive", "error", "kicked_to_menu",
    "timer:start", "timer:clear"
  ];
  events.forEach(event => socket.off(event));
}

export default {
  connect,
  getSocket,
  getSocketIdReactive,
  
  // Actions
  createRoom,
  joinRoom,
  quickPlay,
  leaveRoom,
  requestGameState,
  makeMove,
  submitRps,
  sendMessage,
  notifyAnimationFinished, // <--- MỚI

  // Listeners
  onRoomCreated,
  onRoomJoined,
  onPlayerJoined,
  onQueueUpdate,
  onGameStart,
  onUpdateGameState,
  onRpsResult, // <--- MỚI
  onStartRps,  // <--- MỚI
  onNewMessage,
  onError,
  onKicked,    // <--- MỚI
  onGameOver,  // <--- MỚI
  onTimerStart, // <--- MỚI
  onTimerClear, // <--- MỚI
  
  offAll,
  forceReconnect,
  disconnect,
};