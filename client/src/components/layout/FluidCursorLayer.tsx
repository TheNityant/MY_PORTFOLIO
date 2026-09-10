import { useEffect, useRef } from "react";
import { useFinePointer } from "@/hooks/useFinePointer";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import "./fluidCursorLayer.css";

type FluidGrid = {
  cols: number;
  rows: number;
  density: Float32Array;
  densityNext: Float32Array;
  u: Float32Array;
  v: Float32Array;
  uNext: Float32Array;
  vNext: Float32Array;
  pressure: Float32Array;
  pressureNext: Float32Array;
  divergence: Float32Array;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function makeGrid(cols: number, rows: number): FluidGrid {
  const size = cols * rows;
  return {
    cols,
    rows,
    density: new Float32Array(size),
    densityNext: new Float32Array(size),
    u: new Float32Array(size),
    v: new Float32Array(size),
    uNext: new Float32Array(size),
    vNext: new Float32Array(size),
    pressure: new Float32Array(size),
    pressureNext: new Float32Array(size),
    divergence: new Float32Array(size),
  };
}

function sample(field: Float32Array, x: number, y: number, cols: number, rows: number) {
  const x0 = clamp(Math.floor(x), 0, cols - 1);
  const y0 = clamp(Math.floor(y), 0, rows - 1);
  const x1 = Math.min(cols - 1, x0 + 1);
  const y1 = Math.min(rows - 1, y0 + 1);
  const tx = clamp(x - x0, 0, 1);
  const ty = clamp(y - y0, 0, 1);

  const a = field[y0 * cols + x0] * (1 - tx) + field[y0 * cols + x1] * tx;
  const b = field[y1 * cols + x0] * (1 - tx) + field[y1 * cols + x1] * tx;
  return a * (1 - ty) + b * ty;
}

function projectVelocity(grid: FluidGrid, iterations: number) {
  const { cols, rows, divergence } = grid;
  let pressure = grid.pressure;
  let pressureNext = grid.pressureNext;
  pressure.fill(0);
  pressureNext.fill(0);

  for (let y = 1; y < rows - 1; y += 1) {
    for (let x = 1; x < cols - 1; x += 1) {
      const i = y * cols + x;
      divergence[i] =
        -0.5 *
        (grid.u[i + 1] - grid.u[i - 1] + grid.v[i + cols] - grid.v[i - cols]);
    }
  }

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    for (let y = 1; y < rows - 1; y += 1) {
      for (let x = 1; x < cols - 1; x += 1) {
        const i = y * cols + x;
        pressureNext[i] =
          (divergence[i] + pressure[i - 1] + pressure[i + 1] + pressure[i - cols] + pressure[i + cols]) *
          0.25;
      }
    }
    const swap = pressure;
    pressure = pressureNext;
    pressureNext = swap;
  }

  grid.pressure = pressure;
  grid.pressureNext = pressureNext;

  for (let y = 1; y < rows - 1; y += 1) {
    for (let x = 1; x < cols - 1; x += 1) {
      const i = y * cols + x;
      grid.u[i] -= 0.5 * (pressure[i + 1] - pressure[i - 1]);
      grid.v[i] -= 0.5 * (pressure[i + cols] - pressure[i - cols]);
    }
  }
}

function advectVelocity(grid: FluidGrid, dt: number) {
  const { cols, rows, u, v, uNext, vNext } = grid;
  for (let y = 1; y < rows - 1; y += 1) {
    for (let x = 1; x < cols - 1; x += 1) {
      const i = y * cols + x;
      const backX = clamp(x - u[i] * dt, 0.5, cols - 1.5);
      const backY = clamp(y - v[i] * dt, 0.5, rows - 1.5);
      uNext[i] = sample(u, backX, backY, cols, rows);
      vNext[i] = sample(v, backX, backY, cols, rows);
    }
  }
  grid.u = uNext;
  grid.v = vNext;
  grid.uNext = u;
  grid.vNext = v;
}

function advectDensity(grid: FluidGrid, dt: number) {
  const { cols, rows, density, densityNext, u, v } = grid;
  const decay = Math.pow(0.982, dt * 60);

  for (let y = 1; y < rows - 1; y += 1) {
    for (let x = 1; x < cols - 1; x += 1) {
      const i = y * cols + x;
      const backX = clamp(x - u[i] * dt, 0.5, cols - 1.5);
      const backY = clamp(y - v[i] * dt, 0.5, rows - 1.5);
      densityNext[i] = sample(density, backX, backY, cols, rows) * decay;
    }
  }

  grid.density = densityNext;
  grid.densityNext = density;
}

function stepFluid(grid: FluidGrid, dt: number) {
  projectVelocity(grid, 7);
  advectVelocity(grid, dt);

  const velocityDecay = Math.pow(0.988, dt * 60);
  for (let i = 0; i < grid.u.length; i += 1) {
    grid.u[i] *= velocityDecay;
    grid.v[i] *= velocityDecay;
  }

  projectVelocity(grid, 5);
  advectDensity(grid, dt);
}

