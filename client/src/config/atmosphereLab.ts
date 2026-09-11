export type AtmospherePreset = "nighty" | "interstella";
export type AtmosphereCursorBlendMode = "difference" | "normal";
export type AtmosphereCursorPreset = "ink" | "smoke" | "neon" | "mono";

export type AtmosphereFluidSettings = {
  preset: AtmospherePreset;
  fluidEnabled: boolean;
  splatRadius: number;
  splatForce: number;
  pressureIterations: number;
  curlStrength: number;
  velocityDissipation: number;
  densityDissipation: number;
  pressureDissipation: number;
  threshold: number;
  softness: number;
  opacity: number;
  inkColor: string;
  blendMode: AtmosphereCursorBlendMode;
  simulationResolution: number;
  densityResolution: number;
  maxDpr: number;
};

export const ATMOSPHERE_LAB_STORAGE_KEY = "portfolio.atmosphere-lab.settings.v2";
export const ATMOSPHERE_LAB_PANEL_KEY = "portfolio.atmosphere-lab.panel";
export const ATMOSPHERE_LAB_UPDATE_EVENT = "portfolio:atmosphere-lab-update";
export const ATMOSPHERE_LAB_REBUILD_EVENT = "portfolio:atmosphere-lab-rebuild";

export const atmosphereLabDefaults: AtmosphereFluidSettings = {
  preset: "nighty",
  fluidEnabled: true,
  splatRadius: 0.00025,
  splatForce: 6,
  pressureIterations: 22,
  curlStrength: 1.1,
  velocityDissipation: 0.98,
  densityDissipation: 0.97,
  pressureDissipation: 0.8,
  threshold: 0.1,
  softness: 0.015,
  opacity: 0.92,
  inkColor: "#ffffff",
  blendMode: "difference",
  simulationResolution: 256,
  densityResolution: 512,
  maxDpr: 1.25,
};

/**
 * Cursor personalities adapted from Taha Bakri's demo presets.
 * three-fluid-fx uses a much smaller curl scale than the original vanilla
 * simulation, so CURL values are mapped roughly from 0..40 -> 0..2 while the
 * dissipation / threshold / softness / radius values stay in their original
 * semantic ranges.
 */
export const atmosphereCursorPresets: Record<AtmosphereCursorPreset, Partial<AtmosphereFluidSettings>> = {
  ink: {
    curlStrength: 1.1,
    pressureIterations: 22,
    velocityDissipation: 0.98,
    densityDissipation: 0.97,
    pressureDissipation: 0.8,
    splatRadius: 0.00025,
    splatForce: 6,
    threshold: 0.1,
    softness: 0.015,
    opacity: 0.92,
    inkColor: "#ffffff",
    blendMode: "difference",
  },
  smoke: {
    curlStrength: 0.5,
    pressureIterations: 22,
    velocityDissipation: 0.985,
    densityDissipation: 0.985,
    pressureDissipation: 0.8,
    splatRadius: 0.00055,
    splatForce: 5.2,
    threshold: 0.05,
    softness: 0.1,
    opacity: 0.72,
    inkColor: "#ffffff",
    blendMode: "difference",
  },
  neon: {
    curlStrength: 1.5,
    pressureIterations: 22,
    velocityDissipation: 0.98,
    densityDissipation: 0.965,
    pressureDissipation: 0.8,
    splatRadius: 0.00022,
    splatForce: 6.6,
    threshold: 0.07,
    softness: 0.04,
    opacity: 0.9,
    inkColor: "#1aff8c",
    blendMode: "difference",
  },
  mono: {
    curlStrength: 1.2,
    pressureIterations: 22,
    velocityDissipation: 0.98,
    densityDissipation: 0.97,
    pressureDissipation: 0.8,
    splatRadius: 0.00022,
    splatForce: 6,
    threshold: 0.12,
    softness: 0.001,
    opacity: 0.9,
    inkColor: "#000000",
    blendMode: "normal",
  },
};

