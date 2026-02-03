import React, { useEffect, useRef, ReactNode } from 'react';

// Thêm prop children vào interface
interface GridDistortionWrapperProps {
  children?: ReactNode;   // Slot để chứa nội dung bên trong
  gridSpacing?: number;   // Khoảng cách giữa các điểm
  dotSize?: number;       // Kích thước điểm
  cursorRadius?: number;  // Bán kính ảnh hưởng của chuột
  repulsion?: number;     // Lực đẩy mạnh hay nhẹ
  color?: string;         // Màu của điểm
  className?: string;     // Class cho container bao ngoài
}

export function GridDistortionWrapper({
  children,
  gridSpacing = 40,
  dotSize = 2,
  cursorRadius = 100,
  repulsion = 100,
  color = '#888888',
  className
}: GridDistortionWrapperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // QUAN TRỌNG: Thêm ref cho container bao ngoài
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Khởi tạo chuột ở ngoài vùng container để không bị hiệu ứng lúc mới tải
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let dots: Dot[] = [];

    // --- Class Dot (Giữ nguyên logic vật lý cũ) ---
    class Dot {
      x: number; y: number; vx: number = 0; vy: number = 0;
      currX: number; currY: number; friction: number = 0.9; ease: number = 0.1;
      constructor(x: number, y: number) {
        this.x = x; this.y = y; this.currX = x; this.currY = y;
      }
      update(mouseX: number, mouseY: number) {
        const dx = mouseX - this.currX;
        const dy = mouseY - this.currY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < cursorRadius) {
            const force = (cursorRadius - distance) / cursorRadius;
            const directionX = (dx / distance) * force * repulsion;
            const directionY = (dy / distance) * force * repulsion;
            this.vx -= directionX; this.vy -= directionY;
        }
        this.vx += (this.x - this.currX) * this.ease;
        this.vy += (this.y - this.currY) * this.ease;
        this.vx *= this.friction; this.vy *= this.friction;
        this.currX += this.vx; this.currY += this.vy;
      }
      draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(this.currX, this.currY, dotSize, 0, Math.PI * 2);
        context.fillStyle = color;
        context.fill();
      }
    }

    // --- QUAN TRỌNG: Thay đổi cách tính kích thước ---
    const init = () => {
      dots = [];
      // Lấy kích thước của thẻ Container cha, không phải window
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        for (let y = 0; y < canvas.height; y += gridSpacing) {
          dots.push(new Dot(x, y));
        }
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(dot => dot.update(mouseRef.current.x, mouseRef.current.y));
      dots.forEach(dot => dot.draw(ctx));
      animationFrameId = requestAnimationFrame(render);
    };

    // --- QUAN TRỌNG: Sử dụng ResizeObserver để theo dõi kích thước container ---
    const resizeObserver = new ResizeObserver(() => {
        init();
    });
    resizeObserver.observe(container);


    // --- QUAN TRỌNG: Xử lý chuột trong phạm vi container ---
    const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        // Tính tọa độ tương đối trong container
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseLeave = () => {
        // Khi chuột ra khỏi container, reset vị trí để chấm về chỗ cũ
        mouseRef.current = { x: -9999, y: -9999 };
    }

    // Gắn sự kiện vào container thay vì window
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    init();
    render();

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gridSpacing, dotSize, cursorRadius, repulsion, color]);

  return (
    // QUAN TRỌNG: Wrapper DIV với position: relative
    <div 
      ref={containerRef}
      className={className}
      style={{ 
        position: 'relative', // Để làm mốc tọa độ cho canvas absolute bên trong
        width: '100%',        // Mặc định full chiều rộng cha
        height: '100%',       // Mặc định full chiều cao cha
        overflow: 'hidden'    // Ẩn các chấm bay ra ngoài khung
      }}
    >
      {/* Canvas làm nền, nằm tuyệt đối bên dưới */}
      <canvas 
        ref={canvasRef} 
        style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0, // Nằm dưới nội dung children
            pointerEvents: 'none' // QUAN TRỌNG: Để chuột bấm xuyên qua được vào nút bên trong
        }} 
      />
      
      {/* Nội dung children nằm đè lên trên (z-index cao hơn mặc định) */}
      <div style={{ position: 'relative', zIndex: 1, height: '100%', width: '100%' }}>
        {children}
      </div>
    </div>
  );
}