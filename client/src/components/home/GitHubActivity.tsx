import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardCopy, profile } from "@/data/portfolio";

type GithubProfile = {
  publicRepos: number;
};

export function GitHubActivity() {
  const [stats, setStats] = useState<GithubProfile | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`https://api.github.com/users/${profile.githubHandle}`, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { public_repos?: number } | null) => {
        if (!data) return;
        setStats({ publicRepos: data.public_repos ?? 0 });
      })
      .catch(() => {
        setStats(null);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="github-activity">
      <p className="github-handle">{dashboardCopy.githubHandle}</p>
      {stats ? (
        <p className="tile-prose">
          {stats.publicRepos} public {stats.publicRepos === 1 ? "repository" : "repositories"}
        </p>
      ) : (
        <p className="tile-prose">Public GitHub profile</p>
      )}
      <a className="tile-link" href={profile.githubHref} target="_blank" rel="noopener noreferrer">
        {dashboardCopy.githubCta} <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    </div>
  );
}
