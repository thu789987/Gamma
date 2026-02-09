import React, { useState, useEffect, useRef } from 'react';

// Danh sách ký tự random giống code cũ của bạn
const LETTERS = "QWERTYUIOPASDFGHJKLZXCVBNM";

export default function HackerText({ text = "MENU ITEM", className }: { text: string, className?: string }) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<any>(null);

  const startScramble = () => {
    let iteration = 0;
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(prev => 
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return LETTERS[Math.floor(Math.random() * 26)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(intervalRef.current);
      }
      
      // Tốc độ giải mã: cứ 3 lần chạy thì giải mã 1 ký tự
      iteration += 1 / 3; 
    }, 30); // Tốc độ chạy chữ (ms)
  };

  // Reset về chữ gốc khi chuột rời đi
  const stopScramble = () => {
    clearInterval(intervalRef.current);
    setDisplayText(text);
  };

  // Cập nhật text nếu prop thay đổi trên Plasmic
  useEffect(() => {
    setDisplayText(text);
  }, [text]);

  return (
    <div 
      className={className}
      onMouseEnter={startScramble}
      onMouseLeave={stopScramble}
      style={{ fontFamily: 'Orbitron, sans-serif', cursor: 'pointer' }} // Font chữ style cũ
    >
      {displayText}
    </div>
  );
}