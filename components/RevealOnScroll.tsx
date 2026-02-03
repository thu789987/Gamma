import React from "react";
import { motion } from "framer-motion";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string; // Để Plasmic truyền style layout vào
  duration?: number;  // Thời gian chạy animation (giây)
  delay?: number;     // Độ trễ (giây)
  yOffset?: number;   // Khoảng cách trồi lên (mặc định 50px)
}

export function RevealOnScroll({
  children,
  className,
  duration = 0.8,
  delay = 0,
  yOffset = 50
}: RevealOnScrollProps) {
  return (
    <div className={className} style={{ overflow: 'hidden' }}>
      <motion.div
        // 1. Trạng thái ban đầu (Ẩn + Dịch xuống dưới)
        initial={{ opacity: 0, y: yOffset }}
        
        // 2. Trạng thái khi lọt vào màn hình (Hiện + Về vị trí cũ)
        whileInView={{ opacity: 1, y: 0 }}
        
        // 3. Cấu hình Viewport
        viewport={{ 
          once: true,   // Chỉ chạy 1 lần duy nhất
          margin: "-10% 0px -10% 0px" // Thụt vào 10% màn hình mới bắt đầu chạy (để đỡ bị chạy sớm quá)
        }}
        
        // 4. Cấu hình chuyển động
        transition={{ 
          duration: duration, 
          delay: delay, 
          ease: [0.25, 0.25, 0, 1] // Ease Out Cubic (mượt mà)
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}