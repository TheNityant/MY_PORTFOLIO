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
import { resolveProjectMediaSrc } from "@/lib/projectMedia";
import {
  attachProjectVideo,
  parkProjectVideo,
  projectVideoSources,
  promoteProjectVideo,
} from "@/lib/projectVideoPool";
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
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [nearViewport, setNearViewport] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const promoteProjectList = (list: readonly Project[]) => {
    if (reducedMotion) return;

    for (const src of list.flatMap(projectVideoSources)) {
      promoteProjectVideo(src);
    }
  };

  const warmDomain = (id: ProjectDomainId) => {
    promoteProjectList(projectsForDomain(id).slice(0, PROJECT_PAGE_SIZE));
  };

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const update = () => setVertical(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const selectDomain = (id: ProjectDomainId, index?: number) => {
    warmDomain(id);
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
                onPointerEnter={() => warmDomain(item.id)}
                onFocus={() => warmDomain(item.id)}
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
              onPointerEnter={() => {
                if (safePage <= 0) return;
                const start = (safePage - 1) * PROJECT_PAGE_SIZE;
                promoteProjectList(domainProjects.slice(start, start + PROJECT_PAGE_SIZE));
              }}
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
              onPointerEnter={() => {
                if (safePage >= pageCount - 1) return;
                const start = (safePage + 1) * PROJECT_PAGE_SIZE;
                promoteProjectList(domainProjects.slice(start, start + PROJECT_PAGE_SIZE));
              }}
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
