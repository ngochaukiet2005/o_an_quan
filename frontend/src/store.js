// frontend/src/store.js
import { reactive } from "vue";

// Đây là "nguồn chân lý" cho toàn bộ UI
export const store = reactive({
  // Thông tin phòng
  roomId: null,
  players: [],
  
  // Thông tin người chơi
  myPlayerId: null,
  myPlayerNumber: null, // 1 hoặc 2
  
  // Trạng thái game
  board: [], // Mảng 12 ô {dan, quan}
  scores: {
    player1: { dan: 0, quan: 0 },
    player2: { dan: 0, quan: 0 },
  },
  debt: {
    player1: 0,
    player2: 0,
  },
  
  // Quản lý lượt
  nextTurnPlayerId: null,
  
  // Thông báo
  gameMessage: "",
  errorMessage: "",
});

// Hàm helper để reset state khi rời phòng
export function resetStore() {
  store.roomId = null;
  store.players = [];
  store.myPlayerId = getSocket().id || null; // Giữ lại ID của mình
  store.myPlayerNumber = null;
  store.board = [];
  store.scores = { player1: { dan: 0, quan: 0 }, player2: { dan: 0, quan: 0 } };
  store.debt = { player1: 0, player2: 0 };
  store.nextTurnPlayerId = null;
  store.gameMessage = "";
  store.errorMessage = "";
}

// Hàm cập nhật state từ server
export function updateStateFromServer(newState) {
  store.board = newState.board;
  store.scores = newState.scores;
  store.debt = newState.debt;
  store.nextTurnPlayerId = newState.nextTurnPlayerId;
  store.gameMessage = newState.gameMessage;
  store.errorMessage = ""; // Xóa lỗi cũ khi có update mới
}