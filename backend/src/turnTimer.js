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
    console.log(`[TIMER] 🟢 START Room ${room.id} | Turn: P${room.game.getState().currentPlayer}`);
    // Xóa timer cũ (nếu có)
    this.clear(room, false); // false = không cần báo client, vì sắp báo 'start'

    const game = room.game;
    const currentPlayer = game.getState().currentPlayer;
    const GRACE_PERIOD = 2000; // Thời gian bù trễ mạng (2 giây)
    // 👇👇👇 THÊM DÒNG NÀY ĐỂ KHAI BÁO DEADLINE 👇👇👇
    const deadline = Date.now() + TURN_DURATION;
    // 👆👆👆 ------------------------------------ 👆👆👆
    // Báo client bắt đầu đếm ngược
    this.io.to(room.id).emit("timer:start", { deadline: deadline });

    const timerId = setTimeout(() => {
      console.log(`Timer hết hạn cho phòng ${room.id}`);
      this.timers.delete(room.id); // Xóa timer khỏi map
      
      // Gọi hàm callback (handleTimerExpires) từ gameManager
      this.onTimerExpires(room, currentPlayer);

    }, TURN_DURATION + GRACE_PERIOD);

    this.timers.set(room.id, timerId);
  }

  /**
   * Xóa timer cho một phòng
   * @param {object} room 
   * @param {boolean} [notifyClients=true] - Có báo client để ẩn đồng hồ không
   */
  clear(room, notifyClients = true) {
    if (this.timers.has(room.id)) {
      console.log(`[TIMER] ⚪ STOPPED Room ${room.id}`);
      clearTimeout(this.timers.get(room.id));
      this.timers.delete(room.id);

      if (notifyClients) {
        // Báo client dừng đếm ngược
        this.io.to(room.id).emit("timer:clear");
      }
    }
  }
}