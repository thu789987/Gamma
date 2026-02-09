import React, { useState, useEffect, useRef } from 'react';

const LETTERS = "QWERTYUIOPASDFGHJKLZXCVBNM";

interface HackerTextProps {
  text?: string;
  className?: string;
}

export default function HackerText({ text = "MENU ITEM", className }: HackerTextProps) {
  const [displayText, setDisplayText] = useState(text);
  
  // ✅ FIX LỖI 1: Thay 'any' bằng kiểu dữ liệu chuẩn của setInterval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startScramble = () => {
    let iteration = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      // ✅ FIX LỖI 2: Thay 'prev' bằng '()' vì chúng ta không dùng biến prev
      setDisplayText(() => 
        text
          .split("")
          .map((_letter, index) => { // Thêm dấu _ trước letter để báo là biến này cũng không quan trọng
            if (index < iteration) {
              return text[index];
            }
            return LETTERS[Math.floor(Math.random() * 26)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      
      iteration += 1 / 3; 
    }, 30);
  };

  const stopScramble = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayText(text);
  };

  useEffect(() => {
    setDisplayText(text);
  }, [text]);

  return (
    <div 
      className={className}
      onMouseEnter={startScramble}
      onMouseLeave={stopScramble}
      style={{ fontFamily: 'Orbitron, sans-serif', cursor: 'pointer' }}
    >
      {displayText}
    </div>
  );
}