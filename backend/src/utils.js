// src/utils.js

/**
 * Tạo một ID phòng ngẫu nhiên (ví dụ: 'abc12')
 * Giống như trong API [cite: 26]
 */
export const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 7);
};