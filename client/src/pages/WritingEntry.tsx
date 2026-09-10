import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useRoute } from "wouter";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { writingEntries } from "@/data/portfolio";
import NotFound from "@/pages/NotFound";
import styles from "./writingEntry.module.css";

export default function WritingEntry() {
  const [, params] = useRoute("/writing/:slug");
  const entry = writingEntries.find((item) => item.slug === params?.slug);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  if (!entry) return <NotFound />;

  return (
    <div className="site-shell">
      <Navbar searchOpen={searchOpen} onToggleSearch={() => setSearchOpen((open) => !open)} />
      <div className="page-column page-column--writing">
        <Link href="/writing" className="writing-back">
          <ArrowLeft size={16} aria-hidden="true" /> Writing
        </Link>

        <main className={styles.shell}>
          <header className={styles.intro}>
            <p className={styles.kicker}>
              {entry.type.replace("-", " ")} · {entry.status}
            </p>
            <h1 className={styles.title}>{entry.title}</h1>
            <p className={styles.summary}>{entry.summary}</p>
            <ul className={styles.tags} aria-label="Notebook topics">
              {entry.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            {entry.sourceUrl ? (
              <a className="tile-link" href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">
                Open source notebook <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ) : (
              <p className={styles.note}>
                This page is an overview of the notebook structure. Full chapter prose is not published in this portfolio yet.
              </p>
            )}
          </header>

          <section className={styles.map} aria-labelledby="notebook-map-heading">
            <div className={styles.mapHeader}>
              <h2 id="notebook-map-heading">Selected notebook chapters</h2>
              <span>{entry.sections.length} highlights</span>
            </div>
            {entry.sections.map((section) => (
              <article key={section.id} className={styles.chapter}>
                <div className={styles.chapterHead}>
                  <span className={styles.chapterId}>CH {section.id}</span>
                  <h3>{section.title}</h3>
                </div>
                <ul className={styles.topics} aria-label={`Topics in ${section.title}`}>
                  {section.topics.map((topic) => (
                    <li className={styles.topic} key={topic}>{topic}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        </main>

        <Footer />
      </div>
      <CommandPalette open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
