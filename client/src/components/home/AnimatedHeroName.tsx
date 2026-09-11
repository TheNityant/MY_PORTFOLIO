import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const INITIAL_REVEAL_MS = 1050;
const HOLD_MS = 5000;
const REDRAW_MS = 620;

type NamePhase = "initial" | "hold" | "erase" | "redraw";

export function AnimatedHeroName({ name }: { name: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<NamePhase>("initial");

  useEffect(() => {
    if (reducedMotion) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    if (phase === "initial") {
      timer = setTimeout(() => setPhase("hold"), INITIAL_REVEAL_MS);
    } else if (phase === "hold") {
      timer = setTimeout(() => setPhase("erase"), HOLD_MS);
    } else if (phase === "erase") {
      timer = setTimeout(() => setPhase("redraw"), REDRAW_MS);
    } else if (phase === "redraw") {
      timer = setTimeout(() => setPhase("hold"), REDRAW_MS);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase, reducedMotion]);

  if (reducedMotion) {
    return <span className="hero-name">{name}</span>;
  }

  const clipPath = phase === "erase" ? "inset(0 100% 0 0)" : "inset(0 0% 0 0)";
  const initialClip = phase === "initial" || phase === "redraw" ? "inset(0 100% 0 0)" : undefined;
  const duration = phase === "initial" ? INITIAL_REVEAL_MS / 1000 : REDRAW_MS / 1000;

  return (
    <span className="hero-name-shell" aria-label={name}>
      <motion.span
        key={phase}
        aria-hidden="true"
        className="hero-name hero-name--animated"
        initial={initialClip ? { clipPath: initialClip, opacity: 0.88 } : false}
        animate={{ clipPath, opacity: phase === "erase" ? 0.72 : 1 }}
        transition={{
          duration,
          ease: phase === "erase" ? [0.7, 0, 0.84, 0] : [0.16, 1, 0.3, 1],
        }}
      >
        {name}
      </motion.span>
      <span className="hero-name-stroke" aria-hidden="true" />
    </span>
  );
}
