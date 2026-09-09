import { Briefcase, Brush, Github, Home, Moon, Search, Sun } from "lucide-react";
import { useEffect } from "react";
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
  const visibleNav = nav.filter((item) => !item.deferred);

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

  const handleNav = (href: string) => {
    const id = href.replace("#", "");
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    }
  };

  return (
    <header
      className={cn(
        "site-header",
        visible ? "site-header--visible" : "site-header--hidden",
        reducedMotion && "site-header--static",
      )}
    >
      <a className="wordmark" href="#hero" aria-label={`${profile.name}, home`}>
        <span aria-hidden="true">{profile.initials}</span>
      </a>

      <nav className="main-nav" aria-label="Primary">
        {visibleNav.map((item) => {
          const icon =
            item.icon === "home" ? (
              <Home size={20} />
            ) : item.icon === "projects" ? (
              <Brush size={20} />
            ) : (
              <Briefcase size={20} />
            );

          return (
            <button
              key={item.name}
              type="button"
              className="nav-link"
              onClick={() => handleNav(item.href)}
              aria-label={item.name}
            >
              <span className="nav-link-icon" aria-hidden="true">
                {icon}
              </span>
              <span className="nav-link-label">{item.name}</span>
            </button>
          );
        })}
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
        <button
          className="header-tool"
          type="button"
          onClick={onToggleSearch}
          aria-label="Open search"
          aria-expanded={searchOpen}
        >
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
