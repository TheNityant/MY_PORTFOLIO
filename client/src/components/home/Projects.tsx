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
import { cn } from "@/lib/utils";

function projectVideoSources(project: Project) {
  if (project.media.kind === "video") {
    return [resolveProjectMediaSrc(project.media.src)];
  }

  if (project.media.kind === "video-carousel") {
    const first = project.media.videos[0];
    return first ? [resolveProjectMediaSrc(first.src)] : [];
  }

  return [];
}

function connectionAllowsIntentPreload() {
  const connection = (
    navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
      };
    }
  ).connection;

  if (connection?.saveData) return false;
  return !["slow-2g", "2g"].includes(connection?.effectiveType ?? "");
}

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
  const [slideIndex, setSlideIndex] = useState(0);
  const [nearViewport, setNearViewport] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const mediaDebug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("mediaDebug");

  const isCarousel = media.kind === "video-carousel";
  const carouselVideos = isCarousel ? media.videos : [];
  const safeSlideIndex =
    carouselVideos.length === 0 ? 0 : Math.min(slideIndex, carouselVideos.length - 1);
  const activeCarouselVideo = isCarousel ? carouselVideos[safeSlideIndex] : undefined;
  const shouldLoadVideo = nearViewport;

  useEffect(() => {
    setSlideIndex(0);
    setNearViewport(false);
    setVideoReady(false);
  }, [project.id]);

  useEffect(() => {
    setVideoReady(false);
  }, [safeSlideIndex]);

  const debugVideoEvent = (eventName: string) => {
    if (!mediaDebug) return;
    const video = videoRef.current;
    if (!video) return;

    const buffered =
      video.buffered.length > 0
        ? {
            start: Number(video.buffered.start(0).toFixed(2)),
            end: Number(video.buffered.end(video.buffered.length - 1).toFixed(2)),
          }
        : null;

    console.info(`[project-video:${project.id}] ${eventName}`, {
      msSinceNavigation: Math.round(performance.now()),
      readyState: video.readyState,
      networkState: video.networkState,
      duration: Number.isFinite(video.duration) ? Number(video.duration.toFixed(2)) : null,
      currentTime: Number(video.currentTime.toFixed(2)),
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      buffered,
      currentSrc: video.currentSrc,
    });
  };

  const reportReady = () => {
    setVideoReady(true);
    debugVideoEvent("ready");
  };

  useEffect(() => {
    if ((media.kind !== "video" && media.kind !== "video-carousel") || reducedMotion) return;
    const video = videoRef.current;
    if (!video) return;

    const desktopLayout = window.matchMedia("(min-width: 700px)").matches;
    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        // The element starts in metadata mode. Explicitly upgrade the media
        // request as it approaches the viewport so Chromium does not keep the
        // resource at metadata-only priority until play() is called.
        if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
          video.preload = "auto";
          video.load();
        }

        setNearViewport(true);
        preloadObserver.disconnect();
      },
      {
        rootMargin: desktopLayout ? "1200px 0px" : "700px 0px",
        threshold: 0.01,
      },
    );

    preloadObserver.observe(video);
    return () => preloadObserver.disconnect();
  }, [media.kind, reducedMotion]);

  useEffect(() => {
    if (
      (media.kind !== "video" && media.kind !== "video-carousel") ||
      reducedMotion ||
      !shouldLoadVideo
    ) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const playbackObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => undefined);
        else video.pause();
      },
      {
        rootMargin: "80px 0px",
        threshold: 0.05,
      },
    );

    playbackObserver.observe(video);
    return () => {
      playbackObserver.disconnect();
      video.pause();
    };
  }, [media.kind, reducedMotion, safeSlideIndex, shouldLoadVideo]);

  if (media.kind === "video-carousel") {
    if (!activeCarouselVideo) {
      return (
        <div
          className="project-media project-media--frame project-media--empty"
          role="img"
          aria-label={media.alt}
        />
      );
    }

    const src = resolveProjectMediaSrc(activeCarouselVideo.src);
    const poster = activeCarouselVideo.poster
      ? resolveProjectMediaSrc(activeCarouselVideo.poster)
      : undefined;

    const goToSlide = (nextIndex: number) => {
      if (!carouselVideos.length) return;
      const normalized =
        (nextIndex + carouselVideos.length) % carouselVideos.length;
      setSlideIndex(normalized);
    };

    return (
      <div
        className={cn(
          "project-media",
          "project-media--frame",
          "project-media--carousel",
          shouldLoadVideo && !videoReady && "project-media--loading",
        )}
      >
        <video
          key={src}
          ref={videoRef}
          className={cn(
            "project-media-asset",
            "project-media-asset--contain",
            videoReady && "project-media-asset--ready",
          )}
          src={reducedMotion ? undefined : src}
          poster={poster}
          muted
          loop
          playsInline
          preload={shouldLoadVideo ? "auto" : "metadata"}
          onLoadStart={() => debugVideoEvent("loadstart")}
          onLoadedMetadata={() => debugVideoEvent("loadedmetadata")}
          onLoadedData={reportReady}
          onCanPlay={reportReady}
          onPlaying={() => debugVideoEvent("playing")}
          onWaiting={() => debugVideoEvent("waiting")}
          onStalled={() => debugVideoEvent("stalled")}
          onError={() => debugVideoEvent("error")}
          aria-label={activeCarouselVideo.label ?? media.alt}
        />

        {carouselVideos.length > 1 ? (
          <div className="project-media-carousel-controls" aria-label="Robocon demo video selector">
            <button
              type="button"
              className="project-media-carousel-button"
              aria-label="Previous Robocon video"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                goToSlide(safeSlideIndex - 1);
              }}
            >
              <ArrowLeft size={15} aria-hidden="true" />
            </button>

            <span className="project-media-carousel-count" aria-live="polite">
              {safeSlideIndex + 1} / {carouselVideos.length}
            </span>

            <button
              type="button"
              className="project-media-carousel-button"
              aria-label="Next Robocon video"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                goToSlide(safeSlideIndex + 1);
              }}
            >
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (media.kind === "video") {
    const src = resolveProjectMediaSrc(media.src);
    const poster = media.poster ? resolveProjectMediaSrc(media.poster) : undefined;

    if (reducedMotion) {
      return (
        <div className="project-media project-media--frame">
          {poster ? <img className="project-media-asset" src={poster} alt={media.alt} /> : null}
        </div>
      );
    }

    return (
      <div
        className={cn(
          "project-media",
          "project-media--frame",
          shouldLoadVideo && !videoReady && "project-media--loading",
        )}
      >
        <video
          ref={videoRef}
          className={cn("project-media-asset", videoReady && "project-media-asset--ready")}
          src={reducedMotion ? undefined : src}
          poster={poster}
          muted
          loop
          playsInline
          preload={shouldLoadVideo ? "auto" : "metadata"}
          onLoadStart={() => debugVideoEvent("loadstart")}
          onLoadedMetadata={() => debugVideoEvent("loadedmetadata")}
          onLoadedData={reportReady}
          onCanPlay={reportReady}
          onPlaying={() => debugVideoEvent("playing")}
          onWaiting={() => debugVideoEvent("waiting")}
          onStalled={() => debugVideoEvent("stalled")}
          onError={() => debugVideoEvent("error")}
          aria-label={media.alt}
        />
      </div>
    );
  }

  if (media.kind === "image") {
    return (
      <div className="project-media project-media--frame">
        <img className="project-media-asset" src={resolveProjectMediaSrc(media.src)} alt={media.alt} />
      </div>
    );
  }

  return <div className="project-media project-media--frame project-media--empty" role="img" aria-label={media.alt} />;
}

