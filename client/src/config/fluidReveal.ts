export const fluidRevealConfig = {
  desktop: {
    profile: "balanced" as const,
    simulationResolution: 256,
    densityResolution: 512,
    pressureIterations: 12,
    maxDpr: 1.5,
  },
  mobile: {
    profile: "performance" as const,
    simulationResolution: 128,
    densityResolution: 256,
    pressureIterations: 6,
    maxDpr: 1,
  },
  velocityDissipation: 0.94,
  densityDissipation: 0.985,
  pressureDissipation: 0.8,
  curlStrength: 0,
  enableVorticity: false,
  splatRadius: 0.0175,
  splatForce: 6,
  useBFECC: true,
  reflectWalls: false,
  revealThreshold: 0.19,
  revealSoftness: 0.13,
  boundaryDistortion: 0.00008,
  rimStrength: 0.08,
  flowThreshold: 0.035,
  flowSoftness: 0.075,
  flowOpacity: 0.58,
  mobileBreakpoint: 720,
  idle: {
    enabled: false,
  },
  theme: {
    dark: {
      baseTint: "#858b93",
      revealTint: "#ffffff",
      flowTint: "#f5f1e8",
      baseDesaturation: 0.92,
      rimStrength: 0.08,
    },
    light: {
      baseTint: "#555c66",
      revealTint: "#ffffff",
      flowTint: "#202832",
      baseDesaturation: 0.96,
      rimStrength: 0.055,
    },
  },
} as const;

export type FluidRevealTheme = keyof typeof fluidRevealConfig.theme;
