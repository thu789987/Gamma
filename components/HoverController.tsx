import React, { useState } from 'react';
import { DataProvider } from '@plasmicapp/loader-nextjs'; 

interface HoverControllerProps {
  children?: React.ReactNode; // Thêm dấu ? để báo là có thể không có
  trigger: React.ReactNode;
  className?: string;
}

export function HoverController({ children, trigger, className }: HoverControllerProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Kiểm tra xem thực sự có nội dung trong slot Children hay không
  // (Đôi khi Plasmic truyền mảng rỗng, nên cần kiểm tra kỹ hơn chút)
  const hasChildren = React.Children.count(children) > 0;

  return (
    <DataProvider name="hoverData" data={{ isHovered: isHovered }}>
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* 1. Phần Trigger (Luôn hiện) */}
        <div 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ width: 'fit-content' }}
        >
          {trigger}
        </div>

        {/* 2. Phần Children (Chỉ hiện khi có nội dung) */}
        {/* Logic: Nếu biến hasChildren là True thì mới render đoạn sau && */}
        {hasChildren && (
          <div>
            {children}
          </div>
        )}

      </div>
    </DataProvider>
  );
}