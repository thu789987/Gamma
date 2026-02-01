import React, { useState, useEffect } from 'react';

interface TypingAnimationProps {
  /** Danh sách từ khóa, ngăn cách nhau bởi dấu phẩy. VD: "UI/UX, SEO, Branding" */
  text?: string;
  speed?: number;     // Tốc độ gõ (ms)
  delay?: number;     // Thời gian chờ trước khi xóa (ms)
  className?: string; // Class CSS
}

export default function TypingAnimation({
  text = 'UI/UX, Brand Identity, SEO, Web Development', // Giá trị mặc định
  speed = 100,
  delay = 2000,
  className = '',
}: TypingAnimationProps) {
  
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Biến đếm xem đang gõ đến từ thứ mấy trong danh sách
  const [loopNum, setLoopNum] = useState(0); 
  const [typingSpeed, setTypingSpeed] = useState(speed);

  useEffect(() => {
    // 1. Tách chuỗi đầu vào thành mảng các từ
    // Ví dụ: "UI/UX, SEO" -> ["UI/UX", "SEO"]
    const words = text ? text.split(',').map(w => w.trim()) : [''];
    
    // 2. Xác định từ hiện tại cần gõ dựa trên loopNum
    // Dùng toán tử % để lặp lại vòng tròn (0, 1, 2 -> 0, 1, 2...)
    const i = loopNum % words.length;
    const fullText = words[i];

    const handleTyping = () => {
      // Logic gõ / xóa
      setCurrentText(prev => 
        isDeleting 
          ? fullText.substring(0, prev.length - 1) 
          : fullText.substring(0, prev.length + 1)
      );

      // Tốc độ: Khi xóa thì chạy nhanh gấp đôi cho mượt
      setTypingSpeed(isDeleting ? speed / 2 : speed);

      // Kịch bản A: Đã gõ xong từ hiện tại -> Chờ chút rồi xóa
      if (!isDeleting && currentText === fullText) {
        setTimeout(() => setIsDeleting(true), delay);
      } 
      // Kịch bản B: Đã xóa sạch sành sanh -> Chuyển sang từ tiếp theo
      else if (isDeleting && currentText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1); // Tăng index để lấy từ tiếp theo
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, loopNum, text, speed, delay, typingSpeed]);

  return (
    <span className={className}>
      {currentText}
      <span className="cursor">|</span>

      <style jsx>{`
        .cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink 1s step-end infinite;
          font-weight: 100;
          color: inherit; /* Theo màu chữ của cha */
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}