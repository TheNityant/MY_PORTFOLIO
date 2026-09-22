import type { Project } from "@/data/portfolio";
import { resolveProjectMediaSrc } from "@/lib/projectMedia";

export type ProjectVideoWarmMode = "metadata" | "auto";

type ProjectVideoPoolEntry = {
  src: string;
  video: HTMLVideoElement;
  mode: ProjectVideoWarmMode;
  metadataPromise: Promise<boolean>;
  playablePromise: Promise<boolean>;
  primePromise?: Promise<boolean>;
};

const entries = new Map<string, ProjectVideoPoolEntry>();
let poolHost: HTMLDivElement | null = null;

function ensurePoolHost() {
  if (typeof document === "undefined" || !document.body) return null;

  if (poolHost && document.contains(poolHost)) return poolHost;

  const existing = document.getElementById("project-video-pool");
  if (existing instanceof HTMLDivElement) {
    poolHost = existing;
    return existing;
  }

  const host = document.createElement("div");
  host.id = "project-video-pool";
  host.className = "project-video-pool";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  poolHost = host;
  return host;
}

function waitForState(
  video: HTMLVideoElement,
  minimumState: number,
  events: readonly string[],
) {
  if (video.readyState >= minimumState) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    let settled = false;

    const cleanup = () => {
      for (const event of events) video.removeEventListener(event, onReady);
      video.removeEventListener("error", onError);
      window.clearTimeout(timeout);
    };

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const onReady = () => {
      if (video.readyState >= minimumState) finish(true);
    };

    const onError = () => finish(false);
    const timeout = window.setTimeout(() => finish(false), 55000);

    for (const event of events) video.addEventListener(event, onReady);
    video.addEventListener("error", onError, { once: true });
  });
}

function bufferedAhead(video: HTMLVideoElement) {
  if (!video.buffered.length) return 0;

  for (let index = 0; index < video.buffered.length; index += 1) {
    const start = video.buffered.start(index);
    const end = video.buffered.end(index);
    if (video.currentTime >= start && video.currentTime <= end) {
      return Math.max(0, end - video.currentTime);
    }
  }

  return 0;
}

function waitForBufferedTarget(video: HTMLVideoElement, seconds: number) {
  const isReady = () => {
    if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return false;
    const duration = Number.isFinite(video.duration) ? video.duration : null;
    const target = duration === null ? seconds : Math.min(seconds, Math.max(0.35, duration * 0.9));
    return bufferedAhead(video) >= target || video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA;
  };

  if (isReady()) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const events = ["progress", "loadeddata", "canplay", "canplaythrough", "durationchange"];

    const cleanup = () => {
      for (const event of events) video.removeEventListener(event, onProgress);
      video.removeEventListener("error", onError);
      window.clearTimeout(timeout);
    };

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const onProgress = () => {
      if (isReady()) finish(true);
    };

    const onError = () => finish(false);
    const timeout = window.setTimeout(() => finish(false), 20000);

    for (const event of events) video.addEventListener(event, onProgress);
    video.addEventListener("error", onError, { once: true });
  });
}

function waitForPlayableBuffer(video: HTMLVideoElement) {
  const MIN_BUFFERED_SECONDS = 2;

  const isReady = () => {
    if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return false;

    const duration = Number.isFinite(video.duration) ? video.duration : null;
    const target =
      duration === null
        ? MIN_BUFFERED_SECONDS
        : Math.min(MIN_BUFFERED_SECONDS, Math.max(0.35, duration * 0.35));

    return bufferedAhead(video) >= target || video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA;
  };

  if (isReady()) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const events = ["progress", "loadeddata", "canplay", "canplaythrough", "durationchange"];

    const cleanup = () => {
      for (const event of events) video.removeEventListener(event, onProgress);
      video.removeEventListener("error", onError);
      window.clearTimeout(timeout);
    };

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const onProgress = () => {
      if (isReady()) finish(true);
    };

    const onError = () => finish(false);
    const timeout = window.setTimeout(() => finish(false), 55000);

    for (const event of events) video.addEventListener(event, onProgress);
    video.addEventListener("error", onError, { once: true });
  });
}

function createEntry(src: string, mode: ProjectVideoWarmMode) {
  const video = document.createElement("video");

  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.controls = false;
  video.preload = mode;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.dataset.projectVideoPool = "true";

  const metadataPromise = waitForState(
    video,
    HTMLMediaElement.HAVE_METADATA,
    ["loadedmetadata"],
  );
  const playablePromise = waitForPlayableBuffer(video);

  const entry: ProjectVideoPoolEntry = {
    src,
    video,
    mode,
    metadataPromise,
    playablePromise,
  };

  entries.set(src, entry);
  ensurePoolHost()?.appendChild(video);

  video.src = src;

  return entry;
}

function ensureEntry(src: string, mode: ProjectVideoWarmMode) {
  let entry = entries.get(src);

  if (!entry) {
    entry = createEntry(src, mode);
  }

  if (mode === "auto" && entry.mode !== "auto") {
    entry.mode = "auto";
    entry.video.preload = "auto";
  }

  return entry;
}

export function projectVideoSources(project: Project) {
  if (project.media.kind === "video") {
    return [resolveProjectMediaSrc(project.media.src)];
  }

  if (project.media.kind === "video-carousel") {
    return project.media.videos.map((video) => resolveProjectMediaSrc(video.src));
  }

  return [];
}

