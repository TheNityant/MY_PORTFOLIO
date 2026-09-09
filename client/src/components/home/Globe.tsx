import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { profile } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

const MUMBAI = { lat: profile.locationLat, lng: profile.locationLng };
const MOVEMENT_DAMPING = 1400;

type GlobeState = {
  phi?: number;
  width?: number;
  height?: number;
};

export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const extraPhi = useRef(0);
  const targetPhi = useRef(0);
  const { theme } = useTheme();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = 0;
    let phi = 2.45;
    let currentPhi = phi;
    let overlayAnimId = 0;
    let globe: { destroy: () => void } | null = null;
    const theta = 0.28;
    const isDark = theme === "dark";
    const samples = window.matchMedia("(max-width: 699px)").matches ? 10000 : 18000;

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
      diffuse: 0.55,
      mapSamples: samples,
      mapBrightness: isDark ? 1.4 : 1.15,
      baseColor: (isDark ? [0.78, 0.82, 0.9] : [1, 1, 1]) as [number, number, number],
      markerColor: [0.55, 0.62, 0.72],
      glowColor: [1, 1, 1],
      markers: [{ location: [MUMBAI.lat, MUMBAI.lng], size: 0.08 }],
      scale: 1.05,
      onRender: (state: GlobeState) => {
        extraPhi.current += (targetPhi.current - extraPhi.current) * 0.12;
        if (!pointerInteracting.current && !reducedMotion) phi += 0.004;
        state.phi = phi + extraPhi.current;
        state.width = width * 2;
        state.height = width * 2;
        currentPhi = state.phi ?? phi;
      },
    } as Parameters<typeof createGlobe>[1]);

    canvas.style.opacity = "1";

    const toVec = (lat: number, lng: number) => {
      const latR = (lat * Math.PI) / 180;
      const lngR = (lng * Math.PI) / 180;
      const cosLat = Math.cos(latR);
      return {
        x: cosLat * Math.cos(lngR),
        y: Math.sin(latR),
        z: -cosLat * Math.sin(lngR),
      };
    };

    const project = (p: { x: number; y: number; z: number }, phiRot: number) => {
      const cosP = Math.cos(phiRot);
      const sinP = Math.sin(phiRot);
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const x1 = cosP * p.x + sinP * p.z;
      const y1 = p.y;
      const z1 = -sinP * p.x + cosP * p.z;
      return {
        x: x1,
        y: cosT * y1 - sinT * z1,
        z: sinT * y1 + cosT * z1,
      };
    };

    let orbit = 0;
    const orbitRadiusDeg = 7;

    const drawOverlay = () => {
      const overlay = overlayRef.current;
      if (!overlay || width === 0) {
        overlayAnimId = requestAnimationFrame(drawOverlay);
        return;
      }
      const ctx = overlay.getContext("2d");
      if (!ctx) return;
      const dpr = 2;
      if (overlay.width !== width * dpr) {
        overlay.width = width * dpr;
        overlay.height = width * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, width);
      const cx = width / 2;
      const cy = width / 2;
      const radius = (width / 2) * 0.8;

      const marker = project(toVec(MUMBAI.lat, MUMBAI.lng), currentPhi);
      if (marker.z > -0.02) {
        const sx = cx + marker.x * radius;
        const sy = cy - marker.y * radius;
        const zAlpha = Math.max(0.3, Math.min(1, marker.z + 0.4));
        ctx.globalAlpha = zAlpha * 0.4;
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.9)" : "rgba(20,20,20,0.85)";
        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = zAlpha;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (!reducedMotion) orbit = (orbit + 0.012) % (Math.PI * 2);
      const planeLat = MUMBAI.lat + Math.sin(orbit) * orbitRadiusDeg * 0.35;
      const planeLng = MUMBAI.lng + Math.cos(orbit) * orbitRadiusDeg;
      const plane = project(toVec(planeLat, planeLng), currentPhi);
      if (plane.z > -0.05) {
        const sx = cx + plane.x * radius;
        const sy = cy - plane.y * radius;
        const zAlpha = Math.max(0.2, Math.min(1, (plane.z + 0.05) / 0.6));
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(orbit);
        ctx.globalAlpha = zAlpha;
        ctx.fillStyle = isDark ? "#f4f4f5" : "#18181b";
        ctx.beginPath();
        ctx.moveTo(7, 0);
        ctx.lineTo(-4, 3.2);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-4, -3.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      overlayAnimId = requestAnimationFrame(drawOverlay);
    };
    overlayAnimId = requestAnimationFrame(drawOverlay);

    return () => {
      cancelAnimationFrame(overlayAnimId);
      globe?.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [reducedMotion, theme]);

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current === null) return;
    const delta = clientX - pointerInteracting.current;
    targetPhi.current += delta / MOVEMENT_DAMPING;
    pointerInteracting.current = clientX;
  };

  return (
    <div className={cn("globe-stage", className)}>
      <canvas
        ref={canvasRef}
        className="globe-canvas"
        aria-hidden="true"
        onPointerDown={(event) => {
          pointerInteracting.current = event.clientX;
          (event.currentTarget as HTMLCanvasElement).style.cursor = "grabbing";
        }}
        onPointerUp={(event) => {
          pointerInteracting.current = null;
          (event.currentTarget as HTMLCanvasElement).style.cursor = "grab";
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
        }}
        onPointerMove={(event) => updateMovement(event.clientX)}
      />
      <canvas ref={overlayRef} className="globe-overlay" aria-hidden="true" />
    </div>
  );
}
