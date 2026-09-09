import { ArrowUpRight } from "lucide-react";
import { education, experience, experienceCopy } from "@/data/portfolio";

export function Experience() {
  return (
    <section className="experience-section" id="experience" aria-labelledby="experience-heading">
      <header className="section-heading">
        <h2 id="experience-heading">{experienceCopy.heading}</h2>
        <p>{experienceCopy.intro}</p>
      </header>

      <ol className="experience-list">
        {experience.map((item, index) => (
          <li className="experience-row" key={item.id}>
            <span className="experience-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
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
          </li>
        ))}
      </ol>

      <article className="education-card" aria-labelledby="education-heading">
        <p className="education-kicker">Education</p>
        <h3 id="education-heading">{education.degree}</h3>
        <strong>{education.school}</strong>
        <span>
          {education.dates} · {education.location}
        </span>
      </article>
    </section>
  );
}
