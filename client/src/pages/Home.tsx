import { useCallback, useEffect, useState } from "react";
import { Dashboard } from "@/components/home/Dashboard";
import { Experience } from "@/components/home/Experience";
import { Hero } from "@/components/home/Hero";
import { Projects } from "@/components/home/Projects";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Navbar } from "@/components/layout/Navbar";
import { Reveal } from "@/components/layout/Reveal";
import { profile } from "@/data/portfolio";

export default function Home() {
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const toggleSearch = useCallback(() => setSearchOpen((open) => !open), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSearch]);

  return (
    <div className="site-shell">
      <Navbar searchOpen={searchOpen} onToggleSearch={toggleSearch} />
      <main className="page-column">
        <Hero />
        <Reveal>
          <Dashboard />
        </Reveal>
        <Reveal>
          <Projects />
        </Reveal>
        <Reveal>
          <Experience />
        </Reveal>
      </main>

      <footer className="site-footer" id="contact">
        <p>Have a project, opportunity, or interesting engineering problem?</p>
        <a href={`mailto:${profile.email}`}>Let&apos;s talk.</a>
        <span>© 2026 {profile.name}</span>
      </footer>

      <CommandPalette open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
