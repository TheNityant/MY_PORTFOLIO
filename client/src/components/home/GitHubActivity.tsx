import { GitHubCalendar } from "react-github-calendar";
import { ArrowUpRight } from "lucide-react";
import { Component, type ReactNode } from "react";
import { dashboardCopy, profile } from "@/data/portfolio";

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
  return (
    <a className="github-activity github-activity--link" href={profile.githubHref} target="_blank" rel="noopener noreferrer">
      <CalendarBoundary onFail={() => undefined}>
        <div className="github-calendar-wrap">
          <GitHubCalendar
            username={profile.githubHandle}
            colorScheme="dark"
            blockSize={9}
            blockMargin={2}
            fontSize={10}
            showWeekdayLabels={false}
            theme={{
              dark: ["#1a1a1e", "#2d333b", "#3d444d", "#4f5b66", "#6e7681", "#8b949e"],
            }}
          />
        </div>
      </CalendarBoundary>
      <span className="tile-link github-cta">
        {dashboardCopy.githubCta} <ArrowUpRight size={14} aria-hidden="true" />
      </span>
    </a>
  );
}
