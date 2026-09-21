import type { Project } from "@/data/portfolio";
import { resolveProjectMediaSrc } from "@/lib/projectMedia";

export type ProjectVideoWarmMode = "metadata" | "auto";

type ProjectVideoPoolEntry = {
  src: string;
  video: HTMLVideoElement;
  mode: ProjectVideoWarmMode;
  metadataPromise: Promise<boolean>;
  playablePromise: Promise<boolean>;
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
    const timeout = window.setTimeout(() => finish(false), 45000);

    for (const event of events) video.addEventListener(event, onReady);
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
  const playablePromise = waitForState(
    video,
    HTMLMediaElement.HAVE_CURRENT_DATA,
    ["loadeddata", "canplay"],
  );

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
  video.load();

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

    if (entry.video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      entry.video.load();
    }
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
