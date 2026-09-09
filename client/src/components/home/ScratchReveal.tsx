import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { dashboardCopy } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

type ScratchRevealProps = {
  children: ReactNode;
  className?: string;
};

export function ScratchReveal({ children, className }: ScratchRevealProps) {
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
    const dark = document.documentElement.classList.contains("dark");
    const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0, dark ? "#3f3f46" : "#d4d4d8");
    g.addColorStop(0.5, dark ? "#52525b" : "#e4e4e7");
    g.addColorStop(1, dark ? "#27272a" : "#a1a1aa");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = dark ? "rgba(250,250,250,0.55)" : "rgba(24,24,27,0.55)";
    ctx.font = "600 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(dashboardCopy.scratchPrompt, rect.width / 2, rect.height / 2 + 4);
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
          {children}
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
