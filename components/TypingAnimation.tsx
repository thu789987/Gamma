// components/TypingAnimation.tsx
import React, { useState, useEffect } from 'react';

interface TypingAnimationProps {
  /** Nội dung văn bản cần gõ */
  text?: string;
  /** Tốc độ gõ (ms), mặc định 100ms */
  speed?: number;
  /** Class CSS tùy chỉnh */
  className?: string;
  /** Có hiện con trỏ nhấp nháy không? */
  showCursor?: boolean;
}

export default function TypingAnimation({
  text = '',
  speed = 100,
  className = '',
  showCursor = true,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    // Reset khi text thay đổi
    setDisplayedText(''); 
    
    if (!text) return;

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      // Nếu chưa gõ hết chuỗi
      if (currentIndex < text.length) {
        // Lấy chuỗi con từ 0 đến ký tự hiện tại
        // Dùng slice an toàn hơn cộng chuỗi trực tiếp
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        // Gõ xong thì xóa interval
        clearInterval(intervalId);
      }
    }, speed);

    // Cleanup function để tránh memory leak khi component unmount
    return () => clearInterval(intervalId);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayedText}
      
      {/* Hiệu ứng con trỏ nhấp nháy */}
      {showCursor && (
        <span className="typing-cursor">|</span>
      )}

      {/* Style nội bộ cho con trỏ (Next.js hỗ trợ style jsx) */}
      <style jsx>{`
        .typing-cursor {
          display: inline-block;
          margin-left: 2px;
          font-weight: 400;
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}