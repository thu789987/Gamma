"use client";

import React, { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  yOffset?: number;
}

export function RevealOnScroll({
  children,
  className,
  duration = 0.8,
  delay = 0,
  yOffset = 50
}: RevealOnScrollProps) {
  // 1. Tạo Ref để theo dõi cái khung bao ngoài
  const ref = useRef(null);
  
  // 2. Dùng Hook để kiểm tra xem khung bao ngoài đã vào màn hình chưa
  // once: true -> Chỉ chạy 1 lần
  // amount: 0.1 -> Chỉ cần lú ra 10% là báo tín hiệu ngay
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  // 3. Công cụ điều khiển Animation thủ công
  const mainControls = useAnimation();

  // 4. Lắng nghe thay đổi: Khi vừa thấy (isInView = true) -> Ra lệnh chạy ngay
  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
    }
  }, [isInView, mainControls]);

  return (
    // Cái thẻ div này đóng vai trò là "cảm biến" vị trí (Sensor)
    <div ref={ref} className={className} style={{ position: "relative", overflow: "visible" }}>
      <motion.div
        // 5. Cài đặt các trạng thái biến thiên
        variants={{
          hidden: { opacity: 0, y: yOffset },
          visible: { opacity: 1, y: 0 }
        }}

        // 6. QUAN TRỌNG: Gán cứng trạng thái ban đầu là "hidden"
        initial="hidden"
        
        // 7. Animation sẽ nghe lệnh từ biến mainControls (thay vì tự động)
        animate={mainControls}

        // 8. Cấu hình độ mượt
        transition={{ 
          duration: duration, 
          delay: delay,
          ease: [0.25, 0.25, 0, 1] // Ease Out Cubic (Mượt mà)
        }}
        
        // Fix lỗi CSS: Đảm bảo phần tử block chiếm đủ không gian
        style={{ width: "100%" }} 
      >
        {children}
      </motion.div>
    </div>
  );
}