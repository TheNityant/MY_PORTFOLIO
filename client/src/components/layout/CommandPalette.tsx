import {
  ArrowRight,
  Briefcase,
  Brush,
  Check,
  Copy,
  Github,
  Home,
  Linkedin,
  Mail,
  Moon,
  Pencil,
  Search,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { profile, searchItems, socialUrls } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type PaletteGroup = "Navigation" | "Projects" | "Writing" | "Actions" | "External";

type PaletteItem = {
  id: string;
  label: string;
  sublabel?: string;
  group: PaletteGroup;
  keywords?: string[];
  icon: ReactNode;
  href?: string;
  external?: boolean;
  action?: "copy-email" | "toggle-theme";
};

const groupOrder: PaletteGroup[] = ["Navigation", "Projects", "Writing", "Actions", "External"];

function iconForSearchItem(type: string): LucideIcon {
  if (type === "Navigate") return Home;
  if (type === "Projects") return Brush;
  return Pencil;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const reducedMotion = usePrefersReducedMotion();

  const items = useMemo<PaletteItem[]>(() => {
    const primary = searchItems.map((item, index) => {
      const Icon = iconForSearchItem(item.type);
      const group: PaletteGroup =
        item.type === "Navigate" ? "Navigation" : item.type === "Projects" ? "Projects" : "Writing";
      return {
        id: `search-${index}-${item.label}`,
        label: item.label,
        sublabel: item.type,
        group,
        keywords: [item.type],
        icon: <Icon size={16} aria-hidden="true" />,
        href: item.href,
      } satisfies PaletteItem;
    });

    return [
      ...primary,
      {
        id: "copy-email",
        label: copied ? "Email copied" : "Copy email",
        sublabel: profile.email,
        group: "Actions",
        keywords: ["contact", "mail", "email"],
        icon: copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />,
        action: "copy-email",
      },
      {
        id: "toggle-theme",
        label: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
        sublabel: "Appearance",
        group: "Actions",
        keywords: ["theme", "dark", "light", "appearance"],
        icon: theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />,
        action: "toggle-theme",
      },
      {
        id: "github",
        label: "GitHub",
        sublabel: profile.githubHandle,
        group: "External",
        keywords: ["code", "repository", "github"],
        icon: <Github size={16} aria-hidden="true" />,
        href: socialUrls.github,
        external: true,
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        sublabel: "Nityant Tiwari",
        group: "External",
        keywords: ["linkedin", "profile", "contact"],
        icon: <Linkedin size={16} aria-hidden="true" />,
        href: socialUrls.linkedin,
        external: true,
      },
      {
        id: "email",
        label: "Send email",
        sublabel: profile.email,
        group: "External",
        keywords: ["email", "mail", "contact"],
        icon: <Mail size={16} aria-hidden="true" />,
        href: `mailto:${profile.email}`,
      },
    ];
  }, [copied, theme]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => {
      const searchable = [item.label, item.sublabel, item.group, ...(item.keywords ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [items, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      setCopied(false);
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const goToSection = (href: string) => {
    const id = href.replace(/^#/, "");
    const section = document.getElementById(id);
    if (!section) return;
    section.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  };

  const runItem = async (item: PaletteItem) => {
    if (item.action === "copy-email") {
      try {
        await navigator.clipboard.writeText(profile.email);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      } catch {
        window.location.href = `mailto:${profile.email}`;
      }
      return;
    }

    if (item.action === "toggle-theme") {
      toggleTheme?.();
      return;
    }

    if (!item.href) return;
    onClose();

    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      return;
    }

    if (item.href.startsWith("#")) {
      window.requestAnimationFrame(() => goToSection(item.href!));
      return;
    }

    if (item.href.startsWith("mailto:")) {
      window.location.href = item.href;
      return;
    }

    setLocation(item.href);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!filtered.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((value) => (value + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((value) => (value - 1 + filtered.length) % filtered.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      void runItem(filtered[activeIndex] ?? filtered[0]);
    }
  };

  if (!open) return null;

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search portfolio">
      <button className="search-backdrop" type="button" aria-label="Close search" onClick={onClose} />
      <div className="search-panel search-panel--command">
        <div className="search-command-header">
          <label className="search-field search-field--command">
            <Search size={18} aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Type a command or search…"
            />
            <kbd>ESC</kbd>
          </label>
          <button className="search-close-button" type="button" aria-label="Close search" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="search-command-list" role="listbox" aria-label="Portfolio commands">
          {filtered.length ? (
            groupOrder.map((group) => {
              const groupItems = filtered.filter((item) => item.group === group);
              if (!groupItems.length) return null;
              return (
                <section className="search-command-group" key={group} aria-label={group}>
                  <p>{group}</p>
                  <div>
                    {groupItems.map((item) => {
                      const flatIndex = filtered.findIndex((candidate) => candidate.id === item.id);
                      const selected = flatIndex === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className="search-command-item"
                          data-selected={selected ? "true" : undefined}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          onClick={() => void runItem(item)}
                        >
                          <span className="search-command-icon">{item.icon}</span>
                          <span className="search-command-copy">
                            <strong>{item.label}</strong>
                            {item.sublabel ? <small>{item.sublabel}</small> : null}
                          </span>
                          <ArrowRight className="search-command-arrow" size={14} aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })
          ) : (
            <p className="search-empty">No matching command or portfolio item.</p>
          )}
        </div>

        <footer className="search-command-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span className="search-command-future">AI portfolio guide reserved for a later phase</span>
        </footer>
      </div>
    </div>
  );
}
