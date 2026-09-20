import createGlobe from "cobe";
import { useEffect, useRef, type PointerEvent } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { profile } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

const DRAG_DAMPING = 1400;
const PHI_IDLE = 0.0062;
const THETA_TARGET = 0.4;
const THETA_MIN = 0.12;
const THETA_MAX = 0.55;
const INERTIA_DECAY = 0.92;
const SPRING = 0.14;
const MUMBAI = {
  lat: profile.locationLat,
  lng: profile.locationLng,
};

function toSphereVector(lat: number, lng: number) {
  const latR = (lat * Math.PI) / 180;
  const lngR = (lng * Math.PI) / 180;
  const cosLat = Math.cos(latR);

  return {
    x: cosLat * Math.cos(lngR),
    y: Math.sin(latR),
    z: -cosLat * Math.sin(lngR),
  };
}

function projectSpherePoint(
  point: { x: number; y: number; z: number },
  phi: number,
  theta: number,
) {
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  const x1 = cosPhi * point.x + sinPhi * point.z;
  const y1 = point.y;
  const z1 = -sinPhi * point.x + cosPhi * point.z;

  return {
    x: x1,
    y: cosTheta * y1 - sinTheta * z1,
    z: sinTheta * y1 + cosTheta * z1,
  };
}

const MUMBAI_VECTOR = toSphereVector(MUMBAI.lat, MUMBAI.lng);

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
    let idleTimer = 0;
    let visible = true;
    const isDark = theme === "dark";
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, coarsePointer ? 1 : 2);
    const mapSamples = coarsePointer ? 8000 : 22000;
    const minFrameInterval = coarsePointer ? 66 : 0;
    let lastRender = 0;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: Math.max(1, width * dpr),
      height: Math.max(1, width * dpr),
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: isDark ? 1 : 0,
      diffuse: isDark ? 0.5 : 0.62,
      mapSamples,
      mapBrightness: isDark ? 1.2 : 1.35,
      baseColor: (isDark ? [0.8, 0.9, 1.2] : [0.96, 0.97, 0.99]) as [number, number, number],
      markerColor: [1, 1, 1],
      glowColor: isDark ? [1, 1, 1] : [0.9, 0.92, 0.95],
      markers: [],
      scale: 1,
    });

    const drawMumbaiMarker = (phi: number, theta: number) => {
      const ctx = overlay.getContext("2d");
      if (!ctx || width <= 0) return;

      const renderSize = Math.max(1, width * dpr);
      if (overlay.width !== renderSize || overlay.height !== renderSize) {
        overlay.width = renderSize;
        overlay.height = renderSize;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, width);

      const projected = projectSpherePoint(MUMBAI_VECTOR, phi, theta);
      if (projected.z < -0.02) return;

      const radius = (width / 2) * 0.8;
      const x = width / 2 + projected.x * radius;
      const y = width / 2 - projected.y * radius;
      const depthAlpha = Math.max(0.34, Math.min(1, projected.z + 0.45));
      const coreColor = isDark ? "rgba(244, 247, 247, 0.98)" : "rgba(27, 34, 37, 0.92)";
      const glowColor = isDark ? "rgba(115, 191, 196, 0.22)" : "rgba(58, 121, 126, 0.14)";

      const glow = ctx.createRadialGradient(x, y, 0, x, y, 5.5);
      glow.addColorStop(0, glowColor);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.globalAlpha = depthAlpha;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = coreColor;
      ctx.beginPath();
      ctx.arc(x, y, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const onResize = () => {
      width = canvas.offsetWidth;
    };
    window.addEventListener("resize", onResize);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "240px 0px" },
    );
    visibilityObserver.observe(canvas);

    const tick = (timestamp = performance.now()) => {
      if (!visible || document.hidden) {
        idleTimer = window.setTimeout(() => {
          frameId = requestAnimationFrame(tick);
        }, 250);
        return;
      }

      if (minFrameInterval && timestamp - lastRender < minFrameInterval) {
        frameId = requestAnimationFrame(tick);
        return;
      }
      lastRender = timestamp;

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

      const renderWidth = Math.max(1, width * dpr);
      const renderPhi = phiRef.current + dragPhi.current;
      const renderTheta = thetaRef.current;

      globe.update({
        phi: renderPhi,
        theta: renderTheta,
        width: renderWidth,
        height: renderWidth,
      });
      drawMumbaiMarker(renderPhi, renderTheta);
      frameId = requestAnimationFrame(tick);
    };

    canvas.style.opacity = "1";
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(idleTimer);
      visibilityObserver.disconnect();
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [reducedMotion, theme]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
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
