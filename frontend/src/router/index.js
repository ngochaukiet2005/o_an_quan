// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import GameRoom from "../views/GameRoom.vue";
import About from "../views/About.vue";
import Guide from "../views/Guide.vue";
import Play from "../views/Play.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
  path: "/play",
    name: "Play",
    component: Play,
  },
  {
    path: "/room/:roomId",
    name: "GameRoom",
    component: GameRoom,
    props: true,
  },
  {
    path: "/about",
    name: "About",
    component: About,
  },
  {
    path: "/guide",
    name: "Guide",
    component: Guide,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
