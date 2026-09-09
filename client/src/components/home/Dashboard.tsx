import { Github, Heart, Layers, Link2, Mail, MapPin, Sparkles, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { FavoriteTools, ToolsMarquee } from "@/components/home/ToolsMarquee";
import { GitHubActivity } from "@/components/home/GitHubActivity";
import { Globe } from "@/components/home/Globe";
import { ScratchReveal } from "@/components/home/ScratchReveal";
import { dashboardCopy, visibleSocials } from "@/data/portfolio";
import { cn } from "@/lib/utils";
import styles from "./dashboard.module.css";

function Tile({
  area,
  icon,
  title,
  children,
  className,
}: {
  area: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <li className={cn("dashboard-item", className)} style={{ gridArea: area }}>
      <div className="dashboard-item-frame">
        <article className="dashboard-tile">
          <div className="tile-header">
            <span className="tile-icon" aria-hidden="true">
              {icon}
            </span>
            <h3 className="tile-title">{title}</h3>
          </div>
          <div className="tile-body">{children}</div>
        </article>
      </div>
    </li>
  );
}

export function Dashboard() {
  return (
    <section className="dashboard-section" id="dashboard" aria-labelledby="dashboard-heading">
      <h2 id="dashboard-heading" className="sr-only">
        Personal dashboard
      </h2>
      <ul className={cn("dashboard-grid", styles.dashboardGrid)}>
        <Tile
          area="location"
          icon={<MapPin size={20} />}
          title={dashboardCopy.locationTitle}
          className="dashboard-item--tall dashboard-item--location"
        >
          <Globe />
        </Tile>

        <Tile area="scratch" icon={<Sparkles size={20} />} title={dashboardCopy.scratchTitle}>
          <ScratchReveal>
            <p className="scratch-reveal-line">{dashboardCopy.scratchReveal}</p>
          </ScratchReveal>
        </Tile>

        <Tile area="github" icon={<Github size={20} />} title={dashboardCopy.githubTitle} className="dashboard-item--stack">
          <GitHubActivity />
        </Tile>

        <Tile area="music" icon={<Layers size={20} />} title={dashboardCopy.nowBuildingTitle}>
          <p className="tile-prose tile-prose--large">{dashboardCopy.nowBuildingName}</p>
          <p className="tile-prose">{dashboardCopy.nowBuildingBody}</p>
        </Tile>

        <Tile area="favorite" icon={<Heart size={20} />} title={dashboardCopy.favoriteTitle}>
          <FavoriteTools />
        </Tile>

        <Tile area="contact" icon={<Link2 size={20} />} title={dashboardCopy.connectTitle}>
          <ul className="connect-list">
            {visibleSocials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target={social.external ? "_blank" : undefined}
                  rel={social.external ? "noopener noreferrer" : undefined}
                  aria-label={social.aria}
                >
                  {social.icon === "mail" ? <Mail size={18} /> : <Github size={18} />}
                  <span>{social.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </Tile>

        <Tile area="tools" icon={<Wrench size={20} />} title={dashboardCopy.toolsTitle}>
          <ToolsMarquee />
        </Tile>
      </ul>
    </section>
  );
}
