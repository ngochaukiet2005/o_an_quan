// src/gameManager.js
import { generateRoomId } from "./utils.js";
import { OAnQuanGame } from "./OAnQuanGame.js";
import { GameWithHistory } from "./GameWithHistory.js"; // <-- THÊM DÒNG NÀY
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
  const player1 = { id: socket.id, name: playerName, symbol: "X", isDisconnected: false };
  //const game = new OAnQuanGame();
  const game = new GameWithHistory();
  const room = {
    id: roomId,
    players: [player1],
    game: game,
    status: "waiting",
    rpsGame: null,
    nextTurnPlayerId: null,
    disconnectTimeout: null,
    isWaitingForAnimation: false,
    animationTimeout: null,
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

  const player2 = { id: socket.id, name: playerName, symbol: "O", isDisconnected: false };
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
    //const game = new OAnQuanGame();
    const game = new GameWithHistory();
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

    // ===================================================
    // 🔽 BẮT ĐẦU THAY ĐỔI: GỬI KẾT QUẢ RPS TRƯỚC 🔽
    // ===================================================

    const startingPlayer = room.players.find(p => p.id === rpsState.winnerId);
    
    // 1. Tạo payload kết quả
    const rpsResultData = {
      result: rpsState.winner, // 'p1' hoặc 'p2'
      player1Choice: rpsState.choices[room.players[0].id],
      player2Choice: rpsState.choices[room.players[1].id],
      message: `${startingPlayer.name} đi trước!`,
      winnerId: startingPlayer.id, // Thêm cả winnerId
      // === THÊM 2 DÒNG NÀY ===
      player1Id: room.players[0].id,
      player2Id: room.players[1].id,
      // =======================
      winnerId: rpsState.winnerId, // ID người thắng
    };

    // 2. Gửi sự kiện 'rpsResult' mà frontend đang lắng nghe
    io.to(room.id).emit("rpsResult", rpsResultData);
    // Lấy ID người thắng ra biến riêng để dùng trong timeout cho chắc chắn
    const winnerId = rpsState.winnerId;
    // 3. ĐẶT THỜI GIAN CHỜ (cho animation) trước khi bắt đầu game
    setTimeout(() => {
      // Kiểm tra xem phòng còn tồn tại không (phòng hờ người chơi thoát)
      if (!rooms.has(room.id)) {
        console.log(`Phòng ${room.id} đã bị hủy trong khi chờ animation RPS.`);
        return;
      }
      // =========================================================
      // 👇👇👇 LOGIC MỚI: HOÁN ĐỔI VỊ TRÍ P1/P2 DỰA THEO KẾT QUẢ 👇👇👇
      // =========================================================
      const winnerId = rpsState.winnerId;
      
      // Nếu người thắng KHÔNG PHẢI là người đầu tiên (nghĩa là P2 thắng)
      if (room.players[0].id !== winnerId) {
          console.log(`🔀 Hoán đổi: ${room.players[1].name} thắng RPS -> Lên làm Player 1.`);
          
          // 1. Hoán đổi vị trí trong mảng players
          const temp = room.players[0];
          room.players[0] = room.players[1];
          room.players[1] = temp;

          // 2. Cập nhật lại Ký hiệu (Symbol)
          // Người ở index 0 luôn là 'X' (P1), người ở index 1 luôn là 'O' (P2)
          room.players[0].symbol = 'X';
          room.players[1].symbol = 'O';
      }
      // =========================================================
      console.log(`Bắt đầu game cho phòng ${room.id} sau animation.`);

      // 4. Di chuyển logic bắt đầu game vào đây
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
        // Chúng ta không cần gửi rpsResult trong game_start nữa
        // vì nó đã được xử lý ở sự kiện 'rpsResult'
        gameMessage: initialState.gameMessage,
      };
      
      io.to(room.id).emit("game_start", startData);
      room.rpsGame = null;
      timerManager.start(room);

    }, 2000); // Đợi 4 giây (bạn có thể chỉnh 3000-5000ms tùy ý)

    // ===================================================
    // 🔼 KẾT THÚC THAY ĐỔI 🔼
    // ===================================================
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
  console.log(`[GAME] ♟️ Action: Room ${room.id} | Cell: ${cellIndex} | Dir: ${direction}`);
  const game = room.game;
  // Lưu bàn cờ trước khi đi
  const preMoveBoard = JSON.parse(JSON.stringify(game.getState().board));
  const newState = game.makeMove(cellIndex, direction);
  const moveHistory = game.getMoveHistory ? game.getMoveHistory() : [];
  if (moveHistory && moveHistory.length > 0) {
    io.to(room.id).emit("game:perform_animation", moveHistory);
  }
  // <--- THÊM DÒNG NÀY: Lấy lịch sử nước đi
  //const moveHistory = game.getMoveHistory();
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
      // <--- THÊM DÒNG NÀY: Để client diễn hoạt nốt nước đi cuối cùng
      lastMoveHistory: moveHistory
    });

    timerManager.clear(room);
    rooms.delete(room.id);
    return;
  }

  const nextPlayer = room.players[newState.currentPlayer - 1];
  // Đánh dấu là phòng này đang chờ diễn hoạt xong mới đếm giờ
  room.isWaitingForAnimation = true;
  // 👇👇👇 [CẬP NHẬT] THÊM startTime VÀO replayData 👇👇👇
  room.replayData = {
      prevBoard: preMoveBoard,
      moveHistory: moveHistory,
      startTime: Date.now() // Lưu thời điểm bắt đầu nước đi
  };
  // 👆👆👆 ---------------------------------------- 👆👆👆
  io.to(room.id).emit("update_game_state", {
    board: newState.board,
    nextTurnPlayerId: nextPlayer.id,
    scores: newState.scores,
    debt: newState.debt,
    gameMessage: newState.gameMessage,
    // <--- THÊM DÒNG NÀY: Gửi kèm kịch bản diễn hoạt
    moveHistory: moveHistory
  });
  if (room.animationTimeout) clearTimeout(room.animationTimeout);
  // Tính thời gian chờ: Mỗi bước đi khoảng 1s + 3s đệm. Tối đa chờ 25s.
  const estimatedDuration = Math.min((moveHistory.length * 5000) + 5000, 300000);
  console.log(`[ANIMATION] ⏳ Waiting ${estimatedDuration}ms for client animation...`);
  room.animationTimeout = setTimeout(() => {
      if (room.isWaitingForAnimation) {
          console.log(`⏳ Animation timeout (auto-start) cho phòng ${room.id}`);
          // Gửi lại state mới nhất ép buộc client đồng bộ (trường hợp client bị kẹt)
          const currentState = room.game.getState();
          io.to(room.id).emit("update_game_state", {
              players: room.players,
              startingPlayerId: room.nextTurnPlayerId,
              nextTurnPlayerId: nextPlayer.id, // Đảm bảo ID người chơi tiếp theo đúng
              board: currentState.board,
              scores: currentState.scores,
              debt: currentState.debt,
              roomId: room.id,
              gameMessage: currentState.gameMessage,
              isWaitingForAnimation: false, // Mở khóa
              moveHistory: [], // Không diễn lại
          });
          startTurnTimer(room); 
      }
  }, estimatedDuration); // 15 giây cho animation là khá dư dả
}
// 2️⃣ THÊM HÀM HỖ TRỢ startTurnTimer
function startTurnTimer(room) {
    room.isWaitingForAnimation = false;
    if (room.animationTimeout) clearTimeout(room.animationTimeout);
    timerManager.start(room); // Lúc này mới thực sự bắt đầu đếm 30s
}
// 3️⃣ THÊM HÀM XỬ LÝ SỰ KIỆN MỚI
// backend/src/gameManager.js

