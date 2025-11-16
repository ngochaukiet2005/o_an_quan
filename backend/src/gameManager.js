// src/gameManager.js
import { generateRoomId } from "./utils.js";
import { OAnQuanGame } from "./OAnQuanGame.js";
import { RpsGame } from "./RpsGame.js";
import { TurnTimerManager } from "./turnTimer.js";

// ---- 1. Quản lý Trạng thái ----
const rooms = new Map();
const matchmakingQueue = [];

let ioInstance = null; // Lưu trữ instance 'io'
let timerManager = null; // Biến quản lý timer

// ---- 2. Các Hàm Xử lý Sự kiện ----

export const handleCreateRoom = (socket, playerName) => {
  const roomId = generateRoomId();
  const player1 = { id: socket.id, name: playerName, symbol: "X" };
  const game = new OAnQuanGame();

  const room = {
    id: roomId,
    players: [player1],
    game: game,
    status: "waiting",
    rpsGame: null,
    nextTurnPlayerId: null,
  };
  rooms.set(roomId, room);
  socket.join(roomId);
  socket.emit("room:created", {
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

  const player2 = { id: socket.id, name: playerName, symbol: "O" };
  room.players.push(player2);

  socket.join(roomId);
  socket.emit("room:joined", {
    roomId: roomId,
    playerId: player2.id,
    playerSymbol: player2.symbol,
    players: room.players, // Gửi danh sách người chơi
  });
  socket.to(roomId).emit("room:player-joined", {
    id: player2.id,
    name: player2.name,
  });

  // Bắt đầu Oẳn tù tì
  startRps(io, room);
};

export const handleJoinMatchmaking = (io, socket, playerName) => {
  if (matchmakingQueue.some((p) => p.id === socket.id)) {
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

    // ... (logic kiểm tra socket1, socket2 còn tồn tại) ...
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
    const game = new OAnQuanGame();

    const room = {
      id: roomId,
      players: [player1, player2],
      game: game,
      status: "rps",
      rpsGame: null,
      nextTurnPlayerId: null,
    };
    rooms.set(roomId, room);
    socket1.join(roomId);
    socket2.join(roomId);

    // === 💡 SỬA LỖI "CHƠI NGAY" 💡 ===
    // Báo cho 2 client biết họ đã vào phòng
    socket1.emit("room:joined", {
      roomId: roomId,
      playerId: player1.id,
      playerSymbol: player1.symbol,
      players: room.players,
    });
    socket2.emit("room:joined", {
      roomId: roomId,
      playerId: player2.id,
      playerSymbol: player2.symbol,
      players: room.players,
    });
    // =============================

    // Bắt đầu Oẳn tù tì
    startRps(io, room);
  }
};

/**
 * Bắt đầu hoặc khởi động lại Oẳn tù tì
 */
function startRps(io, room, isRetry = false) {
  room.status = "rps";
  if (!room.rpsGame) {
    room.rpsGame = new RpsGame(room.players[0].id, room.players[1].id);
  } else {
    room.rpsGame.reset();
  }
  io.to(room.id).emit("game:start_rps", { isRetry });
}

/**
 * Xử lý khi người chơi chọn Oẳn tù tì
 */
export const handleSubmitRps = (io, socket, payload) => {
  const { roomId, choice } = payload;
  const room = rooms.get(roomId);

  if (!room || !room.rpsGame || room.status !== "rps") return;

  // === 💡 SỬA LỖI RPS BỊ KẸT 💡 ===
  // Tìm người chơi dựa trên socket.id hiện tại
  const player = room.players.find((p) => p.id === socket.id);
  if (!player) {
    // Trường hợp này có thể xảy ra nếu ID socket thay đổi (rất hiếm)
    // Hoặc nếu một người không phải người chơi cố gắng gửi.
    console.warn(`Socket ${socket.id} không phải là người chơi trong phòng ${roomId}`);
    return; 
  }

  // Giao phó logic cho RpsGame bằng ID ổn định (p.id)
  const rpsState = room.rpsGame.makeChoice(player.id, choice);
  // =============================

  if (rpsState.status === "complete") {
    if (rpsState.winner === "draw") {
      startRps(io, room, true);
      return;
    }

    const startingPlayer = room.players.find(p => p.id === rpsState.winnerId);
    room.status = "playing";
    room.nextTurnPlayerId = startingPlayer.id;

    room.game.state.currentPlayer = room.players.findIndex(p => p.id === startingPlayer.id) + 1;
    room.game.state.gameMessage = `Ván đấu bắt đầu. Lượt của ${startingPlayer.name}.`;

    const initialState = room.game.getState();
    const startData = {
      players: room.players,
      startingPlayerId: startingPlayer.id,
      board: initialState.board,
      scores: initialState.scores,
      debt: initialState.debt,
      roomId: room.id,
      rpsResult: {
        p1Choice: rpsState.choices[room.players[0].id],
        p2Choice: rpsState.choices[room.players[1].id],
        winnerId: startingPlayer.id,
      },
      gameMessage: initialState.gameMessage,
    };
    
    io.to(room.id).emit("game_start", startData);
    room.rpsGame = null;
    timerManager.start(room);
  }
};

/**
 * (Callback) Khi timer hết hạn
 */
function handleTimerExpires(io, room, expiredPlayer) {
  if (!rooms.has(room.id) || !ioInstance) return;
  const gameInstance = room.game;
  if (gameInstance.getState().currentPlayer !== expiredPlayer) {
    return;
  }

  console.log(`Thực hiện nước đi ngẫu nhiên cho P${expiredPlayer}`);
  gameInstance.checkAndHandleBorrowing(expiredPlayer);
  const validIndices = gameInstance.getValidMoveIndices(expiredPlayer);

  const player = room.players[expiredPlayer - 1];
  const playerName = player ? player.name : `Người chơi ${expiredPlayer}`;
  
  if (validIndices.length > 0) {
    const randomIndex = validIndices[Math.floor(Math.random() * validIndices.length)];
    const randomDirection = Math.random() < 0.5 ? 1 : -1;
    const directionText = randomDirection === 1 ? "phải" : "trái";

    ioInstance.to(room.id).emit("chat:receive", {
      senderName: "Hệ thống",
      message: `Hết giờ! Tự động chọn ô ${randomIndex} và đi hướng ${directionText} cho ${playerName}.`
    });

    performMove(ioInstance, room, randomIndex, randomDirection);
  } else {
    ioInstance.to(room.id).emit("chat:receive", {
      senderName: "Hệ thống",
      message: `Hết giờ! ${playerName} không thể thực hiện nước đi (kể cả sau khi vay) và bị xử thua.`
    });
    performMove(ioInstance, room, 0, 1); // Nước đi không hợp lệ để xử thua
  }
}

/**
 * (Logic chung) Thực hiện nước đi
 */
function performMove(io, room, cellIndex, direction) {
  const game = room.game;
  const newState = game.makeMove(cellIndex, direction);

  if (newState.isGameOver) {
    let winnerId = null;
    if (newState.winner === 1) winnerId = room.players[0].id;
    else if (newState.winner === 2) winnerId = room.players[1].id;

    const finalP1 = newState.scores.player1;
    const finalP2 = newState.scores.player2;
    const totalP1 = finalP1.quan * 5 + finalP1.dan;
    const totalP2 = finalP2.quan * 5 + finalP2.dan; // <-- 💡 SỬA LỖI TÍNH ĐIỂM

    io.to(room.id).emit("game_over", {
      winner: winnerId,
      reason: newState.winner === 0 ? "draw" : "win",
      finalScores: { player1: totalP1, player2: totalP2 },
      gameMessage: newState.gameMessage,
    });

    timerManager.clear(room);
    rooms.delete(room.id);
    return;
  }

  const nextPlayer = room.players[newState.currentPlayer - 1];
  io.to(room.id).emit("update_game_state", {
    board: newState.board,
    nextTurnPlayerId: nextPlayer.id,
    scores: newState.scores,
    debt: newState.debt,
    gameMessage: newState.gameMessage,
  });

  timerManager.start(room);
}

/**
 * (C -> S) Xử lý một nước đi
 */
export const handleMakeMove = (io, socket, payload) => {
  const { roomId, cellIndex, direction } = payload;
  const room = rooms.get(roomId);

  if (!room) return;

  timerManager.clear(room);

  const game = room.game;
  if (!game) return;

  const moveDirection = direction === "right" ? 1 : -1;

  const playerIndex = room.players.findIndex((p) => p.id === socket.id);
  if (playerIndex === -1) return; // Không phải người chơi

  const playerNumber = playerIndex === 0 ? 1 : 2;
  const currentState = game.getState();

  if (currentState.currentPlayer !== playerNumber) {
    timerManager.start(room); // Khởi động lại timer
    return socket.emit("invalid_move", { message: "Không phải lượt của bạn!" });
  }

  // Gửi tin nhắn chat
  const player = room.players[playerIndex];
  const playerName = player ? player.name : `Người chơi ${playerNumber}`;
  const directionText = moveDirection === 1 ? "phải" : "trái";
  
  io.to(room.id).emit("chat:receive", {
      senderName: "Hệ thống",
      message: `${playerName} đã chọn ô ${cellIndex} và đi về hướng ${directionText}.`
  });

  performMove(io, room, cellIndex, moveDirection);
};

// --- CÁC HÀM KHÁC ---

export const handleLeaveRoom = (io, socket) => {
  // Tìm phòng của socket này (cần cho disconnect/leave)
  const room = findRoomBySocketId(socket.id);
  if (!room) return;
  
  timerManager.clear(room);

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
  if (queueIndex > -1) {
    matchmakingQueue.splice(queueIndex, 1);
  }
  
  const room = findRoomBySocketId(socket.id);
  if (!room) return;
  
  timerManager.clear(room);
  
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
  const { roomId, message } = payload;
  const room = rooms.get(roomId);
  if (!room) return;
  const player = room.players.find((p) => p.id === socket.id);
  io.to(room.id).emit("chat:receive", {
    senderName: player ? player.name : "Người xem",
    message: message,
  });
};

const findRoomBySocketId = (socketId) => {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.id === socketId)) {
      return room;
    }
  }
  return undefined;
};