function ProjectContent({
  project,
  explicitLink = false,
}: {
  project: Project;
  explicitLink?: boolean;
}) {
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
      {project.href ? (
        explicitLink ? (
          <a
            className="project-action project-action--link"
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {project.hrefLabel ?? "Repository"}
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        ) : (
          <span className="project-action">{project.hrefLabel ?? "Repository"}</span>
        )
      ) : null}
    </div>
  );
}

function ProjectCard({ project, reducedMotion }: { project: Project; reducedMotion: boolean }) {
  const hasInteractiveMedia = project.media.kind === "video-carousel";

  if (hasInteractiveMedia) {
    return (
      <article className="project-card project-card--featured">
        <ProjectMedia project={project} reducedMotion={reducedMotion} />
        <ProjectContent project={project} explicitLink />
      </article>
    );
  }

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
  const preloadedVideoSources = useRef(new Set<string>());
  const domains = useMemo(() => visibleProjectDomains(), []);
  const domainProjects = projectsForDomain(domain);
  const pageCount = Math.max(1, Math.ceil(domainProjects.length / PROJECT_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = domainProjects.slice(safePage * PROJECT_PAGE_SIZE, safePage * PROJECT_PAGE_SIZE + PROJECT_PAGE_SIZE);
  const activeDomain = domains.find((item) => item.id === domain) ?? domains[0];

  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia("(min-width: 700px)").matches) return;
    if (!connectionAllowsIntentPreload()) return;

    const sources = visible.flatMap(projectVideoSources);
    if (!sources.length) return;

    const warmVisibleVideos = () => {
      for (const src of sources) {
        if (preloadedVideoSources.current.has(src)) continue;

        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "video";
        link.type = "video/mp4";
        link.href = src;
        link.dataset.projectVideoPreload = "true";
        document.head.appendChild(link);
        preloadedVideoSources.current.add(src);
      }
    };

    // Do not compete with the initial hero/shader startup. A first interaction
    // is a strong signal that the visitor is moving through the page, so warm
    // the currently selected project pair at that point.
    const onIntent = () => {
      warmVisibleVideos();
      window.removeEventListener("scroll", onIntent);
      window.removeEventListener("pointerdown", onIntent);
      window.removeEventListener("keydown", onIntent);
    };

    window.addEventListener("scroll", onIntent, { passive: true });
    window.addEventListener("pointerdown", onIntent, { passive: true });
    window.addEventListener("keydown", onIntent);

    return () => {
      window.removeEventListener("scroll", onIntent);
      window.removeEventListener("pointerdown", onIntent);
      window.removeEventListener("keydown", onIntent);
    };
  }, [domain, reducedMotion, safePage]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
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
