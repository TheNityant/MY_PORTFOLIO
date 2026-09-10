import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import styles from "./tracingBeam.module.css";

export function TracingBeam({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const update = () => setHeight(content.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const y1Raw = useTransform(scrollYProgress, [0, 0.8], [50, Math.max(50, height)]);
  const y2Raw = useTransform(scrollYProgress, [0, 1], [50, Math.max(50, height - 200)]);
  const y1 = useSpring(y1Raw, { stiffness: 500, damping: 90 });
  const y2 = useSpring(y2Raw, { stiffness: 500, damping: 90 });
  const path = `M 1 0V -36 l 18 24 V ${height * 0.8} l -18 24V ${height}`;

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.beam} aria-hidden="true">
        <div className={styles.origin}>
          <span />
        </div>
        {height > 0 ? (
          <svg viewBox={`0 0 20 ${height}`} width="20" height={height} className={styles.svg}>
            <path d={path} fill="none" stroke="#9091A0" strokeOpacity="0.16" />
            {!reducedMotion ? (
              <motion.path d={path} fill="none" stroke="url(#experience-beam-gradient)" strokeWidth="1.25" />
            ) : null}
            <defs>
              <motion.linearGradient
                id="experience-beam-gradient"
                gradientUnits="userSpaceOnUse"
                x1="0"
                x2="0"
                y1={reducedMotion ? 50 : y1}
                y2={reducedMotion ? Math.max(50, height - 200) : y2}
              >
                <stop stopColor="#5dd9ff" stopOpacity="0" />
                <stop stopColor="#ffe499" />
                <stop offset="0.225" stopOpacity="0.9" stopColor="#ffb0fc" />
                <stop offset="0.325" stopColor="#8c7aff" />
                <stop offset="1" stopColor="#7ddfff" stopOpacity="0" />
              </motion.linearGradient>
            </defs>
          </svg>
        ) : null}
      </div>
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
