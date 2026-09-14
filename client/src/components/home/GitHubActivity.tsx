import { GitHubCalendar, type Activity } from "react-github-calendar";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Component, useEffect, useState, type ReactNode } from "react";
import { dashboardCopy, profile } from "@/data/portfolio";

const GITHUB_GREEN = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
const last49Days = (data: Activity[]) => data.slice(-49);

type GitHubProfileResponse = {
  public_repos?: number;
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
  const [repoCount, setRepoCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`https://api.github.com/users/${profile.githubHandle}`, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub profile request failed: ${response.status}`);
        return response.json() as Promise<GitHubProfileResponse>;
      })
      .then((data) => {
        if (typeof data.public_repos === "number") setRepoCount(data.public_repos);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRepoCount(null);
      });

    return () => controller.abort();
  }, []);

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

      <div className="github-activity-meta">
        <span className="github-repo-count" title="Public repositories on GitHub">
          <BookOpen size={13} aria-hidden="true" />
          <strong>{repoCount ?? "—"}</strong>
          <span>repos</span>
        </span>
        <span className="tile-link github-cta">
          {dashboardCopy.githubCta} <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}
