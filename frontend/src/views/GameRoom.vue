<template>
  <div class="room-page">
    <h1>Phòng: {{ roomId }}</h1>
    <p>
      Bạn là: <strong>{{ playerName }}</strong>
    </p>

    <!-- ===== PLAYER LIST ===== -->
    <PlayerInfo
      :players="players"
      :currentTurnId="currentTurnId"
      class="player-box"
    />

    <!-- ===== GAME BOARD ===== -->
    <GameBoard
      v-if="board.length"
      :board="board"
      :players="players"
      :currentTurnId="currentTurnId"
      :playerId="playerId"
      @move="handleMove"
    />

    <!-- ===== CHAT ===== -->
    <ChatBox :messages="messages" @send="sendMessage" class="chat-box" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import socketService from "../services/socketService";

import ChatBox from "../components/ChatBox.vue";
import PlayerInfo from "../components/PlayerInfo.vue";
import GameBoard from "../components/GameBoard.vue";

/* ===============================
            STATE
================================= */

const route = useRoute();

const roomId = route.params.roomId;
const playerName = route.query.playerName;

const playerId = ref("");
const playerSymbol = ref("");

const players = ref([]);
const board = ref([]);

const currentTurnId = ref("");

const messages = ref([]);

/* ===============================
        SOCKET HANDLERS
================================= */

onMounted(() => {
  console.log("▶ Join room:", roomId, "as", playerName);

  // Gửi join_room (đúng theo backend của bạn)
  socketService.getSocket().emit("room:join", {
    roomId,
    playerName,
  });

  // Backend trả về khi join thành công
  socketService.getSocket().on("room:joined", (data) => {
    console.log("✔ room:joined", data);
    playerId.value = data.playerId;
    playerSymbol.value = data.playerSymbol;
  });

  // Backend gửi state game
  socketService.getSocket().on("update_game_state", (state) => {
    console.log("📌 update_game_state", state);

    board.value = state.board;
    players.value = state.players;
    currentTurnId.value = state.currentTurnId;
  });

  // Chat message mới
  socketService.getSocket().on("chat:receive", (msg) => {
    messages.value.push(msg);
  });

  // Người chơi mới vào phòng
  socketService.getSocket().on("room:player-joined", (data) => {
    messages.value.push({
      senderName: "Hệ thống",
      message: `${data.name} đã vào phòng.`,
    });
  });

  socketService.getSocket().on("error", (err) => {
    alert(err.message);
  });
});

onBeforeUnmount(() => {
  socketService.offAll();
});

/* ===============================
        USER ACTIONS
================================= */

// gửi nước đi
function handleMove(index) {
  socketService.makeMove({
    roomId,
    playerId: playerId.value,
    startIndex: index,
  });
}

// gửi chat
function sendMessage(text) {
  socketService.sendMessage(roomId, playerName.value, text);
}
</script>

<style scoped>
.room-page {
  padding: 20px 30px;
}

.player-box {
  margin-bottom: 20px;
}

.chat-box {
  margin-top: 30px;
}
</style>
