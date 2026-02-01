import React, { useState, useEffect } from 'react';

// Định nghĩa Interface rõ ràng để tránh lỗi "Unexpected any"
interface TypingAnimationProps {
  text?: string;
  speed?: number;     // Tốc độ gõ (ms)
  delay?: number;     // Thời gian chờ trước khi xóa (ms)
  className?: string; // Class CSS
}

export default function TypingAnimation({
  text = 'Welcome to Plasmic',
  speed = 100,
  delay = 2000,
  className = '',
}: TypingAnimationProps) {
  
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(speed);

  useEffect(() => {
    // Xử lý logic gõ/xóa
    const handleTyping = () => {
      const fullText = text;
      
      // Xác định text hiện tại dựa trên trạng thái đang gõ hay đang xóa
      setCurrentText(prev => 
        isDeleting 
          ? fullText.substring(0, prev.length - 1) 
          : fullText.substring(0, prev.length + 1)
      );

      // Tự điều chỉnh tốc độ
      setTypingSpeed(isDeleting ? speed / 2 : speed);

      // Kịch bản 1: Đã gõ xong toàn bộ chữ
      if (!isDeleting && currentText === fullText) {
        setTimeout(() => setIsDeleting(true), delay); // Chờ một chút rồi xóa
      } 
      // Kịch bản 2: Đã xóa hết sạch
      else if (isDeleting && currentText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1); // Bắt đầu vòng lặp mới
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);

    // Cleanup function để tránh memory leak
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, loopNum, text, speed, delay, typingSpeed]);

  return (
    <span className={className}>
      {currentText}
      <span className="cursor">|</span>

      {/* CSS cho con trỏ nhấp nháy */}
      <style jsx>{`
        .cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink 1s step-end infinite;
          font-weight: 100;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}