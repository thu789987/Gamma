// components/MasonryLayout.tsx
import React, { isValidElement, ReactElement, ReactNode } from 'react';
import Masonry from 'react-masonry-css';
import styles from './Masonry.module.css';

// 1. Định nghĩa kiểu dữ liệu (Interface) rõ ràng để tránh dùng 'any'
interface MasonryLayoutProps {
  children: ReactNode;
  columns?: number | Record<string, number>;
}

export function MasonryLayout({ children, columns }: MasonryLayoutProps) {
  // Cấu hình cột mặc định
  const defaultColumns = {
    default: 4,
    1100: 3,
    700: 2
  };

  const breakpointColumnsObj = columns || defaultColumns;

  // Hàm đệ quy để đào sâu vào bên trong nếu bị Plasmic gói quá kỹ
  const getFlattenedChildren = (nodes: ReactNode): ReactNode[] => {
    const array = React.Children.toArray(nodes);

    // Nếu chỉ có đúng 1 phần tử con và nó là một Element hợp lệ
    if (array.length === 1 && isValidElement(array[0])) {
      // 2. Ép kiểu an toàn thay vì dùng 'any'
      // Chúng ta báo cho TS biết đây là một Element có chứa children
      const child = array[0] as ReactElement<{ children?: ReactNode }>;

      // Kịch bản 1: Nó là React Fragment
      if (child.type === React.Fragment) {
        return getFlattenedChildren(child.props.children);
      }

      // Kịch bản 2: Nó là một thẻ Div hoặc Component bọc ngoài
      if (child.props && child.props.children) {
        const innerChildren = React.Children.toArray(child.props.children);
        // Nếu bên trong "vỏ" này có nhiều hơn 1 item, chứng tỏ đây là vỏ bọc danh sách
        if (innerChildren.length > 1) {
          return innerChildren; // Bóc vỏ, lấy ruột
        }
      }
    }

    return array;
  };

  // Gọi hàm xử lý
  const items = getFlattenedChildren(children);

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