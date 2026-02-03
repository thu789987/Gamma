"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { usePlasmicCanvasContext } from "@plasmicapp/loader-nextjs"; 

interface SmoothScrollProps {
  children: React.ReactNode;
  duration?: number;
  easing?: number;
  wheelMultiplier?: number;
  className?: string;
}

export function SmoothScroll({
  children,
  duration = 1.2,
  wheelMultiplier = 1,
  className
}: SmoothScrollProps) {
  const inEditor = usePlasmicCanvasContext();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // 1. Nếu đang trong Editor của Plasmic thì KHÔNG chạy
    if (inEditor) return;

    // 2. Khởi tạo Lenis (Cấu hình đã sửa cho bản mới nhất)
    const lenis = new Lenis({
      duration: duration,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      
      // 👇 CÁC THAY ĐỔI QUAN TRỌNG Ở ĐÂY:
      orientation: 'vertical',        // Thay cho 'direction'
      gestureOrientation: 'vertical', // Thay cho 'gestureDirection'
      smoothWheel: true,              // Thay cho 'smooth'
      wheelMultiplier: wheelMultiplier,
      touchMultiplier: 2,
      // smoothTouch: false,          // Đã bỏ thuộc tính này, mặc định mobile sẽ dùng native scroll (tốt nhất)
    });
    
    lenisRef.current = lenis;

    // 3. Vòng lặp Animation Frame
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    
    const rafId = requestAnimationFrame(raf);

    // 4. Cleanup
    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, [inEditor, duration, wheelMultiplier]);

  return (
    <div className={className} style={{ width: '100%', minHeight: '100vh' }}>
      {children}
    </div>
  );
}