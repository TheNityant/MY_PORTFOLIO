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
import { useRef, type PointerEvent, type ReactNode } from "react";
import type { DashboardCursorKind } from "@/data/portfolio";
import { useFinePointer } from "@/hooks/useFinePointer";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
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
  const reducedMotion = usePrefersReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const surfaceEnabled = finePointer && !reducedMotion;

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!surfaceEnabled || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    frameRef.current.style.setProperty("--pointer-x", `${x}%`);
    frameRef.current.style.setProperty("--pointer-y", `${y}%`);
  };

  const onLeave = () => {
    frameRef.current?.style.removeProperty("--pointer-x");
    frameRef.current?.style.removeProperty("--pointer-y");
  };

  return (
    <li className={cn("dashboard-item", `dashboard-area-${area}`, className)}>
      <div
        ref={frameRef}
        className={cn(
          "dashboard-item-frame",
          surfaceEnabled && "dashboard-item-frame--interactive",
        )}
        data-cursor-kind={cursorKind}
        style={surfaceEnabled ? { cursor: "none" } : undefined}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
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
