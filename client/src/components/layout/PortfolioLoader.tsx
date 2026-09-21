import { useEffect, useRef, useState } from "react";
import {
  defaultProjectDomain,
  profile,
  projectsForDomain,
} from "@/data/portfolio";
import {
  canAggressivelyWarmProjectMedia,
  projectVideoSources,
  warmProjectVideo,
} from "@/lib/projectVideoPool";

const EMERGENCY_REVEAL_MS = 25000;
const EXIT_MS = 680;
const VISUAL_WARMUP_MS = 420;

let loaderPlayedForThisDocument = false;

type LoaderPhase = "loading" | "leaving" | "done";

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
  const prioritySources = Array.from(
    new Set(initialProjects.flatMap(projectVideoSources)),
  );
  const aggressiveMediaWarmup = canAggressivelyWarmProjectMedia();

  const tasks: Array<Promise<unknown>> = [
    document.fonts?.ready ?? Promise.resolve(),
  ];

  if (profile.portraitSrc) {
    tasks.push(preloadImage(profile.portraitSrc));
  }

  // Only the first visible project pair belongs on the critical path.
  // Warming every project at once caused all large MP4s to compete for the
  // same browser/network resources and did not improve perceived startup.
  const videoTasks = prioritySources.map((src) => {
    const mode = aggressiveMediaWarmup ? "auto" : "metadata";

    return warmProjectVideo(src, mode)
      .then((ready) => {
        if (ready) onMediaReady();
        return ready;
      })
      .catch(() => false);
  });

  tasks.push(...videoTasks);

  return {
    tasks,
    mediaTotal: prioritySources.length,
    aggressiveMediaWarmup,
  };
}

export function PortfolioLoader({
  onPrepareVisuals,
  onReveal,
}: {
  onPrepareVisuals: () => void;
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
      onPrepareVisuals();
      onReveal();
      return;
    }

    loaderPlayedForThisDocument = true;
    let disposed = false;
    let completedTasks = 0;
    let visualTimer: number | null = null;

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
      const taskProgress = Math.min(96, 4 + (completedTasks / totalTasks) * 92);
      setProgress((current) => Math.max(current, taskProgress));
    };

    const trackedTasks = warmup.tasks.map((task) =>
      Promise.resolve(task)
        .catch(() => undefined)
        .finally(markTaskDone),
    );

    const finishReveal = () => {
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

    const prepareVisualsThenReveal = () => {
      if (disposed || revealStartedRef.current) return;
      onPrepareVisuals();

      if (visualTimer !== null) window.clearTimeout(visualTimer);
      visualTimer = window.setTimeout(finishReveal, VISUAL_WARMUP_MS);
    };

    void Promise.allSettled(trackedTasks).then((results) => {
      if (disposed) return;

      const allPriorityMediaReady = results.every((result) => {
        if (result.status !== "fulfilled") return false;
        return result.value !== false;
      });

      if (allPriorityMediaReady) prepareVisualsThenReveal();
    });

    // Never trap the user behind a failed media request. Even the emergency
    // path gives the shader a brief hidden warm-up before the loader exits.
    const emergencyTimer = window.setTimeout(
      prepareVisualsThenReveal,
      EMERGENCY_REVEAL_MS,
    );

    return () => {
      disposed = true;
      window.clearTimeout(emergencyTimer);
      if (visualTimer !== null) window.clearTimeout(visualTimer);
      document.documentElement.classList.remove("portfolio-is-loading");
    };
  }, [onPrepareVisuals, onReveal]);

  if (phase === "done") return null;

  const status =
    progress < 24
      ? "Booting the interface"
      : mediaTotal > 0 && mediaSettled < mediaTotal
        ? "Buffering priority project media"
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
          <span>NITYANT / ENGINEERING PORTFOLIO</span>
          <strong>{status}</strong>
          <p>Fonts · identity · interface · priority project media</p>
        </div>

        <div className="portfolio-loader__media" aria-hidden="true">
          <div className="portfolio-loader__media-head">
            <span>{aggressiveWarmup ? "Priority playable media" : "Priority media warm-up"}</span>
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

        <div className="portfolio-loader__stats" aria-hidden="true">
          <div>
            <span>Progress</span>
            <strong>{Math.round(progress)}%</strong>
          </div>
          <div>
            <span>Media</span>
            <strong>{mediaTotal > 0 ? `${mediaSettled}/${mediaTotal}` : "—"}</strong>
          </div>
          <div>
            <span>Mode</span>
            <strong>{aggressiveWarmup ? "Priority" : "Balanced"}</strong>
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
