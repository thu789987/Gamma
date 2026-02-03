import React, { useEffect, useRef } from 'react';

interface GridDistortionProps {
  gridSpacing?: number;   // Khoảng cách giữa các điểm
  dotSize?: number;       // Kích thước điểm
  cursorRadius?: number;  // Bán kính ảnh hưởng của chuột
  repulsion?: number;     // Lực đẩy mạnh hay nhẹ
  color?: string;         // Màu của điểm
  className?: string;     // Để chỉnh CSS (position, z-index)
}

export function GridDistortion({
  gridSpacing = 40,
  dotSize = 2,
  cursorRadius = 100,
  repulsion = 100,
  color = '#888888',
  className
}: GridDistortionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let dots: Dot[] = [];

    // Class quản lý từng điểm
    class Dot {
      x: number;      // Vị trí gốc X
      y: number;      // Vị trí gốc Y
      vx: number = 0; // Vận tốc X
      vy: number = 0; // Vận tốc Y
      currX: number;  // Vị trí hiện tại X
      currY: number;  // Vị trí hiện tại Y
      friction: number = 0.9; // Độ ma sát (dừng lại từ từ)
      ease: number = 0.1;     // Độ đàn hồi (quay về nhanh hay chậm)

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.currX = x;
        this.currY = y;
      }

      update(mouseX: number, mouseY: number) {
        // 1. Tính khoảng cách từ chuột đến điểm
        const dx = mouseX - this.currX;
        const dy = mouseY - this.currY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 2. Tính lực đẩy (Physics)
        // Nếu chuột nằm trong bán kính ảnh hưởng
        if (distance < cursorRadius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            
            // Lực đẩy càng gần tâm càng mạnh
            const force = (cursorRadius - distance) / cursorRadius;
            const directionX = forceDirectionX * force * repulsion;
            const directionY = forceDirectionY * force * repulsion;

            // Đẩy điểm ra xa (ngược hướng chuột)
            this.vx -= directionX;
            this.vy -= directionY;
        }

        // 3. Tính lực hồi vị (Kéo về vị trí gốc)
        const returnX = (this.x - this.currX) * this.ease;
        const returnY = (this.y - this.currY) * this.ease;
        
        this.vx += returnX;
        this.vy += returnY;

        // 4. Áp dụng ma sát để không rung mãi
        this.vx *= this.friction;
        this.vy *= this.friction;

        // 5. Cập nhật vị trí
        this.currX += this.vx;
        this.currY += this.vy;
      }

      draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(this.currX, this.currY, dotSize, 0, Math.PI * 2);
        context.fillStyle = color;
        context.fill();
      }
    }

    // Hàm khởi tạo lưới
    const init = () => {
      dots = [];
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        for (let y = 0; y < canvas.height; y += gridSpacing) {
          dots.push(new Dot(x, y));
        }
      }
    };

    // Hàm render vòng lặp
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(dot => {
        dot.update(mouseRef.current.x, mouseRef.current.y);
        dot.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(render);
    };

    // Event Listeners
    const handleResize = () => init();
    const handleMouseMove = (e: MouseEvent) => {
        // Lấy toạ độ chuột tương đối với canvas
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Chạy lần đầu
    init();
    render();

    // Cleanup khi component bị xóa
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gridSpacing, dotSize, cursorRadius, repulsion, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ display: 'block' }} // Loại bỏ scrollbar dư thừa
    />
  );
}