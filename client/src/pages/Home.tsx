import { useCallback, useEffect, useState } from "react";
import { Dashboard } from "@/components/home/Dashboard";
import { Experience } from "@/components/home/Experience";
import { Hero } from "@/components/home/Hero";
import { Projects } from "@/components/home/Projects";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Navbar } from "@/components/layout/Navbar";

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
      <div className="page-column">
        <Hero />
        <Dashboard />
        <Projects />
        <Experience />
      </div>
      <CommandPalette open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
