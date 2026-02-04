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
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        <div 
          onMouseEnter={() => handleHover(true)}
          onMouseLeave={() => handleHover(false)}
          style={{ width: 'fit-content' }}
        >
          {trigger}
        </div>

        {children}

      </div>
    </DataProvider>
  );
}