import { useEffect, useRef, type PointerEvent } from "react";
import { profile } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Point = { x: number; y: number };

export function HeroIdentityReveal() {
  const reducedMotion = usePrefersReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const target = useRef<Point>({ x: 52, y: 48 });
  const current = useRef<Point>({ x: 52, y: 48 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const tick = () => {
      const nextX = current.current.x + (target.current.x - current.current.x) * 0.12;
      const nextY = current.current.y + (target.current.y - current.current.y) * 0.12;
      current.current = { x: nextX, y: nextY };

      const node = frameRef.current;
      if (node) {
        node.style.setProperty("--identity-x", `${nextX}%`);
        node.style.setProperty("--identity-y", `${nextY}%`);
      }

      raf.current = window.requestAnimationFrame(tick);
    };

    raf.current = window.requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) window.cancelAnimationFrame(raf.current);
    };
  }, [reducedMotion]);

  const moveTarget = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    target.current = {
      x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  return (
    <div
      ref={frameRef}
      className={`hero-identity-reveal${reducedMotion ? " hero-identity-reveal--static" : ""}`}
      role="img"
      aria-label={profile.portraitAlt}
      onPointerMove={moveTarget}
      onPointerEnter={moveTarget}
      onPointerLeave={() => {
        target.current = { x: 52, y: 48 };
      }}
    >
      <div className="hero-identity-reveal__base" aria-hidden="true">
        <span>{profile.initials}</span>
      </div>
      <div className="hero-identity-reveal__signal" aria-hidden="true">
        <span>{profile.initials}</span>
      </div>
      <div className="hero-identity-reveal__cursor" aria-hidden="true" />
      <div className="hero-identity-reveal__ticks" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
