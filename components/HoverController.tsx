import React, { useState } from 'react';
import { DataProvider } from '@plasmicapp/loader-nextjs'; 

interface HoverControllerProps {
  children: React.ReactNode; // Nội dung chính
  trigger: React.ReactNode;  // Cái nút (Vùng cảm ứng)
  className?: string;
}

export function HoverController({ children, trigger, className }: HoverControllerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    // 1. Truyền biến isHovered xuống cho Plasmic dùng
    <DataProvider name="hoverData" data={{ isHovered: isHovered }}>
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* 2. Vùng Cảm Ứng (Cái Nút) */}
        <div 
          // Khi chuột vào nút -> Bật true
          onMouseEnter={() => setIsHovered(true)}
          // Khi chuột rời nút -> Tắt false
          onMouseLeave={() => setIsHovered(false)}
          
          style={{ width: 'fit-content' }} // Để vùng hover bao vừa khít cái nút
        >
          {trigger}
        </div>

        {/* 3. Phần nội dung còn lại (Sẽ biến đổi theo isHovered) */}
        <div>
          {children}
        </div>

      </div>
    </DataProvider>
  );
}