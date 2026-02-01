import React, { useEffect, useState } from "react";

type Props = {
  texts?: string[];
  speed?: number;
  textColor?: string;
};

export const TypingAnimation: React.FC<Props> = ({
  texts = ["Sáng tạo", "Chuyên nghiệp", "Tận tâm"],
  speed = 50,
  textColor,
}) => {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const arr = Array.isArray(texts) ? texts : [String(texts)];
    const current = arr[index % arr.length] ?? "";
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (!isDeleting && display.length < current.length) {
      timer = setTimeout(() => setDisplay(current.slice(0, display.length + 1)), speed);
    } else if (!isDeleting && display.length === current.length) {
      timer = setTimeout(() => setIsDeleting(true), 800);
    } else if (isDeleting && display.length > 0) {
      timer = setTimeout(() => setDisplay(current.slice(0, display.length - 1)), Math.max(20, Math.floor(speed / 2)));
    } else if (isDeleting && display.length === 0) {
      timer = setTimeout(() => {
        setIsDeleting(false);
        setIndex((i) => (i + 1) % arr.length);
      }, 200);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [display, isDeleting, index, texts, speed]);

  return <span style={{ color: textColor || undefined }}>{display}</span>;
};

export default TypingAnimation;
