import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { dashboardCopy, type ScratchRevealContent } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

type ScratchRevealProps = {
  content: ScratchRevealContent;
  className?: string;
};

function RevealLayer({ content }: { content: ScratchRevealContent }) {
  if (content.kind === "text") {
    return <p className="scratch-reveal-line">{content.text}</p>;
  }
  if (content.kind === "gif") {
    return <img className="scratch-reveal-media" src={content.src} alt={content.alt} />;
  }
  return <img className="scratch-reveal-media" src={content.src} alt={content.alt} />;
}

export function ScratchReveal({ content, className }: ScratchRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const scratching = useRef(false);
  const [complete, setComplete] = useState(false);
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
    const g = ctx.createLinearGradient(0, 0, rect.width * 0.85, rect.height);
    g.addColorStop(0, "#171a20");
    g.addColorStop(0.42, "#14171d");
    g.addColorStop(0.78, "#12151a");
    g.addColorStop(1, "#0f1116");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);
    const hatch = ctx.createPattern(
      (() => {
        const p = document.createElement("canvas");
        p.width = 6;
        p.height = 6;
        const px = p.getContext("2d");
        if (px) {
          px.strokeStyle = "rgba(255,255,255,0.04)";
          px.lineWidth = 1;
          px.beginPath();
          px.moveTo(0, 6);
          px.lineTo(6, 0);
          px.stroke();
        }
        return p;
      })(),
      "repeat",
    );
    if (hatch) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = hatch;
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.globalAlpha = 1;
    }
    const sheen = ctx.createLinearGradient(0, 0, rect.width, rect.height * 0.5);
    sheen.addColorStop(0, "rgba(255,255,255,0.07)");
    sheen.addColorStop(0.5, "rgba(255,255,255,0.015)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, rect.width, rect.height);
    for (let i = 0; i < 180; i += 1) {
      const n = Math.random();
      ctx.fillStyle = `rgba(255,255,255,${n * 0.035})`;
      ctx.fillRect(Math.random() * rect.width, Math.random() * rect.height, 1, 1);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, rect.width - 1, rect.height - 1);
    ctx.fillStyle = "rgba(235,236,240,0.88)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 4;
    ctx.fillText(dashboardCopy.scratchPrompt, rect.width / 2, rect.height / 2 + 4);
    ctx.shadowBlur = 0;
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
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(clientX - rect.left, clientY - rect.top, 18, 0, Math.PI * 2);
    ctx.fill();
  };

  const checkComplete = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || complete) return;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 24) cleared += 1;
    }
    if (cleared / (data.length / 4) > 0.42) {
      setComplete(true);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [complete, reducedMotion]);

  const reset = () => {
    setComplete(false);
    setResetKey((key) => key + 1);
  };

  const revealFully = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    ctx?.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0);
    setComplete(true);
  };

  return (
    <div className={cn("scratch-reveal", className)}>
      <div
        ref={wrapRef}
        className="scratch-reveal-stage"
        aria-labelledby={labelId}
        onPointerDown={(event) => {
          if (reducedMotion || complete) return;
          scratching.current = true;
          scratchAt(event.clientX, event.clientY);
        }}
      >
        <div className="scratch-reveal-content" id={labelId}>
          <RevealLayer content={content} />
        </div>
        {!reducedMotion ? (
          <canvas
            ref={canvasRef}
            className={cn("scratch-reveal-canvas", complete && "scratch-reveal-canvas--done")}
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="scratch-reveal-controls">
        <button type="button" className="scratch-reveal-reset" onClick={reset} aria-label="Reset scratch">
          <RefreshCw size={14} aria-hidden="true" />
        </button>
        <button type="button" className="scratch-reveal-skip" onClick={revealFully}>
          {complete || reducedMotion ? "Revealed" : "Reveal"}
        </button>
      </div>
    </div>
  );
}
