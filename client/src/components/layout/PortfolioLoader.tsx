import { useEffect, useRef, useState } from "react";
import {
  defaultProjectDomain,
  experience,
  profile,
  projects,
  projectsForDomain,
  type Project,
} from "@/data/portfolio";
import { resolveProjectMediaSrc } from "@/lib/projectMedia";

const MIN_VISIBLE_MS = 4800;
const MAX_VISIBLE_MS = 8000;
const EXIT_MS = 680;

let loaderPlayedForThisDocument = false;

type LoaderPhase = "loading" | "leaving" | "done";

function projectVideoSources(project: Project) {
  if (project.media.kind === "video") {
    return [resolveProjectMediaSrc(project.media.src)];
  }

  if (project.media.kind === "video-carousel") {
    return project.media.videos.map((video) => resolveProjectMediaSrc(video.src));
  }

  return [];
}

function waitForWindowLoad() {
  if (document.readyState === "complete") return Promise.resolve();

  return new Promise<void>((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

async function preloadImage(src: string) {
  if (!src) return;

  const image = new Image();
  image.decoding = "async";
  image.src = src;

  try {
    if ("decode" in image) {
      await image.decode();
      return;
    }
  } catch {
    // decode() can reject even though the image still loads; fall through.
  }

  await new Promise<void>((resolve) => {
    if (image.complete) {
      resolve();
      return;
    }

    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => resolve(), { once: true });
  });
}

function warmVideo(
  src: string,
  mode: "metadata" | "auto",
  timeoutMs: number,
) {
  return new Promise<void>((resolve) => {
    const video = document.createElement("video");
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      video.removeEventListener(targetEvent, finish);
      video.removeEventListener("error", finish);

      // Let the browser keep any reusable response/cache state, while avoiding
      // detached media elements continuing to consume decode resources.
      video.pause();
      video.removeAttribute("src");
      video.load();
      resolve();
    };

    const targetEvent = mode === "auto" ? "canplay" : "loadedmetadata";
    const timeout = window.setTimeout(finish, timeoutMs);

    video.muted = true;
    video.playsInline = true;
    video.preload = mode;
    video.src = src;
    video.addEventListener(targetEvent, finish, { once: true });
    video.addEventListener("error", finish, { once: true });
    video.load();
  });
}

function getWarmupTasks() {
  const initialProjects = projectsForDomain(defaultProjectDomain).slice(0, 2);
  const initialSources = new Set(initialProjects.flatMap(projectVideoSources));
  const allSources = Array.from(new Set(projects.flatMap(projectVideoSources)));

  const imageSources = new Set<string>();
  if (profile.portraitSrc) imageSources.add(profile.portraitSrc);

  for (const item of experience) {
    if (item.mark.src) imageSources.add(item.mark.src);
  }

  const tasks: Array<Promise<unknown>> = [
    waitForWindowLoad(),
    document.fonts?.ready ?? Promise.resolve(),
    ...Array.from(imageSources).map((src) => preloadImage(src)),
  ];

  // The initially visible project pair gets real buffering time while the
  // loader is on-screen. Remaining project videos warm their container/index
  // metadata so later category switches do not begin completely cold.
  for (const src of allSources) {
    tasks.push(
      warmVideo(
        src,
        initialSources.has(src) ? "auto" : "metadata",
        initialSources.has(src) ? 6200 : 4200,
      ),
    );
  }

  return tasks;
}

export function PortfolioLoader({
  onReveal,
}: {
  onReveal: () => void;
}) {
  const [phase, setPhase] = useState<LoaderPhase>(
    loaderPlayedForThisDocument ? "done" : "loading",
  );
  const [progress, setProgress] = useState(loaderPlayedForThisDocument ? 100 : 4);
  const revealStartedRef = useRef(loaderPlayedForThisDocument);

  useEffect(() => {
    if (loaderPlayedForThisDocument) {
      onReveal();
      return;
    }

    loaderPlayedForThisDocument = true;
    const startedAt = performance.now();
    let disposed = false;
    let completedTasks = 0;

    document.documentElement.classList.add("portfolio-is-loading");

    const tasks = getWarmupTasks();
    const totalTasks = Math.max(1, tasks.length);

    const markTaskDone = () => {
      completedTasks += 1;
      const taskProgress = Math.min(92, 8 + (completedTasks / totalTasks) * 84);
      setProgress((current) => Math.max(current, taskProgress));
    };

    const trackedTasks = tasks.map((task) =>
      Promise.resolve(task)
        .catch(() => undefined)
        .finally(markTaskDone),
    );

    const startReveal = () => {
      if (disposed || revealStartedRef.current) return;
      revealStartedRef.current = true;
      setProgress(100);
      setPhase("leaving");
      onReveal();

      window.setTimeout(() => {
        if (disposed) return;
        setPhase("done");
        document.documentElement.classList.remove("portfolio-is-loading");
      }, EXIT_MS);
    };

    const minimumTimer = window.setTimeout(() => {
      void Promise.allSettled(trackedTasks).then(() => startReveal());
    }, MIN_VISIBLE_MS);

    const safetyTimer = window.setTimeout(startReveal, MAX_VISIBLE_MS);

    // Smooth the progress line between actual readiness milestones without
    // pretending that the full video payloads are downloaded.
    const progressTimer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const timeProgress = Math.min(88, 8 + (elapsed / MIN_VISIBLE_MS) * 72);
      setProgress((current) => Math.max(current, timeProgress));
    }, 160);

    return () => {
      disposed = true;
      window.clearTimeout(minimumTimer);
      window.clearTimeout(safetyTimer);
      window.clearInterval(progressTimer);
      document.documentElement.classList.remove("portfolio-is-loading");
    };
  }, [onReveal]);

  if (phase === "done") return null;

  const status =
    progress < 42
      ? "Preparing interface"
      : progress < 78
        ? "Warming project media"
        : "Finishing the experience";

  return (
    <div
      className={`portfolio-loader portfolio-loader--${phase}`}
      role="status"
      aria-live="polite"
      aria-label="Preparing Nityant's portfolio"
    >
      <div className="portfolio-loader__ambient" aria-hidden="true" />

      <div className="portfolio-loader__content">
        <div className="portfolio-loader__mark" aria-hidden="true">
          NT
        </div>

        <div className="portfolio-loader__identity">
          <span>NITYANT / PORTFOLIO</span>
          <strong>{status}</strong>
        </div>

        <div className="portfolio-loader__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }} />
        </div>

        <div className="portfolio-loader__meta" aria-hidden="true">
          <span>{String(Math.round(progress)).padStart(2, "0")}</span>
          <span>Loading</span>
        </div>
      </div>
    </div>
  );
}
