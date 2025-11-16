// src/RpsGame.js

/**
 * (Hàm nội bộ) Xác định người thắng Oẳn tù tì
 * @returns {'p1' | 'p2' | 'draw'}
 */
function determineRpsWinner(choice1, choice2) {
  if (choice1 === choice2) return 'draw';
  if (
    (choice1 === 'rock' && choice2 === 'scissors') ||
    (choice1 === 'scissors' && choice2 === 'paper') ||
    (choice1 === 'paper' && choice2 === 'rock')
  ) {
    return 'p1';
  }
  return 'p2';
}

/**
 * Class quản lý một ván Oẳn tù tì (Rock-Paper-Scissors)
 */
export class RpsGame {
  constructor(player1Id, player2Id) {
    this.p1_id = player1Id;
    this.p2_id = player2Id;
    this.state = this._getInitialState();
  }

  // Trả về trạng thái khởi tạo
  _getInitialState() {
    return {
      choices: {
        [this.p1_id]: null,
        [this.p2_id]: null,
      },
      status: 'pending', // 'pending', 'complete'
      winner: null,      // null, 'p1', 'p2', 'draw'
      winnerId: null,    // null, <player_id>
    };
  }

  // Lấy trạng thái hiện tại (an toàn)
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Người chơi thực hiện một lựa chọn
   * @param {string} playerId ID của người chơi
   * @param {'rock'|'paper'|'scissors'} choice Lựa chọn
   * @returns {object} Trạng thái mới
   */
  makeChoice(playerId, choice) {
    if (this.state.status !== 'pending') {
      return this.getState(); // Đã hoàn thành
    }
    if (playerId !== this.p1_id && playerId !== this.p2_id) {
      return this.getState(); // Người xem không được chọn
    }
    if (this.state.choices[playerId] !== null) {
      return this.getState(); // Đã chọn rồi
    }
    if (!['rock', 'paper', 'scissors'].includes(choice)) {
      return this.getState(); // Lựa chọn không hợp lệ
    }

    // Ghi nhận lựa chọn
    this.state.choices[playerId] = choice;

    // Kiểm tra xem cả hai đã chọn chưa
    this._checkCompletion();

    return this.getState();
  }

  // (Nội bộ) Kiểm tra và xác định người thắng
  _checkCompletion() {
    const p1Choice = this.state.choices[this.p1_id];
    const p2Choice = this.state.choices[this.p2_id];

    // Chỉ thực hiện khi cả hai đã chọn
    if (p1Choice && p2Choice) {
      this.state.status = 'complete';
      const winnerResult = determineRpsWinner(p1Choice, p2Choice);
      this.state.winner = winnerResult;

      if (winnerResult === 'p1') this.state.winnerId = this.p1_id;
      if (winnerResult === 'p2') this.state.winnerId = this.p2_id;
    }
  }

  // Reset lại ván oẳn tù tì (dùng khi hòa)
  reset() {
    this.state = this._getInitialState();
  }
}