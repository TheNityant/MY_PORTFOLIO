import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { education, experience, experienceCopy } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const view = window.innerHeight * 0.72;
      const traveled = view - rect.top;
      const total = section.offsetHeight;
      setProgress(Math.max(0, Math.min(1, traveled / total)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reducedMotion]);

  return (
    <section ref={sectionRef} className="experience-section" id="experience" aria-labelledby="experience-heading">
      <header className="section-heading">
        <h2 id="experience-heading">{experienceCopy.heading}</h2>
        <p>{experienceCopy.intro}</p>
      </header>

      <div className="experience-track">
        <div className="experience-progress" aria-hidden="true">
          <span className="experience-progress-line" />
          <span className="experience-progress-meteor" style={{ top: `${8 + progress * 84}%` }} />
        </div>

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
      </div>

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
