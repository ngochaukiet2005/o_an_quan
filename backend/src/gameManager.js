// src/gameManager.js
// (ĐÃ VIẾT LẠI HOÀN TOÀN để sử dụng OAnQuanGame.js)

import { generateRoomId } from "./utils.js";
import { OAnQuanGame } from "./OAnQuanGame.js"; // <-- IMPORT LOGIC MỚI

// ---- 1. Quản lý Trạng thái ----
const rooms = new Map();
const matchmakingQueue = [];

// ---- 2. Các Hàm Xử lý Sự kiện ----

export const handleCreateRoom = (socket, playerName) => {
  const roomId = generateRoomId();
  const player1 = { id: socket.id, name: playerName, symbol: "X" }; // X là P1

  // Khởi tạo một thực thể (instance) game mới
  const game = new OAnQuanGame(); // <-- DÙNG CLASS MỚI

  const room = {
    id: roomId,
    players: [player1],
    game: game, // <-- Lưu trữ thực thể game
    status: "waiting",
    nextTurnPlayerId: null,
  };
  rooms.set(roomId, room);
  socket.join(roomId);
  socket.emit("room_created", {
    roomId: roomId,
    playerId: player1.id,
    playerSymbol: player1.symbol,
  });
};

export const handleJoinRoom = (io, socket, roomId, playerName) => {
  const room = rooms.get(roomId);
  if (!room) {
    return socket.emit("error", { message: "Phòng không tồn tại." });
  }
  if (room.players.length >= 2) {
    return socket.emit("error", { message: "Phòng đã đầy." });
  }
  const player2 = { id: socket.id, name: playerName, symbol: "O" }; // O là P2
  room.players.push(player2);
  room.status = "playing";
  room.nextTurnPlayerId = room.players[0].id; // P1 (X) đi trước

  socket.join(roomId);

  // Lấy trạng thái ban đầu từ thực thể game
  const initialState = room.game.getState(); // <-- DÙNG CLASS MỚI

  const startData = {
    players: room.players,
    startingPlayerId: room.nextTurnPlayerId,
    board: initialState.board,
    scores: initialState.scores,
    debt: initialState.debt,
    roomId: roomId,
  };
  io.to(roomId).emit("game_start", startData);
};

/**
 * (C -> S) Xử lý một nước đi (VIẾT LẠI HOÀN TOÀN)
 */
export const handleMakeMove = (io, socket, payload) => {
  const room = findRoomBySocketId(socket.id);
  if (!room) return;

  const game = room.game; // <-- Lấy thực thể game của phòng
  if (!game) return;

  const { cellIndex, direction } = payload;
  // Chuyển 'left'/'right' (từ client) thành -1/1 (cho logic)
  const moveDirection = direction === "right" ? 1 : -1;

  // 1. Xác thực người chơi (dựa trên state của game)
  const playerIndex = room.players.findIndex((p) => p.id === socket.id);
  const playerNumber = playerIndex === 0 ? 1 : 2; // P1 hoặc P2
  const currentState = game.getState();

  if (currentState.currentPlayer !== playerNumber) {
    return socket.emit("invalid_move", { message: "Không phải lượt của bạn!" });
  }

  // 2. Thực hiện nước đi
  // Tất cả logic (Vay, Rải, Ăn, Dừng, Mất lượt) đều nằm trong hàm .makeMove()
  const newState = game.makeMove(cellIndex, moveDirection); // <-- DÙNG CLASS MỚI

  // 3. Kiểm tra xem nước đi có hợp lệ không (dựa trên tin nhắn trả về)
  // Đây chính là lý do bạn gặp lỗi "Không Hợp Lệ"
  if (newState.gameMessage === "Nước đi không hợp lệ.") {
    return socket.emit("invalid_move", {
      message: "Nước đi không hợp lệ (Không được bốc ô trống hoặc ô Quan).",
    });
  }

  // 4. Kiểm tra Game Over (LUẬT 5)
  if (newState.isGameOver) {
    let winnerId = null;
    if (newState.winner === 1) winnerId = room.players[0].id;
    else if (newState.winner === 2) winnerId = room.players[1].id;

    // Tính tổng điểm cuối cùng (Client GameRoom.vue cần cái này)
    const finalP1 = newState.scores.player1;
    const finalP2 = newState.scores.player2;
    // (Đây là nơi duy nhất dùng 5x)
    const totalP1 = finalP1.quan * 5 + finalP1.dan;
    const totalP2 = finalP2.quan * 5 + finalP2.dan;

    io.to(room.id).emit("game_over", {
      winner: winnerId,
      reason: newState.winner === 0 ? "draw" : "win",
      finalScores: {
        player1: totalP1,
        player2: totalP2,
      },
      gameMessage: newState.gameMessage, // Gửi tin nhắn (VD: "Thua do không thể vay")
    });

    rooms.delete(room.id);
    return;
  }

  // 5. Cập nhật trạng thái (nếu game chưa kết thúc)
  const nextPlayer = room.players[newState.currentPlayer - 1]; // Lấy socket ID của người chơi tiếp theo

  io.to(room.id).emit("update_game_state", {
    board: newState.board,
    nextTurnPlayerId: nextPlayer.id,
    scores: newState.scores,
    debt: newState.debt,
    gameMessage: newState.gameMessage, // Gửi tin nhắn (VD: "Mất lượt", "Ăn 5 Dân"...)
  });
};

