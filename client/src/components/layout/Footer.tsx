import { Github, Linkedin, Mail, Send } from "lucide-react";
import { Link } from "wouter";
import { profile, socialUrls, visibleSocials } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const footerNav = [
  { name: "Home", href: "#hero" },
  { name: "Projects", href: "#projects" },
  { name: "Writing", href: "#writing" },
  { name: "Experience", href: "#experience" },
];

export function Footer() {
  const reducedMotion = usePrefersReducedMotion();

  const handleNav = (href: string) => {
    const id = href.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  const socialIcon = (icon: string) => {
    if (icon === "mail") return <Mail size={14} aria-hidden="true" />;
    if (icon === "linkedin") return <Linkedin size={14} aria-hidden="true" />;
    return <Github size={14} aria-hidden="true" />;
  };

  return (
    <footer className="site-footer" id="contact">
      <div className="footer-cta">
        <h2 className="footer-hello">
          Say <span className="hero-script hero-script--inline">hello</span>.
        </h2>
        <a className="footer-contact" href={`mailto:${socialUrls.email}`}>
          <Send size={16} aria-hidden="true" />
          Contact Me
        </a>
        <a className="footer-opensource" href={profile.repoHref} target="_blank" rel="noopener noreferrer">
          This site is open source
        </a>
        <p className="footer-identity">
          <strong>{profile.name}</strong>
          <span>{profile.summary}</span>
        </p>
      </div>

      <div className="footer-columns">
        <div>
          <p className="footer-kicker">Navigate</p>
          <ul>
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
        <div>
          <p className="footer-kicker">Connect</p>
          <ul>
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

      <p className="footer-copy">© 2026 {profile.name}</p>
    </footer>
  );
}
