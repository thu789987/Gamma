// components/HoverReveal.tsx
import React, { useState, ReactNode } from 'react';

// Định nghĩa Props để Plasmic hiểu
export interface HoverRevealProps {
  children?: ReactNode;
  className?: string;
  previewForceOpen?: boolean;
}

export default function HoverReveal({ 
  children, 
  className,
  previewForceOpen = false 
}: HoverRevealProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Logic: Mở nếu đang hover HOẶC đang bật chế độ preview trong Studio
  const isOpen = isHovered || previewForceOpen;

  return (
    <div 
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* CONTAINER ANIMATION */}
      <div
        style={{
          display: "grid",
          // --- PHẦN ĐÃ CHỈNH SỬA ---
          // Thay 0.7fr và 1fr bằng số đo pixel chính xác bạn muốn
          gridTemplateRows: isOpen ? "385px" : "195px",
          
          transition: "grid-template-rows 300ms ease-out",
        }}
      >
        {/* Inner div vẫn cần overflow hidden để cắt nội dung thừa khi ở 195px */}
        <div style={{ overflow: "hidden", minHeight: "0" }}>
           {children}
        </div>
      </div>
    </div>
  );
}