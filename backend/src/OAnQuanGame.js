// OAnQuanGame.js
// Logic Ô Ăn Quan theo bộ luật FINAL v4 của bạn

export class OAnQuanGame {
  constructor() {
    this.state = this.getInitialState();
  }

  // =========================
  // 1. KHỞI TẠO & TRUY CẬP
  // =========================

  getInitialState() {
    const initialBoard = [
      { dan: 0, quan: 1 }, // 0: Quan P2
      { dan: 5, quan: 0 }, // 1: Dân P1
      { dan: 5, quan: 0 }, // 2
      { dan: 5, quan: 0 }, // 3
      { dan: 5, quan: 0 }, // 4
      { dan: 5, quan: 0 }, // 5
      { dan: 0, quan: 1 }, // 6: Quan P1
      { dan: 5, quan: 0 }, // 7: Dân P2
      { dan: 5, quan: 0 }, // 8
      { dan: 5, quan: 0 }, // 9
      { dan: 5, quan: 0 }, // 10
      { dan: 5, quan: 0 }, // 11
    ];

    return {
      board: initialBoard,
      scores: {
        player1: { dan: 0, quan: 0 }, // kho dân / quan đã ăn được
        player2: { dan: 0, quan: 0 },
      },
      debt: {
        player1: 0,
        player2: 0,
      },
      currentPlayer: 1, // 1 hoặc 2
      isGameOver: false,
      winner: null, // 1, 2, 0 (hòa) hoặc null
      gameMessage: "Ván đấu bắt đầu. Lượt của Người chơi 1.",
    };
  }

  getState() {
    // Trả về bản copy để tránh sửa trực tiếp từ bên ngoài
    return JSON.parse(JSON.stringify(this.state));
  }

  // =========================
  // 2. HÀM HỖ TRỢ CƠ BẢN
  // =========================

  getValidIndex(index) {
    return (index + 12) % 12;
  }

  getOpponent(player) {
    return player === 1 ? 2 : 1;
  }

  getPlayerScoreKey(player) {
    return player === 1 ? "player1" : "player2";
  }

  getPlayerCivilianSquares(player) {
    // P1: 1–5, P2: 7–11
    return player === 1 ? [1, 2, 3, 4, 5] : [7, 8, 9, 10, 11];
  }

  isPlayerCivilianSquare(index, player) {
    if (index === 0 || index === 6) return false;
    return player === 1 ? (index >= 1 && index <= 5) : (index >= 7 && index <= 11);
  }

  // =========================
  // 3. KIỂM TRA NƯỚC ĐI HỢP LỆ
  // =========================

  isValidMove(squareIndex, player) {
    // Sai lượt
    if (player !== this.state.currentPlayer) {
      return false;
    }

    // Phải là ô dân của phe mình
    if (!this.isPlayerCivilianSquare(squareIndex, player)) {
      return false;
    }

    const square = this.state.board[squareIndex];

    // Luật bốc: ô phải có dân và KHÔNG có quan
    if (!(square.dan > 0 && square.quan === 0)) {
      return false;
    }

    return true;
  }

  // =========================
  // 4. VAY DÂN (GÂY GIỐNG)
  // =========================

  /**
   * Kiểm tra 5 ô dân phía mình có trống hết không.
   * Nếu trống hết -> xử lý gây giống / vay / thua.
   * Trả về true nếu người chơi bị xử thua (game over) do không vay được.
   */
  checkAndHandleBorrowing(player) {
    const civilIndices = this.getPlayerCivilianSquares(player);
    const allEmpty = civilIndices.every((i) => {
      const sq = this.state.board[i];
      return sq.dan === 0 && sq.quan === 0;
    });

    if (!allEmpty) return false; // còn dân, không cần vay

    const playerKey = this.getPlayerScoreKey(player);
    const oppKey = this.getPlayerScoreKey(this.getOpponent(player));

    let playerDan = this.state.scores[playerKey].dan;
    let oppDan = this.state.scores[oppKey].dan;

    // TH1: đủ >= 5 dân trong kho -> lấy 5 dân chia đều, điểm -5
    if (playerDan >= 5) {
      this.state.scores[playerKey].dan -= 5;
      civilIndices.forEach((i) => {
        this.state.board[i].dan = 1;
        this.state.board[i].quan = 0;
      });
      this.state.gameMessage = `Người chơi ${player} gây giống bằng 5 Dân của mình (bị trừ 5 điểm Dân).`;
      return false;
    }

    // TH2: thiếu dân -> vay đối thủ
    const need = 5 - playerDan;

    if (oppDan < need) {
      // Đối thủ không đủ cho vay -> thua ngay
      this.state.isGameOver = true;
      this.state.winner = this.getOpponent(player);
      this.state.gameMessage = `Người chơi ${player} không đủ Dân và đối thủ không đủ cho vay => bị xử thua.`;
      // Tính điểm cuối theo trạng thái hiện tại
      this.calculateFinalScores();
      return true;
    }

    // Vay được
    // Điểm mình +need, đối thủ -need (thực chất là dịch chuyển Dân trong kho)
    this.state.scores[oppKey].dan -= need;
    this.state.scores[playerKey].dan += need;
    this.state.debt[playerKey] += need;

    // Sau khi vay xong, mình có đúng 5 Dân -> dùng 5 Dân để gây giống (bị -5)
    this.state.scores[playerKey].dan -= 5;

    civilIndices.forEach((i) => {
      this.state.board[i].dan = 1;
      this.state.board[i].quan = 0;
    });

    this.state.gameMessage = `Người chơi ${player} vay ${need} Dân từ đối thủ để gây giống (ghi nợ ${need} Dân).`;
    return false;
  }

