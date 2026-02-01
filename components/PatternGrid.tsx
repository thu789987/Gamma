import React, { isValidElement, ReactElement, ReactNode } from 'react';

// Định nghĩa Props
interface PatternGridProps {
  children: ReactNode;
  className?: string;
  gap?: number;
}

export default function PatternGrid({ 
  children, 
  className,
  gap = 16 
}: PatternGridProps) {

  // 1. HÀM XỬ LÝ LỖI PLASMIC (Đã sửa lỗi TypeScript 'any')
  const getFlattenedChildren = (nodes: ReactNode): ReactNode[] => {
    const array = React.Children.toArray(nodes);
    
    // Kiểm tra xem có phải là 1 phần tử hợp lệ không
    if (array.length === 1 && isValidElement(array[0])) {
      // THAY ĐỔI Ở ĐÂY: Thay vì 'as any', ép kiểu tường minh thành ReactElement
      const child = array[0] as ReactElement<{ children?: ReactNode }>;

      // Kịch bản 1: React Fragment
      if (child.type === React.Fragment) {
        return getFlattenedChildren(child.props.children);
      }

      // Kịch bản 2: Component lồng nhau (Plasmic wrapper)
      if (child.props && child.props.children) {
         const innerChildren = React.Children.toArray(child.props.children);
         if (innerChildren.length > 1) return innerChildren;
      }
    }
    return array;
  };

  const items = getFlattenedChildren(children);

  // 2. HÀM TÍNH TOÁN SPAN
  const getSpanStyle = (index: number) => {
    const positionInCycle = index % 9;
    if (positionInCycle === 1 || positionInCycle === 5 || positionInCycle === 6) {
      return { gridColumn: 'span 2' };
    }
    return { gridColumn: 'span 1' };
  };

  // 3. RENDER
  // Lấy class name thực tế để style (nếu className rỗng thì dùng default)
  const safeClassName = className || 'pattern-grid';
  // Tạo selector CSS có dấu chấm (.) đằng trước
  const selector = `.${safeClassName.split(' ')[0]}`; 

  return (
    <div 
      className={safeClassName}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: `${gap}px`,
        width: '100%',
      }}
    >
      {items.map((child, index) => (
        <div 
          key={index} 
          style={{
            ...getSpanStyle(index),
            display: 'flex',
            flexDirection: 'column',
            minHeight: '200px'
          }}
        >
          {child}
        </div>
      ))}
      
      {/* Style Responsive - Mobile về 1 cột */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          ${selector} {
            grid-template-columns: 1fr !important;
          }
          ${selector} > div {
            grid-column: span 1 !important;
          }
        }
      `}} />
    </div>
  );
}