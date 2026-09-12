import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const SWAP_EVERY_MS = 4600;

export function AnimatedHeroName({ name }: { name: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const variants = useMemo(() => [name, name === "Nityant" ? "TheNityant" : `The${name}`], [name]);
  const [variantIndex, setVariantIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setVariantIndex((value) => (value + 1) % variants.length);
    }, SWAP_EVERY_MS);
    return () => window.clearInterval(interval);
  }, [reducedMotion, variants.length]);

  if (reducedMotion) {
    return <span className="hero-name">{name}</span>;
  }

  const current = variants[variantIndex];

  return (
    <span className="hero-name-shell" aria-label={name}>
      <AnimatePresence mode="wait" initial>
        <motion.span
          key={current}
          aria-hidden="true"
          className="hero-name hero-name--animated"
          initial={{ clipPath: "inset(0 100% 0 0)", y: 4, opacity: 0.25 }}
          animate={{ clipPath: "inset(0 0% 0 0)", y: 0, opacity: 1 }}
          exit={{ clipPath: "inset(0 0 0 100%)", y: -3, opacity: 0.2 }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        >
          {current}
        </motion.span>
      </AnimatePresence>

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
