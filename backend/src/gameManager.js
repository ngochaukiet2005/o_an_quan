// src/gameManager.js
import { generateRoomId } from "./utils.js";
import { OAnQuanGame } from "./OAnQuanGame.js";
import { RpsGame } from "./RpsGame.js"; // <-- IMPORT RPS MỚI
import { TurnTimerManager } from "./turnTimer.js"; // <-- IMPORT TIMER MỚI

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
    status: "waiting", // Chờ P2
    rpsGame: null, // Sẽ được tạo khi P2 vào
    nextTurnPlayerId: null, // Sẽ được quyết định bởi RPS
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
      rpsGame: null, // Sẽ được tạo ngay
      nextTurnPlayerId: null,
    };
    rooms.set(roomId, room);
    socket1.join(roomId);
    socket2.join(roomId);

    // Bắt đầu Oẳn tù tì
    startRps(io, room);
  }
};

/**
 * Bắt đầu hoặc khởi động lại Oẳn tù tì
 */
function startRps(io, room, isRetry = false) {
  room.status = "rps";
  // Tạo hoặc reset instance RpsGame
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
export const handleSubmitRps = (io, socket, choice) => {
  const room = findRoomBySocketId(socket.id);
  if (!room || !room.rpsGame || room.status !== "rps") return;

  // Giao phó logic cho RpsGame
  const rpsState = room.rpsGame.makeChoice(socket.id, choice);

  // Chỉ hành động khi đã hoàn thành (cả 2 đã chọn)
  if (rpsState.status === "complete") {
    if (rpsState.winner === "draw") {
      // Nếu hòa, chơi lại
      startRps(io, room, true);
      return;
    }

    // Nếu có người thắng, bắt đầu game
    const startingPlayer = room.players.find(p => p.id === rpsState.winnerId);
    room.status = "playing";
    room.nextTurnPlayerId = startingPlayer.id; // Đặt người đi trước

    // Cập nhật state của game Ô Ăn Quan
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
      // Gửi kết quả Oẳn tù tì để client hiển thị
      rpsResult: {
        p1Choice: rpsState.choices[room.players[0].id],
        p2Choice: rpsState.choices[room.players[1].id],
        winnerId: startingPlayer.id,
      },
      gameMessage: initialState.gameMessage,
    };
    
    io.to(room.id).emit("game_start", startData);
    
    // Dọn dẹp RpsGame
    room.rpsGame = null; 
    
    // Bắt đầu timer cho lượt đầu tiên
    timerManager.start(room);
  }
};

/**
 * (Callback) Khi timer hết hạn
 */
function handleTimerExpires(room, expiredPlayer) {
  // Kiểm tra phòng còn tồn tại không
  if (!rooms.has(room.id) || !ioInstance) return;

  const gameInstance = room.game;
  
  // Kiểm tra xem có đúng lượt của người chơi đó không
  if (gameInstance.getState().currentPlayer !== expiredPlayer) {
    console.log("Timer hết hạn nhưng lượt đã thay đổi. Bỏ qua.");
    return;
  }

  console.log(`Thực hiện nước đi ngẫu nhiên cho P${expiredPlayer}`);
  
  // Logic vay tự động
  gameInstance.checkAndHandleBorrowing(expiredPlayer);

  // Lấy các nước đi hợp lệ SAU KHI có thể đã vay
  const validIndices = gameInstance.getValidMoveIndices(expiredPlayer);

  if (validIndices.length > 0) {
    const randomIndex = validIndices[Math.floor(Math.random() * validIndices.length)];
    const randomDirection = Math.random() < 0.5 ? 1 : -1; // 1: phải, -1: trái
    performMove(ioInstance, room, randomIndex, randomDirection);
  } else {
    // Nếu vẫn không có nước đi nào (không thể vay) -> thua
    // Gọi performMove với ô không hợp lệ (ví dụ ô 0) để kích hoạt logic thua
    performMove(ioInstance, room, 0, 1);
  }
}

/**
 * (Logic chung) Thực hiện nước đi
 */
