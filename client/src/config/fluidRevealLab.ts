import { fluidRevealConfig } from "@/config/fluidReveal";

export type FluidRevealTuning = {
  splatRadius: number;
  splatForce: number;
  pressureIterations: number;
  curlStrength: number;
  velocityDissipation: number;
  densityDissipation: number;
  pressureDissipation: number;
  enableVorticity: boolean;
  useBFECC: boolean;
  reflectWalls: boolean;
  revealThreshold: number;
  revealSoftness: number;
  boundaryDistortion: number;
  rimMultiplier: number;
  simulationResolution: number;
  densityResolution: number;
  maxDpr: number;
};

export type FluidRevealPresetId = "project" | "ribbon" | "ink" | "wild";

export const FLUID_LAB_STORAGE_KEY = "nityant-fluid-lab-settings-v1";
export const FLUID_LAB_PANEL_KEY = "nityant-fluid-lab-panel-v1";
export const FLUID_LAB_UPDATE_EVENT = "nityant:fluid-lab-update";
export const FLUID_LAB_REBUILD_EVENT = "nityant:fluid-lab-rebuild";

export const fluidRevealLabDefaults: FluidRevealTuning = {
  splatRadius: fluidRevealConfig.splatRadius,
  splatForce: fluidRevealConfig.splatForce,
  pressureIterations: fluidRevealConfig.desktop.pressureIterations,
  curlStrength: fluidRevealConfig.curlStrength,
  velocityDissipation: fluidRevealConfig.velocityDissipation,
  densityDissipation: fluidRevealConfig.densityDissipation,
  pressureDissipation: fluidRevealConfig.pressureDissipation,
  enableVorticity: fluidRevealConfig.enableVorticity,
  useBFECC: fluidRevealConfig.useBFECC,
  reflectWalls: fluidRevealConfig.reflectWalls,
  revealThreshold: fluidRevealConfig.revealThreshold,
  revealSoftness: fluidRevealConfig.revealSoftness,
  boundaryDistortion: fluidRevealConfig.boundaryDistortion,
  rimMultiplier: 1,
  simulationResolution: fluidRevealConfig.desktop.simulationResolution,
  densityResolution: fluidRevealConfig.desktop.densityResolution,
  maxDpr: fluidRevealConfig.desktop.maxDpr,
};

export const fluidRevealLabPresets: Record<
  FluidRevealPresetId,
  { label: string; description: string; settings: FluidRevealTuning }
