import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  PROJECT_PAGE_SIZE,
  defaultProjectDomain,
  projectsForDomain,
  visibleProjectDomains,
  type Project,
  type ProjectDomainId,
} from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

function TechList({ items }: { items: readonly string[] }) {
  return (
    <ul className="project-tech">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ProjectMedia({ project, reducedMotion }: { project: Project; reducedMotion: boolean }) {
  const { media } = project;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (media.kind !== "video" || reducedMotion) return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => undefined);
        else video.pause();
      },
      { threshold: 0.45 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [media, reducedMotion]);

  if (media.kind === "video") {
    if (reducedMotion) {
      const poster = media.poster;
      return (
        <div className="project-media project-media--frame">
          {poster ? <img className="project-media-asset" src={poster} alt={media.alt} /> : null}
        </div>
      );
    }
    return (
      <div className="project-media project-media--frame">
        <video
          ref={videoRef}
          className="project-media-asset"
          src={media.src}
          poster={media.poster}
          muted
          loop
          playsInline
          aria-label={media.alt}
        />
      </div>
    );
  }

  if (media.kind === "image") {
    return (
      <div className="project-media project-media--frame">
        <img className="project-media-asset" src={media.src} alt={media.alt} />
      </div>
    );
  }

  return <div className="project-media project-media--frame project-media--empty" role="img" aria-label={media.alt} />;
}

function ProjectContent({ project }: { project: Project }) {
  return (
    <div className="project-body">
      <div className="project-card-top">
        <span>{project.status ?? "\u00a0"}</span>
        {project.href ? <ArrowUpRight size={16} aria-hidden="true" /> : null}
      </div>
      <div className="project-copy">
        <h3>{project.title}</h3>
        <p>{project.description}</p>
      </div>
      <TechList items={project.technologies} />
      {project.href ? <span className="project-action">{project.hrefLabel ?? "Repository"}</span> : null}
    </div>
  );
}

function ProjectCard({ project, reducedMotion }: { project: Project; reducedMotion: boolean }) {
  const inner = (
    <>
      <ProjectMedia project={project} reducedMotion={reducedMotion} />
      <ProjectContent project={project} />
    </>
  );

  if (project.href) {
    return (
      <a className="project-card project-card--featured" href={project.href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  return <article className="project-card project-card--featured">{inner}</article>;
}

export function Projects() {
  const [domain, setDomain] = useState<ProjectDomainId>(defaultProjectDomain);
  const [page, setPage] = useState(0);
  const [vertical, setVertical] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const domains = useMemo(() => visibleProjectDomains(), []);
  const domainProjects = projectsForDomain(domain);
  const pageCount = Math.max(1, Math.ceil(domainProjects.length / PROJECT_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = domainProjects.slice(safePage * PROJECT_PAGE_SIZE, safePage * PROJECT_PAGE_SIZE + PROJECT_PAGE_SIZE);
  const activeDomain = domains.find((item) => item.id === domain) ?? domains[0];

  useEffect(() => {
    const media = window.matchMedia("(min-width: 700px)");
    const update = () => setVertical(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const selectDomain = (id: ProjectDomainId, index?: number) => {
    setDomain(id);
    setPage(0);
    if (index !== undefined) tabRefs.current[index]?.focus();
  };

  const onRailKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = domains.length - 1;
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    selectDomain(domains[next].id, next);
  };

  return (
    <section className="content-section projects-section" id="projects" aria-labelledby="projects-heading">
      <header className="section-heading section-heading--domain">
        <h2 id="projects-heading">{activeDomain.label}</h2>
      </header>

      <div className="projects-stage">
        <div
          className="project-story-rail"
          role="tablist"
          aria-labelledby="projects-heading"
          aria-orientation={vertical ? "vertical" : "horizontal"}
        >
          {domains.map((item, index) => {
            const selected = item.id === domain;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                aria-label={item.label}
                aria-current={selected ? "true" : undefined}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                className={cn("project-story-item", selected && "project-story-item--active")}
                onClick={() => selectDomain(item.id)}
                onKeyDown={(event) => onRailKeyDown(event, index)}
              >
                <span className="project-story-label">{item.label}</span>
                <span className="project-story-bar" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        {pageCount > 1 ? (
          <div className="projects-pager">
            <button
              type="button"
              className="projects-pager-btn"
              aria-label={`Previous projects in ${activeDomain.label}`}
              disabled={safePage === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <span className="projects-pager-count">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              className="projects-pager-btn"
              aria-label={`Next projects in ${activeDomain.label}`}
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
            >
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <div
          role="tabpanel"
          aria-label={activeDomain.label}
          className={cn(
            "projects-pair",
            visible.length === 1 && "projects-pair--single",
            !reducedMotion && "projects-pair--animate",
          )}
          key={`${domain}-${safePage}`}
        >
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} reducedMotion={reducedMotion} />
          ))}
        </div>
      </div>
    </section>
  );
}