function performMove(io, room, cellIndex, direction) {
  const game = room.game;

  // Kiểm tra nước đi có hợp lệ không (dùng cho random move)
  // Logic vay/thua đã được xử lý trong `handleTimerExpires`
  const playerNumber = game.getState().currentPlayer;
  if (!game.isValidMove(cellIndex, playerNumber)) {
     // Nếu nước đi không hợp lệ (ví dụ: bốc ô 0 do hết cách vay)
     // thì .makeMove() sẽ tự xử lý việc xử thua.
  }

  const newState = game.makeMove(cellIndex, direction);
  
  // 2. Kiểm tra Game Over
  if (newState.isGameOver) {
    let winnerId = null;
    if (newState.winner === 1) winnerId = room.players[0].id;
    else if (newState.winner === 2) winnerId = room.players[1].id;

    const finalP1 = newState.scores.player1;
    const finalP2 = newState.scores.player2;
    const totalP1 = finalP1.quan * 5 + finalP1.dan;
    const totalP2 = finalP1.quan * 5 + finalP2.dan; // <-- SỬA LỖI NHỎ: Đáng lẽ là finalP2

    io.to(room.id).emit("game_over", {
      winner: winnerId,
      reason: newState.winner === 0 ? "draw" : "win",
      finalScores: { player1: totalP1, player2: totalP2 },
      gameMessage: newState.gameMessage,
    });

    timerManager.clear(room); // Dọn dẹp timer
    rooms.delete(room.id);
    return;
  }

  // 3. Cập nhật trạng thái
  const nextPlayer = room.players[newState.currentPlayer - 1];
  io.to(room.id).emit("update_game_state", {
    board: newState.board,
    nextTurnPlayerId: nextPlayer.id,
    scores: newState.scores,
    debt: newState.debt,
    gameMessage: newState.gameMessage,
  });

  // 4. Bắt đầu timer cho người chơi tiếp theo
  timerManager.start(room);
}

/**
 * (C -> S) Xử lý một nước đi
 */
export const handleMakeMove = (io, socket, payload) => {
  const room = findRoomBySocketId(socket.id);
  if (!room) return;

  // Dừng timer ngay khi nhận được nước đi
  timerManager.clear(room);

  const game = room.game;
  if (!game) return;

  const { cellIndex, direction } = payload;
  const moveDirection = direction === "right" ? 1 : -1;

  // 1. Xác thực người chơi
  const playerIndex = room.players.findIndex((p) => p.id === socket.id);
  const playerNumber = playerIndex === 0 ? 1 : 2; 
  const currentState = game.getState();

  if (currentState.currentPlayer !== playerNumber) {
    return socket.emit("invalid_move", { message: "Không phải lượt của bạn!" });
  }

  // 2. Thực hiện nước đi
  performMove(io, room, cellIndex, moveDirection);
};

// --- CÁC HÀM KHÁC (thêm dọn dẹp timer) ---

export const handleLeaveRoom = (io, socket) => {
  const room = findRoomBySocketId(socket.id);
  if (!room) return;
  
  timerManager.clear(room); // <-- DỌN DẸP TIMER

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
  
  timerManager.clear(room); // <-- DỌN DẸP TIMER
  
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
  if (!room) return;
  const player = room.players.find((p) => p.id === socket.id);
  io.to(room.id).emit("chat:receive", {
    senderName: player ? player.name : "Người xem",
    message: payload.message,
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

export const handleRequestGameState = (io, socket) => {
  const room = findRoomBySocketId(socket.id); 
  if (!room || !room.game) {
    return socket.emit("error", { message: "Không tìm thấy phòng." });
  }

  // Nếu game đang oẳn tù tì, báo client vào oẳn tù tì
  if (room.status === "rps") {
    startRps(io, room, false);
    return;
  }
  
  // Nếu game đang chờ, không làm gì
  if (room.status === "waiting") {
     socket.emit("error", { message: "Đang chờ người chơi khác..." });
     return;
  }

  // Nếu game đang chơi, gửi state
  if (room.status === "playing") {
    const currentState = room.game.getState();
    const currentPlayerSocket = room.players[currentState.currentPlayer - 1];

    const stateData = {
      players: room.players,
      startingPlayerId: room.nextTurnPlayerId, // Gửi người bắt đầu ban đầu
      nextTurnPlayerId: currentPlayerSocket ? currentPlayerSocket.id : null,
      board: currentState.board,
      scores: currentState.scores,
      debt: currentState.debt,
      roomId: room.id,
      gameMessage: currentState.gameMessage,
    };
    
    socket.emit("update_game_state", stateData);
    
    // Khởi động lại timer cho client này
    timerManager.start(room);
  }
};
// ===============================
//  GẮN TOÀN BỘ SOCKET HANDLER
// ===============================
export function setupSocketHandlers(io) {
  ioInstance = io;
  // Khởi tạo TurnTimerManager MỘT LẦN và truyền callback
  timerManager = new TurnTimerManager(io, handleTimerExpires);

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

    // Handler Oẳn tù tì
    socket.on("game:submit_rps", (choice) => {
      handleSubmitRps(io, socket, choice);
    });

    socket.on("make_move", (payload) => {
      handleMakeMove(io, socket, payload);
    });
    
    socket.on("game:request_state", () => {
      handleRequestGameState(io, socket);
    });
    
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