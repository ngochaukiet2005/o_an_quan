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
      path: '/game-room', // <--- SỬA LẠI
      name: 'game-room', // <--- SỬA LẠI
      component: () => import('../views/GameRoom.vue')
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