> = {
  project: {
    label: "Project",
    description: "Current portfolio baseline",
    settings: { ...fluidRevealLabDefaults },
  },
  ribbon: {
    label: "Noir ribbon",
    description: "Calm, coherent liquid trail",
    settings: {
      ...fluidRevealLabDefaults,
      splatRadius: 0.0105,
      splatForce: 4.2,
      pressureIterations: 18,
      curlStrength: 0.12,
      velocityDissipation: 0.987,
      densityDissipation: 0.965,
      pressureDissipation: 0.8,
      enableVorticity: true,
      revealThreshold: 0.16,
      revealSoftness: 0.1,
      boundaryDistortion: 0.00009,
      rimMultiplier: 0.9,
    },
  },
  ink: {
    label: "Dense ink",
    description: "Heavier, sharper fluid body",
    settings: {
      ...fluidRevealLabDefaults,
      splatRadius: 0.014,
      splatForce: 6.2,
      pressureIterations: 20,
      curlStrength: 0.45,
      velocityDissipation: 0.991,
      densityDissipation: 0.976,
      pressureDissipation: 0.84,
      enableVorticity: true,
      revealThreshold: 0.22,
      revealSoftness: 0.065,
      boundaryDistortion: 0.00011,
      rimMultiplier: 1.25,
    },
  },
  wild: {
    label: "Wild",
    description: "High curl for stress-testing",
    settings: {
      ...fluidRevealLabDefaults,
      splatRadius: 0.012,
      splatForce: 9,
      pressureIterations: 24,
      curlStrength: 1.15,
      velocityDissipation: 0.995,
      densityDissipation: 0.985,
      pressureDissipation: 0.86,
      enableVorticity: true,
      revealThreshold: 0.1,
      revealSoftness: 0.16,
      boundaryDistortion: 0.00015,
      rimMultiplier: 1.45,
    },
  },
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function sanitizeFluidRevealTuning(value: unknown): FluidRevealTuning {
  if (!value || typeof value !== "object") return { ...fluidRevealLabDefaults };
  const input = value as Partial<FluidRevealTuning>;
  const defaults = fluidRevealLabDefaults;

  return {
    splatRadius: isFiniteNumber(input.splatRadius) ? input.splatRadius : defaults.splatRadius,
    splatForce: isFiniteNumber(input.splatForce) ? input.splatForce : defaults.splatForce,
    pressureIterations: isFiniteNumber(input.pressureIterations)
      ? Math.round(input.pressureIterations)
      : defaults.pressureIterations,
    curlStrength: isFiniteNumber(input.curlStrength) ? input.curlStrength : defaults.curlStrength,
    velocityDissipation: isFiniteNumber(input.velocityDissipation)
      ? input.velocityDissipation
      : defaults.velocityDissipation,
    densityDissipation: isFiniteNumber(input.densityDissipation)
      ? input.densityDissipation
      : defaults.densityDissipation,
    pressureDissipation: isFiniteNumber(input.pressureDissipation)
      ? input.pressureDissipation
      : defaults.pressureDissipation,
    enableVorticity:
      typeof input.enableVorticity === "boolean" ? input.enableVorticity : defaults.enableVorticity,
    useBFECC: typeof input.useBFECC === "boolean" ? input.useBFECC : defaults.useBFECC,
    reflectWalls: typeof input.reflectWalls === "boolean" ? input.reflectWalls : defaults.reflectWalls,
    revealThreshold: isFiniteNumber(input.revealThreshold)
      ? input.revealThreshold
      : defaults.revealThreshold,
    revealSoftness: isFiniteNumber(input.revealSoftness) ? input.revealSoftness : defaults.revealSoftness,
    boundaryDistortion: isFiniteNumber(input.boundaryDistortion)
      ? input.boundaryDistortion
      : defaults.boundaryDistortion,
    rimMultiplier: isFiniteNumber(input.rimMultiplier) ? input.rimMultiplier : defaults.rimMultiplier,
    simulationResolution: isFiniteNumber(input.simulationResolution)
      ? Math.round(input.simulationResolution)
      : defaults.simulationResolution,
    densityResolution: isFiniteNumber(input.densityResolution)
      ? Math.round(input.densityResolution)
      : defaults.densityResolution,
    maxDpr: isFiniteNumber(input.maxDpr) ? input.maxDpr : defaults.maxDpr,
  };
}

export function readFluidRevealLabSettings(): FluidRevealTuning {
  if (typeof window === "undefined" || !import.meta.env.DEV) return { ...fluidRevealLabDefaults };

  try {
    const raw = window.localStorage.getItem(FLUID_LAB_STORAGE_KEY);
    return raw ? sanitizeFluidRevealTuning(JSON.parse(raw)) : { ...fluidRevealLabDefaults };
  } catch {
    return { ...fluidRevealLabDefaults };
  }
}

export function writeFluidRevealLabSettings(settings: FluidRevealTuning) {
  if (typeof window === "undefined" || !import.meta.env.DEV) return;
  window.localStorage.setItem(FLUID_LAB_STORAGE_KEY, JSON.stringify(settings));
}

export function dispatchFluidRevealLabUpdate(settings: FluidRevealTuning) {
  if (typeof window === "undefined" || !import.meta.env.DEV) return;
  window.dispatchEvent(new CustomEvent<FluidRevealTuning>(FLUID_LAB_UPDATE_EVENT, { detail: settings }));
}

export function dispatchFluidRevealLabRebuild() {
  if (typeof window === "undefined" || !import.meta.env.DEV) return;
  window.dispatchEvent(new Event(FLUID_LAB_REBUILD_EVENT));
}
