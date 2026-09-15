import { useEffect, useMemo, useState, type MouseEvent, type PointerEvent } from "react";
import { ArrowRight, ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";
import { AnimatedHeroName } from "@/components/home/AnimatedHeroName";
import type { SocialIconName } from "@/data/portfolio";
import { profile, visibleSocials } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type HeroStatus = {
  label: "Available" | "Away";
  tone: "available" | "away";
};

const RESUME_HREF = import.meta.env.VITE_RESUME_URL?.trim() || "/resume.pdf";

function SocialIcon({ name }: { name: SocialIconName }) {
  if (name === "mail") return <Mail size={20} strokeWidth={1.7} />;
  if (name === "linkedin") return <Linkedin size={20} strokeWidth={1.7} />;
  return <Github size={20} strokeWidth={1.7} />;
}

function getHeroStatus(): HeroStatus {
  const hourText = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  const hour = Number.parseInt(hourText, 10);
  const available = hour >= 8 && hour < 22;

  return available
    ? { label: "Available", tone: "available" }
    : { label: "Away", tone: "away" };
}

export function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const [status, setStatus] = useState<HeroStatus>(() => getHeroStatus());
  const portraitCandidates = useMemo(
    () =>
      [
        import.meta.env.VITE_PORTRAIT_URL?.trim(),
        profile.portraitSrc,
        "/media/profile/portrait.jpg",
        "/media/profile/profile.jpg",
        "/media/profile/nityant.jpg",
        "/media/profile/nityant-profile.jpg",
        "/profile.jpg",
        "/profile.png",
      ].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index),
    [],
  );
  const [portraitIndex, setPortraitIndex] = useState(0);
  const portraitSrc = portraitCandidates[portraitIndex];

  useEffect(() => {
    const updateStatus = () => setStatus(getHeroStatus());
    updateStatus();
    const interval = window.setInterval(updateStatus, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const onCtaPointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--cta-x", `${event.clientX - rect.left}px`);
    element.style.setProperty("--cta-y", `${event.clientY - rect.top}px`);
  };

  const onViewWork = (event: MouseEvent<HTMLAnchorElement>) => {
    const section = document.getElementById("projects");
    if (!section) return;
    event.preventDefault();
    section.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  };

  return (
    <section
      className={`hero hero--technical${reducedMotion ? "" : " hero--enter"}`}
      id="hero"
      aria-labelledby="hero-title"
    >
      <TooltipProvider>
        <div className="hero-content hero-content--technical">
          <div className="portrait-wrap portrait-wrap--static">
            <div className="hero-identity-cluster">
              <div className="hero-static-identity" aria-label={profile.portraitAlt}>
                {portraitSrc ? (
                  <img
                    className="hero-portrait-image"
                    src={portraitSrc}
                    alt={profile.portraitAlt}
                    onError={() => setPortraitIndex((index) => index + 1)}
                  />
                ) : (
                  <span aria-hidden="true">{profile.initials}</span>
                )}
              </div>
            </div>
          </div>

          <div className="hero-status-row">
            <a
              className="hero-live-status"
              data-status={status.tone}
              href={`mailto:${profile.email}`}
              aria-label={`${status.label}; schedule-based status in India Standard Time. Email Nityant.`}
              title="Schedule-based status in India Standard Time"
            >
              <span className="hero-live-status__dot-wrap" aria-hidden="true">
                <span className="hero-live-status__ping" />
                <span className="hero-live-status__dot" />
              </span>
              <span className="hero-live-status__label" aria-live="polite">
                {status.label}
              </span>
            </a>
          </div>

          <div className="hero-copy hero-copy--technical">
            <h1 id="hero-title" className="hero-title hero-title--technical">
              <span className="hero-title-fade">Hi. I&apos;m </span>
              <AnimatedHeroName name={profile.displayName} alternate={profile.githubHandle} />
            </h1>
            <p className="hero-description hero-description--technical">
              {profile.taglineLead}{" "}
              <span className="hero-description-emphasis">{profile.taglineEmphasis}</span>{" "}
              {profile.taglineTail}
            </p>
          </div>

          <div className="hero-actions hero-actions--technical hero-actions--balanced">
            <a
              href="#projects"
              className="outline-action hero-flow-action"
              onPointerMove={onCtaPointerMove}
              onClick={onViewWork}
            >
              <span>View my work</span>
              <ArrowRight size={16} aria-hidden="true" />
            </a>

            <span className="hero-divider" aria-hidden="true" />

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

            <a
              href={RESUME_HREF}
              className="outline-action hero-flow-action"
              onPointerMove={onCtaPointerMove}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Nityant Tiwari's resume"
            >
              <span>View resume</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </TooltipProvider>
    </section>
  );
}