// --- CÁC HÀM KHÁC (giữ nguyên) ---

export const handleLeaveRoom = (io, socket) => {
  const room = findRoomBySocketId(socket.id);
  // ... (giữ nguyên code)
  if (!room) return;
  const otherPlayer = room.players.find((p) => p.id !== socket.id);
  if (otherPlayer) {
    const otherSocket = io.sockets.sockets.get(otherPlayer.id);
    if (otherSocket) {
      otherSocket.emit("kicked_to_menu", {
        message: "Đối thủ đã rời phòng. Bạn thắng!",
      });
    }
  }
  socket.emit("kicked_to_menu", {
    message: "Bạn đã rời phòng và bị xử thua.",
  });
  rooms.delete(room.id);
};

export const handleDisconnect = (io, socket, reason) => {
  const queueIndex = matchmakingQueue.findIndex((p) => p.id === socket.id);
  // ... (giữ nguyên code)
  if (queueIndex > -1) {
    matchmakingQueue.splice(queueIndex, 1);
  }
  const room = findRoomBySocketId(socket.id);
  if (!room) return;
  const otherPlayer = room.players.find((p) => p.id !== socket.id);
  if (otherPlayer) {
    const otherSocket = io.sockets.sockets.get(otherPlayer.id);
    if (otherSocket) {
      otherSocket.emit("kicked_to_menu", {
        message: "Đối thủ đã ngắt kết nối. Bạn thắng!",
      });
    }
  }
  rooms.delete(room.id);
};

export const handleSendMessage = (io, socket, payload) => {
  const room = findRoomBySocketId(socket.id);
  // ... (giữ nguyên code)
  if (!room) return;
  const player = room.players.find((p) => p.id === socket.id);
  io.to(room.id).emit("new_message", {
    senderName: player ? player.name : "Người xem",
    message: payload.message,
  });
};

const findRoomBySocketId = (socketId) => {
  // ... (giữ nguyên code)
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.id === socketId)) {
      return room;
    }
  }
  return undefined;
};

export const handleJoinMatchmaking = (io, socket, playerName) => {
  if (matchmakingQueue.some((p) => p.id === socket.id)) {
  // ... (giữ nguyên code)
    return socket.emit("queue_update", {
      message: "Bạn đã ở trong hàng chờ rồi.",
    });
  }
  matchmakingQueue.push({ id: socket.id, name: playerName });
  socket.emit("queue_update", { message: "Đang tìm đối thủ..." });

  if (matchmakingQueue.length >= 2) {
    const player1Data = matchmakingQueue.shift();
    const player2Data = matchmakingQueue.shift();
    const socket1 = io.sockets.sockets.get(player1Data.id);
    const socket2 = io.sockets.sockets.get(player2Data.id);

    if (!socket1) {
      if (socket2) {
        matchmakingQueue.unshift(player2Data);
        socket2.emit("queue_update", {
          message: "Đối thủ đã hủy. Đang tìm lại...",
        });
      }
      return;
    }
    if (!socket2) {
      matchmakingQueue.unshift(player1Data);
      socket1.emit("queue_update", {
        message: "Đối thủ đã hủy. Đang tìm lại...",
      });
      return;
    }

    const roomId = generateRoomId();
    const player1 = { id: player1Data.id, name: player1Data.name, symbol: "X" };
    const player2 = { id: player2Data.id, name: player2Data.name, symbol: "O" };

    const game = new OAnQuanGame(); // <-- Khởi tạo game MỚI

    const room = {
      id: roomId,
      players: [player1, player2],
      game: game, // <-- Lưu game MỚI
      status: "playing",
      nextTurnPlayerId: player1.id,
    };
    rooms.set(roomId, room);
    socket1.join(roomId);
    socket2.join(roomId);

    const initialState = room.game.getState(); // <-- Lấy state MỚI

    const startData = {
      players: room.players,
      startingPlayerId: room.nextTurnPlayerId,
      board: initialState.board,
      scores: initialState.scores,
      debt: initialState.debt,
      roomId: roomId,
    };
    io.to(roomId).emit("game_start", startData);
  }
};
// ===============================
//  GẮN TOÀN BỘ SOCKET HANDLER
// ===============================
export function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("✔ Client connected:", socket.id);

    // --- Tạo phòng ---
    socket.on("create_room", ({ playerName }) => {
      handleCreateRoom(socket, playerName);
    });

    // --- Tham gia phòng ---
    socket.on("join_room", ({ roomId, playerName }) => {
      handleJoinRoom(io, socket, roomId, playerName);
    });

    // --- Matchmaking ---
    socket.on("join_matchmaking", ({ playerName }) => {
      handleJoinMatchmaking(io, socket, playerName);
    });

    // --- Xử lý nước đi ---
    socket.on("make_move", (payload) => {
      handleMakeMove(io, socket, payload);
    });

    // --- Chat ---
    socket.on("send_message", (payload) => {
      handleSendMessage(io, socket, payload);
    });

    // --- Người chơi rời phòng ---
    socket.on("leave_room", () => {
      handleLeaveRoom(io, socket);
    });

    // --- Ngắt kết nối ---
    socket.on("disconnect", (reason) => {
      handleDisconnect(io, socket, reason);
    });
  });
}
