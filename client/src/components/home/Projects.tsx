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
  primeProjectVideo,
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
  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const carouselHostRefs = useRef<Array<HTMLDivElement | null>>([]);
  const carouselVideoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [nearViewport, setNearViewport] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [carouselReady, setCarouselReady] = useState<boolean[]>([]);
  const [carouselVisible, setCarouselVisible] = useState(false);

  const mediaDebug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("mediaDebug");

  const isCarousel = media.kind === "video-carousel";
  const carouselVideos = isCarousel ? media.videos : [];
  const safeSlideIndex =
    carouselVideos.length === 0 ? 0 : Math.min(slideIndex, carouselVideos.length - 1);
  const activeCarouselVideo = isCarousel ? carouselVideos[safeSlideIndex] : undefined;

  const activeSrc =
    media.kind === "video"
      ? resolveProjectMediaSrc(media.src)
      : activeCarouselVideo
        ? resolveProjectMediaSrc(activeCarouselVideo.src)
        : null;

  const activePoster =
    media.kind === "video"
      ? media.poster
        ? resolveProjectMediaSrc(media.poster)
        : undefined
      : activeCarouselVideo?.poster
        ? resolveProjectMediaSrc(activeCarouselVideo.poster)
        : undefined;

  const activeLabel =
    media.kind === "video"
      ? media.alt
      : activeCarouselVideo?.label ?? (media.kind === "video-carousel" ? media.alt : "");

  useEffect(() => {
    setSlideIndex(0);
  }, [project.id]);

  useEffect(() => {
    if (isCarousel) return;
    setNearViewport(false);
    setVideoReady(false);
  }, [activeSrc, isCarousel]);

  useEffect(() => {
    if (isCarousel || reducedMotion || !activeSrc) return;

    const host = hostRef.current;
    if (!host) return;

    const video = attachProjectVideo({
      src: activeSrc,
      host,
      className: cn(
        "project-media-asset",
        isCarousel && "project-media-asset--contain",
      ),
      poster: activePoster,
      ariaLabel: activeLabel,
    });

    videoRef.current = video;

    const debugVideoEvent = (eventName: string) => {
      if (!mediaDebug) return;

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

    const markReady = () => {
      setVideoReady(true);
      debugVideoEvent("ready");

      if (isCarousel && carouselVideos.length > 1) {
        const nextIndex = (safeSlideIndex + 1) % carouselVideos.length;
        if (nextIndex !== safeSlideIndex) {
          const nextVideo = carouselVideos[nextIndex];
          if (nextVideo) {
            void primeProjectVideo(resolveProjectMediaSrc(nextVideo.src), 8);
          }
        }
      }
    };

    const onLoadStart = () => debugVideoEvent("loadstart");
    const onLoadedMetadata = () => debugVideoEvent("loadedmetadata");
    const onPlaying = () => debugVideoEvent("playing");
    const onWaiting = () => debugVideoEvent("waiting");
    const onStalled = () => debugVideoEvent("stalled");
    const onError = () => debugVideoEvent("error");

    video.addEventListener("loadstart", onLoadStart);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("loadeddata", markReady);
    video.addEventListener("canplay", markReady);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("stalled", onStalled);
    video.addEventListener("error", onError);

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setVideoReady(true);
    }

    return () => {
      video.removeEventListener("loadstart", onLoadStart);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("loadeddata", markReady);
      video.removeEventListener("canplay", markReady);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("stalled", onStalled);
      video.removeEventListener("error", onError);

      parkProjectVideo(activeSrc, host);
      if (videoRef.current === video) videoRef.current = null;
    };
  }, [
    activeLabel,
    activePoster,
    activeSrc,
    isCarousel,
    mediaDebug,
    project.id,
    reducedMotion,
  ]);

  useEffect(() => {
    if (isCarousel) return;
    const video = videoRef.current;
    if (!video) return;

    video.className = cn(
      "project-media-asset",
      isCarousel && "project-media-asset--contain",
      videoReady && "project-media-asset--ready",
    );
  }, [isCarousel, videoReady]);

  useEffect(() => {
    if (isCarousel || reducedMotion || !activeSrc) return;

    const host = hostRef.current;
    if (!host) return;

    const desktopLayout = window.matchMedia("(min-width: 700px)").matches;
    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNearViewport(true);
        preloadObserver.disconnect();
      },
      {
        rootMargin: desktopLayout ? "2400px 0px" : "1000px 0px",
        threshold: 0.01,
      },
    );

    preloadObserver.observe(host);
    return () => preloadObserver.disconnect();
  }, [activeSrc, reducedMotion]);

  useEffect(() => {
    if (isCarousel || reducedMotion || !activeSrc || !nearViewport) return;
    promoteProjectVideo(activeSrc);
  }, [activeSrc, isCarousel, nearViewport, reducedMotion]);

  useEffect(() => {
    if (isCarousel || reducedMotion || !activeSrc) return;

    const host = hostRef.current;
    if (!host) return;

    const playbackObserver = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;

        if (entry.isIntersecting) {
          promoteProjectVideo(activeSrc);
          video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      {
        rootMargin: "80px 0px",
        threshold: 0.05,
      },
    );

    playbackObserver.observe(host);
    return () => {
      playbackObserver.disconnect();
      videoRef.current?.pause();
    };
  }, [activeSrc, reducedMotion]);

  useEffect(() => {
    if (!isCarousel || reducedMotion || carouselVideos.length === 0) return;

    setCarouselReady(carouselVideos.map(() => false));

    const cleanups = carouselVideos.map((item, index) => {
      const host = carouselHostRefs.current[index];
      if (!host) return () => undefined;

      const src = resolveProjectMediaSrc(item.src);
      const poster = item.poster ? resolveProjectMediaSrc(item.poster) : undefined;
      const video = attachProjectVideo({
        src,
        host,
        className: cn(
          "project-media-asset",
          "project-media-asset--contain",
          "project-media-carousel-video",
        ),
        poster,
        ariaLabel: item.label ?? media.alt,
      });

      carouselVideoRefs.current[index] = video;

      const debugCarouselEvent = (eventName: string) => {
        if (!mediaDebug) return;

        const buffered =
          video.buffered.length > 0
            ? {
                start: Number(video.buffered.start(0).toFixed(2)),
                end: Number(video.buffered.end(video.buffered.length - 1).toFixed(2)),
              }
            : null;

        console.info(`[project-video:${project.id}:carousel-${index}] ${eventName}`, {
          msSinceNavigation: Math.round(performance.now()),
          readyState: video.readyState,
          networkState: video.networkState,
          currentTime: Number(video.currentTime.toFixed(2)),
          buffered,
          currentSrc: video.currentSrc,
        });
      };

      const markReady = () => {
        setCarouselReady((current) => {
          const next = current.length === carouselVideos.length
            ? [...current]
            : carouselVideos.map((_, itemIndex) => Boolean(current[itemIndex]));
          next[index] = true;
          return next;
        });
        debugCarouselEvent("ready");
      };

      const onPlaying = () => debugCarouselEvent("playing");
      const onWaiting = () => debugCarouselEvent("waiting");
      const onStalled = () => debugCarouselEvent("stalled");
      const onError = () => debugCarouselEvent("error");

      video.addEventListener("loadeddata", markReady);
      video.addEventListener("canplay", markReady);
      video.addEventListener("playing", onPlaying);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("stalled", onStalled);
      video.addEventListener("error", onError);

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        markReady();
      }

      return () => {
        video.removeEventListener("loadeddata", markReady);
        video.removeEventListener("canplay", markReady);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("stalled", onStalled);
        video.removeEventListener("error", onError);
        parkProjectVideo(src, host);
        if (carouselVideoRefs.current[index] === video) {
          carouselVideoRefs.current[index] = null;
        }
      };
    });

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [isCarousel, mediaDebug, project.id, reducedMotion]);

  useEffect(() => {
    if (!isCarousel) return;

    carouselVideoRefs.current.forEach((video, index) => {
      if (!video) return;

      const active = index === safeSlideIndex;
      video.className = cn(
        "project-media-asset",
        "project-media-asset--contain",
        "project-media-carousel-video",
        carouselReady[index] && "project-media-asset--ready",
      );
      video.setAttribute("aria-hidden", active ? "false" : "true");

      const host = carouselHostRefs.current[index];
      if (host) {
        host.className = cn(
          "project-media-video-host",
          "project-media-carousel-video-host",
          active && "project-media-carousel-video-host--active",
        );
      }
    });
  }, [carouselReady, isCarousel, safeSlideIndex]);

  useEffect(() => {
    if (!isCarousel || reducedMotion) return;

    const container = carouselContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCarouselVisible(entry.isIntersecting),
      { rootMargin: "80px 0px", threshold: 0.05 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isCarousel, reducedMotion]);

  useEffect(() => {
    if (!isCarousel || reducedMotion || carouselVideos.length === 0) return;

    let cancelled = false;

    carouselVideoRefs.current.forEach((video, index) => {
      if (!video || index === safeSlideIndex) return;
      video.pause();
    });

    const activeVideo = carouselVideoRefs.current[safeSlideIndex];
    const activeItem = carouselVideos[safeSlideIndex];

    if (!carouselVisible || !activeVideo || !activeItem) {
      activeVideo?.pause();
      return;
    }

    const src = resolveProjectMediaSrc(activeItem.src);
    promoteProjectVideo(src);

    // A loader/domain prime may still own this same pooled element. Wait for
    // that job to finish because primeProjectVideo intentionally pauses/reset
    // the element at the end; then start the active Robocon clip for real.
    void primeProjectVideo(src, 8).then(() => {
      if (cancelled) return;
      if (carouselVideoRefs.current[safeSlideIndex] !== activeVideo) return;
      activeVideo.play().catch(() => undefined);
    });

    return () => {
      cancelled = true;
    };
  }, [
    carouselVisible,
    isCarousel,
    reducedMotion,
    safeSlideIndex,
  ]);

  if (media.kind === "video-carousel") {
    if (!activeCarouselVideo || !activeSrc) {
      return (
        <div
          className="project-media project-media--frame project-media--empty"
          role="img"
          aria-label={media.alt}
        />
      );
    }

    const normalizedSlide = (nextIndex: number) =>
      (nextIndex + carouselVideos.length) % carouselVideos.length;

    const warmCarouselSlide = (nextIndex: number) => {
      if (!carouselVideos.length || reducedMotion) return;
      const candidate = carouselVideos[normalizedSlide(nextIndex)];
      if (!candidate) return;
      const src = resolveProjectMediaSrc(candidate.src);
      promoteProjectVideo(src);
      void primeProjectVideo(src, 8);
    };

    const goToSlide = (nextIndex: number) => {
      if (!carouselVideos.length) return;
      const normalized = normalizedSlide(nextIndex);
      setSlideIndex(normalized);
    };

    if (reducedMotion) {
      return (
        <div className="project-media project-media--frame project-media--carousel">
          {activePoster ? (
            <img
              className="project-media-asset project-media-asset--contain"
              src={activePoster}
              alt={media.alt}
            />
          ) : null}
        </div>
      );
    }

    return (
      <div
        ref={carouselContainerRef}
        className={cn(
          "project-media",
          "project-media--frame",
          "project-media--carousel",
          !carouselReady[safeSlideIndex] && "project-media--loading",
        )}
      >
        {carouselVideos.map((item, index) => (
          <div
            key={resolveProjectMediaSrc(item.src)}
            ref={(node) => {
              carouselHostRefs.current[index] = node;
            }}
            className={cn(
              "project-media-video-host",
              "project-media-carousel-video-host",
              index === safeSlideIndex && "project-media-carousel-video-host--active",
            )}
          />
        ))}

        {carouselVideos.length > 1 ? (
          <div className="project-media-carousel-controls" aria-label="Robocon demo video selector">
            <button
              type="button"
              className="project-media-carousel-button"
              aria-label="Previous Robocon video"
              onPointerEnter={() => warmCarouselSlide(safeSlideIndex - 1)}
              onFocus={() => warmCarouselSlide(safeSlideIndex - 1)}
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
              onPointerEnter={() => warmCarouselSlide(safeSlideIndex + 1)}
              onFocus={() => warmCarouselSlide(safeSlideIndex + 1)}
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
    if (reducedMotion) {
      return (
        <div className="project-media project-media--frame">
          {activePoster ? (
            <img className="project-media-asset" src={activePoster} alt={media.alt} />
          ) : null}
        </div>
      );
    }

    return (
      <div
        className={cn(
          "project-media",
          "project-media--frame",
          !videoReady && "project-media--loading",
        )}
      >
        <div ref={hostRef} className="project-media-video-host" />
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

  return (
    <div
      className="project-media project-media--frame project-media--empty"
      role="img"
      aria-label={media.alt}
    />
  );
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
      <a
        className="project-card project-card--featured"
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
      >
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
  const visible = domainProjects.slice(
    safePage * PROJECT_PAGE_SIZE,
    safePage * PROJECT_PAGE_SIZE + PROJECT_PAGE_SIZE,
  );
  const activeDomain = domains.find((item) => item.id === domain) ?? domains[0];

  const promoteProjectList = (list: readonly Project[]) => {
    if (reducedMotion) return;

    for (const project of list) {
      const bufferedSeconds = project.media.kind === "video-carousel" ? 8 : 5;

      for (const src of projectVideoSources(project)) {
        // Domain selection is a strong intent signal. Start every visible
        // project's media immediately on every device, including carousel
        // siblings, so a loader timeout never turns into another delayed card.
        promoteProjectVideo(src);
        void primeProjectVideo(src, bufferedSeconds);
      }
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

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = index === last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = index === 0 ? last : index - 1;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = last;
    } else {
      return;
    }

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
