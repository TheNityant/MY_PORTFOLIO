import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const SWAP_EVERY_MS = 4600;

export function AnimatedHeroName({ name }: { name: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setExpanded((value) => !value);
    }, SWAP_EVERY_MS);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  if (reducedMotion) {
    return <span className="hero-name">{name}</span>;
  }

  const prefix = name === "Nityant" ? "Nit" : name.slice(0, Math.min(3, name.length));
  const suffix = name.slice(prefix.length);

  return (
    <span className="hero-name-shell" aria-label={name}>
      <span className="hero-name hero-name--animated" aria-hidden="true">
        <span>{prefix}</span>
        <motion.span
          className="hero-name-suffix"
          initial={false}
          animate={
            expanded
              ? { clipPath: "inset(0 0% 0 0)", opacity: 1, scaleX: 1, y: 0 }
              : { clipPath: "inset(0 100% 0 0)", opacity: 0, scaleX: 0.82, y: -1 }
          }
          transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "inline-block", transformOrigin: "left bottom" }}
        >
          {suffix}
        </motion.span>
      </span>

      <motion.span
        className="hero-name-stroke"
        aria-hidden="true"
        animate={{
          scaleX: [0.3, 1, 0.55, 1],
          x: ["-4%", "0%", "4%", "0%"],
          opacity: [0.12, 0.42, 0.18, 0.28],
        }}
        transition={{
          duration: 3.2,
          times: [0, 0.34, 0.7, 1],
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />
    </span>
  );
}
