// OAnQuanGame.ts

// -----------
// 1. ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU (TYPESCRIPT)
// -----------

/**
 * Đại diện cho một ô trên bàn cờ.
 * dan: Số quân Dân.
 * quan: Số quân Quan.
 */
export interface Square {
  dan: number;
  quan: number;
}

/**
 * Kho điểm của cả hai người chơi.
 */
export interface Scores {
  player1: {
    dan: number;
    quan: number;
  };
  player2: {
    dan: number;
    quan: number;
  };
}

/**
 * Khoản nợ do "Vay Quân" (Luật 4).
 * player1: Số Dân người chơi 1 nợ người chơi 2.
 */
export interface Debt {
  player1: number;
  player2: number;
}

/**
 * Trạng thái đầy đủ của ván game.
 */
export interface GameState {
  board: Square[];
  scores: Scores;
  debt: Debt;
  currentPlayer: 1 | 2;
  isGameOver: boolean;
  winner: 1 | 2 | 0 | null; // 1: P1 thắng, 2: P2 thắng, 0: Hòa, null: Chưa kết thúc
  gameMessage: string; // Tin nhắn thông báo trạng thái (VD: "Mất lượt", "Ăn 5 dân", "Vay quân"...)
}

export type Direction = 1 | -1; // 1: Cùng chiều kim đồng hồ, -1: Ngược chiều

// -----------
// 2. LỚP LOGIC CHÍNH CỦA GAME
// -----------

export class OAnQuanGame {
  private state: GameState;

  /**
   * Khởi tạo một ván game mới.
   */
  constructor() {
    this.state = this.getInitialState();
  }

  /**
   * Lấy trạng thái khởi tạo của bàn cờ.
   */
  public getInitialState(): GameState {
    const initialBoard: Square[] = [
      { dan: 0, quan: 5 }, // Ô 0 (Quan P2)
      { dan: 5, quan: 0 }, // Ô 1
      { dan: 5, quan: 0 }, // Ô 2
      { dan: 5, quan: 0 }, // Ô 3
      { dan: 5, quan: 0 }, // Ô 4
      { dan: 5, quan: 0 }, // Ô 5
      { dan: 0, quan: 5 }, // Ô 6 (Quan P1)
      { dan: 5, quan: 0 }, // Ô 7
      { dan: 5, quan: 0 }, // Ô 8
      { dan: 5, quan: 0 }, // Ô 9
      { dan: 5, quan: 0 }, // Ô 10
      { dan: 5, quan: 0 }, // Ô 11
    ];

    return {
      board: initialBoard,
      scores: {
        player1: { dan: 0, quan: 0 },
        player2: { dan: 0, quan: 0 },
      },
      debt: {
        player1: 0,
        player2: 0,
      },
      currentPlayer: 1,
      isGameOver: false,
      winner: null,
      gameMessage: "Ván đấu bắt đầu. Lượt của Người chơi 1.",
    };
  }