// backend/src/gameManager.js

export const handleAnimationFinished = (io, socket, roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    // Chỉ xử lý nếu server thực sự đang ở trạng thái chờ diễn hoạt
    if (room.isWaitingForAnimation) {
        // Kiểm tra: Người gửi tín hiệu có phải là thành viên trong phòng không?
        // (Không quan trọng là P1 hay P2, hay ai đang cầm lượt, 
        // chỉ cần 1 người báo xong là tính cho cả phòng xong để tránh Deadlock)
        const isMember = room.players.some(p => p.id === socket.id);

        if (isMember) {
            console.log(`[ANIMATION] ✅ Finished signal from ${socket.id}. Unlocking board.`);
            // === 👇 BỔ SUNG QUAN TRỌNG 👇 ===
            // Gửi lại state mới nhất cho cả phòng để cập nhật ID người chơi (nếu có người vừa F5)
            const currentState = room.game.getState();
            const currentPlayerSocket = room.players[currentState.currentPlayer - 1];

            io.to(room.id).emit("update_game_state", {
              players: room.players, // <-- Cập nhật danh sách player (chứa ID mới) cho đối thủ
              startingPlayerId: room.nextTurnPlayerId,
              nextTurnPlayerId: currentPlayerSocket ? currentPlayerSocket.id : null,
              board: currentState.board,
              scores: currentState.scores,
              debt: currentState.debt,
              roomId: room.id,
              gameMessage: currentState.gameMessage,
              isWaitingForAnimation: false, // Đánh dấu đã xong animation
              moveHistory: [], // Không gửi lịch sử để tránh diễn lại
            });
            // === 👆 KẾT THÚC BỔ SUNG 👆 ===
            // Hàm này sẽ set isWaitingForAnimation = false và emit 'timer:start'
            // Khi Client F5 nhận 'timer:start', nó sẽ tự động set isServerWaiting = false và cho chọn ô.
            startTurnTimer(room);
        }
    }
};
/**
 * (C -> S) Xử lý một nước đi
 */
