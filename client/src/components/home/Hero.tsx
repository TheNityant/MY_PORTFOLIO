import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";
import { AnimatedHeroName } from "@/components/home/AnimatedHeroName";
import { HeroIdentityReveal } from "@/components/home/HeroIdentityReveal";
import type { SocialIconName } from "@/data/portfolio";
import { profile, visibleSocials } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type HeroStatus = {
  label: "Available" | "Away";
  tone: "available" | "away";
};

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
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const updateStatus = () => setStatus(getHeroStatus());
    updateStatus();
    const interval = window.setInterval(updateStatus, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const onCtaPointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    const element = ctaRef.current;
    if (!element) return;
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
          <div className="portrait-wrap portrait-wrap--fluid">
            <div className="hero-identity-cluster">
              <HeroIdentityReveal />
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
          </div>

          <div className="hero-copy hero-copy--technical">
            <h1 id="hero-title" className="hero-title hero-title--technical">
              <span className="hero-title-fade">Hi. I&apos;m </span>
              <AnimatedHeroName name={profile.displayName} />
            </h1>
            <p className="hero-description hero-description--technical">
              {profile.taglineLead}{" "}
              <span className="hero-description-emphasis">{profile.taglineEmphasis}</span>{" "}
              {profile.taglineTail}
            </p>
          </div>

          <div className="hero-actions hero-actions--technical">
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
              ref={ctaRef}
              href="#projects"
              className="outline-action"
              onPointerMove={onCtaPointerMove}
              onClick={onViewWork}
            >
              <span>View my work</span>
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </TooltipProvider>
    </section>
  );
}
