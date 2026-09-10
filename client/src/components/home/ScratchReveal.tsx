import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { scratchRewards } from "@/data/scratchRewards";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import styles from "./scratchReveal.module.css";

const BRUSH_RADIUS = 30;
const COMPLETE_THRESHOLD = 0.2;
// Match the reference scratch layer: the gradient is intentionally translucent
// rather than a fully saturated pink/purple/orange panel.
const GRADIENT_COLORS = ["#A97CF933", "#F38CB933", "#FDCC9233"] as const;

function differentReward(current: number) {
  if (scratchRewards.length <= 1) return 0;
  let next = current;
  while (next === current) next = Math.floor(Math.random() * scratchRewards.length);
  return next;
}

export function ScratchReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scratching = useRef(false);
  const [rewardIndex, setRewardIndex] = useState(() => Math.floor(Math.random() * scratchRewards.length));
  const [complete, setComplete] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = "#ccc";
    ctx.fillRect(0, 0, rect.width, rect.height);

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
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() => {
      if (!complete) paintCover();
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [complete, paintCover, reducedMotion, rewardIndex]);

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

  const checkCompletion = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || complete) return;

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let clearPixels = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) clearPixels += 1;
    }

    if (clearPixels / (pixels.length / 4) >= COMPLETE_THRESHOLD) {
      setComplete(true);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  };

  const reset = () => {
    scratching.current = false;
    setComplete(false);
    setRewardIndex((current) => differentReward(current));
  };

  return (
    <div className={styles.root}>
      <div ref={stageRef} className={`${styles.stage} ${complete ? styles.stageComplete : ""}`}>
        <div className={styles.reward}>
          <img src={scratchRewards[rewardIndex]} alt="Scratch reward" draggable={false} />
        </div>

        {!reducedMotion ? (
          <canvas
            ref={canvasRef}
            className={`${styles.canvas} ${complete ? styles.canvasDone : ""}`}
            aria-hidden="true"
            onPointerDown={(event) => {
              if (complete) return;
              scratching.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              scratchAt(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (!scratching.current || complete) return;
              scratchAt(event.clientX, event.clientY);
            }}
            onPointerUp={(event) => {
              if (!scratching.current) return;
              scratching.current = false;
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
              checkCompletion();
            }}
            onPointerCancel={() => {
              scratching.current = false;
              checkCompletion();
            }}
          />
        ) : null}

        <button
          type="button"
          className={styles.refresh}
          onClick={(event) => {
            event.stopPropagation();
            reset();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label="Refresh scratch reward"
        >
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
