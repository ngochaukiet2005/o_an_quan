<template>
  <div class="guide-container">
    <!-- HERO SECTION -->
    <div class="hero">
      <h1>HƯỚNG DẪN CHƠI Ô ĂN QUAN</h1>
      <p>Luật chơi đầy đủ – dễ hiểu – dành cho người mới</p>
    </div>

    <!-- MAIN CONTENT -->
    <section class="content">
      <h2>1. MỤC TIÊU</h2>
      <p>
        Mục tiêu của trò chơi là “ăn” được nhiều quân (dân và quan) nhất. Khi
        ván chơi kết thúc, người chơi nào có tổng số quân quy đổi nhiều hơn sẽ
        chiến thắng.
      </p>
      <p><strong>Quy đổi điểm:</strong> 1 Quan = 5 Dân.</p>

      <h2>2. THIẾT LẬP BÀN CHƠI</h2>
      <p>Bàn cờ gồm 10 ô dân và 2 ô quan.</p>
      <ul>
        <li>Mỗi người chơi quản lý 5 ô dân phía trước mặt.</li>
        <li>Quân dân: 50 quân – chia đều 5 quân/ô dân.</li>
        <li>Quân quan: 2 quân – mỗi ô quan đặt 1 quân.</li>
      </ul>

      <h2>3. CÁCH CHƠI (THEO LƯỢT)</h2>
      <p>Hai người chơi luân phiên thực hiện lượt đi. Mỗi lượt gồm 3 bước:</p>

      <h3>🔹 Bước 1: Chọn ô</h3>
      <p>Chọn 1 ô dân còn quân. Nếu cả 5 ô đều trống, xem luật đặc biệt.</p>

      <h3>🔹 Bước 2: Rải quân</h3>
      <p>
        Bốc toàn bộ quân trong ô và rải từng quân vào các ô kế tiếp theo chiều
        tùy chọn.
      </p>

      <h3>🔹 Bước 3: Xử lý sau khi rải</h3>
      <p><strong>Tình huống:</strong></p>
      <ul>
        <li>
          <strong>Đi tiếp:</strong> Nếu rơi vào ô có quân → bốc tiếp và rải
          tiếp.
        </li>
        <li>
          <strong>Ăn quân:</strong> Nếu rơi vào ô trống → được ăn quân ở ô sau
          đó.
        </li>
        <li><strong>Mất lượt:</strong> Nếu ô sau đó trống hoặc là ô quan.</li>
      </ul>

      <h2>4. LUẬT ĐẶC BIỆT</h2>
      <p><strong>Hết quân:</strong></p>
      <p>
        Nếu cả 5 ô dân của bạn trống → bạn phải bỏ 5 quân từ kho điểm để đặt vào
        mỗi ô 1 quân. Nếu kho điểm không đủ → phải vay của đối thủ. Hết ván chơi
        tính điểm phải trả số quân đã vai.
      </p>

      <h2>5. KẾT THÚC VÁN CHƠI</h2>
      <p>Ván chơi kết thúc khi:</p>
      <ul>
        <li>Cả 2 ô quan đều bị ăn hết.</li>
        <li>Hoặc bàn cờ không còn quân dân để rải.</li>
      </ul>

      <h2>6. TÍNH ĐIỂM & CHIẾN THẮNG</h2>
      <p>
        Người chơi đổ tất cả quân đã ăn để đếm.
        <strong>1 Quan = 5 Dân.</strong>
        Ai có điểm cao hơn là người chiến thắng.
      </p>
    </section>
  </div>
</template>

<style scoped>
.guide-container {
  margin: 100px auto;
  max-width: 900px;
}

/* HERO */
.hero {
  height: 260px;
  background: linear-gradient(45deg, #2563eb, #3b82f6);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 40px;
  border-radius: 18px;

  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
  animation: fadeInHero 0.7s ease;
}

.hero h1 {
  font-size: 40px;
  margin-bottom: 10px;
  font-weight: 800;
}

.hero p {
  font-size: 18px;
  opacity: 0.95;
}

/* CONTENT CARD */
.content {
  background: rgba(255, 255, 255, 0.92);
  margin-top: 30px;
  padding: 40px 48px;
  border-radius: 16px;

  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(4px);

  animation: fadeIn 0.7s ease;
  line-height: 1.7;
  font-size: 17px;
}

/* TITLES */
h2 {
  color: #1e40af;
  font-size: 26px;
  margin-top: 28px;
  margin-bottom: 10px;
  font-weight: 700;
  border-left: 6px solid #1e40af;
  padding-left: 12px;
}

h3 {
  font-size: 20px;
  margin-top: 18px;
  color: #0f172a;
  font-weight: 600;
}

ul {
  padding-left: 22px;
}

li {
  margin: 6px 0;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInHero {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
