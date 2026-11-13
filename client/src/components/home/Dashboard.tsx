import { useEffect, useRef, useState, type CSSProperties } from "react";
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

// The odometer animates compositor transforms instead of changing text every
// animation frame.  Changing the final value doesn't induce stepped reflows.
const DIGIT_TAPE = Array.from({ length: 30 }, (_, i) => i % 10);

type AnimatedMetricProps = {
  value: number | null;
  fallback: string;
  format: (value: number) => string;
  title?: string;
};

function AnimatedMetric({ value, fallback, format, title }: AnimatedMetricProps) {
  const elementRef = useRef<HTMLParagraphElement>(null);
  const animatedOnceRef = useRef(false);
  const [isInView, setIsInView] = useState(false);
  const [roll, setRoll] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setIsInView(true);
      observer.disconnect();
    }, { threshold: 0.2 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const valid = typeof value === "number" && Number.isFinite(value) && value >= 0;
  const accessibleText = valid ? format(value) : fallback;

  useEffect(() => {
    if (!isInView || !valid || reducedMotion || animatedOnceRef.current) return;
    // Keep the initial zero frame committed before transitioning the digits.
    let outer = 0;
    let inner = 0;
    outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        animatedOnceRef.current = true;
        setRoll(true);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [isInView, valid, reducedMotion]);

  if (!valid || reducedMotion) {
    return <p ref={elementRef} className="tile-metric-value" title={title}>{accessibleText}</p>;
  }

  const parts = Array.from(accessibleText);
  let digitIndex = 0;
  return (
    <p
      ref={elementRef}
      className="tile-metric-value metric-odometer"
      title={title}
      aria-label={accessibleText}
    >
      <span className="metric-odometer__content" aria-hidden="true">
        {parts.map((char, index) => {
          if (!/^[0-9]$/.test(char)) {
            return <span key={index} className="metric-odometer__literal">{char}</span>;
          }
          const order = digitIndex++;
          return (
            <span key={index} className="metric-odometer__digit">
              <span
                className={`metric-odometer__reel${roll ? " metric-odometer__reel--rolling" : ""}`}
                style={{
                  "--metric-end": 20 + Number(char),
                  "--metric-delay": `${Math.min(order, 6) * 85}ms`,
                } as CSSProperties}
              >
                {DIGIT_TAPE.map((digit, step) => <span key={step}>{digit}</span>)}
              </span>
            </span>
          );
        })}
      </span>
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
            headerIcon={dashboardHeaderIcon("music")}
            cursorKind="music"
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
