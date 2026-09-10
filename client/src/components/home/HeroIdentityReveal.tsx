import { useEffect, useId, useRef, type PointerEvent } from "react";
import { profile } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Point = { x: number; y: number };

const VIEWBOX_WIDTH = 240;
const VIEWBOX_HEIGHT = 100;
const CENTER = { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 };
const TRAIL_POINT_COUNT = 10;

function smoothPath(points: Point[]) {
  if (points.length < 2) return `M ${CENTER.x} ${CENTER.y}`;

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    const next = points[index + 1];
    const midX = (point.x + next.x) / 2;
    const midY = (point.y + next.y) / 2;
    d += ` Q ${point.x.toFixed(2)} ${point.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }

  const previous = points[points.length - 2];
  const last = points[points.length - 1];
  d += ` Q ${previous.x.toFixed(2)} ${previous.y.toFixed(2)} ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
}

export function HeroIdentityReveal() {
  const reducedMotion = usePrefersReducedMotion();
  const rawId = useId().replace(/:/g, "");
  const maskId = `hero-fluid-mask-${rawId}`;
  const blurId = `hero-fluid-blur-${rawId}`;
  const glowId = `hero-fluid-glow-${rawId}`;
  const frameRef = useRef<HTMLDivElement>(null);
  const maskSoftRef = useRef<SVGPathElement>(null);
  const maskCoreRef = useRef<SVGPathElement>(null);
  const flowGlowRef = useRef<SVGPathElement>(null);
  const flowCoreRef = useRef<SVGPathElement>(null);
  const maskHeadRef = useRef<SVGCircleElement>(null);
  const flowHeadRef = useRef<SVGCircleElement>(null);
  const targetRef = useRef<Point>({ ...CENTER });
  const pointerActiveRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const pointsRef = useRef<Point[]>(
    Array.from({ length: TRAIL_POINT_COUNT }, (_, index) => ({
      x: CENTER.x - index * 2.2,
      y: CENTER.y,
    })),
  );

  useEffect(() => {
    const setGeometry = (path: string, head: Point) => {
      maskSoftRef.current?.setAttribute("d", path);
      maskCoreRef.current?.setAttribute("d", path);
      flowGlowRef.current?.setAttribute("d", path);
      flowCoreRef.current?.setAttribute("d", path);
      maskHeadRef.current?.setAttribute("cx", head.x.toFixed(2));
      maskHeadRef.current?.setAttribute("cy", head.y.toFixed(2));
      flowHeadRef.current?.setAttribute("cx", head.x.toFixed(2));
      flowHeadRef.current?.setAttribute("cy", head.y.toFixed(2));
    };

    if (reducedMotion) {
      const staticPoints: Point[] = [
        { x: 78, y: 56 },
        { x: 96, y: 37 },
        { x: 121, y: 42 },
        { x: 143, y: 62 },
        { x: 165, y: 51 },
      ];
      setGeometry(smoothPath(staticPoints), staticPoints[0]);
      return;
    }

    const start = performance.now();

    const tick = (time: number) => {
      if (!pointerActiveRef.current) {
        const elapsed = (time - start) / 1000;
        targetRef.current = {
          x: CENTER.x + Math.sin(elapsed * 0.72) * 43,
          y: CENTER.y + Math.sin(elapsed * 1.08 + 0.8) * 18,
        };
      }

      const points = pointsRef.current;
      const headEase = pointerActiveRef.current ? 0.19 : 0.055;
      points[0].x += (targetRef.current.x - points[0].x) * headEase;
      points[0].y += (targetRef.current.y - points[0].y) * headEase;

      for (let index = 1; index < points.length; index += 1) {
        const follow = Math.max(0.115, 0.19 - index * 0.0065);
        points[index].x += (points[index - 1].x - points[index].x) * follow;
        points[index].y += (points[index - 1].y - points[index].y) * follow;
      }

      setGeometry(smoothPath(points), points[0]);
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion]);

  const moveTarget = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT;

    targetRef.current = {
      x: Math.min(VIEWBOX_WIDTH - 10, Math.max(10, x)),
      y: Math.min(VIEWBOX_HEIGHT - 8, Math.max(8, y)),
    };
  };

  const activatePointer = (event: PointerEvent<HTMLDivElement>) => {
    pointerActiveRef.current = true;
    moveTarget(event);
  };

  const releasePointer = () => {
    pointerActiveRef.current = false;
  };

  return (
    <div
      ref={frameRef}
      className={`hero-identity-reveal hero-fluid-reveal${reducedMotion ? " hero-fluid-reveal--static" : ""}`}
      role="img"
      aria-label={profile.portraitAlt}
      onPointerEnter={activatePointer}
      onPointerMove={moveTarget}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        activatePointer(event);
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        releasePointer();
      }}
      onPointerCancel={releasePointer}
      onPointerLeave={releasePointer}
    >
      <svg
        className="hero-fluid-reveal__svg"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <filter id={blurId} x="-40%" y="-80%" width="180%" height="260%">
            <feGaussianBlur stdDeviation="4.8" />
          </filter>
          <filter id={glowId} x="-50%" y="-100%" width="200%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`hero-fluid-clip-${rawId}`}>
            <circle cx={CENTER.x} cy={CENTER.y} r="44" />
          </clipPath>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT}>
            <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="black" />
            <path
              ref={maskSoftRef}
              fill="none"
              stroke="white"
              strokeWidth="42"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${blurId})`}
            />
            <path
              ref={maskCoreRef}
              fill="none"
              stroke="white"
              strokeWidth="25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle ref={maskHeadRef} r="18" fill="white" />
          </mask>
        </defs>

        <circle className="hero-fluid-reveal__disc" cx={CENTER.x} cy={CENTER.y} r="44" />
        <text className="hero-fluid-reveal__base-mark" x={CENTER.x} y={CENTER.y + 2}>
          {profile.initials}
        </text>

        <g
          clipPath={`url(#hero-fluid-clip-${rawId})`}
          mask={`url(#${maskId})`}
          className="hero-fluid-reveal__revealed"
        >
          <circle className="hero-fluid-reveal__signal-disc" cx={CENTER.x} cy={CENTER.y} r="44" />
          {profile.portraitSrc ? (
            <image
              href={profile.portraitSrc}
              x={CENTER.x - 44}
              y={CENTER.y - 44}
              width="88"
              height="88"
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <text className="hero-fluid-reveal__signal-mark" x={CENTER.x} y={CENTER.y + 2}>
              {profile.initials}
            </text>
          )}
        </g>

        <path
          ref={flowGlowRef}
          className="hero-fluid-reveal__flow hero-fluid-reveal__flow--glow"
          fill="none"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
        />
        <path
          ref={flowCoreRef}
          className="hero-fluid-reveal__flow hero-fluid-reveal__flow--core"
          fill="none"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle ref={flowHeadRef} className="hero-fluid-reveal__head" r="3.8" />
      </svg>
    </div>
  );
}
