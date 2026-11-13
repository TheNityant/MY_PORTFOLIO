import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { type DashboardFeature } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export const LIVE_PULSE_SWITCH_MS = 5000;
export const SPOTIFY_REFRESH_MS = 60000;

// The same public Giphy sticker sources used by Shivam Patel's dashboard.
// Kept as embeds (not copied into this repo) with original SVG fallbacks.
export const DANCER_GIF =
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OXBwZGkzbG4zc2N1dTU4bmgyZDBkenk1amxoZG5meWcydWp2aGU0MyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/NawOC2k0SQ5pYjTXLt/giphy.gif";
export const DANCER_FLOOR_GIF =
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N3J5dzE3dW9icXhlMHM0a2wwMzZhMDVmNmJ2bXNtZTZlcnljenhmayZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/GZQGgGtosl3Fm4k0A9/giphy.gif";
// Tenor's "Manutencao" sticker: a hard-hat worker actually hammering.
export const WORKER_GIF =
  "https://media.tenor.com/JHXKK4oP06MAAAAj/manutencao.gif";

type Playback = {
  status: "playing" | "last-played" | "idle" | "unconfigured" | "unavailable";
  title: string | null;
  artist: string | null;
  artwork: string | null;
  url: string | null;
};

const INITIAL_PLAYBACK: Playback = {
  status: "idle", title: null, artist: null, artwork: null, url: null,
};

// Original vector fallbacks: the reference GIFs are loaded only while their
// respective scene is visible. No audio, canvas, or extra video is requested.
function DancingFigure() {
  return (
    <svg className="live-pulse__character" viewBox="0 0 90 80" fill="none" aria-hidden="true">
      <ellipse cx="46" cy="75" rx="25" ry="3" fill="currentColor" opacity=".10"/>
      <g className="live-pulse__dancer">
        <g className="live-pulse__dancer-leg-left">
          <path d="M43 54L36 67L29 72" stroke="#8A75C9" strokeWidth="5" strokeLinecap="round"/>
          <path d="M28 72L20 74" stroke="#363A58" strokeWidth="5" strokeLinecap="round"/>
        </g>
        <g className="live-pulse__dancer-leg-right">
          <path d="M50 54L57 67L65 72" stroke="#8A75C9" strokeWidth="5" strokeLinecap="round"/>
          <path d="M63 72L71 74" stroke="#363A58" strokeWidth="5" strokeLinecap="round"/>
        </g>
        <path d="M40 40Q47 37 53 40L57 55Q46 61 38 55Z" fill="#A789E8"/>
        <path d="M39 53Q46 58 56 53L59 58Q45 65 36 57Z" fill="#68569C"/>
        <g className="live-pulse__dancer-arm-left">
          <path d="M41 39Q31 35 30 25L26 19" stroke="#DBA990" strokeWidth="4.5" strokeLinecap="round"/>
          <circle cx="26" cy="18" r="3.2" fill="#DBA990"/>
        </g>
        <g className="live-pulse__dancer-arm-right">
          <path d="M52 40Q62 38 64 27L68 21" stroke="#DBA990" strokeWidth="4.5" strokeLinecap="round"/>
          <circle cx="68" cy="20" r="3.2" fill="#DBA990"/>
        </g>
        <path d="M39 23Q34 16 38 12Q45 2 55 11Q60 17 57 26L59 32Q52 36 50 28Z" fill="#33364E"/>
        <ellipse cx="47" cy="25" rx="9" ry="11" fill="#DBA990"/>
        <path d="M38 19Q41 9 49 13Q54 14 57 21L52 19L49 17Q45 23 38 22Z" fill="#33364E"/>
        <circle cx="51" cy="24" r="1" fill="#392D39"/>
        <path d="M47 29Q50 31 52 28" stroke="#9C5D60" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M44 35L44 40L50 40L50 35" stroke="#DBA990" strokeWidth="4"/>
      </g>
      <circle cx="16" cy="18" r="2" fill="#C7ADFF" opacity=".65"/>
      <circle cx="76" cy="35" r="1.5" fill="#70DFA8" opacity=".75"/>
    </svg>
  );
}