/**
 * (C -> S) Xử lý một nước đi
 */
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
    timerManager.start(room); 
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

  // --- [ĐÃ XÓA] Đoạn code phát sự kiện 'game:perform_animation' ở đây ---
  // Chúng ta không cần nó nữa vì 'moveHistory' trong 'update_game_state'
  // sẽ đảm nhiệm việc diễn hoạt chính xác hơn.

  performMove(io, room, cellIndex, moveDirection);
};

// --- CÁC HÀM KHÁC ---

export const handleLeaveRoom = (io, socket) => {
  const room = findRoomBySocketId(socket.id);
  if (!room) return;
  
  timerManager.clear(room);
  // Xóa timeout reconnect nếu có (vì người chơi chủ động rời đi)
  if (room.disconnectTimeout) clearTimeout(room.disconnectTimeout);

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
}; // <--- QUAN TRỌNG: Phải có dấu đóng hàm này thì hàm dưới mới chạy được

export const handleDisconnect = (io, socket, reason) => {
  console.log(`[CONN] 🔌 Disconnect: ${socket.id} | Reason: ${reason}`);
  const queueIndex = matchmakingQueue.findIndex((p) => p.id === socket.id);
  if (queueIndex > -1) {
    matchmakingQueue.splice(queueIndex, 1);
  }
  
  const room = findRoomBySocketId(socket.id);
  if (!room) return;
  // 1. Đánh dấu người chơi offline
  const player = room.players.find(p => p.id === socket.id);
  if (player) {
      player.isDisconnected = true;
  }
  timerManager.clear(room);
  // 3. Reset timeout cũ nếu có
  if (room.disconnectTimeout) {
      clearTimeout(room.disconnectTimeout);
  }
  console.log(`⚠️ Socket ${socket.id} mất kết nối. Giữ phòng trong 20s...`);
  // 4. Thiết lập chờ 20s trước khi thực sự xóa phòng
  room.disconnectTimeout = setTimeout(() => {
      if (!rooms.has(room.id)) return;

      // Kiểm tra lại lần cuối xem người chơi còn mất kết nối không
      const stillDisconnected = room.players.find(p => p.isDisconnected === true);
      
      if (stillDisconnected) {
          console.log(`❌ Timeout reconnect. Hủy phòng ${room.id}`);
          const otherPlayer = room.players.find(p => !p.isDisconnected);
          if (otherPlayer) {
            const otherSocket = io.sockets.sockets.get(otherPlayer.id);
            if (otherSocket) {
              otherSocket.emit("kicked_to_menu", {
                message: "Đối thủ đã ngắt kết nối quá lâu. Bạn thắng!",
              });
            }
          }
          rooms.delete(room.id);
      }
  }, 20000); // 20 giây
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

export const handleRequestGameState = async (io, socket, roomId) => {
  console.log(`[STATE] 📥 Request State from ${socket.id} for Room ${roomId}`);
  const room = rooms.get(roomId);
  if (!room) {
    return socket.emit("error", { message: "Không tìm thấy phòng." });
  }

  // 1. Client đã quay lại -> Hủy lệnh xóa phòng ngay lập tức
  if (room.disconnectTimeout) {
      console.log(`♻️ Client quay lại phòng ${roomId}. Hủy lệnh xóa.`);
      clearTimeout(room.disconnectTimeout);
      room.disconnectTimeout = null;
  }
  // === 💡 SỬA LỖI RECONNECT 💡 ===
  // Cập nhật socket.id mới cho người chơi nếu họ reconnect
  const playerIndex = room.players.findIndex(p => p.id === socket.id);
  if (playerIndex === -1) { 
    const disconnectedPlayer = room.players.find(p => p.isDisconnected);
    if (disconnectedPlayer) {
      console.log(`🔌 Khôi phục kết nối: ${disconnectedPlayer.name} (${disconnectedPlayer.id} -> ${socket.id})`);
      disconnectedPlayer.id = socket.id; // Cập nhật ID mới
      disconnectedPlayer.isDisconnected = false; // Đánh dấu online
    } else {
    // Nếu không tìm thấy, đây là một reconnect
    // Chúng ta cần tìm xem họ là P1 hay P2
    // Giải pháp đơn giản: giả định người chơi đầu tiên không khớp là họ
    // (Điều này có thể không an toàn nếu cả 2 cùng reconnect, nhưng hiếm)
    
    // Thử tìm P1
      const p1Socket = io.sockets.sockets.get(room.players[0].id);
      if (!p1Socket && room.players.length > 0) {
        room.players[0].id = socket.id;
      } else if (room.players.length > 1) {
        const p2Socket = io.sockets.sockets.get(room.players[1].id);
        if (!p2Socket) room.players[1].id = socket.id;
      }
    }
  }
  // Thêm socket này vào phòng của Socket.IO
  await socket.join(roomId);
  // ==========================

  if (room.status === "rps") {
    socket.emit("game:start_rps", { isRetry: false });
    startRps(io, room, false);
    return;
  }
  
  // 👇👇👇 SỬA ĐOẠN NÀY 👇👇👇
  if (room.status === "waiting") {
     // KHÔNG gửi lỗi "Đang chờ..." nữa vì nó sẽ làm hiện Popup Lỗi
     // Thay vào đó, gửi lại sự kiện 'room:joined' để cập nhật danh sách người chơi cho chắc chắn
     socket.emit("room:joined", {
        roomId: room.id,
        playerId: socket.id, // Đảm bảo gửi đúng ID (có thể là ID mới nếu reconnect)
        playerSymbol: room.players.find(p => p.id === socket.id)?.symbol || "X",
        players: room.players, 
     });
     return;
  }
  // 👆👆👆 KẾT THÚC SỬA 👆👆👆

  if (room.status === "playing") {
    const currentState = room.game.getState();
    const currentPlayerSocket = room.players[currentState.currentPlayer - 1];
    // 👇👇👇 [SỬA ĐOẠN NÀY: Logic gửi dữ liệu Replay] 👇👇👇
    let boardToSend = currentState.board;
    let historyToSend = [];

    // Nếu đang chờ animation, ta vẫn gửi board hiện tại (kết quả) và KHÔNG gửi history
    // Để client hiển thị kết quả tĩnh và chờ đối thủ xem xong.
    if (room.isWaitingForAnimation && room.replayData) {
         boardToSend = currentState.board; // Gửi bàn cờ hiện tại (đã xong)
         historyToSend = [];               // Không gửi lịch sử đi nữa
    }
    const stateData = {
      players: room.players,
      startingPlayerId: room.nextTurnPlayerId,
      nextTurnPlayerId: currentPlayerSocket ? currentPlayerSocket.id : null,
      board: currentState.board,
      scores: currentState.scores,
      debt: currentState.debt,
      roomId: room.id,
      gameMessage: currentState.gameMessage,
      isWaitingForAnimation: room.isWaitingForAnimation || false,
    };
    socket.emit("update_game_state", stateData);
    if (!room.isWaitingForAnimation) {
      timerManager.start(room);
    }
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

    // 👇👇👇 THÊM SỰ KIỆN NÀY 👇👇👇
    socket.on("game:animation_finished", (roomId) => {
        handleAnimationFinished(io, socket, roomId);
    });
    // 👆👆👆 -------------------- 👆👆👆

    socket.on("disconnect", (reason) => {
      handleDisconnect(io, socket, reason);
    });
  });
}