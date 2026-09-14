import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { writingEntries } from "@/data/portfolio";
import { useCallback, useState } from "react";
import { CommandPalette } from "@/components/layout/CommandPalette";

export default function Writing() {
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <div className="site-shell">
      <Navbar searchOpen={searchOpen} onToggleSearch={() => setSearchOpen((o) => !o)} />
      <div className="page-column page-column--writing">
        <header className="writing-page-header">
          <Link href="/" className="writing-back">
            <ArrowLeft size={16} aria-hidden="true" /> Home
          </Link>
          <h1>Writing</h1>
          <p>Learning journeys and engineering notes.</p>
        </header>
        <div className="writing-list-page">
          {writingEntries.map((entry) => (
            <Link key={entry.slug} href={`/writing/${entry.slug}`} className="writing-preview-card">
              <div>
                <p className="writing-preview-kicker">{entry.type.replace("-", " ")} · {entry.status}</p>
                <h2>{entry.title}</h2>
                <p>{entry.summary}</p>
              </div>
            </Link>
          ))}
        </div>
        <Footer />
      </div>
      <CommandPalette open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
