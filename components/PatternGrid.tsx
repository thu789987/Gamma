import React, { isValidElement } from 'react';

// Định nghĩa Props
interface PatternGridProps {
  children: React.ReactNode;
  className?: string;
  gap?: number;
}

export default function PatternGrid({ 
  children, 
  className,
  gap = 16 
}: PatternGridProps) {

  // 1. HÀM XỬ LÝ LỖI PLASMIC (Giữ nguyên)
  const getFlattenedChildren = (nodes: React.ReactNode): React.ReactNode[] => {
    const array = React.Children.toArray(nodes);
    if (array.length === 1 && isValidElement(array[0])) {
      const child = array[0] as any;
      if (child.type === React.Fragment) {
        return getFlattenedChildren(child.props.children);
      }
      if (child.props && child.props.children) {
         const innerChildren = React.Children.toArray(child.props.children);
         if (innerChildren.length > 1) return innerChildren;
      }
    }
    return array;
  };

  const items = getFlattenedChildren(children);

  // 2. HÀM TÍNH TOÁN SPAN (Giữ nguyên)
  const getSpanStyle = (index: number) => {
    const positionInCycle = index % 9;
    if (positionInCycle === 1 || positionInCycle === 5 || positionInCycle === 6) {
      return { gridColumn: 'span 2' };
    }
    return { gridColumn: 'span 1' };
  };

  // 3. RENDER (Đã sửa lỗi thẻ Style)
  // Tạo class name an toàn để dùng trong CSS
  const targetClass = className ? `.${className}` : '.pattern-grid'; // Mặc định nếu không có class

  return (
    <div 
      className={className || 'pattern-grid'} // Gán class mặc định nếu chưa có
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
      
      {/* --- PHẦN SỬA LỖI Ở ĐÂY --- */}
      {/* Sử dụng dangerouslySetInnerHTML để tránh lỗi Hydration do dấu > */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          ${targetClass} {
            grid-template-columns: 1fr !important;
          }
          ${targetClass} > div {
            grid-column: span 1 !important;
          }
        }
      `}} />
    </div>
  );
}