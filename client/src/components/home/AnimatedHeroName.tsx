import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const INITIAL_REVEAL_MS = 900;
const HOLD_MS = 4200;
const SWAP_MS = 620;

type Phase = "initial" | "hold" | "exit" | "enter";

export function AnimatedHeroName({
  name,
  alternate = "TheNityant",
}: {
  name: string;
  alternate?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("initial");
  const [showAlternate, setShowAlternate] = useState(false);
  const primaryMeasureRef = useRef<HTMLSpanElement>(null);
  const alternateMeasureRef = useRef<HTMLSpanElement>(null);
  const [widths, setWidths] = useState<{ primary: number; alternate: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const primary = primaryMeasureRef.current?.getBoundingClientRect().width;
      const alternateWidth = alternateMeasureRef.current?.getBoundingClientRect().width;
      if (primary && alternateWidth) setWidths({ primary, alternate: alternateWidth });
    };

    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => window.removeEventListener("resize", measure);
  }, [name, alternate]);

  useEffect(() => {
    if (reducedMotion) return;

    let timer: number | undefined;
    if (phase === "initial") {
      timer = window.setTimeout(() => setPhase("hold"), INITIAL_REVEAL_MS);
    } else if (phase === "hold") {
      timer = window.setTimeout(() => setPhase("exit"), HOLD_MS);
    } else if (phase === "enter") {
      timer = window.setTimeout(() => setPhase("hold"), SWAP_MS);
    }

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [phase, reducedMotion]);

  if (reducedMotion) {
    return <span className="hero-name">{name}</span>;
  }

  const visibleWord = showAlternate ? alternate : name;
  const visibleWidth = widths?.[showAlternate ? "alternate" : "primary"];
  const hiddenClip = "inset(0 100% 0 0)";
  const shownClip = "inset(0 0% 0 0)";

  const finishExit = () => {
    if (phase !== "exit") return;
    setShowAlternate((value) => !value);
    setPhase("enter");
  };

  const measureStyle = {
    position: "absolute" as const,
    left: "-9999px",
    top: 0,
    visibility: "hidden" as const,
    whiteSpace: "nowrap" as const,
    pointerEvents: "none" as const,
  };

  if (phase === "initial") {
    return (
      <span className="hero-name-shell" aria-label={name}>
        <motion.span
          className="hero-name hero-name--animated"
          aria-hidden="true"
          initial={{ clipPath: hiddenClip }}
          animate={{ clipPath: shownClip }}
          transition={{ duration: INITIAL_REVEAL_MS / 1000, ease: [0.6, 0.05, 0.3, 1] }}
        >
          {name}
        </motion.span>
        <span ref={primaryMeasureRef} className="hero-name" style={measureStyle}>{name}</span>
        <span ref={alternateMeasureRef} className="hero-name" style={measureStyle}>{alternate}</span>
      </span>
    );
  }

  return (
    <span className="hero-name-shell" aria-label={name}>
      <motion.span
        className="hero-name-slot"
        initial={phase === "enter" && widths ? { width: 0 } : undefined}
        animate={widths ? { width: phase === "exit" ? 0 : visibleWidth } : undefined}
        transition={{ duration: SWAP_MS / 1000, ease: "easeInOut" }}
        onAnimationComplete={finishExit}
      >
        <motion.span
          key={`${visibleWord}-${phase}`}
          className="hero-name hero-name--animated"
          aria-hidden="true"
          initial={{ clipPath: phase === "enter" ? hiddenClip : shownClip }}
          animate={{ clipPath: phase === "exit" ? hiddenClip : shownClip }}
          transition={{ duration: SWAP_MS / 1000, ease: "easeInOut" }}
        >
          {visibleWord}
        </motion.span>
      </motion.span>

      <span ref={primaryMeasureRef} className="hero-name" style={measureStyle}>{name}</span>
      <span ref={alternateMeasureRef} className="hero-name" style={measureStyle}>{alternate}</span>
    </span>
  );
}
