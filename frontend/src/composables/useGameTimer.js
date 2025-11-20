import { ref, onUnmounted } from 'vue';

export function useGameTimer() {
  const timerValue = ref(null);
  const timerInterval = ref(null);

  const clearTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
    timerValue.value = null;
  };

  const startTimer = (data) => {
    clearTimer(); // Reset trước khi chạy mới

    // Trường hợp 1: Đếm ngược theo thời lượng (ví dụ: còn 30s)
    if (!data.deadline) {
      timerValue.value = data.duration;
      timerInterval.value = setInterval(() => {
        if (timerValue.value > 0) {
          timerValue.value--;
        } else {
          clearTimer();
        }
      }, 1000);
      return;
    }

    // Trường hợp 2: Đếm ngược theo Deadline (đồng bộ server)
    const deadline = data.deadline;
    const update = () => {
      const now = Date.now();
      const remainingMs = deadline - now;
      if (remainingMs > 0) {
        timerValue.value = Math.ceil(remainingMs / 1000);
      } else {
        timerValue.value = 0;
        clearTimer();
      }
    };
    
    update(); // Cập nhật ngay lập tức
    timerInterval.value = setInterval(update, 100); // Check mỗi 100ms cho mượt
  };

  // Tự động dọn dẹp khi component unmount
  onUnmounted(() => {
    clearTimer();
  });

  return {
    timerValue,
    startTimer,
    clearTimer
  };
}