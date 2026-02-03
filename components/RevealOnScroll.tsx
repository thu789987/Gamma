"use client"; // 👈 QUAN TRỌNG: Dòng này giúp Animation chạy đúng trên trình duyệt

import React from "react";
import { motion } from "framer-motion";

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
  return (
    <div className={className} style={{ overflow: 'hidden' }}>
      <motion.div
        // 1. Định nghĩa trạng thái Ẩn (Hidden) và Hiện (Visible)
        variants={{
          hidden: { opacity: 0, y: yOffset },
          visible: { opacity: 1, y: 0 }
        }}

        // 2. Gán trạng thái ban đầu là 'hidden'
        initial="hidden"

        // 3. Khi lọt vào khung hình thì chuyển sang 'visible'
        whileInView="visible"

        // 4. CẤU HÌNH LẠI VIEWPORT (Quan trọng)
        viewport={{ 
          once: true,    // Chỉ chạy 1 lần
          amount: 0.3,   // 👇 Phải nhìn thấy 30% nội dung mới bắt đầu chạy (tránh chạy sớm)
          margin: "0px 0px -50px 0px" // Thụt lề dưới một chút để chắc chắn người dùng đang cuộn xuống
        }}

        // 5. Cấu hình chuyển động
        transition={{ 
          duration: duration, 
          delay: delay, 
          ease: "easeOut" // Dùng easeOut mặc định cho mượt
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}