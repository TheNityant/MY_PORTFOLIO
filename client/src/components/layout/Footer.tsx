import { Github, Mail, Send } from "lucide-react";
import { nav, profile, visibleSocials } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function Footer() {
  const reducedMotion = usePrefersReducedMotion();
  const navigate = nav.filter((item) => !item.deferred);

  const handleNav = (href: string) => {
    const id = href.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <footer className="site-footer" id="contact">
      <div className="footer-cta">
        <h2 className="footer-hello">
          Say <span className="hero-script hero-script--inline">hello</span>.
        </h2>
        <a className="footer-contact" href={`mailto:${profile.email}`}>
          <Send size={16} aria-hidden="true" />
          Contact me
        </a>
        <p className="footer-summary">{profile.summary}</p>
      </div>

      <div className="footer-columns">
        <div>
          <p className="footer-kicker">Navigate</p>
          <ul>
            {navigate.map((item) => (
              <li key={item.name}>
                <button type="button" onClick={() => handleNav(item.href)}>
                  {item.name}
                </button>
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
                  {social.icon === "mail" ? <Mail size={14} aria-hidden="true" /> : <Github size={14} aria-hidden="true" />}
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