export const atmosphereCursorPresetMeta: Record<AtmosphereCursorPreset, { label: string; description: string }> = {
  ink: { label: "Ink (inverts)", description: "White difference-blend ink, closest to Taha's default." },
  smoke: { label: "Smoke", description: "Softer, wider and longer-lived fluid." },
  neon: { label: "Neon", description: "Tighter, more energetic green difference-blend trail." },
  mono: { label: "Mono", description: "Hard-edged black trail with normal blending." },
};

export const atmospherePresetMeta: Record<AtmospherePreset, { label: string; description: string }> = {
  nighty: {
    label: "Nighty Nighty",
    description: "Quieter violet/graphite water-plane atmosphere.",
  },
  interstella: {
    label: "Interstella sphere",
    description: "Original teal / amber / muted-blue sphere atmosphere.",
  },
};

function sanitizeNumber(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function sanitizeColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

export function sanitizeAtmosphereLabSettings(value: unknown): AtmosphereFluidSettings {
  const candidate = (value && typeof value === "object" ? value : {}) as Partial<AtmosphereFluidSettings>;
  return {
    preset: candidate.preset === "interstella" ? "interstella" : "nighty",
    fluidEnabled: typeof candidate.fluidEnabled === "boolean" ? candidate.fluidEnabled : atmosphereLabDefaults.fluidEnabled,
    splatRadius: sanitizeNumber(candidate.splatRadius, atmosphereLabDefaults.splatRadius, 0.00005, 0.03),
    splatForce: sanitizeNumber(candidate.splatForce, atmosphereLabDefaults.splatForce, 1, 18),
    pressureIterations: Math.round(sanitizeNumber(candidate.pressureIterations, atmosphereLabDefaults.pressureIterations, 1, 40)),
    curlStrength: sanitizeNumber(candidate.curlStrength, atmosphereLabDefaults.curlStrength, 0, 2),
    velocityDissipation: sanitizeNumber(candidate.velocityDissipation, atmosphereLabDefaults.velocityDissipation, 0.85, 1),
    densityDissipation: sanitizeNumber(candidate.densityDissipation, atmosphereLabDefaults.densityDissipation, 0.85, 1),
    pressureDissipation: sanitizeNumber(candidate.pressureDissipation, atmosphereLabDefaults.pressureDissipation, 0, 1),
    threshold: sanitizeNumber(candidate.threshold, atmosphereLabDefaults.threshold, 0, 0.5),
    softness: sanitizeNumber(candidate.softness, atmosphereLabDefaults.softness, 0.001, 0.2),
    opacity: sanitizeNumber(candidate.opacity, atmosphereLabDefaults.opacity, 0, 1),
    inkColor: sanitizeColor(candidate.inkColor, atmosphereLabDefaults.inkColor),
    blendMode: candidate.blendMode === "normal" ? "normal" : "difference",
    simulationResolution: Math.round(sanitizeNumber(candidate.simulationResolution, atmosphereLabDefaults.simulationResolution, 128, 512)),
    densityResolution: Math.round(sanitizeNumber(candidate.densityResolution, atmosphereLabDefaults.densityResolution, 256, 1024)),
    maxDpr: sanitizeNumber(candidate.maxDpr, atmosphereLabDefaults.maxDpr, 1, 2),
  };
}

export function readAtmosphereLabSettings(): AtmosphereFluidSettings {
  if (typeof window === "undefined") return { ...atmosphereLabDefaults };
  try {
    const stored = window.localStorage.getItem(ATMOSPHERE_LAB_STORAGE_KEY);
    if (!stored) return { ...atmosphereLabDefaults };
    return sanitizeAtmosphereLabSettings(JSON.parse(stored));
  } catch {
    return { ...atmosphereLabDefaults };
  }
}

export function writeAtmosphereLabSettings(settings: AtmosphereFluidSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ATMOSPHERE_LAB_STORAGE_KEY, JSON.stringify(settings));
}

export function dispatchAtmosphereLabUpdate(settings: AtmosphereFluidSettings) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AtmosphereFluidSettings>(ATMOSPHERE_LAB_UPDATE_EVENT, { detail: settings }));
}

export function dispatchAtmosphereLabRebuild() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ATMOSPHERE_LAB_REBUILD_EVENT));
}
