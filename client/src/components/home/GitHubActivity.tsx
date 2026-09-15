import { GitHubCalendar, type Activity } from "react-github-calendar";
import { ArrowUpRight } from "lucide-react";
import {
  cloneElement,
  Component,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { dashboardCopy, profile } from "@/data/portfolio";

const GITHUB_GREEN = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

const last49Days = (data: Activity[]) => data.slice(-49);

function activityLabel(activity: Activity) {
  const date = new Date(`${activity.date}T00:00:00`);
  const dateLabel = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const noun = activity.count === 1 ? "contribution" : "contributions";
  return `${activity.count} ${noun} · ${dateLabel}`;
}

type GitHubPublicProfile = {
  public_repos?: number;
};

type ContributionTooltip = {
  label: string;
  x: number;
  y: number;
};

class CalendarBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export function GitHubActivity() {
  const [failed, setFailed] = useState(false);
  const [publicRepoCount, setPublicRepoCount] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<ContributionTooltip | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`https://api.github.com/users/${profile.githubHandle}`, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub profile request failed: ${response.status}`);
        return response.json() as Promise<GitHubPublicProfile>;
      })
      .then((data) => {
        if (typeof data.public_repos === "number") setPublicRepoCount(data.public_repos);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPublicRepoCount(null);
      });

    return () => controller.abort();
  }, []);

  const showTooltipFromCell = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      setTooltip(null);
      return;
    }

    const cell = target.closest("rect[data-contribution-label]");
    if (!(cell instanceof SVGRectElement)) {
      setTooltip(null);
      return;
    }

    const label = cell.getAttribute("data-contribution-label");
    if (!label) {
      setTooltip(null);
      return;
    }

    const horizontalPadding = 110;
    const x = Math.min(
      Math.max(event.clientX, horizontalPadding),
      Math.max(horizontalPadding, window.innerWidth - horizontalPadding),
    );
    const y = Math.max(event.clientY, 56);

    setTooltip({ label, x, y });
  };

  const tooltipPortal =
    tooltip && typeof document !== "undefined"
      ? createPortal(
          <span
            className="github-contribution-tooltip-portal"
            style={{ left: tooltip.x, top: tooltip.y }}
            role="tooltip"
          >
            {tooltip.label}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <a
        className="github-activity github-activity--link"
        href={profile.githubHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        {failed ? (
          <div className="github-fallback" aria-live="polite">
            <p className="github-fallback-label">@{profile.githubHandle}</p>
            <p className="github-fallback-copy">
              Contribution calendar unavailable — open GitHub for recent activity.
            </p>
          </div>
        ) : (
          <CalendarBoundary onFail={() => setFailed(true)}>
            <div
              className="github-calendar-wrap"
              onPointerOver={showTooltipFromCell}
              onPointerMove={showTooltipFromCell}
              onPointerLeave={() => setTooltip(null)}
            >
              <GitHubCalendar
                username={profile.githubHandle}
                colorScheme="dark"
                blockSize={10}
                blockMargin={2}
                fontSize={10}
                showWeekdayLabels={false}
                showMonthLabels={false}
                showTotalCount={false}
                showColorLegend={false}
                transformData={last49Days}
                theme={{ dark: GITHUB_GREEN, light: GITHUB_GREEN }}
                renderBlock={(block, activity) => {
                  const label = activityLabel(activity);
                  return cloneElement(
                    block,
                    {
                      "aria-label": label,
                      "data-contribution-count": activity.count,
                      "data-contribution-date": activity.date,
                      "data-contribution-label": label,
                    },
                    <title>{label}</title>,
                  );
                }}
              />
            </div>
          </CalendarBoundary>
        )}

        <div className="github-activity-meta" aria-label="GitHub repository summary">
          <span className="github-activity-meta__label">Public repos</span>
          <strong>{publicRepoCount ?? "—"}</strong>
        </div>

        <span className="tile-link github-cta">
          {dashboardCopy.githubCta} <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </a>

      {tooltipPortal}
    </>
  );
}
