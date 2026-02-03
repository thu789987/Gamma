import React, { useState, useEffect } from 'react';

interface ScrollWrapperProps {
  children: React.ReactNode;
  threshold?: number; // Cuộn bao nhiêu px thì bắt đầu đổi? (Mặc định 50px)
  className?: string; // Để Plasmic truyền style layout vào
}

const ScrollWrapper: React.FC<ScrollWrapperProps> = ({ 
  children, 
  threshold = 50,
  className 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Nếu vị trí cuộn > ngưỡng threshold thì set là true
      setIsScrolled(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return (
    <div 
      className={`${className} ${isScrolled ? 'is-scrolled' : ''}`}
      style={{ transition: 'all 0.3s ease' }} // Thêm hiệu ứng chuyển đổi mượt
    >
      {children}
    </div>
  );
};

export default ScrollWrapper;