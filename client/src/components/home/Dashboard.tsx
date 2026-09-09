import { ArrowUpRight, Brain, Code2, Github, Layers, Link2, Mail, Server, Sparkles, Wrench } from "lucide-react";
import { useState, type ReactNode } from "react";
import { aiFocus, backendFocus, dashboardCopy, profile, socials, tools } from "@/data/portfolio";
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

function ChipList({ items }: { items: readonly string[] }) {
  return (
    <ul className="tile-chips">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ScratchCard() {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      className={cn("scratch-card", revealed && "scratch-card--revealed")}
      onClick={() => setRevealed(true)}
      aria-pressed={revealed}
    >
      <Sparkles size={18} aria-hidden="true" />
      <strong>{revealed ? dashboardCopy.scratchReveal : dashboardCopy.scratchPrompt}</strong>
    </button>
  );
}

export function Dashboard() {
  return (
    <section className="dashboard-section" id="dashboard" aria-labelledby="dashboard-heading">
      <h2 id="dashboard-heading" className="sr-only">
        Personal dashboard
      </h2>
      <ul className={cn("dashboard-grid", styles.dashboardGrid)}>
        <Tile area="location" icon={<Code2 size={20} />} title={dashboardCopy.aboutTitle} className="dashboard-item--tall">
          <div className="about-copy">
            <p className="tile-prose tile-prose--large">{dashboardCopy.aboutLead}</p>
            <p className="tile-prose">{dashboardCopy.aboutBody}</p>
          </div>
        </Tile>

        <Tile area="scratch" icon={<Sparkles size={20} />} title={dashboardCopy.scratchTitle}>
          <ScratchCard />
        </Tile>

        <Tile area="github" icon={<Github size={20} />} title={dashboardCopy.githubTitle} className="dashboard-item--stack">
          <p className="github-handle">{dashboardCopy.githubHandle}</p>
          <a className="tile-link" href={profile.githubHref} target="_blank" rel="noopener noreferrer">
            {dashboardCopy.githubCta} <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </Tile>

        <Tile area="coffees" icon={<Server size={20} />} title={dashboardCopy.backendTitle} className="dashboard-item--metric">
          <ChipList items={backendFocus} />
        </Tile>

        <Tile area="hours" icon={<Brain size={20} />} title={dashboardCopy.aiTitle} className="dashboard-item--metric">
          <ChipList items={aiFocus} />
        </Tile>

        <Tile area="music" icon={<Layers size={20} />} title={dashboardCopy.nowBuildingTitle}>
          <p className="tile-prose tile-prose--large">{dashboardCopy.nowBuildingName}</p>
          <p className="tile-prose">{dashboardCopy.nowBuildingBody}</p>
        </Tile>

        <Tile area="favorite" icon={<Wrench size={20} />} title={dashboardCopy.stackTitle}>
          <p className="tile-prose tile-prose--large">{dashboardCopy.stackBody}</p>
        </Tile>

        <Tile area="contact" icon={<Link2 size={20} />} title={dashboardCopy.connectTitle}>
          <ul className="connect-list">
            {socials.map((social) => (
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
          <div className="tools-marquee" aria-label="Tools">
            <div className="tools-track">
              {[...tools, ...tools].map((tool, index) => (
                <span key={`${tool}-${index}`}>{tool}</span>
              ))}
            </div>
          </div>
        </Tile>
      </ul>
    </section>
  );
}
