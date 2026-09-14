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
    }

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [phase, reducedMotion]);

  if (reducedMotion) {
    return <span className="hero-name">{name}</span>;
  }

  const measureStyle = {
    position: "absolute" as const,
    left: "-9999px",
    top: 0,
    visibility: "hidden" as const,
    whiteSpace: "nowrap" as const,
    pointerEvents: "none" as const,
  };

  const measureSpans = (
    <>
      <span ref={primaryMeasureRef} className="hero-name" style={measureStyle}>{name}</span>
      <span ref={alternateMeasureRef} className="hero-name" style={measureStyle}>{alternate}</span>
    </>
  );

  /* useLayoutEffect normally gives us these widths before paint. Keeping an
     invisible occupying word here also prevents a one-frame title jump if a
     browser/font takes longer than expected to report its metrics. */
  if (!widths) {
    return (
      <span className="hero-name-shell" aria-label={name}>
        <span className="hero-name" style={{ visibility: "hidden" }}>{name}</span>
        {measureSpans}
      </span>
    );
  }

  const visibleWord = showAlternate ? alternate : name;
  const visibleWidth = showAlternate ? widths.alternate : widths.primary;

  const finishWidthAnimation = () => {
    if (phase === "initial") {
      setPhase("hold");
      return;
    }
    if (phase === "exit") {
      setShowAlternate((value) => !value);
      setPhase("enter");
      return;
    }
    if (phase === "enter") {
      setPhase("hold");
    }
  };

  const targetWidth = phase === "exit" ? 0 : visibleWidth;
  const initialWidth = phase === "initial" || phase === "enter" ? 0 : visibleWidth;

  return (
    <span className="hero-name-shell" aria-label={name}>
      <motion.span
        key={`${visibleWord}-${phase}`}
        className="hero-name-slot"
        data-phase={phase}
        initial={{ width: initialWidth, opacity: phase === "hold" ? 1 : 0.86 }}
        animate={{ width: targetWidth, opacity: phase === "exit" ? 0.84 : 1 }}
        transition={{ duration: (phase === "initial" ? INITIAL_REVEAL_MS : SWAP_MS) / 1000, ease: [0.4, 0, 0.2, 1] }}
        onAnimationComplete={finishWidthAnimation}
      >
        <span className="hero-name hero-name--animated" aria-hidden="true">
          {visibleWord}
        </span>
      </motion.span>
      {measureSpans}
    </span>
  );
}
