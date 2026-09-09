import { GitHubCalendar, type Activity } from "react-github-calendar";
import { ArrowUpRight } from "lucide-react";
import { Component, useState, type ReactNode } from "react";
import { dashboardCopy, profile } from "@/data/portfolio";

const GITHUB_GREEN = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

const last49Days = (data: Activity[]) => data.slice(-49);

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

  return (
    <a className="github-activity github-activity--link" href={profile.githubHref} target="_blank" rel="noopener noreferrer">
      {failed ? (
        <div className="github-fallback" aria-live="polite">
          <p className="github-fallback-label">@{profile.githubHandle}</p>
          <p className="github-fallback-copy">Contribution calendar unavailable — open GitHub for recent activity.</p>
        </div>
      ) : (
        <CalendarBoundary onFail={() => setFailed(true)}>
          <div className="github-calendar-wrap">
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
            />
          </div>
        </CalendarBoundary>
      )}
      <span className="tile-link github-cta">
        {dashboardCopy.githubCta} <ArrowUpRight size={14} aria-hidden="true" />
      </span>
    </a>
  );
}
