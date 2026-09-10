import createGlobe from "cobe";
import { useEffect, useRef, type PointerEvent } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { profile } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

const DRAG_DAMPING = 1400;
const PHI_IDLE = 0.005;
const THETA_TARGET = 0.4;
const THETA_MIN = 0.12;
const THETA_MAX = 0.55;
const INERTIA_DECAY = 0.92;
const SPRING = 0.14;
const DPR = 2;
const MUMBAI_MARKER = {
  location: [profile.locationLat, profile.locationLng] as [number, number],
  size: 0.085,
};

export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerId = useRef<number | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const phiRef = useRef(2.45);
  const thetaRef = useRef(THETA_TARGET);
  const dragPhi = useRef(0);
  const dragTheta = useRef(0);
  const dragVelPhi = useRef(0);
  const dragVelTheta = useRef(0);
  const { theme } = useTheme();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = canvas.offsetWidth;
    let frameId = 0;
    const isDark = theme === "dark";

    const globe = createGlobe(canvas, {
      devicePixelRatio: DPR,
      width: Math.max(1, width * DPR),
      height: Math.max(1, width * DPR),
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: isDark ? 1 : 0,
      diffuse: isDark ? 0.5 : 0.62,
      mapSamples: 22000,
      mapBrightness: isDark ? 1.2 : 1.35,
      baseColor: (isDark ? [0.8, 0.9, 1.2] : [0.96, 0.97, 0.99]) as [number, number, number],
      markerColor: [245 / 255, 158 / 255, 11 / 255],
      glowColor: isDark ? [1, 1, 1] : [0.9, 0.92, 0.95],
      markers: [MUMBAI_MARKER],
      scale: 1,
    });

    const onResize = () => {
      width = canvas.offsetWidth;
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      if (pointerId.current === null && !reducedMotion) {
        phiRef.current += PHI_IDLE;
      }

      if (pointerId.current === null) {
        dragVelPhi.current *= INERTIA_DECAY;
        dragVelTheta.current *= INERTIA_DECAY;
      }

      dragPhi.current += (dragVelPhi.current - dragPhi.current) * SPRING;
      dragTheta.current += (dragVelTheta.current - dragTheta.current) * SPRING;

      thetaRef.current = Math.min(
        THETA_MAX,
        Math.max(THETA_MIN, thetaRef.current + dragTheta.current),
      );
      dragTheta.current *= 0.82;

      const renderWidth = Math.max(1, width * DPR);
      globe.update({
        phi: phiRef.current + dragPhi.current,
        theta: thetaRef.current,
        width: renderWidth,
        height: renderWidth,
      });
      frameId = requestAnimationFrame(tick);
    };

    canvas.style.opacity = "1";
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [reducedMotion, theme]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerId.current = event.pointerId;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerId.current === null) return;
    const dx = event.clientX - lastPointer.current.x;
    const dy = event.clientY - lastPointer.current.y;
    dragVelPhi.current -= dx / DRAG_DAMPING;
    dragVelTheta.current -= dy / DRAG_DAMPING;
    lastPointer.current = { x: event.clientX, y: event.clientY };
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerId.current === null) return;
    if (event.currentTarget.hasPointerCapture(pointerId.current)) {
      event.currentTarget.releasePointerCapture(pointerId.current);
    }
    pointerId.current = null;
  };

  return (
    <div
      className={cn("globe-stage", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <canvas ref={canvasRef} className="globe-canvas" aria-hidden="true" />
    </div>
  );
}
