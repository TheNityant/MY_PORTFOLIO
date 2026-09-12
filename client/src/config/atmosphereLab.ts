export type AtmospherePreset = "nighty" | "interstella";

export type AtmospherePresetTuning = {
  speed: number;
  brightness: number;
};

export type AtmosphereLabSettings = {
  preset: AtmospherePreset;
  nighty: AtmospherePresetTuning;
  interstella: AtmospherePresetTuning;
};

// Compatibility alias for older imports while the old global-fluid experiment is gone.
export type AtmosphereFluidSettings = AtmosphereLabSettings;

export const ATMOSPHERE_LAB_STORAGE_KEY = "portfolio.atmosphere-lab.settings.v3";
export const ATMOSPHERE_LAB_PANEL_KEY = "portfolio.atmosphere-lab.panel";
export const ATMOSPHERE_LAB_UPDATE_EVENT = "portfolio:atmosphere-lab-update";

export const atmosphereLabDefaults: AtmosphereLabSettings = {
  preset: "nighty",
  nighty: {
    speed: 0.3,
    brightness: 1,
  },
  interstella: {
    speed: 0.3,
    brightness: 0.8,
  },
};

export const atmospherePresetMeta: Record<
  AtmospherePreset,
  { label: string; description: string }
> = {
  nighty: {
    label: "Nighty Nighty",
    description: "Quieter violet/graphite water-plane atmosphere.",
  },
  interstella: {
    label: "Interstella sphere",
    description: "Teal / amber / muted-blue sphere atmosphere.",
  },
};

function sanitizeNumber(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function sanitizePresetTuning(
  value: unknown,
  fallback: AtmospherePresetTuning,
): AtmospherePresetTuning {
  const candidate = (value && typeof value === "object" ? value : {}) as Partial<AtmospherePresetTuning>;
  return {
    speed: sanitizeNumber(candidate.speed, fallback.speed, 0, 1.5),
    brightness: sanitizeNumber(candidate.brightness, fallback.brightness, 0.2, 2),
  };
}

export function sanitizeAtmosphereLabSettings(value: unknown): AtmosphereLabSettings {
  const candidate = (value && typeof value === "object" ? value : {}) as Partial<AtmosphereLabSettings>;
  return {
    preset: candidate.preset === "interstella" ? "interstella" : "nighty",
    nighty: sanitizePresetTuning(candidate.nighty, atmosphereLabDefaults.nighty),
    interstella: sanitizePresetTuning(candidate.interstella, atmosphereLabDefaults.interstella),
  };
}

export function getAtmospherePresetTuning(
  settings: AtmosphereLabSettings,
  preset = settings.preset,
): AtmospherePresetTuning {
  return preset === "interstella" ? settings.interstella : settings.nighty;
}

export function readAtmosphereLabSettings(): AtmosphereLabSettings {
  if (typeof window === "undefined") return structuredClone(atmosphereLabDefaults);
  try {
    const stored = window.localStorage.getItem(ATMOSPHERE_LAB_STORAGE_KEY);
    if (!stored) return structuredClone(atmosphereLabDefaults);
    return sanitizeAtmosphereLabSettings(JSON.parse(stored));
  } catch {
    return structuredClone(atmosphereLabDefaults);
  }
}

export function writeAtmosphereLabSettings(settings: AtmosphereLabSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ATMOSPHERE_LAB_STORAGE_KEY, JSON.stringify(settings));
}

export function dispatchAtmosphereLabUpdate(settings: AtmosphereLabSettings) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AtmosphereLabSettings>(ATMOSPHERE_LAB_UPDATE_EVENT, { detail: settings }),
  );
}
