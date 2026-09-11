import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const REPLAY_EVERY_MS = 5200;

export function AnimatedHeroName({ name }: { name: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const [cycle, setCycle] = useState(0);
  const letters = useMemo(() => Array.from(name), [name]);

  useEffect(() => {
    if (reducedMotion) return;

    const interval = window.setInterval(() => {
      setCycle((value) => value + 1);
    }, REPLAY_EVERY_MS);

    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  if (reducedMotion) {
    return <span className="hero-name">{name}</span>;
  }

  return (
    <span className="hero-name-shell" aria-label={name}>
      <motion.span
        key={`name-cycle-${cycle}`}
        aria-hidden="true"
        className="hero-name hero-name--animated"
        initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0.35 }}
        animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {letters.map((letter, index) => (
          <motion.span
            key={`${cycle}-${index}-${letter}`}
            className="hero-name-letter"
            initial={{ y: 9, rotate: -2.5, opacity: 0, filter: "blur(3px)" }}
            animate={{ y: 0, rotate: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{
              delay: 0.05 + index * 0.055,
              duration: 0.42,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
        ))}
      </motion.span>

      <motion.span
        key={`stroke-cycle-${cycle}`}
        className="hero-name-stroke"
        aria-hidden="true"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1, 1], opacity: [0, 0.42, 0.18] }}
        transition={{ duration: 1.15, times: [0, 0.72, 1], ease: "easeOut" }}
      />
    </span>
  );
}
