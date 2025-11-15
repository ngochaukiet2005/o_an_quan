import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import GameRoom from "../views/GameRoom.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/game/:roomId", // URL sẽ có dạng /game/abc12
    name: "GameRoom",
    component: GameRoom,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
