import { Github, Linkedin, Mail } from "lucide-react";
import { DashboardCard, dashboardHeaderIcon } from "@/components/home/DashboardCard";
import { FeatureCard, featureCardTitle } from "@/components/home/FeatureCard";
import { GitHubActivity } from "@/components/home/GitHubActivity";
import { Globe } from "@/components/home/Globe";
import { ScratchReveal } from "@/components/home/ScratchReveal";
import { CoreStackTools, ToolsMarquee } from "@/components/home/ToolsMarquee";
import {
  dashboardCopy,
  dashboardFeature,
  formatMetric,
  metrics,
  scratchRevealContent,
  visibleSocials,
} from "@/data/portfolio";

export function Dashboard() {
  return (
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
          <ScratchReveal content={scratchRevealContent} />
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
          <p className="tile-metric-value">{formatMetric(metrics.workouts)}</p>
        </DashboardCard>

        <DashboardCard
          area="hours"
          title={dashboardCopy.hoursTitle}
          headerIcon={dashboardHeaderIcon("clock")}
          cursorKind="clock"
          className="dashboard-item--metric"
        >
          <p className="tile-metric-value">{formatMetric(metrics.codingHours)}</p>
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
  );
}
