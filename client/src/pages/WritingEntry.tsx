import { ArrowLeft } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { writingEntries } from "@/data/portfolio";
import { useCallback, useState } from "react";
import { CommandPalette } from "@/components/layout/CommandPalette";
import NotFound from "@/pages/NotFound";

export default function WritingEntry() {
  const [, params] = useRoute("/writing/:slug");
  const entry = writingEntries.find((item) => item.slug === params?.slug);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  if (!entry) return <NotFound />;

  return (
    <div className="site-shell">
      <Navbar searchOpen={searchOpen} onToggleSearch={() => setSearchOpen((o) => !o)} />
      <div className="page-column page-column--writing">
        <header className="writing-page-header">
          <Link href="/writing" className="writing-back">
            <ArrowLeft size={16} aria-hidden="true" /> Writing
          </Link>
          <p className="writing-preview-kicker">{entry.type.replace("-", " ")} · {entry.status}</p>
          <h1>{entry.title}</h1>
          <p>{entry.summary}</p>
          {entry.sourceUrl ? (
            <a className="tile-link" href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">
              Source
            </a>
          ) : null}
        </header>
        <div className="writing-journey">
          {entry.sections.map((section) => (
            <section key={section.id} className="writing-journey-section">
              <h2>
                <span className="writing-section-id">{section.id}</span>
                {section.title}
              </h2>
              <ul>
                {section.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <Footer />
      </div>
      <CommandPalette open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
