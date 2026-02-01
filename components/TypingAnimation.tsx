import React from 'react';
import { TypeAnimation } from 'react-type-animation';

export default function TypingAnimation(props: { 
  texts?: string[]; 
  speed?: number; 
  className?: string;
  textColor?: string; // Thêm prop này
}) {
  // 1. Dữ liệu mặc định nếu chưa nhập gì
  const inputTexts = props.texts || ["Thiết kế Web", "Lập trình React", "Marketing Online"];
  
  // 2. Xử lý dữ liệu: Biến mảng chữ thường thành mảng "sequence" của thư viện
  // Cấu trúc sequence: [ "Chữ A", 2000ms nghỉ, "Chữ B", 2000ms nghỉ, ... ]
  const sequence = inputTexts.flatMap(text => [text, 2000]); 

  // Tốc độ gõ: Props truyền vào (1-99), mặc định là 50
  const typingSpeed = props.speed || 50;

  return (
    <div className={props.className}>
      <TypeAnimation
  sequence={sequence}
  speed={typingSpeed as any} // Ép kiểu để tránh lỗi TS nếu cần
  style={{ 
    fontSize: '2em', // Bạn có thể thêm font size prop nếu muốn
    display: 'inline-block', 
    color: props.textColor 
  }}
  repeat={Infinity}
/>
    </div>
  );
}