function WorkerFigure() {
  return (
    <svg className="live-pulse__character" viewBox="0 0 90 80" fill="none" aria-hidden="true">
      <ellipse cx="45" cy="75" rx="30" ry="3" fill="currentColor" opacity=".11"/>
      <path d="M67 57L78 57L78 72L67 72Z" fill="#7F8A9A"/>
      <path d="M65 60H79M65 66H79" stroke="#B4BDCA" strokeWidth="1.6"/>
      <g className="live-pulse__builder">
        <g className="live-pulse__builder-leg">
          <path d="M39 55L35 70L28 73M49 55L53 70L60 73" stroke="#515D78" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M27 73H20M60 73H67" stroke="#303847" strokeWidth="4" strokeLinecap="round"/>
        </g>
        <path d="M38 39L52 39L56 55H35Z" fill="#DDA44F"/>
        <path d="M43 39V54M50 39V54" stroke="#F7D18A" strokeWidth="2.4"/>
        <path d="M39 36Q29 39 30 51" stroke="#D69D7A" strokeWidth="4.5" strokeLinecap="round"/>
        <circle cx="30" cy="52" r="3" fill="#D69D7A"/>
        <g className="live-pulse__builder-arm">
          <path d="M53 40L61 45L66 42" stroke="#D69D7A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M65 42L69 24" stroke="#555A69" strokeWidth="3" strokeLinecap="round"/>
          <path d="M61 22H77V28H61Z" fill="#B9C1CE"/>
        </g>
        <rect x="39" y="31" width="8" height="11" rx="3" fill="#D69D7A"/>
        <circle cx="44" cy="25" r="10" fill="#D69D7A"/>
        <path d="M33 23C33 12 40 10 45 11C53 12 56 17 56 23H33Z" fill="#EDB846"/>
        <path d="M31 23H58" stroke="#C48929" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="48" cy="25" r="1.2" fill="#363841"/>
      </g>
      <g className="live-pulse__builder-spark" stroke="#E4AF61" strokeWidth="2" strokeLinecap="round">
        <path d="M69 59L66 52M71 58L77 52M71 60H80"/>
      </g>
    </svg>
  );
}

