import { useEffect, useRef, useState } from "react";
import {
  profile,
  projects,
} from "@/data/portfolio";
import {
  primeProjectVideo,
  projectVideoSources,
} from "@/lib/projectVideoPool";

const MEDIA_GATE_MAX_MS = 15000;
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

async function primeWithRetry(src: string, bufferedSeconds: number) {
  const first = await primeProjectVideo(src, bufferedSeconds).catch(() => false);
  if (first) return true;

  await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
  return primeProjectVideo(src, bufferedSeconds).catch(() => false);
}

function getWarmupTasks(onMediaReady: () => void) {
  const mediaTargets = new Map<string, number>();

  for (const project of projects) {
    const bufferedSeconds = project.media.kind === "video-carousel" ? 8 : 5;

    for (const src of projectVideoSources(project)) {
      mediaTargets.set(
        src,
        Math.max(mediaTargets.get(src) ?? 0, bufferedSeconds),
      );
    }
  }

  const criticalTasks: Array<Promise<unknown>> = [
    waitForWindowLoad(),
    document.fonts?.ready ?? Promise.resolve(),
    preloadImage(profile.portraitSrc),
  ];

  // Start every project video immediately during the loading screen. The
  // pooled media elements are reused by the project cards, so this startup
  // work survives domain switches instead of being thrown away.
  const mediaTasks = Array.from(mediaTargets, ([src, bufferedSeconds]) =>
    primeWithRetry(src, bufferedSeconds).then((ready) => {
      if (ready) onMediaReady();
      return ready;
    }),
  );

  return {
    criticalTasks,
    mediaTasks,
    mediaTotal: mediaTasks.length,
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
    let completedCritical = 0;
    let completedMedia = 0;

    document.documentElement.classList.add("portfolio-is-loading");

    const updateProgress = (criticalTotal: number, mediaCount: number) => {
      const total = Math.max(1, criticalTotal + mediaCount);
      const completed = completedCritical + completedMedia;
      const next = Math.min(96, 4 + (completed / total) * 92);
      setProgress((current) => Math.max(current, next));
    };

    const warmup = getWarmupTasks(() => {
      if (disposed) return;
      completedMedia += 1;
      setMediaSettled((current) => Math.min(warmup.mediaTotal, current + 1));
      updateProgress(warmup.criticalTasks.length, warmup.mediaTotal);
    });

    setMediaTotal(warmup.mediaTotal);

    const trackedCriticalTasks = warmup.criticalTasks.map((task) =>
      Promise.resolve(task)
        .catch(() => undefined)
        .finally(() => {
          if (disposed) return;
          completedCritical += 1;
          updateProgress(warmup.criticalTasks.length, warmup.mediaTotal);
        }),
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

    // Normal path: do not reveal until the UI assets are ready AND every
    // project video has reached its startup buffer target.
    void Promise.all([
      Promise.allSettled(trackedCriticalTasks),
      Promise.all(warmup.mediaTasks),
    ]).then(([, mediaResults]) => {
      if (disposed) return;
      if (mediaResults.every(Boolean)) startReveal();
    });

    // The user prefers a longer startup screen over late project media, but a
    // broken asset/network must still have a hard escape hatch.
    const emergencyTimer = window.setTimeout(() => {
      startReveal();
    }, MEDIA_GATE_MAX_MS);

    return () => {
      disposed = true;
      window.clearTimeout(emergencyTimer);
      document.documentElement.classList.remove("portfolio-is-loading");
    };
  }, [onReveal]);

  if (phase === "done") return null;

  const status =
    progress < 18
      ? "Booting the interface"
      : mediaTotal > 0 && mediaSettled < mediaTotal
        ? "Buffering all project media"
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
