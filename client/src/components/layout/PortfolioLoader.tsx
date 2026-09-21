import { useEffect, useRef, useState } from "react";
import {
  defaultProjectDomain,
  experience,
  profile,
  projects,
  projectsForDomain,
} from "@/data/portfolio";
import {
  canAggressivelyWarmProjectMedia,
  projectVideoSources,
  warmProjectVideo,
} from "@/lib/projectVideoPool";

const MIN_VISIBLE_MS = 5200;
const MAX_VISIBLE_MS = 8000;
const EXIT_MS = 680;

let loaderPlayedForThisDocument = false;

type LoaderPhase = "loading" | "leaving" | "done";

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

function getWarmupTasks(onMediaSettled: (ready: boolean) => void) {
  const initialProjects = projectsForDomain(defaultProjectDomain).slice(0, 2);
  const initialSources = new Set(initialProjects.flatMap(projectVideoSources));
  const allSources = Array.from(new Set(projects.flatMap(projectVideoSources)));
  const aggressiveMediaWarmup = canAggressivelyWarmProjectMedia();

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

  // Every project video enters the browser's media queue in the same turn.
  // On capable desktop connections we ask all of them for playable buffering;
  // constrained/mobile connections keep the existing lighter behavior.
  const videoTasks = allSources.map((src) => {
    const mode =
      aggressiveMediaWarmup || initialSources.has(src) ? "auto" : "metadata";

    return warmProjectVideo(src, mode)
      .then((ready) => {
        onMediaSettled(ready);
        return ready;
      })
      .catch(() => {
        onMediaSettled(false);
        return false;
      });
  });

  tasks.push(...videoTasks);

  return {
    tasks,
    mediaTotal: allSources.length,
    aggressiveMediaWarmup,
  };
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
  const [mediaSettled, setMediaSettled] = useState(0);
  const [mediaTotal, setMediaTotal] = useState(0);
  const [aggressiveWarmup, setAggressiveWarmup] = useState(false);
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

    const warmup = getWarmupTasks(() => {
      if (disposed) return;
      setMediaSettled((current) => Math.min(warmup.mediaTotal, current + 1));
    });

    setMediaTotal(warmup.mediaTotal);
    setAggressiveWarmup(warmup.aggressiveMediaWarmup);

    const totalTasks = Math.max(1, warmup.tasks.length);

    const markTaskDone = () => {
      completedTasks += 1;
      const taskProgress = Math.min(94, 7 + (completedTasks / totalTasks) * 87);
      setProgress((current) => Math.max(current, taskProgress));
    };

    const trackedTasks = warmup.tasks.map((task) =>
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

    // Time contributes only to the visual interpolation; the media counter is
    // tied to actual media readiness/metadata events from the persistent pool.
    const progressTimer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const timeProgress = Math.min(89, 7 + (elapsed / MIN_VISIBLE_MS) * 70);
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
    progress < 24
      ? "Booting the interface"
      : mediaTotal > 0 && mediaSettled < mediaTotal
        ? "Preloading project media"
        : "Synchronizing the experience";

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
          <span>NT</span>
        </div>

        <div className="portfolio-loader__identity">
          <span>NITYANT / PORTFOLIO</span>
          <strong>{status}</strong>
        </div>

        <div className="portfolio-loader__media" aria-hidden="true">
          <div className="portfolio-loader__media-head">
            <span>{aggressiveWarmup ? "Persistent media pool" : "Media warm-up"}</span>
            <strong>
              {mediaTotal > 0 ? `${mediaSettled}/${mediaTotal}` : "—"}
            </strong>
          </div>

          <div className="portfolio-loader__media-nodes">
            {Array.from({ length: Math.max(1, mediaTotal) }, (_, index) => (
              <span
                key={index}
                className={
                  index < mediaSettled
                    ? "portfolio-loader__media-node portfolio-loader__media-node--ready"
                    : "portfolio-loader__media-node"
                }
              />
            ))}
          </div>
        </div>

        <div className="portfolio-loader__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }} />
        </div>

        <div className="portfolio-loader__meta" aria-hidden="true">
          <span>{String(Math.round(progress)).padStart(2, "0")}</span>
          <span>{aggressiveWarmup ? "Media resident" : "Loading"}</span>
        </div>
      </div>
    </div>
  );
}
