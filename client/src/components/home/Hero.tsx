import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";
import { HeroIdentityReveal } from "@/components/home/HeroIdentityReveal";
import type { SocialIconName } from "@/data/portfolio";
import { profile, visibleSocials } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function SocialIcon({ name }: { name: SocialIconName }) {
  if (name === "mail") return <Mail size={18} strokeWidth={1.7} />;
  if (name === "linkedin") return <Linkedin size={18} strokeWidth={1.7} />;
  return <Github size={18} strokeWidth={1.7} />;
}

export function Hero() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section
      className={`hero hero--technical${reducedMotion ? "" : " hero--enter"}`}
      id="hero"
      aria-labelledby="hero-title"
    >
      <TooltipProvider>
        <div className="hero-technical-grid">
          <div className="hero-copy hero-copy--technical">
            <p className="hero-kicker">{profile.role}</p>
            <h1 id="hero-title" className="hero-title hero-title--technical">
              <span className="hero-title-line">Nityant</span>
              <span className="hero-title-line">Tiwari</span>
            </h1>
            <p className="hero-description hero-description--technical">
              <strong>{profile.taglineLead} {profile.taglineEmphasis}</strong> {profile.taglineTail}
            </p>

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
              <a href="#projects" className="outline-action">
                <span>View my work</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <HeroIdentityReveal />
          </div>
        </div>
      </TooltipProvider>
    </section>
  );
}
