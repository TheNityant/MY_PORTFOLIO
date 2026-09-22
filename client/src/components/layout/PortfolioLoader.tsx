import { useEffect, useRef, useState } from "react";
import {
  defaultProjectDomain,
  profile,
  projectsForDomain,
} from "@/data/portfolio";
import {
  projectVideoSources,
  warmProjectVideo,
} from "@/lib/projectVideoPool";

const EMERGENCY_REVEAL_MS = 8000;
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

function getWarmupTasks(onMediaReady: () => void) {
  const initialProjects = projectsForDomain(defaultProjectDomain).slice(0, 2);
  const initialSources = Array.from(
    new Set(initialProjects.flatMap(projectVideoSources)),
  );

  const criticalTasks: Array<Promise<unknown>> = [
    waitForWindowLoad(),
    document.fonts?.ready ?? Promise.resolve(),
    preloadImage(profile.portraitSrc),
  ];

  // Only the first visible project pair is warmed during startup, and that
  // work never blocks the portfolio reveal. Everything else is promoted by
  // viewport/intent logic in Projects.tsx.
  const backgroundMediaTasks = initialSources.map((src) =>
    warmProjectVideo(src, "auto")
      .then((ready) => {
        if (ready) onMediaReady();
        return ready;
      })
      .catch(() => false),
  );

  return {
    criticalTasks,
    backgroundMediaTasks,
    mediaTotal: initialSources.length,
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
  const revealStartedRef = useRef(loaderPlayedForThisDocument);

  useEffect(() => {
    if (loaderPlayedForThisDocument) {
      onReveal();
      return;
    }

    loaderPlayedForThisDocument = true;
    let disposed = false;
    let completedTasks = 0;

    document.documentElement.classList.add("portfolio-is-loading");

    const warmup = getWarmupTasks(() => {
      if (disposed) return;
      setMediaSettled((current) => Math.min(warmup.mediaTotal, current + 1));
    });

    setMediaTotal(warmup.mediaTotal);

    const totalTasks = Math.max(1, warmup.criticalTasks.length);

    const markTaskDone = () => {
      completedTasks += 1;
      const taskProgress = Math.min(96, 4 + (completedTasks / totalTasks) * 92);
      setProgress((current) => Math.max(current, taskProgress));
    };

    const trackedCriticalTasks = warmup.criticalTasks.map((task) =>
      Promise.resolve(task)
        .catch(() => undefined)
        .finally(markTaskDone),
    );

    // Fire-and-forget. These prime the default project pair but are not part
    // of the loading-screen gate.
    void Promise.allSettled(warmup.backgroundMediaTasks);

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

    // The loader now gates only on critical UI assets. Large MP4s continue
    // warming in the background and can never hold the site hostage.
    void Promise.allSettled(trackedCriticalTasks).then(() => {
      if (disposed) return;
      startReveal();
    });

    // A broken/blocked media asset must never trap someone on the loading
    // screen forever. This is an emergency fallback, not the normal reveal
    // path.
    const emergencyTimer = window.setTimeout(() => {
      startReveal();
    }, EMERGENCY_REVEAL_MS);

    return () => {
      disposed = true;
      window.clearTimeout(emergencyTimer);
      document.documentElement.classList.remove("portfolio-is-loading");
    };
  }, [onReveal]);

  if (phase === "done") return null;

  const status =
    progress < 24
      ? "Booting the interface"
      : mediaTotal > 0 && mediaSettled < mediaTotal
        ? "Buffering project media"
        : "Finalizing the experience";

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
            <span>Media warm-up</span>
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
          <span>{progress >= 100 ? "Ready" : "Preparing"}</span>
        </div>
      </div>
    </div>
  );
}
