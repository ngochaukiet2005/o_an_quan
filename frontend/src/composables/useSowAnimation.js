// src/composables/useSowAnimation.js

import { ref, nextTick } from 'vue';

// YÊU CẦU: Tốc độ chậm hơn
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getRandomPositionInCell() {
  const top = Math.random() * 60 + 10;
  const left = Math.random() * 60 + 10;
  return { top: `${top}%`, left: `${left}%` };
}

export function useSowAnimation() {
  const handVisible = ref(false);
  const handStyle = ref({ top: '0px', left: '0px' });
  const handStones = ref(0);

  const animatingStones = ref([]);
  let stoneAnimationIdCounter = 0;

  const moveHandToCell = (boardElRef, index) => {
    if (!boardElRef.value) return;
    const cellEl = boardElRef.value.querySelector(`.cell[data-index="${index}"]`);
    if (!cellEl) return;
    
    const boardRect = boardElRef.value.getBoundingClientRect();
    const cellRect = cellEl.getBoundingClientRect();
    
    handStyle.value = {
      top: `${cellRect.top - boardRect.top + cellRect.height / 2}px`,
      left: `${cellRect.left - boardRect.left + cellRect.width / 2}px`,
    };
  };

  const runSowAnimation = async (
    localBoard,
    boardElRef,
    startIndex,
    direction
  ) => {
    handVisible.value = true;
    const step = direction === 'left' ? -1 : 1;
    let currentIndex = startIndex;

    // 1. Bốc quân
    let stonesToSow = localBoard.value[currentIndex];
    handStones.value = stonesToSow;
    
    // --- FIX LỖI REACTIVITY ---
    // localBoard.value[currentIndex] = 0; (SẼ GÂY LỖI)
    localBoard.value.splice(currentIndex, 1, 0); // (ĐÚNG)
    // -------------------------

    moveHandToCell(boardElRef, currentIndex);
    await sleep(600); // Tăng tốc độ

    // 2. Vòng lặp "Rải" và "Rải Tiếp"
    while (true) {
      // 2a. Rải quân
      while (stonesToSow > 0) {
        currentIndex = (currentIndex + step + 12) % 12;
        
        moveHandToCell(boardElRef, currentIndex);
        // YÊU CẦU: Tốc độ lia tay (chậm lại)
        await sleep(600); // Tăng từ 500ms -> 600ms
        
        stonesToSow--;
        handStones.value = stonesToSow;

        // --- FIX BUG (Hiệu ứng "viên đá rơi từ tay") ---
        const boardRect = boardElRef.value.getBoundingClientRect();
        const cellEl = boardElRef.value.querySelector(`.cell[data-index="${currentIndex}"]`);
        if (cellEl) {
            const cellRect = cellEl.getBoundingClientRect();
            const startX = parseFloat(handStyle.value.left);
            const startY = parseFloat(handStyle.value.top);
            const randomPosInCell = getRandomPositionInCell();
            const endX = (cellRect.left - boardRect.left) + (parseFloat(randomPosInCell.left) / 100 * cellRect.width);
            const endY = (cellRect.top - boardRect.top) + (parseFloat(randomPosInCell.top) / 100 * cellRect.height);
            const newStoneId = stoneAnimationIdCounter++;
            
            animatingStones.value.push({
                id: newStoneId,
                style: {
                    top: '0px',
                    left: '0px',
                    transform: `translate(${startX}px, ${startY}px) scale(0.5)`,
                    opacity: 1,
                    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
                }
            });

            await nextTick(); 

            const stoneToAnimate = animatingStones.value.find(s => s.id === newStoneId);
            if (stoneToAnimate) {
                stoneToAnimate.style.transform = `translate(${endX}px, ${endY}px) scale(1)`;
                
                setTimeout(() => {
                    animatingStones.value = animatingStones.value.filter(s => s.id !== newStoneId);
                    
                    // --- FIX LỖI REACTIVITY ---
                    // localBoard.value[currentIndex]++; (SẼ GÂY LỖI)
                    const newValue = localBoard.value[currentIndex] + 1;
                    localBoard.value.splice(currentIndex, 1, newValue); // (ĐÚNG)
                    // -------------------------
                }, 300); 
            } else {
                const newValue = localBoard.value[currentIndex] + 1;
                localBoard.value.splice(currentIndex, 1, newValue);
            }
        }
        // ----------------------------------------
      }

      // 2b. Rải xong, kiểm tra ô cuối
      const lastCellStones = localBoard.value[currentIndex];

      // 2c. Kiểm tra "Rải Tiếp"
      if (lastCellStones > 1) {
        await sleep(500); 
        stonesToSow = lastCellStones;
        
        // --- FIX LỖI REACTIVITY ---
        // localBoard.value[currentIndex] = 0; (SẼ GÂY LỖI)
        localBoard.value.splice(currentIndex, 1, 0); // (ĐÚNG)
        // -------------------------

        handStones.value = stonesToSow;
        await sleep(500);
      } else {
        break; 
      }
    }

    // 3. Animation kết thúc
    await sleep(800);
    handVisible.value = false;
  };

  return {
    handVisible,
    handStyle,
    handStones,
    animatingStones,
    runSowAnimation,
  };
}