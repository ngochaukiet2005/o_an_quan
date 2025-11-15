import { createApp } from "vue";
import App from "./App.vue";
import router from "./router"; // 1. Import file router/index.js

const app = createApp(App);

// 2. Dòng này RẤT QUAN TRỌNG
// Nó kích hoạt router và nói cho <RouterView> trong App.vue
// biết phải hiển thị trang Home.vue
app.use(router);

app.mount("#app");
