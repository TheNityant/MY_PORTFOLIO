import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { Github, Linkedin, Mail } from "lucide-react";
import { DashboardCard, dashboardHeaderIcon } from "@/components/home/DashboardCard";
import { DashboardCursorProvider } from "@/components/home/DashboardCursor";
import { FeatureCard, featureCardTitle } from "@/components/home/FeatureCard";
import { GitHubActivity } from "@/components/home/GitHubActivity";
import { Globe } from "@/components/home/Globe";
import { ScratchReveal } from "@/components/home/ScratchReveal";
import { CoreStackTools, ToolsMarquee } from "@/components/home/ToolsMarquee";
import {
  formatCodingDuration,
  formatWorkoutDays,
  useDashboardData,
} from "@/hooks/useDashboardData";
import {
  dashboardCopy,
  dashboardFeature,
  formatMetric,
  metrics,
  visibleSocials,
} from "@/data/portfolio";

type AnimatedMetricProps = {
  value: number | null;
  fallback: string;
  format: (value: number) => string;
  title?: string;
};

/**
 * Counts up the real API total only when the metric card enters the viewport.
 * Updates animate from the previous displayed total rather than resetting,
 * and the final number stays accessible to screen readers throughout.
 */
function AnimatedMetric({ value, fallback, format, title }: AnimatedMetricProps) {
  const elementRef = useRef<HTMLParagraphElement>(null);
  const currentValueRef = useRef(0);
  const [shownValue, setShownValue] = useState<number | null>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setHasEnteredView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasEnteredView(true);
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (value === null || !Number.isFinite(value) || value < 0) {
      currentValueRef.current = 0;
      setShownValue(null);
      return;
    }
    if (!hasEnteredView) return;

    if (prefersReducedMotion) {
      currentValueRef.current = value;
      setShownValue(value);
      return;
    }

    const start = currentValueRef.current;
    if (start === value) {
      setShownValue(value);
      return;
    }

    let frame = 0;
    let startedAt: number | null = null;
    const duration = 1250;

    const tick = (timestamp: number) => {
      startedAt ??= timestamp;
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(start + (value - start) * eased);
      currentValueRef.current = next;
      setShownValue(next);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        currentValueRef.current = value;
        setShownValue(value);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value, hasEnteredView, prefersReducedMotion]);

  const validValue =
    typeof value === "number" && Number.isFinite(value) && value >= 0;
  const accessibleText = validValue ? format(value) : fallback;
  const visibleNumber = !validValue
    ? fallback
    : !hasEnteredView
      ? format(value)
      : format(shownValue ?? 0);

  return (
    <p
      ref={elementRef}
      className="tile-metric-value"
      title={title}
      aria-label={accessibleText}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <span aria-hidden="true">{visibleNumber}</span>
    </p>
  );
}

export function Dashboard() {
  const { data } = useDashboardData();

  const liveCodingSeconds =
    data?.coding.status === "ready" || data?.coding.status === "stale"
      ? data.coding.totalSeconds
      : null;
  const codingMetric =
    liveCodingSeconds != null
      ? formatCodingDuration(liveCodingSeconds)
      : data == null
        ? "Loading…"
        : data.coding.status === "stale"
          ? "Updating…"
          : data.coding.status === "unconfigured"
            ? "Not set"
            : "Unavailable";

  const liveWorkoutDays =
    data?.workouts.status === "ready"
      ? (data.workouts.totalDays ?? data.workouts.totalCount)
      : null;
  const workoutMetric =
    liveWorkoutDays == null
      ? formatMetric(metrics.workouts)
      : formatWorkoutDays(liveWorkoutDays);

  const codingTooltip =
    data?.coding.status === "stale"
      ? data.coding.percentCalculated == null
        ? "All-time WakaTime total · refreshing"
        : `All-time WakaTime total · ${data.coding.percentCalculated}% calculated`
      : data?.coding.status === "ready"
        ? "All-time WakaTime total"
        : data?.coding.diagnostic ?? undefined;

  return (
    <DashboardCursorProvider>
      <section className="dashboard-section dashboard-section--cascade" id="dashboard" aria-labelledby="dashboard-heading">
        <h2 id="dashboard-heading" className="sr-only">Personal dashboard</h2>
        <ul className="dashboard-grid">
          <DashboardCard
            area="location"
            title={dashboardCopy.locationTitle}
            headerIcon={dashboardHeaderIcon("plane")}
            cursorKind="plane"
            className="dashboard-item--tall dashboard-item--location"
          >
            <Globe />
          </DashboardCard>

          <DashboardCard
            area="scratch"
            title={dashboardCopy.scratchTitle}
            headerIcon={dashboardHeaderIcon("hand")}
            cursorKind="hand"
          >
            <ScratchReveal />
          </DashboardCard>

          <DashboardCard
            area="activity"
            title={dashboardCopy.activityTitle}
            headerIcon={<Github size={20} />}
            cursorKind="laptop"
            className="dashboard-item--stack"
          >
            <GitHubActivity />
          </DashboardCard>

          <DashboardCard
            area="workouts"
            title={dashboardCopy.workoutsTitle}
            headerIcon={dashboardHeaderIcon("dumbbell")}
            cursorKind="dumbbell"
            className="dashboard-item--metric"
          >
            <AnimatedMetric
              value={liveWorkoutDays}
              fallback={workoutMetric}
              format={formatWorkoutDays}
              title={
                data?.workouts.status === "ready"
                  ? `${data.workouts.weekCount ?? 0} workout days in the last 7 days`
                  : undefined
              }
            />
          </DashboardCard>

          <DashboardCard
            area="hours"
            title={dashboardCopy.hoursTitle}
            headerIcon={dashboardHeaderIcon("clock")}
            cursorKind="clock"
            className="dashboard-item--metric"
          >
            <AnimatedMetric
              value={liveCodingSeconds}
              fallback={codingMetric}
              format={formatCodingDuration}
              title={codingTooltip}
            />
          </DashboardCard>

          <DashboardCard
            area="feature"
            title={featureCardTitle(dashboardFeature)}
            headerIcon={dashboardHeaderIcon(dashboardFeature.kind === "building" ? "hammer" : "music")}
            cursorKind={dashboardFeature.kind === "building" ? "hammer" : "music"}
            className="dashboard-item--feature"
          >
            <FeatureCard feature={dashboardFeature} />
          </DashboardCard>

          <DashboardCard
            area="corestack"
            title={dashboardCopy.coreStackTitle}
            headerIcon={dashboardHeaderIcon("heart")}
            cursorKind="heart"
          >
            <CoreStackTools />
          </DashboardCard>

          <DashboardCard
            area="contact"
            title={dashboardCopy.connectTitle}
            headerIcon={dashboardHeaderIcon("link")}
            cursorKind="link"
            className="dashboard-item--tall-contact"
          >
            <ul className="connect-list">
              {visibleSocials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target={social.external ? "_blank" : undefined}
                    rel={social.external ? "noopener noreferrer" : undefined}
                    aria-label={social.aria}
                  >
                    {social.icon === "mail" ? <Mail size={18} /> : social.icon === "linkedin" ? <Linkedin size={18} /> : <Github size={18} />}
                    <span>{social.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard
            area="tools"
            title={dashboardCopy.toolsTitle}
            headerIcon={dashboardHeaderIcon("wrench")}
            cursorKind="wrench"
          >
            <ToolsMarquee />
          </DashboardCard>
        </ul>
      </section>
    </DashboardCursorProvider>
  );
}