  // =========================
  // 5. HÀM RẢI & ĂN
  // =========================

  /**
   * Rải pieceCount DÂN từ startIndex theo hướng direction (+1 / -1).
   * Trả về index ô cuối cùng rải dân.
   */
  spreadPieces(startIndex, direction, pieceCount) {
    let currentIndex = startIndex;
    for (let i = 0; i < pieceCount; i++) {
      currentIndex = this.getValidIndex(currentIndex + direction);
      this.state.board[currentIndex].dan += 1;
    }
    return currentIndex;
  }

  /**
   * Ăn toàn bộ quân tại index (Dân + Quan) vào kho player.
   */
  captureAt(index, player) {
    const sq = this.state.board[index];
    const eatenDan = sq.dan;
    const eatenQuan = sq.quan;

    this.state.board[index] = { dan: 0, quan: 0 };

    const key = this.getPlayerScoreKey(player);
    this.state.scores[key].dan += eatenDan;
    this.state.scores[key].quan += eatenQuan;

    return { eatenDan, eatenQuan };
  }

  // =========================
  // 6. LƯỢT ĐI CHÍNH (makeMove)
  // =========================

  /**
   * squareIndex: ô bắt đầu bốc (0–11)
   * direction: 1 (phải) hoặc -1 (trái)
   */
  makeMove(squareIndex, direction) {
    if (this.state.isGameOver) {
      this.state.gameMessage = "Ván đấu đã kết thúc. Không thể đi tiếp.";
      return this.getState();
    }

    const currentPlayer = this.state.currentPlayer;
    const dir = direction >= 0 ? 1 : -1;

    // 1. Kiểm tra & xử lý vay dân nếu 5 ô dân trống
    const loseByBorrow = this.checkAndHandleBorrowing(currentPlayer);
    if (loseByBorrow) {
      // Đã set isGameOver & winner & tính điểm trong checkAndHandleBorrowing
      return this.getState();
    }

    // 2. Kiểm tra nước đi hợp lệ
    if (!this.isValidMove(squareIndex, currentPlayer)) {
      this.state.gameMessage = "Nước đi không hợp lệ.";
      return this.getState();
    }

    this.state.gameMessage = "";

    // 3. Bốc dân (KHÔNG bốc Quan)
    const pickedDan = this.state.board[squareIndex].dan;
    if (!(pickedDan > 0 && this.state.board[squareIndex].quan === 0)) {
      this.state.gameMessage = "Nước đi không hợp lệ (ô không chỉ có Dân).";
      return this.getState();
    }

    this.state.board[squareIndex].dan = 0;

    // 4. Rải theo hướng
    let lastIndex = this.spreadPieces(squareIndex, dir, pickedDan);

    // 5. Vòng lặp xử lý sau khi rải:
    //    - Bốc tiếp nếu ô kế tiếp (next) có Dân và không có Quan
    //    - Ăn nếu next trống & next2 có quân
    //    - Mất lượt trong các trường hợp còn lại
    let continueTurn = true;

    while (continueTurn && !this.state.isGameOver) {
      const next = this.getValidIndex(lastIndex + dir);
      const nextSq = this.state.board[next];
      const next2 = this.getValidIndex(next + dir);
      const next2Sq = this.state.board[next2];

      // 5.1. Nếu ô kế tiếp có Quan -> mất lượt
      if (nextSq.quan > 0) {
        this.state.gameMessage =
          this.state.gameMessage ||
          `Người chơi ${currentPlayer} mất lượt vì ô kế tiếp (${next}) có Quan.`;
        continueTurn = false;
        break;
      }

      // 5.2. LUẬT BỐC TIẾP:
      // Nếu ô kế tiếp có Dân và KHÔNG có Quan (dan>0, quan=0) -> bốc & rải tiếp
      if (nextSq.dan > 0 && nextSq.quan === 0) {
        const extraDan = nextSq.dan;
        this.state.board[next].dan = 0;

        lastIndex = this.spreadPieces(next, dir, extraDan);
        // Sau khi rải xong, quay lại while để xét next mới
        continue;
      }

      // 5.3. LUẬT ĂN:
      // Nếu next TRỐNG & next2 CÓ QUÂN -> ăn toàn bộ next2, kết thúc lượt
      const nextIsEmpty = nextSq.dan === 0 && nextSq.quan === 0;
      const next2HasPieces = next2Sq.dan > 0 || next2Sq.quan > 0;

      if (nextIsEmpty && next2HasPieces) {
        const { eatenDan, eatenQuan } = this.captureAt(next2, currentPlayer);
        this.state.gameMessage = `Người chơi ${currentPlayer} ăn ${eatenQuan} Quan và ${eatenDan} Dân ở ô ${next2}.`;
        continueTurn = false;
        break;
      }

      // 5.4. Hai ô kế tiếp đều trống -> mất lượt
      if (
        nextIsEmpty &&
        next2Sq.dan === 0 &&
        next2Sq.quan === 0
      ) {
        this.state.gameMessage =
          this.state.gameMessage ||
          `Người chơi ${currentPlayer} mất lượt vì hai ô kế tiếp (${next}, ${next2}) đều trống.`;
        continueTurn = false;
        break;
      }

      // 5.5. Trường hợp không bốc tiếp, không ăn, không gặp Quan:
      //      -> kết thúc lượt (fallback an toàn)
      this.state.gameMessage =
        this.state.gameMessage || `Lượt của Người chơi ${currentPlayer} kết thúc.`;
      continueTurn = false;
      break;
    }

    // 6. Kiểm tra kết thúc ván (cả 2 Quan = 0 và không còn Quan trên bàn)
    this.checkGameEnd();

    if (this.state.isGameOver) {
      // Nếu chưa tính điểm thì tính
      this.calculateFinalScores();
    } else {
      // Đổi lượt
      this.state.currentPlayer = this.getOpponent(currentPlayer);
      if (!this.state.gameMessage) {
        this.state.gameMessage = `Đến lượt Người chơi ${this.state.currentPlayer}.`;
      }
    }

    return this.getState();
  }

