import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";
import type { SocialIconName } from "@/data/portfolio";
import { profile, visibleSocials } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import "./heroParity.css";

function SocialIcon({ name }: { name: SocialIconName }) {
  if (name === "mail") return <Mail size={20} strokeWidth={1.7} />;
  if (name === "linkedin") return <Linkedin size={20} strokeWidth={1.7} />;
  return <Github size={20} strokeWidth={1.7} />;
}

function getStatus() {
  const localHour = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false,
  }).format(new Date());

  const hour = Number.parseInt(localHour, 10);
  const available = Number.isFinite(hour) && hour >= 8 && hour < 22;
  return {
    label: available ? "Available" : "Away",
    tone: available ? "available" : "away",
  } as const;
}

export function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const status = getStatus();

  return (
    <section className={reducedMotion ? "hero" : "hero hero--enter"} id="hero" aria-labelledby="hero-title">
      <TooltipProvider>
        <div className="hero-content">
          <div className="portrait-wrap">
            <div className="portrait-placeholder" role="img" aria-label={profile.portraitAlt}>
              <span>{profile.initials}</span>
            </div>
          </div>

          <div className={`hero-status-pill hero-status-pill--${status.tone}`} aria-label={`Status: ${status.label}`}>
            <span className="hero-status-dot" aria-hidden="true" />
            <span>{status.label}</span>
          </div>

          <div className="hero-copy">
            <h1 id="hero-title" className="hero-title">
              <span className="hero-title-fade">Hi. I&apos;m</span>
              <span className="hero-script">{profile.displayName}</span>
            </h1>
            <p className="hero-description">
              {profile.taglineLead}{" "}
              <span className="hero-script hero-script--inline">{profile.taglineEmphasis}</span>{" "}
              {profile.taglineTail}
            </p>
          </div>
          <div className="hero-actions">
            <div className="social-actions" aria-label="Contact links">
              {visibleSocials.map((social) => (
                <Tooltip key={social.label}>
                  <TooltipTrigger asChild>
                    <a
                      href={social.href}
                      aria-label={social.aria}
                      target={social.external ? "_blank" : undefined}
                      rel={social.external ? "noopener noreferrer" : undefined}
                    >
                      <SocialIcon name={social.icon} />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{social.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
            <span className="hero-divider" aria-hidden="true" />
            <a href="#projects" className="outline-action">
              <span>View my work</span>
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </TooltipProvider>
    </section>
  );
}
