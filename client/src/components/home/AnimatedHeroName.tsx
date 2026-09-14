import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const INITIAL_REVEAL_MS = 900;
const HOLD_MS = 4200;
const SWAP_MS = 620;
const CLIP_REVEALED = "inset(-0.12em -0.18em -0.55em 0)";
const CLIP_CLIPPED = "inset(-0.12em 100% -0.55em 0)";

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
    if (reducedMotion || phase !== "hold") return;
    const timer = window.setTimeout(() => setPhase("exit"), HOLD_MS);
    return () => window.clearTimeout(timer);
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
    paddingBottom: "0.5em",
    marginBottom: "-0.5em",
  };

  const measureSpans = (
    <>
      <span ref={primaryMeasureRef} className="hero-name" style={measureStyle}>{name}</span>
      <span ref={alternateMeasureRef} className="hero-name" style={measureStyle}>{alternate}</span>
    </>
  );

  if (!widths) {
    return (
      <span className="hero-name-shell" aria-label={name}>
        <span className="hero-name" style={{ visibility: "hidden", paddingBottom: "0.5em", marginBottom: "-0.5em" }}>{name}</span>
        {measureSpans}
      </span>
    );
  }

  const visibleWord = showAlternate ? alternate : name;
  const visibleWidth = showAlternate ? widths.alternate : widths.primary;
  const slotInitialWidth = phase === "enter" ? 0 : visibleWidth;
  const slotTargetWidth = phase === "exit" ? 0 : visibleWidth;
  const innerInitialClip = phase === "initial" || phase === "enter" ? CLIP_CLIPPED : CLIP_REVEALED;
  const innerTargetClip = phase === "exit" ? CLIP_CLIPPED : CLIP_REVEALED;
  const duration = phase === "initial" ? INITIAL_REVEAL_MS / 1000 : SWAP_MS / 1000;

  const finishAnimation = () => {
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

  return (
    <span className="hero-name-shell" aria-label={name}>
      <motion.span
        key={`${visibleWord}-${phase}-slot`}
        className="hero-name-slot"
        data-phase={phase}
        initial={{ width: slotInitialWidth }}
        animate={{ width: slotTargetWidth }}
        transition={{ duration, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.span
          key={`${visibleWord}-${phase}-word`}
          className="hero-name hero-name--animated"
          initial={{ clipPath: innerInitialClip, opacity: phase === "initial" || phase === "enter" ? 0.9 : 1 }}
          animate={{ clipPath: innerTargetClip, opacity: phase === "exit" ? 0.88 : 1 }}
          transition={{ duration, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={phase === "hold" ? undefined : finishAnimation}
          aria-hidden="true"
        >
          {visibleWord}
        </motion.span>
      </motion.span>
      {measureSpans}
    </span>
  );
}
