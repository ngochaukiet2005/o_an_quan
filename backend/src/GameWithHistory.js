// backend/src/GameWithHistory.js
import { OAnQuanGame } from "./OAnQuanGame.js";

export class GameWithHistory extends OAnQuanGame {
  constructor() {
    super();
    this.moveHistory = []; // Nơi lưu lịch sử nước đi
  }

  // Ghi đè để chặn các log tự động của lớp cha (SPREAD, CAPTURE...)
  // Vì GameWithHistory tự quản lý moveHistory cho diễn hoạt
  _logAction() {
    // intentionally left blank
  }
  /**
   * Lấy lịch sử và xóa ngay sau đó (để không trùng lặp ở lượt sau)
   */
  getMoveHistory() {
    const history = [...this.moveHistory];
    this.moveHistory = []; 
    return history;
  }
  // --- THÊM ĐOẠN NÀY ---
  // Ghi đè để bắt sự kiện vay dân
  checkAndHandleBorrowing(player) {
    // Kiểm tra trạng thái TRƯỚC khi xử lý logic gốc
    const civilIndices = this.getPlayerCivilianSquares(player);
    const wasAllEmpty = civilIndices.every((i) => this.state.board[i].dan === 0 && this.state.board[i].quan === 0);
    
    // Gọi logic gốc của OAnQuanGame
    const result = super.checkAndHandleBorrowing(player);

    // Nếu trước đó trống hết, và giờ đã được điền quân (nghĩa là đã vay/gây giống thành công)
    // và game chưa kết thúc
    if (wasAllEmpty && !result && !this.state.isGameOver) {
         // Kiểm tra xem ô đầu tiên có quân chưa để chắc chắn
         if (this.state.board[civilIndices[0]].dan > 0) {
             // Đẩy sự kiện vay vào đầu danh sách lịch sử (vì nó xảy ra trước khi đi)
             this.moveHistory.push({
                 type: "borrow",
                 player: player,
                 indices: civilIndices // [1,2,3,4,5] hoặc [7,8,9,10,11]
             });
         }
    }
    return result;
  }
  // ---------------------
  // THÊM PHƯƠNG THỨC NÀY
  _recordFinalSweep() {
    const s = this.state;
    // P1 Squares: 1-5 (phía dưới trên màn hình P1)
    const player1Squares = this.getPlayerCivilianSquares(1); 
    // P2 Squares: 7-11 (phía trên trên màn hình P1)
    const player2Squares = this.getPlayerCivilianSquares(2);
    
    // Thu quân P1 (Sẽ bay xuống trên màn hình P1)
    player1Squares.forEach((index) => {
        const count = s.board[index].dan;
        if (count > 0) {
            this.moveHistory.push({ 
                type: "final_sweep", 
                index: index, 
                count: count,
                player: 1, 
            });
        }
    });

    // Thu quân P2 (Sẽ bay lên trên màn hình P1)
    player2Squares.forEach((index) => {
        const count = s.board[index].dan;
        if (count > 0) {
            this.moveHistory.push({ 
                type: "final_sweep", 
                index: index, 
                count: count,
                player: 2, 
            });
        }
    });
  }
  // KẾT THÚC PHƯƠNG THỨC MỚI
  // Ghi đè hàm makeMove để chèn logic ghi log
  makeMove(squareIndex, direction) {
    // Reset lịch sử mỗi đầu lượt
    this.moveHistory = [];

    if (this.state.isGameOver) {
      this.state.gameMessage = "Ván đấu đã kết thúc. Không thể đi tiếp.";
      return this.getState();
    }

    const currentPlayer = this.state.currentPlayer;
    const dir = direction >= 0 ? 1 : -1;

    // 1. Kiểm tra vay dân (Giữ nguyên)
    const loseByBorrow = this.checkAndHandleBorrowing(currentPlayer);
    if (loseByBorrow) return this.getState();

    // 2. Kiểm tra hợp lệ (Giữ nguyên)
    if (!this.isValidMove(squareIndex, currentPlayer)) {
      this.state.gameMessage = "Nước đi không hợp lệ.";
      return this.getState();
    }
    this.state.gameMessage = "";

    // ============ [LOGIC CHÍNH + GHI LOG] ============

    // 3. Bốc dân đầu tiên
    const pickedDan = this.state.board[squareIndex].dan;
    
    // [LOG] Bốc quân
    this.moveHistory.push({ type: "pickup", index: squareIndex, count: pickedDan });
    
    this.state.board[squareIndex].dan = 0;

    // 4. Rải quân
    // [LOG] Rải quân (Ghi lại vị trí bắt đầu rải thực tế là ô kế tiếp)
    this.moveHistory.push({ 
        type: "spread", 
        start: this.getValidIndex(squareIndex + dir), 
        count: pickedDan, 
        direction: dir 
    });
    
    let lastIndex = this.spreadPieces(squareIndex, dir, pickedDan);

    // 5. Vòng lặp xử lý
    let continueTurn = true;

    while (continueTurn && !this.state.isGameOver) {
      const next = this.getValidIndex(lastIndex + dir);
      const nextSq = this.state.board[next];
      const next2 = this.getValidIndex(next + dir);
      const next2Sq = this.state.board[next2];

      // 5.1. Gặp Quan -> Mất lượt
      if (nextSq.quan > 0) {
        this.state.gameMessage = this.state.gameMessage || `Người chơi ${currentPlayer} mất lượt vì gặp Quan tại ô ${next}.`;
        continueTurn = false;
        break;
      }

      // 5.2. Bốc tiếp
      if (nextSq.dan > 0 && nextSq.quan === 0) {
        const extraDan = nextSq.dan;
        
        // [LOG] Bốc tiếp
        this.moveHistory.push({ type: "pickup", index: next, count: extraDan });

        this.state.board[next].dan = 0;

        // [LOG] Rải tiếp
        this.moveHistory.push({ 
            type: "spread", 
            start: this.getValidIndex(next + dir), 
            count: extraDan, 
            direction: dir 
        });

        lastIndex = this.spreadPieces(next, dir, extraDan);
        continue;
      }

      // 5.3. Ăn (và ăn dây)
      const nextIsEmpty = nextSq.dan === 0 && nextSq.quan === 0;
      const next2HasPieces = next2Sq.dan > 0 || next2Sq.quan > 0;

      if (nextIsEmpty && next2HasPieces) {
        // 👇👇👇 THÊM MỚI: Ghi nhận hành động đập tay vào ô trống (next) 👇👇👇
        this.moveHistory.push({ type: "move_to_empty", index: next }); 
        // 👆👆👆 --------------------------------------------------- 👆👆👆
        // Ăn lần 1
        const { eatenDan, eatenQuan } = this.captureAt(next2, currentPlayer);
        this.state.gameMessage = `Người chơi ${currentPlayer} ăn ${eatenQuan} Quan, ${eatenDan} Dân tại ô ${next2}.`;

        // [LOG] Ăn
        this.moveHistory.push({ 
            type: "capture", 
            index: next2, 
            eatenDan, 
            eatenQuan 
        });

        let lastEatenIndex = next2;
        let continueChainEating = true;
        this.checkGameEnd();

        while (continueChainEating && !this.state.isGameOver) {
          const chainNext = this.getValidIndex(lastEatenIndex + dir);
          const chainNextSq = this.state.board[chainNext];
          const chainNext2 = this.getValidIndex(chainNext + dir);
          const chainNext2Sq = this.state.board[chainNext2];

          const chainNextIsEmpty = chainNextSq.dan === 0 && chainNextSq.quan === 0;
          const chainNext2HasPieces = chainNext2Sq.dan > 0 || chainNext2Sq.quan > 0;

          if (chainNextIsEmpty && chainNext2HasPieces) {
            // 👇👇👇 THÊM MỚI: Ghi nhận đập tay khi ăn dây 👇👇👇
            this.moveHistory.push({ type: "move_to_empty", index: chainNext });
            // 👆👆👆 ---------------------------------------- 👆👆👆
            const res = this.captureAt(chainNext2, currentPlayer);
            this.state.gameMessage += ` (Ăn dây ô ${chainNext2})`;

            // [LOG] Ăn dây
            this.moveHistory.push({ 
                type: "capture", 
                index: chainNext2, 
                eatenDan: res.eatenDan, 
                eatenQuan: res.eatenQuan 
            });

            lastEatenIndex = chainNext2;
            this.checkGameEnd();
          } else {
            continueChainEating = false;
          }
        }
        continueTurn = false;
        break;
      }

      // 5.4. Hai ô trống -> Mất lượt
      if (nextIsEmpty && next2Sq.dan === 0 && next2Sq.quan === 0) {
        this.state.gameMessage = this.state.gameMessage || `Mất lượt tại ô ${lastIndex} (2 ô trống kế tiếp).`;
        continueTurn = false;
        break;
      }

      // Fallback
      this.state.gameMessage = this.state.gameMessage || `Lượt kết thúc.`;
      continueTurn = false;
      break;
    }
    // 6. Kết thúc ván
    this.checkGameEnd();
    if (this.state.isGameOver) {
      this._recordFinalSweep();
      this.calculateFinalScores();
    } else {
      this.state.currentPlayer = this.getOpponent(currentPlayer);
      if (!this.state.gameMessage) {
        this.state.gameMessage = `Đến lượt Người chơi ${this.state.currentPlayer}.`;
      }
    }

    return this.getState();
  }
}