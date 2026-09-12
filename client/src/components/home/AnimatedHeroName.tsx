import { motion } from "framer-motion";
import { useMemo } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function AnimatedHeroName({ name }: { name: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const letters = useMemo(() => Array.from(name), [name]);

  if (reducedMotion) {
    return <span className="hero-name">{name}</span>;
  }

  return (
    <span className="hero-name-shell" aria-label={name}>
      <motion.span
        aria-hidden="true"
        className="hero-name hero-name--animated"
        initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0.4 }}
        animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
        transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
      >
        {letters.map((letter, index) => (
          <motion.span
            key={`${index}-${letter}`}
            className="hero-name-letter"
            initial={{ y: 10, rotate: -2.5, opacity: 0 }}
            animate={{
              y: [0, -2.8, 1.2, 0],
              rotate: [0, -1.8, 1.15, 0],
              scale: [1, 1.018, 0.995, 1],
              opacity: [1, 0.88, 1, 1],
            }}
            transition={{
              delay: 0.06 + index * 0.085,
              duration: 2.65,
              times: [0, 0.34, 0.68, 1],
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
        ))}
      </motion.span>

      <motion.span
        className="hero-name-stroke"
        aria-hidden="true"
        animate={{
          scaleX: [0.35, 1, 0.58, 1],
          x: ["-5%", "0%", "5%", "0%"],
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
