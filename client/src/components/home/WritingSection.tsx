import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { HoverFeatureMedia } from "@/components/ui/HoverFeatureMedia";
import { writingEntries } from "@/data/portfolio";
import {
  fallbackWritingFeatureMedia,
  fallbackWritingPreview,
  writingFeatureMedia,
  writingPreviewMedia,
} from "@/data/media";

export function WritingSection() {
  const [activePreview, setActivePreview] = useState<string | null>(null);

  return (
    <section className="content-section writing-section" id="writing" aria-labelledby="writing-heading">
      <header className="section-heading">
        <h2 id="writing-heading">Writing</h2>
        <p>Learning journeys and engineering notes.</p>
      </header>
      <div className="writing-preview-list">
        {writingEntries.map((item) => {
          const previewSrc = writingPreviewMedia[item.slug] ?? fallbackWritingPreview;
          const featureMedia = writingFeatureMedia[item.slug] ?? fallbackWritingFeatureMedia;
          const active = activePreview === item.slug;

          return (
            <Link
              key={item.slug}
              href={`/writing/${item.slug}`}
              className="writing-preview-card writing-preview-card--interactive"
              onMouseEnter={() => setActivePreview(item.slug)}
              onMouseLeave={() => setActivePreview(null)}
              onFocus={() => setActivePreview(item.slug)}
              onBlur={() => setActivePreview(null)}
            >
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

              <aside className="writing-feature-preview" aria-hidden="true">
                {active ? <HoverFeatureMedia media={featureMedia} active /> : null}
              </aside>

              <aside className="writing-hover-preview" aria-hidden="true">
                <div className="writing-hover-preview__media">
                  {active ? <img src={previewSrc} alt="" decoding="async" /> : null}
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
