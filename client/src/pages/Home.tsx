import { useCallback, useEffect, useState } from "react";
import AtmosphereLabPanel from "@/components/dev/AtmosphereLabPanel";
import FluidLabPanel from "@/components/dev/FluidLabPanel";
import { Dashboard } from "@/components/home/Dashboard";
import { Experience } from "@/components/home/Experience";
import { Hero } from "@/components/home/Hero";
import { Projects } from "@/components/home/Projects";
import { WritingSection } from "@/components/home/WritingSection";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SiteAtmosphere } from "@/components/layout/SiteAtmosphere";

export default function Home() {
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const toggleSearch = useCallback(() => setSearchOpen((open) => !open), []);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    if (window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSearch]);

  return (
    <div className="site-shell">
      <SiteAtmosphere />
      <Navbar searchOpen={searchOpen} onToggleSearch={toggleSearch} />
      <div className="page-column">
        <Hero />
        <Dashboard />
        <Projects />
        <WritingSection />
        <Experience />
        <Footer />
      </div>
      <CommandPalette open={searchOpen} onClose={closeSearch} />
      {import.meta.env.DEV ? <FluidLabPanel /> : null}
      {import.meta.env.DEV ? <AtmosphereLabPanel /> : null}
    </div>
  );
}
