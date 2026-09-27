import { useEffect, useRef, useState } from "react";
import {
  experience,
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

async function primeMediaWithConcurrency(
  targets: Array<[string, number]>,
  concurrency: number,
  onMediaReady: () => void,
) {
  const results = new Array<boolean>(targets.length).fill(false);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < targets.length) {
      const index = nextIndex;
      nextIndex += 1;

      const [src, bufferedSeconds] = targets[index];
      const ready = await primeWithRetry(src, bufferedSeconds);
      results[index] = ready;
      if (ready) onMediaReady();
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, Math.max(1, targets.length)) },
      () => worker(),
    ),
  );

  return results;
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

  const experienceImages = experience.flatMap((item) =>
    item.kind === "entry" && item.mark.src ? [item.mark.src] : [],
  );

  const imageSources = Array.from(
    new Set([profile.portraitSrc, ...experienceImages].filter(Boolean)),
  );

  const criticalTasks: Array<Promise<unknown>> = [
    waitForWindowLoad(),
    document.fonts?.ready ?? Promise.resolve(),
    ...imageSources.map((src) => preloadImage(src)),
  ];

  const priorityBySource = new Map<string, number>();

  for (const project of projects) {
    const priority =
      project.id === "robocon-2026" || project.id === "robotic-hand"
        ? 0
        : project.domain === "backend"
          ? 1
          : 2;

    for (const src of projectVideoSources(project)) {
      priorityBySource.set(
        src,
        Math.min(priorityBySource.get(src) ?? Number.POSITIVE_INFINITY, priority),
      );
    }
  }

  const targets = Array.from(mediaTargets.entries()).sort(
    ([srcA], [srcB]) =>
      (priorityBySource.get(srcA) ?? 9) - (priorityBySource.get(srcB) ?? 9),
  );

  return {
    criticalTasks,
    mediaTotal: targets.length,
    // Identity/experience imagery wins the first network turn. Once those
    // assets settle, warm project media in a small parallel batch. Robotics
    // clips are deliberately first because Robotic Hand and the secondary
    // RoboCon clip were the slowest on real cold-entry tests.
    startMedia: async () => {
      await Promise.allSettled(criticalTasks);
      return primeMediaWithConcurrency(targets, 4, onMediaReady);
    },
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

    // The opening screen is a real media-readiness gate on a cold document:
    // identity assets settle first, then every project video is primed to its
    // target buffer before the normal reveal. A hard timeout still prevents a
    // single broken/slow asset from trapping the visitor indefinitely.
    void Promise.allSettled(trackedCriticalTasks).then(async () => {
      if (disposed) return;
      const mediaResults = await warmup.startMedia();
      if (disposed) return;
      if (mediaResults.every(Boolean)) startReveal();
    });

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