  // =========================
  // 7. KẾT THÚC VÁN & TÍNH ĐIỂM
  // =========================

  checkGameEnd() {
    if (this.state.isGameOver) return;

    // Theo luật: trò chơi dừng khi 2 ô Quan đều trống
    // và không còn Quan nào trên bàn.
    const hasAnyQuan =
      this.state.board.some((sq) => sq.quan > 0);

    if (!hasAnyQuan) {
      this.state.isGameOver = true;
      if (!this.state.gameMessage) {
        this.state.gameMessage = "Ván đấu kết thúc do cả hai Quan đã bị ăn hết.";
      }
    }
  }

  calculateFinalScores() {
    // Chỉ tính 1 lần
    // (nếu muốn bảo vệ thêm thì có thể check cờ, nhưng ở đây cứ tính khi gameOver)
    const s = this.state;

    // 1. Thu toàn bộ Dân còn lại trên bàn vào kho
    const p1Squares = this.getPlayerCivilianSquares(1);
    const p2Squares = this.getPlayerCivilianSquares(2);

    p1Squares.forEach((i) => {
      s.scores.player1.dan += s.board[i].dan;
      s.board[i].dan = 0;
    });

    p2Squares.forEach((i) => {
      s.scores.player2.dan += s.board[i].dan;
      s.board[i].dan = 0;
    });

    // (Nếu bạn muốn thu Dân trên ô Quan về phe tương ứng, có thể thêm:
    //  s.scores.player2.dan += s.board[0].dan; s.board[0].dan = 0;
    //  s.scores.player1.dan += s.board[6].dan; s.board[6].dan = 0;
    // Ở đây mình giữ nguyên như thiết kế trước: chỉ thu ô Dân.)

    // 2. TRẢ NỢ: người vay bị trừ Dân, đối thủ được cộng lại
    const repayDebt = (borrowerKey, lenderKey) => {
      const debtAmount = s.debt[borrowerKey];
      if (debtAmount <= 0) return;

      const canRepay = Math.min(debtAmount, s.scores[borrowerKey].dan);
      s.scores[borrowerKey].dan -= canRepay;
      s.scores[lenderKey].dan += canRepay;
      s.debt[borrowerKey] -= canRepay;
    };

    repayDebt("player1", "player2");
    repayDebt("player2", "player1");

    // 3. TÍNH ĐIỂM: Quan * 5 + Dân
    const finalScoreP1 =
      s.scores.player1.quan * 5 + s.scores.player1.dan;
    const finalScoreP2 =
      s.scores.player2.quan * 5 + s.scores.player2.dan;

    // 4. Xác định winner nếu chưa set
    if (s.winner === null) {
      if (finalScoreP1 > finalScoreP2) s.winner = 1;
      else if (finalScoreP2 > finalScoreP1) s.winner = 2;
      else s.winner = 0; // hòa
    }

    s.gameMessage += ` | Điểm cuối: P1 = ${finalScoreP1}, P2 = ${finalScoreP2}.`;
  }
  getValidMoveIndices(player) {
    const playerSquares = this.getPlayerCivilianSquares(player);
    const validMoves = [];

    for (const index of playerSquares) {
      if (this.isValidMove(index, player)) {
        validMoves.push(index);
      }
    }
    return validMoves;
  }
}