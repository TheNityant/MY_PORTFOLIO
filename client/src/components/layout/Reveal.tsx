import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  delayMs?: number;
  className?: string;
};

export function Reveal({ children, delayMs = 0, className }: RevealProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -6% 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      className={cn("reveal-slot", visible && "reveal-slot--visible", className)}
      style={{ "--reveal-delay": `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
