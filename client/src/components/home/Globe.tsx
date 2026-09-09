import createGlobe from "cobe";
import { useEffect, useRef, type PointerEvent } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { profile } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

const MUMBAI = { lat: profile.locationLat, lng: profile.locationLng };
const DRAG_DAMPING = 1400;
const PHI_IDLE = 0.005;
const THETA_TARGET = 0.4;
const THETA_MIN = 0.12;
const THETA_MAX = 0.55;
const INERTIA_DECAY = 0.92;
const SPRING = 0.14;
const DPR = 2;

/** Match cobe v2 internal lat/lng → unit sphere conversion. */
function cobeLocationToVec(lat: number, lng: number): [number, number, number] {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(latRad);
  return [-cosLat * Math.cos(lngRad), Math.sin(latRad), cosLat * Math.sin(lngRad)];
}

/** Match cobe v2 marker screen projection (normalized → render pixels). */
function projectMumbai(phi: number, theta: number, size: number) {
  const [tx, ty, tz] = cobeLocationToVec(MUMBAI.lat, MUMBAI.lng);
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const c = cosPhi * tx + sinPhi * tz;
  const s = sinPhi * sinTheta * tx + cosTheta * ty - cosPhi * sinTheta * tz;
  const depth = -sinPhi * cosTheta * tx + sinTheta * ty + cosPhi * cosTheta * tz;
  return {
    x: ((c + 1) / 2) * size,
    y: ((-s + 1) / 2) * size,
    visible: depth >= 0,
    depth,
  };
}

function drawMumbaiGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  visible: boolean,
  depth: number,
) {
  if (!visible) return;
  const alpha = Math.min(1, Math.max(0.2, depth * 1.35));
  const glowRadius = 10 * DPR;
  const coreRadius = 2.75 * DPR;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  glow.addColorStop(0, `rgba(255, 228, 190, ${0.9 * alpha})`);
  glow.addColorStop(0.28, `rgba(255, 176, 96, ${0.5 * alpha})`);
  glow.addColorStop(0.62, `rgba(255, 140, 70, ${0.16 * alpha})`);
  glow.addColorStop(1, "rgba(255, 140, 70, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 252, 244, ${0.98 * alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 168, 72, ${0.85 * alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, coreRadius * 0.55, 0, Math.PI * 2);
  ctx.fill();
}

export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
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
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    let width = canvas.offsetWidth;
    let frameId = 0;
    const isDark = theme === "dark";

    const globe = createGlobe(canvas, {
      devicePixelRatio: DPR,
      width: Math.max(1, width * 2),
      height: Math.max(1, width * 2),
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: isDark ? 1 : 0,
      diffuse: isDark ? 0.5 : 0.62,
      mapSamples: 22000,
      mapBrightness: isDark ? 1.2 : 1.35,
      baseColor: (isDark ? [0.8, 0.9, 1.2] : [0.96, 0.97, 0.99]) as [number, number, number],
      markerColor: [0.98, 0.99, 1],
      glowColor: isDark ? [1, 1, 1] : [0.9, 0.92, 0.95],
      markers: [],
      scale: 1,
    });

    const paintOverlay = () => {
      const octx = overlay.getContext("2d");
      if (!octx || width <= 0) return;
      const renderSize = width * 2;
      overlay.width = renderSize;
      overlay.height = renderSize;
      overlay.style.width = `${width}px`;
      overlay.style.height = `${width}px`;
      octx.clearRect(0, 0, renderSize, renderSize);
      const projected = projectMumbai(
        phiRef.current + dragPhi.current,
        thetaRef.current,
        renderSize,
      );
      drawMumbaiGlow(octx, projected.x, projected.y, projected.visible, projected.depth);
    };

    const onResize = () => {
      width = canvas.offsetWidth;
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      if (!pointerId.current && !reducedMotion) {
        phiRef.current += PHI_IDLE;
      }

      if (!pointerId.current) {
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

      const renderWidth = Math.max(1, width * 2);
      globe.update({
        phi: phiRef.current + dragPhi.current,
        theta: thetaRef.current,
        width: renderWidth,
        height: renderWidth,
      });
      paintOverlay();
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
    event.currentTarget.style.cursor = "grabbing";
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
    event.currentTarget.releasePointerCapture(pointerId.current);
    pointerId.current = null;
    event.currentTarget.style.cursor = "grab";
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
      <canvas ref={overlayRef} className="globe-overlay" aria-hidden="true" />
    </div>
  );
}
