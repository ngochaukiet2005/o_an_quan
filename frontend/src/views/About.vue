<template>
  <div class="about-container">
    <!-- HERO SECTION -->
    <div class="hero">
      <h1>Giới thiệu về Ô Ăn Quan</h1>
      <p>Trò chơi dân gian Việt Nam – phiên bản hiện đại</p>
    </div>

    <!-- MAIN CONTENT -->
    <section class="content">
      <h2>1. Ô Ăn Quan là gì?</h2>
      <p>
        Ô Ăn Quan là một trò chơi chiến thuật đối kháng dành cho hai người chơi.
        Trò chơi sử dụng bàn cờ tự vẽ cùng các quân đơn giản như sỏi, đá nhỏ
        hoặc hạt cây để mô phỏng việc thu hoạch và tính toán chiến thuật.
      </p>

      <h2>2. Nguồn gốc và Ý nghĩa</h2>
      <p>
        Đây là một trò chơi dân gian có từ rất lâu đời tại Việt Nam, đặc biệt
        phổ biến ở vùng Bắc Bộ xưa. Trò chơi mang ý nghĩa giáo dục cao, gợi nhớ
        đời sống làng quê: các ô dân tượng trưng cho dân chúng, còn hai ô quan
        đại diện cho tầng lớp quan lại.
      </p>

      <ul>
        <li>Tư duy logic và tính toán – chọn nước đi tối ưu.</li>
        <li>Lập kế hoạch – chọn thời điểm ăn quân hoặc nuôi quân.</li>
        <li>Kiên nhẫn và cẩn thận – chỉ một nước đi sai có thể mất lợi thế.</li>
      </ul>

      <h2>3. Chuẩn bị bàn chơi</h2>
      <p>Bàn chơi rất đơn giản, có thể vẽ trực tiếp trên nền đất hoặc giấy.</p>
      <ul>
        <li>10 ô dân (mỗi bên người chơi 5 ô)</li>
        <li>2 ô quan hình bán nguyệt ở hai đầu</li>
        <li>50 quân dân (5 quân/ô dân)</li>
        <li>2 quân quan (mỗi ô quan 1 quân – lớn hơn để phân biệt)</li>
      </ul>

      <h2>4. Mục tiêu</h2>
      <p>
        Thu thập càng nhiều quân càng tốt. Kết thúc ván chơi, người có tổng số
        điểm cao hơn sẽ chiến thắng. Thông thường:
      </p>
      <p><strong>1 Quan = 10 Dân</strong> (hoặc 5 tùy luật).</p>

      <h2>5. Giá trị văn hóa</h2>
      <p>
        Ô Ăn Quan là một phần ký ức tuổi thơ của nhiều thế hệ Việt Nam. Trò chơi
        mang tính cộng đồng cao, vui đơn giản mà giàu giá trị truyền thống. Hiện
        nay Ô Ăn Quan đã được đưa lên nền tảng online để tiếp cận giới trẻ, vừa
        gìn giữ văn hóa, vừa mang lại trải nghiệm thân thuộc nhưng hiện đại.
      </p>

      <h2>Phiên bản Online</h2>
      <p>
        Ô Ăn Quan Online được xây dựng nhằm lan tỏa trò chơi dân gian theo phong
        cách hiện đại. Với công nghệ realtime, giao diện trẻ trung, người chơi
        có thể thi đấu mọi lúc mọi nơi.
      </p>

      <ul>
        <li>Frontend: Vue 3 + Vite</li>
        <li>Realtime Engine: Node.js + Socket.IO</li>
        <li>
          Mục tiêu: Trở thành nền tảng Ô Ăn Quan trực tuyến lớn nhất Việt Nam
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.about-container {
  margin: 100px auto;
  max-width: 900px;
}

/* HERO */
.hero {
  height: 260px;
  background: linear-gradient(45deg, #0400ff, #3d4aff);
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
  font-size: 42px;
  margin-bottom: 10px;
  font-weight: 800;
}

.hero p {
  font-size: 18px;
  opacity: 0.95;
}

/* CONTENT BLOCK */
.content {
  background: rgba(255, 255, 255, 0.9);
  margin-top: 30px;
  padding: 40px 48px;
  border-radius: 16px;

  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);

  animation: fadeIn 0.7s ease;
  line-height: 1.7;
  font-size: 17px;
}

h2 {
  color: #1e40af;
  font-size: 26px;
  margin-top: 28px;
  margin-bottom: 10px;
  font-weight: 700;
  border-left: 6px solid #1e40af;
  padding-left: 12px;
}

ul {
  padding-left: 22px;
  margin: 10px 0;
}

li {
  margin: 6px 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
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
