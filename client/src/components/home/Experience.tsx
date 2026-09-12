import { ArrowUpRight } from "lucide-react";
import { TracingBeam } from "@/components/ui/TracingBeam";
import { education, experience, experienceCopy, type ExperienceMark } from "@/data/portfolio";
import { experiencePreviewMedia, fallbackExperiencePreview } from "@/data/media";

function ExperienceMarkView({ mark }: { mark: ExperienceMark }) {
  return (
    <div className="experience-mark" aria-hidden={!mark.alt}>
      {mark.src ? <img src={mark.src} alt={mark.alt ?? ""} /> : <span>{mark.fallback}</span>}
    </div>
  );
}

export function Experience() {
  return (
    <section className="experience-section" id="experience" aria-labelledby="experience-heading">
      <header className="section-heading">
        <h2 id="experience-heading">{experienceCopy.heading}</h2>
        <p>{experienceCopy.intro}</p>
      </header>

      <div className="experience-track">
        <TracingBeam>
          <ol className="experience-list">
            {experience.map((item) => {
              const previewSrc = experiencePreviewMedia[item.id] ?? fallbackExperiencePreview;
              return (
                <li className="experience-row experience-row--preview" key={item.id} tabIndex={0}>
                  <ExperienceMarkView mark={item.mark} />
                  <div className="experience-meta">
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer">
                        <h3>{item.org}</h3>
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                    ) : (
                      <h3>{item.org}</h3>
                    )}
                    <strong>{item.label}</strong>
                    <span>{[item.dates, item.location].filter(Boolean).join(" · ")}</span>
                  </div>
                  <div className="experience-copy">
                    <p>{item.description}</p>
                    {item.skills.length ? (
                      <ul className="project-tech">
                        {item.skills.map((skill) => (
                          <li key={skill}>{skill}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <aside className="experience-hover-preview" aria-hidden="true">
                    <div className="experience-hover-preview__media">
                      <img src={previewSrc} alt="" />
                    </div>
                    <div className="experience-hover-preview__copy">
                      <span>{item.label}</span>
                      <strong>{item.org}</strong>
                      <p>{item.description}</p>
                    </div>
                  </aside>
                </li>
              );
            })}
          </ol>
        </TracingBeam>
      </div>

      <article className="education-card" aria-labelledby="education-heading">
        <div className="education-card-head">
          <ExperienceMarkView mark={education.mark} />
          <div>
            <p className="education-kicker">Education</p>
            <h3 id="education-heading">{education.degree}</h3>
            <strong>{education.school}</strong>
            <span>{education.dates} · {education.location}</span>
          </div>
        </div>
      </article>
    </section>
  );
}
