import {
  Clock,
  Dumbbell,
  Github,
  Hammer,
  Hand,
  Heart,
  Laptop,
  Link2,
  MapPin,
  Music,
  Plane,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useRef, useState, type ReactNode } from "react";
import type { DashboardCursorKind } from "@/data/portfolio";
import { useFinePointer } from "@/hooks/useFinePointer";
import { cn } from "@/lib/utils";

const CURSOR_ICONS: Record<DashboardCursorKind, LucideIcon> = {
  plane: Plane,
  hand: Hand,
  laptop: Laptop,
  dumbbell: Dumbbell,
  clock: Clock,
  hammer: Hammer,
  music: Music,
  heart: Heart,
  link: Link2,
  wrench: Wrench,
};

type DashboardCardProps = {
  area: string;
  title: string;
  headerIcon: ReactNode;
  cursorKind: DashboardCursorKind;
  children: ReactNode;
  className?: string;
};

export function DashboardCard({
  area,
  title,
  headerIcon,
  cursorKind,
  children,
  className,
}: DashboardCardProps) {
  const finePointer = useFinePointer();
  const frameRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [angle, setAngle] = useState(0);
  const lastPoint = useRef({ x: 0, y: 0, t: 0 });
  const heading = useRef(0);

  const onMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!finePointer || !frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setPos({ x, y });

      if (cursorKind === "plane") {
        const now = performance.now();
        const dt = Math.max(1, now - lastPoint.current.t);
        const vx = (event.clientX - lastPoint.current.x) / dt;
        const vy = (event.clientY - lastPoint.current.y) / dt;
        const speed = Math.hypot(vx, vy);
        if (speed > 0.02) {
          const target = Math.atan2(vy, vx);
          heading.current += (target - heading.current) * 0.18;
          setAngle(heading.current);
        } else {
          setAngle(heading.current);
        }
        lastPoint.current = { x: event.clientX, y: event.clientY, t: now };
      }
    },
    [cursorKind, finePointer],
  );

  const FollowerIcon = CURSOR_ICONS[cursorKind];

  return (
    <li className={cn("dashboard-item", `dashboard-area-${area}`, className)}>
      <div
        ref={frameRef}
        className="dashboard-item-frame dashboard-item-frame--interactive"
        onPointerEnter={() => finePointer && setHovering(true)}
        onPointerLeave={() => setHovering(false)}
        onPointerMove={onMove}
      >
        {finePointer && hovering ? (
          <span
            className={cn("dashboard-cursor", cursorKind === "plane" && "dashboard-cursor--plane")}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%) rotate(${cursorKind === "plane" ? angle : 0}rad)`,
            }}
            aria-hidden="true"
          >
            <FollowerIcon size={cursorKind === "plane" ? 16 : 14} strokeWidth={1.8} />
          </span>
        ) : null}
        <article className="dashboard-tile">
          <div className="tile-header">
            <span className="tile-icon" aria-hidden="true">{headerIcon}</span>
            <h3 className="tile-title">{title}</h3>
          </div>
          <div className="tile-body">{children}</div>
        </article>
      </div>
    </li>
  );
}

export function dashboardHeaderIcon(kind: DashboardCursorKind, size = 20) {
  const Icon = kind === "laptop" ? Github : kind === "hand" ? Sparkles : CURSOR_ICONS[kind];
  if (kind === "plane") return <MapPin size={size} />;
  return <Icon size={size} />;
}
