import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { writingEntries } from "@/data/portfolio";
import { fallbackWritingPreview, writingPreviewMedia } from "@/data/media";

export function WritingSection() {
  return (
    <section className="content-section writing-section" id="writing" aria-labelledby="writing-heading">
      <header className="section-heading">
        <h2 id="writing-heading">Writing</h2>
        <p>Learning journeys and engineering notes.</p>
      </header>
      <div className="writing-preview-list">
        {writingEntries.map((item) => {
          const previewSrc = writingPreviewMedia[item.slug] ?? fallbackWritingPreview;
          return (
            <Link key={item.slug} href={`/writing/${item.slug}`} className="writing-preview-card writing-preview-card--interactive">
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

              <aside className="writing-hover-preview" aria-hidden="true">
                <div className="writing-hover-preview__media">
                  <img src={previewSrc} alt="" />
                </div>
                <div>
                  <span>{item.status}</span>
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                </div>
              </aside>
            </Link>
          );
        })}
      </div>
      <Link href="/writing" className="writing-all-link">
        View all writing <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}
