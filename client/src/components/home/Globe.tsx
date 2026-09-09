import createGlobe from "cobe";
import { useEffect, useRef, type PointerEvent } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { profile } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

const MUMBAI = { lat: profile.locationLat, lng: profile.locationLng };
const DRAG_DAMPING = 900;
const THETA_MIN = 0.12;
const THETA_MAX = 0.55;

type GlobeState = {
  phi?: number;
  theta?: number;
  width?: number;
  height?: number;
};

export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerId = useRef<number | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const dragPhi = useRef(0);
  const dragTheta = useRef(0);
  const { theme } = useTheme();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = 0;
    let phi = 2.45;
    let theta = 0.28;
    let globe: { destroy: () => void } | null = null;
    const isDark = theme === "dark";
    const samples = window.matchMedia("(max-width: 899px)").matches ? 12000 : 16000;

    const onResize = () => {
      width = canvas.offsetWidth;
    };
    window.addEventListener("resize", onResize);
    onResize();

    globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(2, window.devicePixelRatio || 1),
      width: width * 2,
      height: width * 2,
      phi,
      theta,
      dark: isDark ? 1 : 0,
      diffuse: isDark ? 3 : 0.62,
      mapSamples: samples,
      mapBrightness: isDark ? 2.6 : 1.35,
      baseColor: (isDark ? [0.75, 0.8, 0.9] : [0.96, 0.97, 0.99]) as [number, number, number],
      markerColor: [0.98, 0.99, 1],
      glowColor: isDark ? [0.06, 0.07, 0.1] : [0.9, 0.92, 0.95],
      markers: [{ location: [MUMBAI.lat, MUMBAI.lng], size: 0.08 }],
      scale: 1,
      onRender: (state: GlobeState) => {
        if (!pointerId.current && !reducedMotion) phi += 0.0032;
        dragPhi.current *= pointerId.current ? 1 : 0.94;
        dragTheta.current *= pointerId.current ? 1 : 0.94;
        state.phi = phi + dragPhi.current;
        theta = Math.min(THETA_MAX, Math.max(THETA_MIN, theta + dragTheta.current));
        state.theta = theta;
        state.width = width * 2;
        state.height = width * 2;
      },
    } as Parameters<typeof createGlobe>[1]);

    canvas.style.opacity = "1";

    return () => {
      globe?.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [reducedMotion, theme]);

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    pointerId.current = event.pointerId;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.style.cursor = "grabbing";
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (pointerId.current === null) return;
    const dx = event.clientX - lastPointer.current.x;
    const dy = event.clientY - lastPointer.current.y;
    dragPhi.current -= dx / DRAG_DAMPING;
    dragTheta.current -= dy / DRAG_DAMPING;
    lastPointer.current = { x: event.clientX, y: event.clientY };
  };

  const endDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    if (pointerId.current === null) return;
    event.currentTarget.releasePointerCapture(pointerId.current);
    pointerId.current = null;
    event.currentTarget.style.cursor = "grab";
  };

  return (
    <div className={cn("globe-stage", className)}>
      <canvas
        ref={canvasRef}
        className="globe-canvas"
        aria-hidden="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </div>
  );
}