export const handleRequestGameState = (io, socket, roomId) => {
  const room = rooms.get(roomId);
  if (!room) {
    return socket.emit("error", { message: "Không tìm thấy phòng." });
  }

  // === 💡 SỬA LỖI RECONNECT 💡 ===
  // Cập nhật socket.id mới cho người chơi nếu họ reconnect
  const playerIndex = room.players.findIndex(p => p.id === socket.id);
  if (playerIndex === -1) { 
    // Nếu không tìm thấy, đây là một reconnect
    // Chúng ta cần tìm xem họ là P1 hay P2
    // Giải pháp đơn giản: giả định người chơi đầu tiên không khớp là họ
    // (Điều này có thể không an toàn nếu cả 2 cùng reconnect, nhưng hiếm)
    
    // Thử tìm P1
    const p1Socket = io.sockets.sockets.get(room.players[0].id);
    if (!p1Socket) {
      console.log(`Phát hiện P1 (ID ${room.players[0].id}) reconnect với ID mới ${socket.id}`);
      room.players[0].id = socket.id;
    } 
    // Thử tìm P2 (nếu có P2)
    else if (room.players.length > 1) {
      const p2Socket = io.sockets.sockets.get(room.players[1].id);
      if (!p2Socket) {
        console.log(`Phát hiện P2 (ID ${room.players[1].id}) reconnect với ID mới ${socket.id}`);
        room.players[1].id = socket.id;
      }
    }
  }
  // Thêm socket này vào phòng của Socket.IO
  socket.join(roomId);
  // ==========================

  if (room.status === "rps") {
    startRps(io, room, false);
    return;
  }
  
  if (room.status === "waiting") {
     socket.emit("error", { message: "Đang chờ người chơi khác..." });
     return;
  }

  if (room.status === "playing") {
    const currentState = room.game.getState();
    const currentPlayerSocket = room.players[currentState.currentPlayer - 1];

    const stateData = {
      players: room.players,
      startingPlayerId: room.nextTurnPlayerId,
      nextTurnPlayerId: currentPlayerSocket ? currentPlayerSocket.id : null,
      board: currentState.board,
      scores: currentState.scores,
      debt: currentState.debt,
      roomId: room.id,
      gameMessage: currentState.gameMessage,
    };
    
    socket.emit("update_game_state", stateData);
    timerManager.start(room);
  }
};
// ===============================
//  GẮN TOÀN BỘ SOCKET HANDLER
// ===============================
export function setupSocketHandlers(io) {
  ioInstance = io;
  timerManager = new TurnTimerManager(io, (room, expiredPlayer) => handleTimerExpires(io, room, expiredPlayer));

  io.on("connection", (socket) => {
    console.log("✔ Client connected:", socket.id);

    socket.on("room:create", ({ name }) => {
      handleCreateRoom(socket, name);
    });

    socket.on("room:join", ({ roomId, name }) => {
      handleJoinRoom(io, socket, roomId, name);
    });

    socket.on("room:quickplay", ({ name }) => {
      handleJoinMatchmaking(io, socket, name);
    });

    // Handler Oẳn tù tì (nhận payload là object)
    socket.on("game:submit_rps", (payload) => {
      handleSubmitRps(io, socket, payload);
    });

    // Handler Nước đi (nhận payload là object)
    socket.on("make_move", (payload) => {
      handleMakeMove(io, socket, payload);
    });
    
    // Handler Yêu cầu State (nhận payload là string)
    socket.on("game:request_state", (roomId) => {
      handleRequestGameState(io, socket, roomId);
    });
    
    // Handler Chat (nhận payload là object)
    socket.on("chat:send", (payload) => {
      handleSendMessage(io, socket, payload);
    });

    socket.on("leave_room", () => {
      handleLeaveRoom(io, socket);
    });

    socket.on("disconnect", (reason) => {
      handleDisconnect(io, socket, reason);
    });
  });
}