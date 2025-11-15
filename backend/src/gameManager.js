// src/gameManager.js
// (CẬP NHẬT THEO LOGIC MỚI)

import { generateRoomId } from "./utils.js";
import {
  initializeGameBoard,
  checkAndPerformBorrow,
  performMove,
  checkGameOver,
} from "./oAnQuanLogic.js";

// ---- 1. Quản lý Trạng thái ----
const rooms = new Map();
const matchmakingQueue = [];

const P1_CELLS = [1, 2, 3, 4, 5];
const P2_CELLS = [7, 8, 9, 10, 11];

// ---- 2. Các Hàm Xử lý Sự kiện ----
// (handleCreateRoom, handleJoinRoom giữ nguyên y như file cũ của bạn)
export const handleCreateRoom = (socket, playerName) => {
  const roomId = generateRoomId();
  const player1 = { id: socket.id, name: playerName, symbol: "X" };
  const room = {
    id: roomId,
    players: [player1],
    gameState: initializeGameBoard(), // <-- Gọi hàm MỚI
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
  const player2 = { id: socket.id, name: playerName, symbol: "O" };
  room.players.push(player2);
  room.status = "playing";
  room.nextTurnPlayerId = room.players[0].id; // P1 đi trước
  socket.join(roomId);
  const startData = {
    players: room.players,
    startingPlayerId: room.nextTurnPlayerId,
    board: room.gameState.board, // <-- Gửi board MỚI (array of objects)
    scores: room.gameState.scores, // <-- Gửi score MỚI (object)
    roomId: roomId,
  };
  io.to(roomId).emit("game_start", startData);
};


/**
 * (C -> S) Xử lý một nước đi (Cập nhật theo logic MỚI)
 */
export const handleMakeMove = (io, socket, payload) => {
  const room = findRoomBySocketId(socket.id);
  if (!room) return;

  const { players } = room;
  const { cellIndex, direction } = payload;
  let currentGameState = room.gameState;

  // 1. Xác thực lượt
  if (socket.id !== room.nextTurnPlayerId) {
    return socket.emit("invalid_move", { message: "Không phải lượt của bạn!" });
  }
  
  const playerIndex = players.findIndex((p) => p.id === socket.id);
  const playerSymbol = playerIndex === 0 ? "player1" : "player2";
  const playerCells = playerSymbol === 'player1' ? P1_CELLS : P2_CELLS;

  // 2. Xác thực Nước đi (Luật III.1)
  if (!playerCells.includes(cellIndex)) {
    return socket.emit("invalid_move", { 
      message: "Nước đi không hợp lệ! Bạn chỉ được bốc 5 ô dân của mình." 
    });
  }

  // 3. Xử lý logic "Hết Quân" (Luật VI)
  // (Kiểm tra 5 ô dân không còn Dân VÀ Quan)
  const playerCellsAreEmpty = playerCells.every(
    (index) =>
      currentGameState.board[index].quan === 0 &&
      currentGameState.board[index].dan === 0
  );

  if (playerCellsAreEmpty) {
    // Nếu tất cả 5 ô đều trống, phải thực hiện Luật VI
    const borrowResult = checkAndPerformBorrow(currentGameState, playerSymbol);
      
    if (borrowResult.isLoser) {
      // "Nếu không đủ 5 dân -> thua ngay"
      const winner = players.find(p => p.id !== socket.id);
      io.to(room.id).emit("game_over", {
          winner: winner.id,
          reason: "win_by_borrow_fail",
          finalScores: currentGameState.scores, // Gửi score object
      });
      rooms.delete(room.id);
      return;
    }
    
    // Cập nhật state sau khi vay (rải 5 Dân) thành công
    currentGameState = borrowResult.newState;
    
    io.to(room.id).emit("update_game_state", {
        board: currentGameState.board,
        nextTurnPlayerId: room.nextTurnPlayerId,
        scores: currentGameState.scores,
    });
    
    // Kiểm tra ô vừa click (giờ đã có 1 Dân)
    if (currentGameState.board[cellIndex].dan === 0) {
         return socket.emit("invalid_move", { 
            message: "Bạn phải chọn 1 trong 5 ô dân (giờ đã có 1 quân) để đi." 
         });
    }
    
  } else if (currentGameState.board[cellIndex].quan === 0 && currentGameState.board[cellIndex].dan === 0) {
      // Trường hợp: Bốc 0 quân (ô đã chọn trống)
      // Đây là một nước đi hợp lệ (ăn 0 quân).
  }

  // 4. Giao logic rải/ăn cho "Trọng tài" (Luật IV)
  const moveResult = performMove(currentGameState, { cellIndex, direction });

  // 5. Cập nhật trạng thái game của phòng VÀ cộng điểm
  room.gameState = moveResult.newState;
  // CẬP NHẬT CÁCH TÍNH ĐIỂM
  if (room.gameState.lastCaptured) {
      room.gameState.scores[playerSymbol].quan += room.gameState.lastCaptured.quan;
      room.gameState.scores[playerSymbol].dan += room.gameState.lastCaptured.dan;
      delete room.gameState.lastCaptured; // Xóa điểm tạm
  }

  // 6. Kiểm tra Game Over (Luật VII)
  const gameOverCheck = checkGameOver(room.gameState);
  if (gameOverCheck.isGameOver) {
    room.gameState = gameOverCheck.finalState;

    let winnerId = null;
    if (gameOverCheck.winnerSymbol === 'player1') winnerId = players[0].id;
    else if (gameOverCheck.winnerSymbol === 'player2') winnerId = players[1].id;

    io.to(room.id).emit("game_over", {
      winner: winnerId,
      reason: gameOverCheck.winnerSymbol === 'draw' ? 'draw' : 'win',
      finalScores: room.gameState.scores, // Gửi score object
    });
    
    rooms.delete(room.id);
    return;
  }

  // 7. Chuyển lượt
  if (moveResult.turnOver) {
    const nextPlayer = players.find((p) => p.id !== socket.id);
    room.nextTurnPlayerId = nextPlayer.id;

    io.to(room.id).emit("update_game_state", {
      board: room.gameState.board,
      nextTurnPlayerId: room.nextTurnPlayerId,
      scores: room.gameState.scores,
    });
  }
};


// --- CÁC HÀM KHÁC (giữ nguyên) ---
// (handleLeaveRoom, handleDisconnect, handleSendMessage, findRoomBySocketId, handleJoinMatchmaking)

export const handleLeaveRoom = (io, socket) => {
  const room = findRoomBySocketId(socket.id);
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
  if (!room) return;
  const player = room.players.find((p) => p.id === socket.id);
  io.to(room.id).emit("new_message", {
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
        socket2.emit("queue_update", { message: "Đối thủ đã hủy. Đang tìm lại..." });
      }
      return;
    }
    if (!socket2) {
      matchmakingQueue.unshift(player1Data);
      socket1.emit("queue_update", { message: "Đối thủ đã hủy. Đang tìm lại..." });
      return;
    }

    const roomId = generateRoomId();
    const player1 = { id: player1Data.id, name: player1Data.name, symbol: "X" };
    const player2 = { id: player2Data.id, name: player2Data.name, symbol: "O" };

    const room = {
      id: roomId,
      players: [player1, player2],
      gameState: initializeGameBoard(), // <-- Gọi hàm MỚI
      status: "playing",
      nextTurnPlayerId: player1.id,
    };
    rooms.set(roomId, room);
    socket1.join(roomId);
    socket2.join(roomId);

    const startData = {
      players: room.players,
      startingPlayerId: room.nextTurnPlayerId,
      board: room.gameState.board, // <-- Gửi board MỚI
      scores: room.gameState.scores, // <-- Gửi score MỚI
      roomId: roomId,
    };
    io.to(roomId).emit("game_start", startData);
  }
};