import React, { useState, useEffect } from "react";
// 1. Giữ nguyên import thư viện
import TextTransition, { presets } from "react-text-transition";

// 2. ĐỔI TÊN function này để không bị trùng (ví dụ: TextRotator)
export default function TextRotator(props: {
  texts?: string[];
  interval?: number;
  className?: string; }) {

  const defaultTexts = ["Nhanh chóng", "Đẹp mắt", "Hiệu quả", "Mượt mà"];
  const textsToDisplay = props.texts || defaultTexts;

  const duration = props.interval || 3000;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIndex((index) => index + 1);
    }, duration);

    return () => clearInterval(intervalId);
  }, [duration]);

  return (
    <div className={props.className} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* 3. Ở đây gọi thư viện TextTransition (màu xanh lá) */}
      <TextTransition springConfig={presets.wobbly}>
        {textsToDisplay[index % textsToDisplay.length]}
      </TextTransition>
    </div>
  );
}