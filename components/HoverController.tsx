import React, { useState } from 'react';
import { DataProvider } from '@plasmicapp/loader-nextjs'; 

interface HoverControllerProps {
  children?: React.ReactNode;
  trigger: React.ReactNode;
  className?: string;
  // 👇 Thêm dòng này: Hàm callback để báo tin cho cha
  onHoverChange?: (isHovered: boolean) => void; 
}

export function HoverController({ 
  children, 
  trigger, 
  className,
  onHoverChange // Lấy prop này ra
}: HoverControllerProps) {
  
  const [isHovered, setIsHovered] = useState(false);

  // Hàm xử lý logic chung
  const handleHover = (status: boolean) => {
    setIsHovered(status);
    // Nếu cha có đưa cái dây (hàm) xuống, thì giật dây báo tin
    if (onHoverChange) {
      onHoverChange(status);
    }
  };

return (
    <DataProvider name="hoverData" data={{ isHovered: isHovered }}>
      <div 
        className={className} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px',
          // 👇 THÊM 2 DÒNG NÀY ĐỂ ÉP XÓA BORDER
          border: 'none', 
          outline: 'none'
        }}
      >
        
        <div 
          onMouseEnter={() => handleHover(true)}
          onMouseLeave={() => handleHover(false)}
          // 👇 Thêm border: none vào cả chỗ này cho chắc chắn
          style={{ width: 'fit-content', border: 'none' }} 
        >
          {trigger}
        </div>

        {/* Kiểm tra xem có phải nội dung bên trong children có border không */}
        <div style={{ border: 'none' }}>
           {children}
        </div>

      </div>
    </DataProvider>
  );
}