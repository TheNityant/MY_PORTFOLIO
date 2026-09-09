import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { writingEntries } from "@/data/portfolio";

export function WritingSection() {
  return (
    <section className="content-section writing-section" id="writing" aria-labelledby="writing-heading">
      <header className="section-heading">
        <h2 id="writing-heading">Writing</h2>
        <p>Learning journeys and engineering notes.</p>
      </header>
      <div className="writing-preview-list">
        {writingEntries.map((item) => (
          <Link key={item.slug} href={`/writing/${item.slug}`} className="writing-preview-card">
            <div>
              <p className="writing-preview-kicker">{item.type.replace("-", " ")} · {item.status}</p>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <ul className="project-tech">
                {item.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>
            <span className="writing-preview-action">
              Read <ArrowRight size={14} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
      <Link href="/writing" className="writing-all-link">
        View all writing <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}
