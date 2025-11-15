// backend/src/oAnQuanLogic.js
// (PHIÊN BẢN MỚI HOÀN TOÀN - "QUAN LÀ QUAN, DÂN LÀ DÂN")

// ---- 1. Hằng số & Cấu hình Luật chơi ----
const P1_QUAN_INDEX = 0;
const P2_QUAN_INDEX = 6;
const P1_CELLS = [1, 2, 3, 4, 5];
const P2_CELLS = [7, 8, 9, 10, 11];
// const QUAN_VALUE = 5; // KHÔNG DÙNG NỮA
const BORROW_AMOUNT = 5; // Vay 5 Dân

// ---- 2. Logic Di chuyển "Chữ U" (Đã xác nhận) ----
const MAP_DIRECTION_LEFT = {
  0: 7, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4,
  6: 5, 7: 8, 8: 9, 9: 10, 10: 11, 11: 6
};
const MAP_DIRECTION_RIGHT = {
  0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6,
  6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 0
};

const getNextCellIndex = (currentIndex, direction) => {
  return direction === 'left'
    ? MAP_DIRECTION_LEFT[currentIndex]
    : MAP_DIRECTION_RIGHT[currentIndex];
};

// ---- 3. Các Hàm Logic Thuần Tuý ----

/**
 * Khởi tạo bàn cờ mới
 * (Sử dụng cấu trúc dữ liệu Object MỚI)
 */
export const initializeGameBoard = () => {
  const board = [];
  for (let i = 0; i < 12; i++) {
    if (i === P1_QUAN_INDEX || i === P2_QUAN_INDEX) {
      board.push({ quan: 1, dan: 0 }); // Ô Quan
    } else {
      board.push({ quan: 0, dan: 5 }); // Ô Dân
    }
  }

  return {
    board: board,
    scores: {
      player1: { quan: 0, dan: 0 },
      player2: { quan: 0, dan: 0 }
    },
  };
};

/**
 * Xử lý "Vay Quân" (Luật VI)
 * (Sử dụng cấu trúc dữ liệu MỚI - Chỉ vay Dân)
 */
export const checkAndPerformBorrow = (gameState, playerSymbol) => {
  const newGameState = JSON.parse(JSON.stringify(gameState));
  
  // "Nếu không đủ 5 dân để gây giống -> thua ngay"
  if (newGameState.scores[playerSymbol].dan < BORROW_AMOUNT) {
    return {
      newState: newGameState,
      error: 'Không đủ 5 Dân để vay!',
      isLoser: true,
    };
  }

  // "bỏ ra 5 dân nhỏ... Mỗi ô dân đặt lại 1 quân"
  newGameState.scores[playerSymbol].dan -= BORROW_AMOUNT;
  const playerCells = playerSymbol === 'player1' ? P1_CELLS : P2_CELLS;
  playerCells.forEach((index) => {
    newGameState.board[index].dan = 1; // Chỉ thêm Dân
  });

  return { newState: newGameState, error: null, isLoser: false };
};

/**
 * Hàm "Trọng tài" chính
 * (VIẾT LẠI HOÀN TOÀN - Rải Quan trước, Dân sau)
 */
