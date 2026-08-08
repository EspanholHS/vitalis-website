"use client";

import type { CSSProperties, HTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";

type RevealVariant = "fade-up" | "slide-left" | "slide-right" | "scale-soft";

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  delay?: number;
  variant?: RevealVariant;
};

export function Reveal({
  children,
  className,
  delay = 0,
  variant = "fade-up",
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.16 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-variant={variant}
      className={["reveal", isVisible ? "is-visible" : "", className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}
