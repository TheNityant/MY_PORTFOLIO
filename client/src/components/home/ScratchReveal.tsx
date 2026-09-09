import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { type ScratchRevealContent } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

const BRUSH_RADIUS = 30;
const COMPLETE_THRESHOLD = 0.2;
const GRADIENT_COLORS = ["rgba(169, 124, 249, 0.2)", "rgba(243, 140, 185, 0.2)", "rgba(253, 204, 146, 0.2)"] as const;

type ScratchRevealProps = {
  content: ScratchRevealContent;
  className?: string;
};

function RevealLayer({ content }: { content: ScratchRevealContent }) {
  if (content.kind === "text") {
    return <p className="scratch-reveal-line">{content.text}</p>;
  }
  return <img className="scratch-reveal-media" src={content.src} alt={content.alt} />;
}

export function ScratchReveal({ content, className }: ScratchRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const scratching = useRef(false);
  const [complete, setComplete] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const labelId = useId();

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, rect.width, rect.height);

    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, GRADIENT_COLORS[0]);
    gradient.addColorStop(0.5, GRADIENT_COLORS[1]);
    gradient.addColorStop(1, GRADIENT_COLORS[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    paintCover();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver(() => {
      if (!complete) paintCover();
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [complete, paintCover, reducedMotion, resetKey]);

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / Math.max(1, rect.width);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(clientX - rect.left, clientY - rect.top, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const checkComplete = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || complete) return;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) cleared += 1;
    }
    if (cleared / (data.length / 4) >= COMPLETE_THRESHOLD) {
      setComplete(true);
      setCelebrate(true);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      window.setTimeout(() => setCelebrate(false), 500);
    }
  };

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (event: PointerEvent) => {
      if (!scratching.current) return;
      scratchAt(event.clientX, event.clientY);
    };
    const onUp = () => {
      if (!scratching.current) return;
      scratching.current = false;
      checkComplete();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [complete, reducedMotion]);

  const reset = () => {
    setComplete(false);
    setCelebrate(false);
    setResetKey((key) => key + 1);
  };

  return (
    <div className={cn("scratch-reveal", className)}>
      <div
        ref={wrapRef}
        className={cn("scratch-reveal-stage", celebrate && "scratch-reveal-stage--celebrate")}
        aria-labelledby={labelId}
        onPointerDown={(event) => {
          if (reducedMotion || complete) return;
          scratching.current = true;
          scratchAt(event.clientX, event.clientY);
        }}
      >
        <div className="scratch-reveal-content" id={labelId}>
          <div className="scratch-reveal-payload scratch-reveal-payload--visible">
            <RevealLayer content={content} />
          </div>
        </div>
        {!reducedMotion ? (
          <canvas
            ref={canvasRef}
            className={cn("scratch-reveal-canvas", complete && "scratch-reveal-canvas--done")}
            aria-hidden="true"
          />
        ) : null}
        <button
          type="button"
          className="scratch-reveal-reset scratch-reveal-reset--overlay"
          onClick={(event) => {
            event.stopPropagation();
            reset();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label="Refresh scratch"
        >
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
