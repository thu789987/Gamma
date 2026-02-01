// components/MasonryLayout.tsx
import React, { isValidElement } from 'react';
import Masonry from 'react-masonry-css';
import styles from './Masonry.module.css';

export function MasonryLayout({ children, columns }: { children: React.ReactNode, columns?: any }) {
  const breakpointColumnsObj = columns || {
    default: 4,
    1100: 3,
    700: 2
  };

  // Hàm đệ quy để đào sâu vào bên trong nếu bị Plasmic gói quá kỹ
  const getFlattenedChildren = (nodes: React.ReactNode): React.ReactNode[] => {
    const array = React.Children.toArray(nodes);

    // Nếu chỉ có đúng 1 phần tử con
    if (array.length === 1 && isValidElement(array[0])) {
      const child = array[0] as any;

      // Kịch bản 1: Nó là React Fragment (thường gặp)
      if (child.type === React.Fragment) {
        return getFlattenedChildren(child.props.children);
      }
      
      // Kịch bản 2: Nó là một thẻ Div hoặc Component bọc ngoài (Vertical Stack, v.v...)
      // Dấu hiệu: Có props.children là một mảng nhiều phần tử hoặc Fragment
      if (child.props && child.props.children) {
         // Kiểm tra xem bên trong cái vỏ này có phải là danh sách item thật không
         // Đây là bước mạo hiểm nhưng cần thiết để "cứu" Masonry trong Plasmic
         const innerChildren = React.Children.toArray(child.props.children);
         if (innerChildren.length > 1) {
             return innerChildren; // Bóc vỏ, lấy ruột
         }
      }
    }
    
    return array;
  };

  // Gọi hàm xử lý
  const items = getFlattenedChildren(children);
  console.log('Masonry Children:', React.Children.toArray(children));
  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className={styles.myMasonryGrid}
      columnClassName={styles.myMasonryColumn}
    >
      {items.map((child, index) => (
        // Thêm key index để React không báo lỗi
        <div key={index} className={styles.itemWrapper}>
          {child}
        </div>
      ))}
    </Masonry>
  );
}