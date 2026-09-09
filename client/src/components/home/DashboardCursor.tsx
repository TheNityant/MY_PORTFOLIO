import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { DashboardCursorKind } from "@/data/portfolio";
import { useFinePointer } from "@/hooks/useFinePointer";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const CURSOR_EMOJI: Record<DashboardCursorKind, string> = {
  plane: "✈️",
  hand: "✋",
  laptop: "💻",
  dumbbell: "🏋️",
  clock: "🕐",
  hammer: "🛠️",
  music: "🎵",
  heart: "❤️",
  link: "🔗",
  wrench: "🔧",
};

function wrapAngle(delta: number) {
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

export function DashboardCursorProvider({ children }: { children: ReactNode }) {
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  const cursorRef = useRef<HTMLSpanElement>(null);
  const activeKind = useRef<DashboardCursorKind | null>(null);
  const rafId = useRef(0);
  const pointer = useRef({ x: 0, y: 0, visible: false });
  const velocity = useRef({ vx: 0, vy: 0 });
  const lastSample = useRef({ x: 0, y: 0, t: 0 });
  const angle = useRef(0);
  const angleVel = useRef(0);
  const enabled = finePointer && !reducedMotion;

  useEffect(() => {
    if (!enabled) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const tick = (now: number) => {
      const dt = Math.max(1, now - lastSample.current.t);
      const dx = pointer.current.x - lastSample.current.x;
      const dy = pointer.current.y - lastSample.current.y;

      velocity.current.vx = velocity.current.vx * 0.75 + (dx / dt) * 0.25;
      velocity.current.vy = velocity.current.vy * 0.75 + (dy / dt) * 0.25;

      const speed = Math.hypot(velocity.current.vx, velocity.current.vy);
      const kind = activeKind.current;

      if (kind === "plane") {
        if (speed > 0.02) {
          const target = Math.atan2(velocity.current.vy, velocity.current.vx) + Math.PI / 4;
          const delta = wrapAngle(target - angle.current);
          angleVel.current = (angleVel.current + delta * 0.12) * 0.82;
          angle.current += angleVel.current;
        }
      } else if (speed > 0.02) {
        const lean = Math.max(-0.22, Math.min(0.22, velocity.current.vx * 0.08));
        angle.current = lean;
        angleVel.current = 0;
      }

      const scale = kind === "plane" ? 1 + Math.min(speed * 0.006, 0.12) : 1;
      const rotate = kind === "plane" ? angle.current : angle.current;

      if (pointer.current.visible && kind) {
        cursor.style.opacity = "1";
        cursor.style.transform = `translate3d(${pointer.current.x}px, ${pointer.current.y}px, 0) translate(-50%, -50%) rotate(${rotate}rad) scale(${scale})`;
        cursor.textContent = CURSOR_EMOJI[kind];
        cursor.dataset.kind = kind;
      } else {
        cursor.style.opacity = "0";
      }

      lastSample.current = { x: pointer.current.x, y: pointer.current.y, t: now };
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: PointerEvent) => {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;

      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-cursor-kind]");
      if (target) {
        activeKind.current = target.dataset.cursorKind as DashboardCursorKind;
        pointer.current.visible = true;
      } else {
        pointer.current.visible = false;
        activeKind.current = null;
      }
    };

    const onLeave = () => {
      pointer.current.visible = false;
      activeKind.current = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  return (
    <>
      {children}
      {enabled
        ? createPortal(
            <span ref={cursorRef} className="dashboard-cursor-global" aria-hidden="true" />,
            document.body,
          )
        : null}
    </>
  );
}