export const performMove = (gameState, move) => {
  const { cellIndex, direction } = move;
  const newGameState = JSON.parse(JSON.stringify(gameState));

  // Bước 1: Bốc quân (Bốc cả Quan và Dân)
  let pickedUpQuan = newGameState.board[cellIndex].quan;
  let pickedUpDan = newGameState.board[cellIndex].dan;
  newGameState.board[cellIndex].quan = 0;
  newGameState.board[cellIndex].dan = 0;
  
  let currentIndex = cellIndex;
  let totalStonesToSow = pickedUpQuan + pickedUpDan;

  while (true) {
    // --- Gieo quân (Theo luật MỚI: Rải Quan trước, Dân sau) ---
    // 1. Rải Quan
    while (pickedUpQuan > 0) {
      currentIndex = getNextCellIndex(currentIndex, direction);
      newGameState.board[currentIndex].quan++; // Rải 1 Quan
      pickedUpQuan--;
      totalStonesToSow--; // Giảm tổng
    }
    // 2. Rải Dân
    while (pickedUpDan > 0) {
      currentIndex = getNextCellIndex(currentIndex, direction);
      newGameState.board[currentIndex].dan++; // Rải 1 Dân
      pickedUpDan--;
      totalStonesToSow--; // Giảm tổng
    }

    // --- Xử lý khi rải xong (Mục V & VI) ---
    const nextIndex = getNextCellIndex(currentIndex, direction);
    const nextCell = newGameState.board[nextIndex];
    const nextCellIsEmpty = nextCell.quan === 0 && nextCell.dan === 0;

    // --- Trường hợp 1: (Mục V.1 & VI-TH1) -> BỐC TIẾP ---
    // "Ô Kế Tiếp Có Quân -> Bốc Tiếp"
    if (!nextCellIsEmpty) {
      pickedUpQuan = nextCell.quan; // Bốc Quan
      pickedUpDan = nextCell.dan; // Bốc Dân
      totalStonesToSow = pickedUpQuan + pickedUpDan;
      newGameState.board[nextIndex].quan = 0;
      newGameState.board[nextIndex].dan = 0;
      
      currentIndex = nextIndex;
      continue; // Quay lại đầu vòng lặp `while(true)` để rải tiếp
    }

    // Nếu code chạy đến đây, nghĩa là nextCellIsEmpty === true
    // (Ô kế tiếp TRỐNG)

    // --- Trường hợp 2: (Mục V.2 & VI-TH2) -> ĂN ---
    // "Ô Kế Tiếp Trống, Ô Sau Có Quân -> Ăn"
    const captureIndex = getNextCellIndex(nextIndex, direction);
    const captureCell = newGameState.board[captureIndex];
    const captureCellIsEmpty = captureCell.quan === 0 && captureCell.dan === 0;

    if (!captureCellIsEmpty) {
      let totalCapturedQuan = 0;
      let totalCapturedDan = 0;
      let currentCaptureIndex = captureIndex;

      // Bắt đầu "Ăn Dây"
      while (true) {
        const cellToCapture = newGameState.board[currentCaptureIndex];
        if (cellToCapture.quan === 0 && cellToCapture.dan === 0) break; // Dừng nếu gặp ô trống

        // "ăn toàn bộ quân trong ô sau" (Ăn cả Quan và Dân)
        totalCapturedQuan += cellToCapture.quan;
        totalCapturedDan += cellToCapture.dan;
        cellToCapture.quan = 0;
        cellToCapture.dan = 0;

        // "Xét tiếp ô phía sau đó nữa"
        const nextEmptyIndex = getNextCellIndex(currentCaptureIndex, direction);
        const nextCaptureIndex = getNextCellIndex(nextEmptyIndex, direction);
        
        const nextEmptyCell = newGameState.board[nextEmptyIndex];
        const nextCaptureCell = newGameState.board[nextCaptureIndex];

        // "Nếu lại gặp trường hợp (trống - có quân) -> tiếp tục ăn"
        if (
          (nextEmptyCell.quan === 0 && nextEmptyCell.dan === 0) &&
          (nextCaptureCell.quan > 0 || nextCaptureCell.dan > 0)
        ) {
          currentCaptureIndex = nextCaptureIndex;
        } else {
          break; // Hết thể ăn dây
        }
      }
      
      // Ghi lại số quân ăn được
      newGameState.lastCaptured = {
        quan: totalCapturedQuan,
        dan: totalCapturedDan
      };
    }
    
    // --- Trường hợp 3: (Mục V.3 & VI-TH3) -> DỪNG ---
    // "Ô Kế Trống và Ô Sau Cũng Trống -> Dừng Lượt"
    break; // "Lượt của bạn kết thúc ngay"
  }

  return { newState: newGameState, turnOver: true };
};

/**
 * Kiểm tra Game Over
 * (Kiểm tra 2 Ô Quan không còn QUAN LỚN)
 */
export const checkGameOver = (gameState) => {
  // "Hai ô Quan đã bị ăn hết" (nghĩa là mất Quan Lớn)
  if (
    gameState.board[P1_QUAN_INDEX].quan === 0 &&
    gameState.board[P2_QUAN_INDEX].quan === 0
  ) {
    let finalState = JSON.parse(JSON.stringify(gameState));

    // "thu toàn bộ quân còn lại trong lãnh địa của mình"
    // (Thu cả Quan (nếu có) và Dân)
    P1_CELLS.forEach((index) => {
      finalState.scores.player1.quan += finalState.board[index].quan;
      finalState.scores.player1.dan += finalState.board[index].dan;
      finalState.board[index] = { quan: 0, dan: 0 };
    });
    P2_CELLS.forEach((index) => {
      finalState.scores.player2.quan += finalState.board[index].quan;
      finalState.scores.player2.dan += finalState.board[index].dan;
      finalState.board[index] = { quan: 0, dan: 0 };
    });
    
    // Thu nốt Dân còn sót lại trong 2 ô Quan
    finalState.scores.player1.dan += finalState.board[P1_QUAN_INDEX].dan;
    finalState.scores.player2.dan += finalState.board[P2_QUAN_INDEX].dan;
    finalState.board[P1_QUAN_INDEX].dan = 0;
    finalState.board[P2_QUAN_INDEX].dan = 0;

    // Tính điểm cuối cùng
    const p1TotalScore = (finalState.scores.player1.quan * 5) + finalState.scores.player1.dan;
    const p2TotalScore = (finalState.scores.player2.quan * 5) + finalState.scores.player2.dan;
    
    let winnerSymbol = 'draw';
    if (p1TotalScore > p2TotalScore) {
      winnerSymbol = 'player1';
    } else if (p2TotalScore > p1TotalScore) {
      winnerSymbol = 'player2';
    }

    return { isGameOver: true, finalState, winnerSymbol };
  }

  return { isGameOver: false };
};