  /**
   * Lấy trạng thái hiện tại của game.
   */
  public getState(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  // -----------
  // 3. CÁC HÀM HỖ TRỢ (HELPERS)
  // -----------

  /**
   * Lấy chỉ số của ô (0-11) một cách an toàn, tự động vòng lại.
   */
  private getValidIndex(index: number): number {
    return (index + 12) % 12;
  }

  /**
   * Lấy người chơi đối thủ.
   */
  private getOpponent(player: 1 | 2): 1 | 2 {
    return player === 1 ? 2 : 1;
  }

  /**
   * Lấy key điểm của người chơi ('player1' hoặc 'player2').
   */
  private getPlayerScoreKey(player: 1 | 2): 'player1' | 'player2' {
    return player === 1 ? 'player1' : 'player2';
  }

  /**
   * Lấy danh sách các chỉ số ô Dân của một người chơi.
   */
  private getPlayerCivilianSquares(player: 1 | 2): number[] {
    return player === 1 ? [1, 2, 3, 4, 5] : [7, 8, 9, 10, 11];
  }

  /**
   * Kiểm tra xem một ô có phải là ô Dân của người chơi hay không.
   */
  private isPlayerCivilianSquare(index: number, player: 1 | 2): boolean {
    if (index === 0 || index === 6) return false;
    return player === 1 ? index >= 1 && index <= 5 : index >= 7 && index <= 11;
  }

  // -----------
  // 4. LOGIC CỐT LÕI CỦA LƯỢT CHƠI
  // -----------

  /**
   * (LUẬT 1) Kiểm tra xem một nước đi có hợp lệ không.
   */
  public isValidMove(squareIndex: number, player: 1 | 2): boolean {
    // 1. Phải là lượt của người chơi
    if (player !== this.state.currentPlayer) {
      return false;
    }

    // 2. Phải là ô Dân của người chơi (Luật 1 & Yêu cầu 2)
    if (!this.isPlayerCivilianSquare(squareIndex, player)) {
      return false;
    }

    // 3. (MỚI) Không được bốc ô trống (Yêu cầu 1)
    const square = this.state.board[squareIndex];
    if (square.dan === 0 && square.quan === 0) {
      return false;
    }

    return true;
  }

  /**
   * (LUẬT 4 - MỚI) Xử lý logic "Vay Quân" khi bắt đầu lượt.
   * Hàm này sẽ thay đổi state (board, scores, debt) nếu cần.
   * @returns {boolean} Trả về true nếu game kết thúc (do không thể vay), ngược lại false.
   */
  private checkAndHandleBorrowing(player: 1 | 2): boolean {
    const playerSquares = this.getPlayerCivilianSquares(player);
    const areAllEmpty = playerSquares.every(
      (i) => this.state.board[i].dan === 0 && this.state.board[i].quan === 0
    );

    if (!areAllEmpty) {
      return false; // Không cần vay
    }

    const playerKey = this.getPlayerScoreKey(player);
    const opponentKey = this.getPlayerScoreKey(this.getOpponent(player));
    let playerDan = this.state.scores[playerKey].dan;

    if (playerDan >= 5) {
      // Trường hợp 1: Đủ Dân
      this.state.scores[playerKey].dan -= 5;
      playerSquares.forEach((i) => {
        this.state.board[i].dan = 1;
      });
      this.state.gameMessage = `Người chơi ${player} rải 5 Dân từ kho.`;
    } else {
      // Trường hợp 2: Vay Đối Thủ
      const needed = 5 - playerDan;
      const opponentDan = this.state.scores[opponentKey].dan;

      if (opponentDan < needed) {
        // Không đủ Dân để vay -> THUA
        this.state.isGameOver = true;
        this.state.winner = this.getOpponent(player);
        this.state.gameMessage = `Người chơi ${player} không thể vay quân và bị xử thua.`;
        this.calculateFinalScores(); // Kết thúc game ngay lập tức
        return true; // Game đã kết thúc
      }

      // Đối thủ đủ Dân cho vay
      this.state.scores[opponentKey].dan -= needed;
      this.state.scores[playerKey].dan += needed; // Giờ player có 5 Dân
      this.state.debt[playerKey] += needed; // Ghi nợ

      // Dùng 5 Dân vừa vay/có được để rải
      this.state.scores[playerKey].dan -= 5;
      playerSquares.forEach((i) => {
        this.state.board[i].dan = 1;
      });
      this.state.gameMessage = `Người chơi ${player} đã vay ${needed} Dân từ đối thủ.`;
    }
    return false; // Game tiếp tục
  }

  /**
   * (LUẬT 2) Rải quân và trả về ô cuối cùng.
   */
  private spreadPieces(
    startIndex: number,
    direction: Direction,
    pieceCount: number
  ): number {
    let currentIndex = startIndex;
    for (let i = 0; i < pieceCount; i++) {
      currentIndex = this.getValidIndex(currentIndex + direction);
      // Logic "Chữ U": Bỏ qua ô Quan nếu không đủ quân để rải qua
      // (Logic này được đơn giản hóa: luôn rải 1 quân vào mỗi ô)
      this.state.board[currentIndex].dan++;
    }
    return currentIndex; // Trả về ô cuối cùng đã rải
  }

  /**
   * (LUẬT 3) Ăn quân tại một ô và cộng vào điểm.
   * @returns {Square} Số quân đã ăn (để thông báo).
   */
  private eatPieces(index: number, player: 1 | 2): Square {
    const eaten = { ...this.state.board[index] };
    this.state.board[index] = { dan: 0, quan: 0 };

    const playerKey = this.getPlayerScoreKey(player);
    this.state.scores[playerKey].dan += eaten.dan;
    this.state.scores[playerKey].quan += eaten.quan;

    return eaten;
  }

  /**
   * Thực hiện một nước đi đầy đủ (Bốc, Rải, Xử lý).
   */
  public makeMove(
    squareIndex: number,
    direction: Direction
  ): GameState {
    // 0. Kiểm tra game đã kết thúc chưa
    if (this.state.isGameOver) {
      this.state.gameMessage = "Game đã kết thúc. Không thể đi tiếp.";
      return this.getState();
    }

    // 1. (LUẬT 1) Kiểm tra nước đi hợp lệ
    if (!this.isValidMove(squareIndex, this.state.currentPlayer)) {
      this.state.gameMessage = "Nước đi không hợp lệ.";
      return this.getState();
    }

    // 2. (LUẬT 4) Kiểm tra và xử lý "Vay Quân"
    this.state.gameMessage = ""; // Reset tin nhắn
    const didLoseOnBorrow = this.checkAndHandleBorrowing(
      this.state.currentPlayer
    );
    if (didLoseOnBorrow) {
      return this.getState(); // Game đã kết thúc khi vay
    }

    // 3. (LUẬT 2) Bốc và Rải Quân
    const pickedUp = { ...this.state.board[squareIndex] };
    const totalPieces = pickedUp.dan + pickedUp.quan;
    this.state.board[squareIndex] = { dan: 0, quan: 0 };

    let lastSquareIndex = this.spreadPieces(
      squareIndex,
      direction,
      totalPieces
    );

    // 4. (LUẬT 3) Xử lý sau khi Rải
    let continueLooping = true;
    while (continueLooping) {
      const nextSquareIndex = this.getValidIndex(lastSquareIndex + direction);
      const nextSquare = this.state.board[nextSquareIndex];

      // TH 1: Ô kế tiếp CÓ QUÂN
      if (nextSquare.dan > 0 || nextSquare.quan > 0) {
        // (MỚI - Sửa đổi 4): Nếu có Quan -> Mất lượt
        if (nextSquare.quan > 0) {
          this.state.gameMessage = "Mất lượt do rải vào ô có Quan.";
          continueLooping = false; // Dừng vòng lặp, kết thúc lượt
        }
        // Nếu chỉ có Dân -> Bốc rải tiếp
        else {
          const piecesToSpread = nextSquare.dan;
          this.state.board[nextSquareIndex] = { dan: 0, quan: 0 };
          lastSquareIndex = this.spreadPieces(
            nextSquareIndex,
            direction,
            piecesToSpread
          );
          // Vòng lặp `while` tự động lặp lại
        }
      }
      // TH 2: Ô kế tiếp TRỐNG
      else {
        const captureIndex = this.getValidIndex(nextSquareIndex + direction);
        const captureSquare = this.state.board[captureIndex];

        // 2b (Dừng): Gặp 2 ô trống liên tiếp
        if (captureSquare.dan === 0 && captureSquare.quan === 0) {
          this.state.gameMessage = "Dừng do 2 ô trống liên tiếp.";
          continueLooping = false;
        }
        // 2b (Dừng - MỚI): Gặp ô ăn có Quan
        else if (captureSquare.quan > 0) {
          this.state.gameMessage = "Dừng do ô ăn có Quan.";
          continueLooping = false;
        }
        // 2a (Ăn): Chỉ có thể ăn nếu ô captureSquare chỉ có Dân
        else {
          // Ăn dây (liên hoàn)
          // (LƯU Ý: Theo Luật 2a "ăn... kể cả quan" và 2b "dừng... nếu có quan",
          // logic 2b được ưu tiên. Vì vậy, ta chỉ có thể ăn nếu ô đó
          // KHÔNG CÓ QUAN, tức là chỉ có Dân.)
          let totalEatenDan = 0;
          let chainIndex = nextSquareIndex;

          while (true) {
            const emptyCheckIndex = this.getValidIndex(chainIndex + direction);
            const captureCheckIndex = this.getValidIndex(
              chainIndex + 2 * direction
            );
            const emptySquare = this.state.board[emptyCheckIndex];
            const captureSquareToEat = this.state.board[captureCheckIndex];

            // Điều kiện ăn: (Trống) -> (Chỉ có Dân)
            if (
              (emptySquare.dan === 0 && emptySquare.quan === 0) &&
              (captureSquareToEat.dan > 0 && captureSquareToEat.quan === 0)
            ) {
              const eaten = this.eatPieces(
                captureCheckIndex,
                this.state.currentPlayer
              );
              totalEatenDan += eaten.dan;
              chainIndex = captureCheckIndex; // Di chuyển để xét cặp tiếp theo
            } else {
              // Dừng ăn dây
              break;
            }
          }

          if (totalEatenDan > 0) {
            this.state.gameMessage = `Ăn ${totalEatenDan} Dân.`;
          }
          continueLooping = false; // Dừng lượt sau khi ăn (hoặc không ăn gì)
        }
      }
    } // kết thúc vòng lặp while(continueLooping)

    // 5. (LUẬT 5) Kiểm tra kết thúc ván và đổi lượt
    this.checkGameEnd();

    if (this.state.isGameOver) {
      // Nếu game kết thúc (do hết Quan), tính điểm
      if (this.state.winner === null) {
        // Chỉ tính khi winner chưa bị set (ví dụ: do vay quân)
        this.calculateFinalScores();
      }
    } else {
      // Đổi lượt
      this.state.currentPlayer = this.getOpponent(this.state.currentPlayer);
      if (this.state.gameMessage === "") {
        this.state.gameMessage = `Đến lượt Người chơi ${this.state.currentPlayer}.`;
      }
    }

    return this.getState();
  }

  // -----------
  // 5. LOGIC KẾT THÚC GAME
  // -----------

  /**
   * (LUẬT 5) Kiểm tra điều kiện kết thúc ván (chỉ check hết Quan).
   * Điều kiện thua do vay đã được xử lý ở `checkAndHandleBorrowing`.
   */
  private checkGameEnd(): void {
    if (this.state.isGameOver) {
      return; // Game đã kết thúc rồi
    }

    if (
      this.state.board[0].quan === 0 &&
      this.state.board[6].quan === 0
    ) {
      this.state.isGameOver = true;
      this.state.gameMessage = "Ván đấu kết thúc do cả 2 ô Quan đã hết.";
    }
  }

  /**
   * (LUẬT 5) Tính điểm cuối cùng khi ván đấu kết thúc.
   */
  private calculateFinalScores(): void {
    if (!this.state.isGameOver) return;

    // 1. Thu nốt Dân còn lại
    this.getPlayerCivilianSquares(1).forEach((i) => {
      this.state.scores.player1.dan += this.state.board[i].dan;
      this.state.board[i].dan = 0;
    });
    this.getPlayerCivilianSquares(2).forEach((i) => {
      this.state.scores.player2.dan += this.state.board[i].dan;
      this.state.board[i].dan = 0;
    });

    // 2. (MỚI) Trả Nợ
    // P1 trả nợ cho P2
    if (this.state.debt.player1 > 0) {
      const repayAmount = Math.min(
        this.state.debt.player1,
        this.state.scores.player1.dan
      );
      this.state.scores.player1.dan -= repayAmount;
      this.state.scores.player2.dan += repayAmount;
      this.state.debt.player1 = 0; // Nợ đã được trả (hoặc trả hết mức có thể)
    }
    // P2 trả nợ cho P1
    if (this.state.debt.player2 > 0) {
      const repayAmount = Math.min(
        this.state.debt.player2,
        this.state.scores.player2.dan
      );
      this.state.scores.player2.dan -= repayAmount;
      this.state.scores.player1.dan += repayAmount;
      this.state.debt.player2 = 0;
    }

    // 3. Tính Tổng Điểm Cuối
    const finalScoreP1 =
      this.state.scores.player1.quan * 5 + this.state.scores.player1.dan;
    const finalScoreP2 =
      this.state.scores.player2.quan * 5 + this.state.scores.player2.dan;

    // 4. Quyết định người thắng (nếu chưa được quyết định)
    if (this.state.winner === null) {
      if (finalScoreP1 > finalScoreP2) {
        this.state.winner = 1;
      } else if (finalScoreP2 > finalScoreP1) {
        this.state.winner = 2;
      } else {
        this.state.winner = 0; // Hòa
      }
    }
    
    // Cập nhật tin nhắn cuối cùng
    this.state.gameMessage += ` | Điểm P1: ${finalScoreP1} (Quan: ${this.state.scores.player1.quan}, Dân: ${this.state.scores.player1.dan}) | Điểm P2: ${finalScoreP2} (Quan: ${this.state.scores.player2.quan}, Dân: ${this.state.scores.player2.dan}).`;
  }
}