export function FeatureCard({ feature }: { feature: DashboardFeature }) {
  const building = feature.kind === "building" ? feature : {
    kind: "building" as const,
    title: "Jiraiya Personal Assistant",
    description: "Personalization",
    href: "https://github.com/TheNityant/JIRAYA_PERSONAL_ASSISTANT",
  };

  const [mode, setMode] = useState<"listening" | "building">("listening");
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [rotationKey, setRotationKey] = useState(0);
  const [playback, setPlayback] = useState<Playback>(INITIAL_PLAYBACK);
  const [dancerReady, setDancerReady] = useState(false);
  const [dancerFailed, setDancerFailed] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const [workerFailed, setWorkerFailed] = useState(false);
  const [floorFailed, setFloorFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const target = rootRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "180px 0px",
      threshold: 0.1,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setPageVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    if (!inView || !pageVisible || reducedMotion) return;
    const interval = window.setInterval(
      () => setMode((current) => current === "listening" ? "building" : "listening"),
      LIVE_PULSE_SWITCH_MS,
    );
    return () => window.clearInterval(interval);
  }, [inView, pageVisible, reducedMotion, rotationKey]);

  useEffect(() => {
    if (!inView || !pageVisible) return;
    let active = true;
    const controller = new AbortController();
    const poll = async () => {
      try {
        const response = await fetch("/api/now-playing", {
          signal: controller.signal,
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Spotify status unavailable");
        const next = (await response.json()) as Playback;
        if (active && next && typeof next.status === "string") setPlayback(next);
      } catch {
        if (active && !controller.signal.aborted) {
          setPlayback({ ...INITIAL_PLAYBACK, status: "unavailable" });
        }
      }
    };
    void poll();
    const interval = window.setInterval(() => void poll(), SPOTIFY_REFRESH_MS);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [inView, pageVisible]);

  const listening = mode === "listening";
  const trackAvailable = Boolean(playback.title && playback.artist);
  const musicPlaying = playback.status === "playing";
  const liveTint = listening ? "#55ba83" : "#ad91ec";

  const selectMode = (next: "listening" | "building") => {
    setMode(next);
    setRotationKey((key) => key + 1); // restart the 5-second timer
  };

  return (
    <div
      ref={rootRef}
      className={`live-pulse${!inView || !pageVisible || reducedMotion ? " live-pulse--paused" : ""}`}
      style={{
        "--live-pulse-tint": liveTint,
        "--live-pulse-interval": `${LIVE_PULSE_SWITCH_MS}ms`,
      } as CSSProperties}
    >
      <div className="live-pulse__tabs" aria-label="Live dashboard display">
        <button type="button" className="live-pulse__tab" aria-pressed={listening}
          onClick={() => selectMode("listening")}>Listening</button>
        <button type="button" className="live-pulse__tab" aria-pressed={!listening}
          onClick={() => selectMode("building")}>Building</button>
        {inView && pageVisible && !reducedMotion ? (
          <span key={rotationKey} className="live-pulse__cycle" aria-hidden="true" />
        ) : null}
      </div>

      <div className="live-pulse__body">
        {listening ? (
          <>
            <div className="live-pulse__copy">
              <p className="live-pulse__eyebrow">
                {musicPlaying ? "Now playing" : trackAvailable ? "Last played" : "Spotify"}
                <span className="live-pulse__equalizer" aria-hidden="true">
                  {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
                </span>
              </p>
              <div className="live-pulse__song">
                {trackAvailable && playback.artwork ? (
                  <img className="live-pulse__artwork" src={playback.artwork}
                    alt="" loading="lazy" decoding="async" />
                ) : null}
                <div className="live-pulse__song-copy">
                  <p className="live-pulse__heading" title={playback.title || undefined}>
                    {trackAvailable ? playback.title : "Music corner"}
                  </p>
                  <p className="live-pulse__sub" title={playback.artist || undefined}>
                    {trackAvailable ? playback.artist : "Track sync not connected"}
                  </p>
                </div>
              </div>
              {playback.url && trackAvailable ? (
                <a className="live-pulse__link" href={playback.url} target="_blank" rel="noopener noreferrer">
                  Open in Spotify <ArrowUpRight size={12} aria-hidden="true"/>
                </a>
              ) : null}
            </div>
            <div className="live-pulse__figure live-pulse__figure--dance" aria-label="Animated dancer" role="img">
              <div className="live-pulse__spectrum" aria-hidden="true">
                {Array.from({ length: 26 }, (_, index) => (
                  <span
                    key={index}
                    className="live-pulse__spectrum-bar"
                    style={{
                      "--wave-delay": `-${(index * 97) % 1090}ms`,
                      "--wave-duration": `${650 + (index * 83) % 600}ms`,
                      "--wave-height": `${28 + (index * 41) % 72}%`,
                    } as CSSProperties}
                  />
                ))}
              </div>
              {(!dancerReady || dancerFailed || reducedMotion) ? (
                <span className="live-pulse__fallback"><DancingFigure /></span>
              ) : null}
              {!dancerFailed && !reducedMotion ? (
                <>
                  {dancerReady && !floorFailed ? (
                    <span className="live-pulse__floor" aria-hidden="true">
                      <img src={DANCER_FLOOR_GIF} alt="" decoding="async" loading="lazy"
                        onError={() => setFloorFailed(true)} />
                    </span>
                  ) : null}
                  <img className={`live-pulse__gif live-pulse__gif--dancer${dancerReady ? " live-pulse__gif--ready" : ""}`}
                    src={DANCER_GIF} alt="" loading="lazy" decoding="async"
                    onLoad={() => setDancerReady(true)}
                    onError={() => setDancerFailed(true)} />
                </>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="live-pulse__copy">
              <p className="live-pulse__eyebrow">In development</p>
              <p className="live-pulse__heading" title={building.title}>{building.title}</p>
              <p className="live-pulse__sub" title={building.description}>{building.description}</p>
              {building.href ? (
                <a className="live-pulse__link" href={building.href} target="_blank" rel="noopener noreferrer">
                  Repository <ArrowUpRight size={12} aria-hidden="true"/>
                </a>
              ) : null}
            </div>
            <div className="live-pulse__figure live-pulse__figure--work" aria-label="Animated construction worker hammering" role="img">
              {(!workerReady || workerFailed || reducedMotion) ? (
                <span className="live-pulse__fallback"><WorkerFigure /></span>
              ) : null}
              {!workerFailed && !reducedMotion ? (
                <img className={`live-pulse__gif live-pulse__gif--worker${workerReady ? " live-pulse__gif--ready" : ""}`}
                  src={WORKER_GIF} alt="" loading="lazy" decoding="async"
                  onLoad={() => setWorkerReady(true)}
                  onError={() => setWorkerFailed(true)} />
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function featureCardTitle(_feature: DashboardFeature) {
  return "Listening / Building";
}
