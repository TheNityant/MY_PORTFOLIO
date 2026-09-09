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
const COBE_SCREEN_RADIUS = 0.8;

/** Match cobe's coordinate convention: lng=0 sits on +X. */
function cobeLocationToVec(lat: number, lng: number): [number, number, number] {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  return [cosLat * Math.cos(lngRad), Math.sin(latRad), -cosLat * Math.sin(lngRad)];
}

/** Match cobe's M_theta * M_phi rotation and its 0.8 screen-space globe radius. */
function projectMumbai(phi: number, theta: number, size: number) {
  const [x, y, z] = cobeLocationToVec(MUMBAI.lat, MUMBAI.lng);
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const x1 = cosPhi * x + sinPhi * z;
  const z1 = -sinPhi * x + cosPhi * z;
  const y1 = cosTheta * y - sinTheta * z1;
  const depth = sinTheta * y + cosTheta * z1;
  const center = size / 2;
  const radius = center * COBE_SCREEN_RADIUS;

  return {
    x: center + x1 * radius,
    y: center - y1 * radius,
    visible: depth >= -0.02,
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
  const alpha = Math.min(1, Math.max(0.25, depth + 0.4));
  const glowRadius = 10 * DPR;
  const coreRadius = 3 * DPR;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  glow.addColorStop(0, `rgba(245, 158, 11, ${0.9 * alpha})`);
  glow.addColorStop(0.42, `rgba(245, 158, 11, ${0.38 * alpha})`);
  glow.addColorStop(1, "rgba(245, 158, 11, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(245, 158, 11, ${alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
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
      width: Math.max(1, width * DPR),
      height: Math.max(1, width * DPR),
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
      const renderSize = width * DPR;
      if (overlay.width !== renderSize || overlay.height !== renderSize) {
        overlay.width = renderSize;
        overlay.height = renderSize;
        overlay.style.width = `${width}px`;
        overlay.style.height = `${width}px`;
      }
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
      <canvas ref={overlayRef} className="globe-overlay" aria-hidden="true" />
    </div>
  );
}
