<template>
  <header class="navbar">
    <div class="nav-left">
      <img src="/img/logo.jpg" alt="Logo" class="logo" />
      <span class="brand">Ô Ăn Quan Online</span>
    </div>

    <nav class="nav-menu">
      <router-link to="/" exact-active-class="active">Trang chủ</router-link>
      <router-link to="/guide" active-class="active"
        >Hướng dẫn (Luật chơi)</router-link
      >
      <router-link to="/about" active-class="active">Giới thiệu</router-link>
    </nav>

    <div class="nav-user">
      <i class="fa-solid fa-user-circle"></i>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  width: 100%;
  height: 70px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: fixed;
  top: 0;
  left: 0;
  box-shadow: 0 4px 10px #00000010;
  z-index: 50;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 45px;
}

.brand {
  font-size: 20px;
  font-weight: 700;
}

.nav-menu {
  display: flex;
  gap: 22px;
}

.nav-menu router-link {
  text-decoration: none;
  font-weight: 500;
  color: #333;
  padding-bottom: 4px;
  border-bottom: 2px solid transparent;
  transition: 0.25s ease;
}

.nav-menu router-link:hover {
  color: #2563eb;
}

/* Highlight active */
.active {
  color: #2563eb;
  border-bottom: 2px solid #2563eb;
  font-weight: 600;
}

.nav-user i {
  font-size: 26px;
  cursor: pointer;
}
.nav-menu a,
.nav-menu router-link,
.nav-menu .router-link-active {
  text-decoration: none !important;
}
</style>