function injectFluid(
  grid: FluidGrid,
  width: number,
  height: number,
  pointerX: number,
  pointerY: number,
  movementX: number,
  movementY: number,
) {
  const { cols, rows } = grid;
  const gx = (pointerX / Math.max(width, 1)) * (cols - 1);
  const gy = (pointerY / Math.max(height, 1)) * (rows - 1);
  const velocityX = movementX * (cols / Math.max(width, 1)) * 26;
  const velocityY = movementY * (rows / Math.max(height, 1)) * 26;
  const radius = Math.max(2.2, cols * 0.018);
  const radiusSq = radius * radius;

  const minX = Math.max(1, Math.floor(gx - radius * 2.2));
  const maxX = Math.min(cols - 2, Math.ceil(gx + radius * 2.2));
  const minY = Math.max(1, Math.floor(gy - radius * 2.2));
  const maxY = Math.min(rows - 2, Math.ceil(gy + radius * 2.2));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - gx;
      const dy = y - gy;
      const distanceSq = dx * dx + dy * dy;
      const weight = Math.exp(-distanceSq / Math.max(radiusSq, 0.001));
      if (weight < 0.025) continue;

      const i = y * cols + x;
      grid.density[i] = Math.min(3.6, grid.density[i] + weight * 1.35);
      grid.u[i] += velocityX * weight;
      grid.v[i] += velocityY * weight;
    }
  }
}

export function FluidCursorLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  const enabled = finePointer && !reducedMotion;

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    const head = headRef.current;
    if (!canvas || !head) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const densityCanvas = document.createElement("canvas");
    const densityContext = densityCanvas.getContext("2d", { alpha: true });
    if (!densityContext) return;

    let width = Math.max(1, window.innerWidth);
    let height = Math.max(1, window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let grid = makeGrid(112, 64);
    let densityImage = densityContext.createImageData(grid.cols, grid.rows);
    let frameId = 0;
    let lastFrame = performance.now();

    const pointer = {
      x: width / 2,
      y: height / 2,
      previousX: width / 2,
      previousY: height / 2,
      movementX: 0,
      movementY: 0,
      visible: false,
      overPremiumSurface: false,
    };

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const cols = width < 720 ? 76 : 112;
      const rows = Math.max(42, Math.round(cols * (height / width)));
      grid = makeGrid(cols, rows);
      densityCanvas.width = cols;
      densityCanvas.height = rows;
      densityImage = densityContext.createImageData(cols, rows);
    };

    const updateHead = () => {
      head.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
      head.style.opacity = pointer.visible && !pointer.overPremiumSurface ? "1" : "0";
    };

    const onPointerMove = (event: PointerEvent) => {
      const firstSample = !pointer.visible;
      pointer.previousX = pointer.x;
      pointer.previousY = pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.visible = true;

      const target = event.target instanceof Element ? event.target : null;
      pointer.overPremiumSurface = Boolean(target?.closest("[data-cursor-kind]"));

      if (!firstSample) {
        const dx = clamp(event.clientX - pointer.previousX, -42, 42);
        const dy = clamp(event.clientY - pointer.previousY, -42, 42);
        pointer.movementX += dx;
        pointer.movementY += dy;
      }

      updateHead();
    };

    const onPointerLeave = () => {
      pointer.visible = false;
      head.style.opacity = "0";
    };

    const onVisibilityChange = () => {
      lastFrame = performance.now();
    };

    const renderDensity = () => {
      const pixels = densityImage.data;
      for (let i = 0; i < grid.density.length; i += 1) {
        const normalized = clamp((grid.density[i] - 0.015) / 1.15, 0, 1);
        const alpha = Math.pow(normalized, 0.72);
        const offset = i * 4;
        pixels[offset] = 255;
        pixels[offset + 1] = 255;
        pixels[offset + 2] = 255;
        pixels[offset + 3] = Math.round(alpha * 230);
      }
      densityContext.putImageData(densityImage, 0, 0);

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.imageSmoothingEnabled = true;

      context.save();
      context.globalAlpha = 0.26;
      context.filter = "blur(16px)";
      context.drawImage(densityCanvas, 0, 0, width, height);
      context.restore();

      context.save();
      context.globalAlpha = 0.78;
      context.filter = "blur(3px)";
      context.drawImage(densityCanvas, 0, 0, width, height);
      context.restore();
    };

    const tick = (now: number) => {
      frameId = window.requestAnimationFrame(tick);
      if (document.hidden) {
        lastFrame = now;
        return;
      }

      const dt = clamp((now - lastFrame) / 1000, 1 / 240, 1 / 30);
      lastFrame = now;

      if (pointer.visible && (Math.abs(pointer.movementX) + Math.abs(pointer.movementY) > 0.02)) {
        injectFluid(
          grid,
          width,
          height,
          pointer.x,
          pointer.y,
          pointer.movementX,
          pointer.movementY,
        );
        pointer.movementX = 0;
        pointer.movementY = 0;
      }

      stepFluid(grid, dt);
      renderDensity();
    };

    resize();
    document.documentElement.classList.add("fluid-cursor-enabled");
    window.addEventListener("resize", resize);
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.documentElement.classList.remove("fluid-cursor-enabled");
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <canvas ref={canvasRef} className="fluid-cursor-layer" aria-hidden="true" />
      <span ref={headRef} className="fluid-cursor-head" aria-hidden="true" />
    </>
  );
}
