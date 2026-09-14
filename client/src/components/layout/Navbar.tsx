import { Briefcase, Brush, Github, Home, Moon, Pencil, Search, Sun } from "lucide-react";
import { useEffect, type MouseEvent } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { nav, profile } from "@/data/portfolio";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

type NavbarProps = {
  searchOpen: boolean;
  onToggleSearch: () => void;
};

export function Navbar({ searchOpen, onToggleSearch }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const visible = useHideOnScroll();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onToggleSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onToggleSearch]);

  const handleNav = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    const section = document.getElementById(href.replace("#", ""));
    if (!section) return;

    event.preventDefault();
    section.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  };

  const navIcon = (icon: string) => {
    if (icon === "home") return <Home size={20} />;
    if (icon === "projects") return <Brush size={20} />;
    if (icon === "experience") return <Briefcase size={20} />;
    return <Pencil size={20} />;
  };

  return (
    <header
      className={cn(
        "site-header",
        visible ? "site-header--visible" : "site-header--hidden",
        reducedMotion && "site-header--static",
      )}
    >
      <a
        className="wordmark"
        href="#hero"
        aria-label={`${profile.name}, home`}
        onClick={(event) => handleNav(event, "#hero")}
      >
        <span aria-hidden="true">{profile.initials}</span>
      </a>

      <nav className="main-nav" aria-label="Primary">
        {nav.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="nav-link"
            onClick={(event) => handleNav(event, item.href)}
            aria-label={item.name}
          >
            <span className="nav-link-icon" aria-hidden="true">{navIcon(item.icon)}</span>
            <span className="nav-link-label">{item.name}</span>
          </a>
        ))}
      </nav>

      <div className="header-tools">
        <span className="header-divider" aria-hidden="true" />
        <a
          className="header-tool header-github"
          href={profile.repoHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open this portfolio repository on GitHub"
        >
          <Github size={14} />
          <span>Code</span>
        </a>
        <button className="header-tool" type="button" onClick={onToggleSearch} aria-label="Open search" aria-expanded={searchOpen}>
          <Search size={15} />
          <kbd>⌘K</kbd>
        </button>
        <button
          className="header-tool"
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
