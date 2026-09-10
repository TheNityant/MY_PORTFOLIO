import { Github, Linkedin, Mail, Send, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { profile, socialUrls, visibleSocials } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";
import styles from "./footer.module.css";

const footerNav = [
  { name: "Home", href: "#hero" },
  { name: "Projects", href: "#projects" },
  { name: "Writing", href: "#writing" },
  { name: "Experience", href: "#experience" },
];

export function Footer() {
  const reducedMotion = usePrefersReducedMotion();
  const [planeSending, setPlaneSending] = useState(false);

  const handleNav = (href: string) => {
    const id = href.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  const socialIcon = (icon: string) => {
    if (icon === "mail") return <Mail size={17} aria-hidden="true" />;
    if (icon === "linkedin") return <Linkedin size={17} aria-hidden="true" />;
    return <Github size={17} aria-hidden="true" />;
  };

  const handleContactClick = () => {
    if (reducedMotion || planeSending) return;
    setPlaneSending(true);
    window.setTimeout(() => setPlaneSending(false), 380);
  };

  return (
    <footer className={cn("site-footer", styles.footer)} id="contact">
      <div className="footer-cta">
        <h2 className="footer-hello">
          Say <span className="hero-script hero-script--inline">hello</span>.{" "}
          <span className={styles.wave} aria-hidden="true">👋</span>
        </h2>

        <a
          className={cn("footer-contact", styles.contactButton, planeSending && "footer-contact--sending")}
          href={`mailto:${socialUrls.email}`}
          onClick={handleContactClick}
        >
          <Send className="footer-contact-plane" size={16} aria-hidden="true" />
          Contact Me
        </a>

        <a
          className={styles.sourceLink}
          href={profile.repoHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open this site's repository on GitHub"
        >
          <Github size={15} aria-hidden="true" />
          <span>This site is open source: star it on GitHub</span>
          <Star size={13} aria-hidden="true" />
        </a>
      </div>

      <div className={styles.columns}>
        <div className={styles.identity}>
          <span className={styles.mark} aria-hidden="true">{profile.initials}</span>
          <p className={styles.name}>{profile.name}</p>
          <p className={styles.role}>{profile.role}</p>
          <p className={styles.summary}>{profile.summary}</p>
        </div>

        <div className={styles.linkColumn}>
          <p className="footer-kicker">Navigate</p>
          <ul className={styles.linkList}>
            {footerNav.map((item) => (
              <li key={item.name}>
                {item.href.startsWith("#") ? (
                  <button type="button" onClick={() => handleNav(item.href)}>{item.name}</button>
                ) : (
                  <Link href={item.href}>{item.name}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.linkColumn}>
          <p className="footer-kicker">Connect</p>
          <ul className={styles.linkList}>
            {visibleSocials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target={social.external ? "_blank" : undefined}
                  rel={social.external ? "noopener noreferrer" : undefined}
                >
                  {socialIcon(social.icon)}
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <p>© 2026 {profile.name}. All rights reserved.</p>
        <p>Built with <span aria-hidden="true">❤️</span> using React, Vite and Tailwind</p>
      </div>
    </footer>
  );
}