export function canAggressivelyWarmProjectMedia() {
  if (typeof window === "undefined") return false;
  if (!window.matchMedia("(min-width: 700px)").matches) return false;

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

export function warmProjectVideo(
  src: string,
  mode: ProjectVideoWarmMode = "auto",
) {
  if (typeof document === "undefined") return Promise.resolve(false);

  const entry = ensureEntry(src, mode);
  return mode === "auto" ? entry.playablePromise : entry.metadataPromise;
}

export function warmProjectVideoSet(
  sources: readonly string[],
  mode: ProjectVideoWarmMode,
  onSettled?: (src: string, ready: boolean) => void,
) {
  const uniqueSources = Array.from(new Set(sources));

  // Intentionally create/promote every element before awaiting any one of them.
  // The browser still controls connection scheduling, but every project video
  // enters the media fetch queue in the same turn.
  const jobs = uniqueSources.map((src) =>
    warmProjectVideo(src, mode).then((ready) => {
      onSettled?.(src, ready);
      return ready;
    }),
  );

  return {
    total: uniqueSources.length,
    promise: Promise.allSettled(jobs),
  };
}

export function promoteProjectVideo(src: string) {
  if (typeof document === "undefined") return;
  ensureEntry(src, "auto");
}

function shouldKickMobileVideoFetch() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(max-width: 699px)").matches ||
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

async function kickMobileVideoFetch(video: HTMLVideoElement) {
  if (!shouldKickMobileVideoFetch()) return;
  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return;

  const originalTime = video.currentTime;

  try {
    await video.play();

    await new Promise<void>((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        video.removeEventListener("loadeddata", finish);
        video.removeEventListener("canplay", finish);
        video.removeEventListener("playing", finish);
        window.clearTimeout(timeout);
        resolve();
      };

      const timeout = window.setTimeout(finish, 900);
      video.addEventListener("loadeddata", finish, { once: true });
      video.addEventListener("canplay", finish, { once: true });
      video.addEventListener("playing", finish, { once: true });
    });
  } catch {
    // Muted inline autoplay can still be denied on some browser/device
    // combinations. The normal preload path remains as the fallback.
  } finally {
    video.pause();
    try {
      video.currentTime = originalTime;
    } catch {
      // Ignore transient seek errors while media state is changing.
    }
  }
}

export function primeProjectVideo(
  src: string,
  bufferedSeconds = 5,
) {
  if (typeof document === "undefined") return Promise.resolve(false);

  const entry = ensureEntry(src, "auto");
  if (entry.primePromise) return entry.primePromise;

  const runPrime = (async () => {
    // Mobile Safari/Chrome may throttle preload="auto" for pooled/off-screen
    // media until playback is attempted. Kick a muted inline play first so
    // secondary carousel videos and below-fold project videos actually start
    // fetching instead of waiting on a buffer the browser has not prioritized.
    await kickMobileVideoFetch(entry.video);

    // Do not permanently trust an older timed-out playable promise. A video
    // can become playable later, especially for secondary carousel clips.
    const playable =
      entry.video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA
        ? true
        : await waitForPlayableBuffer(entry.video);

    if (!playable) return false;

    const buffered = await waitForBufferedTarget(entry.video, bufferedSeconds);
    if (!buffered) return false;

    const video = entry.video;
    const originalTime = video.currentTime;

    try {
      video.currentTime = 0;
      await video.play();

      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          resolve();
        };

        const timeout = window.setTimeout(finish, 700);

        if ("requestVideoFrameCallback" in video) {
          video.requestVideoFrameCallback(() => finish());
        } else {
          window.requestAnimationFrame(() => window.requestAnimationFrame(finish));
        }
      });

      video.pause();
      video.currentTime = 0;
      return true;
    } catch {
      video.pause();
      try {
        video.currentTime = originalTime;
      } catch {
        // Ignore browsers that reject a seek while media state changes.
      }
      return buffered;
    }
  })();

  entry.primePromise = runPrime.then(
    (ready) => {
      if (!ready) entry.primePromise = undefined;
      return ready;
    },
    () => {
      entry.primePromise = undefined;
      return false;
    },
  );

  return entry.primePromise;
}

export function attachProjectVideo({
  src,
  host,
  className,
  poster,
  ariaLabel,
}: {
  src: string;
  host: HTMLElement;
  className: string;
  poster?: string;
  ariaLabel: string;
}) {
  const entry = ensureEntry(src, "metadata");
  const video = entry.video;

  video.className = className;
  if (poster) video.poster = poster;
  else video.removeAttribute("poster");

  video.setAttribute("aria-label", ariaLabel);
  video.removeAttribute("aria-hidden");

  if (video.parentElement !== host) {
    host.replaceChildren(video);
  }

  return video;
}

export function parkProjectVideo(src: string, host?: HTMLElement | null) {
  const entry = entries.get(src);
  if (!entry) return;

  const video = entry.video;
  if (host && video.parentElement !== host) return;

  video.pause();
  video.removeAttribute("aria-label");
  video.setAttribute("aria-hidden", "true");
  video.className = "";

  const target = ensurePoolHost();
  if (target && video.parentElement !== target) {
    target.appendChild(video);
  }
}

export function getProjectVideoPoolState(src: string) {
  const entry = entries.get(src);
  if (!entry) {
    return {
      exists: false,
      readyState: 0,
      networkState: 0,
      bufferedEnd: 0,
    };
  }

  const video = entry.video;
  const bufferedEnd =
    video.buffered.length > 0
      ? video.buffered.end(video.buffered.length - 1)
      : 0;

  return {
    exists: true,
    readyState: video.readyState,
    networkState: video.networkState,
    bufferedEnd,
  };
}
