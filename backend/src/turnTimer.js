// src/turnTimer.js

const TURN_DURATION = 30000; // 30 giây

/**
 * Class quản lý tất cả các bộ đếm thời gian
 */
export class TurnTimerManager {
  constructor(io, onTimerExpiresCallback) {
    this.io = io;
    // Callback này sẽ là hàm handleTimerExpires từ gameManager
    this.onTimerExpires = onTimerExpiresCallback;
    this.timers = new Map();
  }

  /**
   * Bắt đầu timer cho một phòng
   * @param {object} room 
   */
  start(room) {
    // Xóa timer cũ (nếu có)
    this.clear(room, false); // false = không cần báo client, vì sắp báo 'start'

    const game = room.game;
    const currentPlayer = game.getState().currentPlayer;

    // Báo client bắt đầu đếm ngược
    this.io.to(room.id).emit("timer:start", { duration: TURN_DURATION / 1000 });

    const timerId = setTimeout(() => {
      console.log(`Timer hết hạn cho phòng ${room.id}`);
      this.timers.delete(room.id); // Xóa timer khỏi map
      
      // Gọi hàm callback (handleTimerExpires) từ gameManager
      this.onTimerExpires(room, currentPlayer);

    }, TURN_DURATION);

    this.timers.set(room.id, timerId);
  }

  /**
   * Xóa timer cho một phòng
   * @param {object} room 
   * @param {boolean} [notifyClients=true] - Có báo client để ẩn đồng hồ không
   */
  clear(room, notifyClients = true) {
    if (this.timers.has(room.id)) {
      clearTimeout(this.timers.get(room.id));
      this.timers.delete(room.id);

      if (notifyClients) {
        // Báo client dừng đếm ngược
        this.io.to(room.id).emit("timer:clear");
      }
    }
  }
}