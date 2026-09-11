import { useEffect, useRef, useState } from "react";
import {
  CanvasTexture,
  Color,
  LinearFilter,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Uniform,
  Vector2,
  WebGLRenderer,
  type Texture,
} from "three";
import {
  attachPointerSplats,
  FluidSimulation,
  FULLSCREEN_VERTEX,
  FullscreenPass,
} from "three-fluid-fx";
import { fluidRevealConfig, type FluidRevealTheme } from "@/config/fluidReveal";
import {
  FLUID_LAB_REBUILD_EVENT,
  FLUID_LAB_UPDATE_EVENT,
  readFluidRevealLabSettings,
  type FluidRevealTuning,
} from "@/config/fluidRevealLab";
import { useTheme } from "@/contexts/ThemeContext";
import { profile } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const MONOGRAM_WIDTH = 1024;
const MONOGRAM_HEIGHT = 512;

function configureIdentityTexture(texture: Texture) {
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function createMonogramTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = MONOGRAM_WIDTH;
  canvas.height = MONOGRAM_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create the hero identity texture.");

  const cx = MONOGRAM_WIDTH / 2;
  const cy = MONOGRAM_HEIGHT / 2;
  const radius = 178;

  ctx.clearRect(0, 0, MONOGRAM_WIDTH, MONOGRAM_HEIGHT);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  const gradient = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  gradient.addColorStop(0, "#73bfc4");
  gradient.addColorStop(0.52, "#8da0ce");
  gradient.addColorStop(1, "#ff810a");
  ctx.fillStyle = gradient;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  for (let offset = -120; offset <= 120; offset += 30) {
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy + offset);
    ctx.lineTo(cx + radius, cy + offset * 0.46);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.2;
  for (let x = cx - 120; x <= cx + 120; x += 40) {
    for (let y = cy - 100; y <= cy + 100; y += 40) {
      ctx.beginPath();
      ctx.arc(x, y, 3.25, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#f8f6ef";
  ctx.font = "700 112px Inter, ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(profile.initials, cx, cy + 7);

  return {
    texture: configureIdentityTexture(new CanvasTexture(canvas)),
    width: MONOGRAM_WIDTH,
    height: MONOGRAM_HEIGHT,
  };
}

function applyTheme(material: ShaderMaterial, theme: FluidRevealTheme, rimMultiplier = 1) {
  const presentation = fluidRevealConfig.theme[theme];
  material.uniforms.uBaseTint.value.set(presentation.baseTint);
  material.uniforms.uRevealTint.value.set(presentation.revealTint);
  material.uniforms.uBaseDesaturation.value = presentation.baseDesaturation;
  material.uniforms.uRimStrength.value = presentation.rimStrength * rimMultiplier;
}

export function HeroIdentityReveal() {
  const regionRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<ShaderMaterial | null>(null);
  const tuningRef = useRef<FluidRevealTuning>(readFluidRevealLabSettings());
  const [rebuildRevision, setRebuildRevision] = useState(0);
  const { theme } = useTheme();
  const themeRef = useRef<FluidRevealTheme>(theme);
  const reducedMotion = usePrefersReducedMotion();
  themeRef.current = theme;

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const onUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<FluidRevealTuning>;
      if (!customEvent.detail) return;
      tuningRef.current = customEvent.detail;
    };
    const onRebuild = () => setRebuildRevision((value) => value + 1);

    window.addEventListener(FLUID_LAB_UPDATE_EVENT, onUpdate);
    window.addEventListener(FLUID_LAB_REBUILD_EVENT, onRebuild);
    return () => {
      window.removeEventListener(FLUID_LAB_UPDATE_EVENT, onUpdate);
      window.removeEventListener(FLUID_LAB_REBUILD_EVENT, onRebuild);
    };
  }, []);

  useEffect(() => {
    if (materialRef.current) {
      applyTheme(
        materialRef.current,
        theme,
        import.meta.env.DEV ? tuningRef.current.rimMultiplier : 1,
      );
    }
  }, [theme]);

  useEffect(() => {
    const region = regionRef.current;
    const host = canvasHostRef.current;
    if (!region || !host || reducedMotion) return;

    let disposed = false;
    let frameId = 0;
    let heroVisible = true;
    let lastFrame = performance.now();

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch (error) {
      console.warn("Hero fluid reveal unavailable; using the static identity fallback.", error);
      return;
    }

    const mobile = window.matchMedia(
      `(max-width: ${fluidRevealConfig.mobileBreakpoint}px), (pointer: coarse)`,
    ).matches;
    const quality = mobile ? fluidRevealConfig.mobile : fluidRevealConfig.desktop;
    const tuning = tuningRef.current;
    const useLabQuality = import.meta.env.DEV && !mobile;
    const simulationResolution = useLabQuality
      ? tuning.simulationResolution
      : quality.simulationResolution;
    const densityResolution = useLabQuality ? tuning.densityResolution : quality.densityResolution;
    const maxDpr = useLabQuality ? tuning.maxDpr : quality.maxDpr;
    const initialPressureIterations = import.meta.env.DEV
      ? tuning.pressureIterations
      : quality.pressureIterations;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "hero-fluid-reveal__canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.pointerEvents = "none";
    host.appendChild(renderer.domElement);

    const fluid = new FluidSimulation(renderer, {
      profile: quality.profile,
      simResolution: simulationResolution,
      dyeResolution: densityResolution,
      pressureIterations: initialPressureIterations,
      velocityDissipation: import.meta.env.DEV ? tuning.velocityDissipation : fluidRevealConfig.velocityDissipation,
      densityDissipation: import.meta.env.DEV ? tuning.densityDissipation : fluidRevealConfig.densityDissipation,
      pressureDissipation: import.meta.env.DEV ? tuning.pressureDissipation : fluidRevealConfig.pressureDissipation,
      curlStrength: import.meta.env.DEV ? tuning.curlStrength : fluidRevealConfig.curlStrength,
      enableVorticity: import.meta.env.DEV ? tuning.enableVorticity : fluidRevealConfig.enableVorticity,
      splatRadius: import.meta.env.DEV ? tuning.splatRadius : fluidRevealConfig.splatRadius,
      splatForce: import.meta.env.DEV ? tuning.splatForce : fluidRevealConfig.splatForce,
      bfecc: import.meta.env.DEV ? tuning.useBFECC : fluidRevealConfig.useBFECC,
      reflectWalls: import.meta.env.DEV ? tuning.reflectWalls : fluidRevealConfig.reflectWalls,
    });

    const initialIdentity = createMonogramTexture();
    let identityTexture: Texture = initialIdentity.texture;
    const imageSize = new Vector2(initialIdentity.width, initialIdentity.height);

    const composite = new ShaderMaterial({
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;

        uniform sampler2D tIdentity;
        uniform sampler2D tDensity;
        uniform sampler2D tVelocity;
        uniform vec2 uImageSize;
        uniform vec2 uViewSize;
        uniform vec3 uBaseTint;
        uniform vec3 uRevealTint;
        uniform float uBaseDesaturation;
        uniform float uRevealThreshold;
        uniform float uRevealSoftness;
        uniform float uBoundaryDistortion;
        uniform float uRimStrength;

        vec2 coverUv(vec2 uv, vec2 imageSize, vec2 viewSize) {
          float viewAspect = viewSize.x / max(viewSize.y, 1.0);
          float imageAspect = imageSize.x / max(imageSize.y, 1.0);
          vec2 ratio = vec2(
            min(viewAspect / imageAspect, 1.0),
            min(imageAspect / viewAspect, 1.0)
          );
          return uv * ratio + (1.0 - ratio) * 0.5;
        }

        void main() {
          vec2 imgUv = coverUv(vUv, uImageSize, uViewSize);
          vec4 densityField = texture2D(tDensity, vUv);
          vec2 velocity = texture2D(tVelocity, vUv).xy;

          float thresholdLow = max(0.0, uRevealThreshold - uRevealSoftness);
          float thresholdHigh = uRevealThreshold + uRevealSoftness;
          float revealMask = smoothstep(thresholdLow, thresholdHigh, densityField.b);
          float edgeBand = revealMask * (1.0 - revealMask) * 4.0;

          vec2 revealUv = clamp(
            imgUv - velocity * uBoundaryDistortion * edgeBand,
            0.0,
            1.0
          );

          vec4 identity = texture2D(tIdentity, imgUv);
          vec4 revealedIdentity = texture2D(tIdentity, revealUv);

          float luma = dot(identity.rgb, vec3(0.2126, 0.7152, 0.0722));
          vec3 monochrome = mix(identity.rgb, vec3(luma), uBaseDesaturation);
          vec3 base = mix(monochrome, uBaseTint, 0.28);
          vec3 revealed = revealedIdentity.rgb * uRevealTint;
          vec3 color = mix(base, revealed, revealMask);
          color += revealed * edgeBand * uRimStrength;

          vec2 centered = vUv - 0.5;
          centered.x *= uViewSize.x / max(uViewSize.y, 1.0);
          float portraitFeather = 1.0 - smoothstep(0.34, 0.405, length(centered));
          float portraitAlpha = max(identity.a, revealedIdentity.a) * portraitFeather;

          gl_FragColor = vec4(color, portraitAlpha);
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        tIdentity: new Uniform(identityTexture),
        tDensity: new Uniform(fluid.densityTexture),
        tVelocity: new Uniform(fluid.velocityTexture),
        uImageSize: new Uniform(imageSize),
        uViewSize: new Uniform(new Vector2(1, 1)),
        uBaseTint: new Uniform(new Color("#858b93")),
        uRevealTint: new Uniform(new Color("#ffffff")),
        uBaseDesaturation: new Uniform(fluidRevealConfig.theme.dark.baseDesaturation),
        uRevealThreshold: new Uniform(import.meta.env.DEV ? tuning.revealThreshold : fluidRevealConfig.revealThreshold),
        uRevealSoftness: new Uniform(import.meta.env.DEV ? tuning.revealSoftness : fluidRevealConfig.revealSoftness),
        uBoundaryDistortion: new Uniform(import.meta.env.DEV ? tuning.boundaryDistortion : fluidRevealConfig.boundaryDistortion),
        uRimStrength: new Uniform(fluidRevealConfig.rimStrength),
      },
    });
    materialRef.current = composite;
    applyTheme(composite, themeRef.current, import.meta.env.DEV ? tuning.rimMultiplier : 1);

    const pass = new FullscreenPass(composite);

    if (profile.portraitSrc) {
      const loader = new TextureLoader();
      loader.load(
        profile.portraitSrc,
        (loaded) => {
          if (disposed) {
            loaded.dispose();
            return;
          }

          configureIdentityTexture(loaded);
          const source = loaded.image as
            | { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number }
            | undefined;
          const width = source?.naturalWidth ?? source?.width ?? 1;
          const height = source?.naturalHeight ?? source?.height ?? 1;

          identityTexture.dispose();
          identityTexture = loaded;
          composite.uniforms.tIdentity.value = identityTexture;
          composite.uniforms.uImageSize.value.set(width, height);
        },
        undefined,
        (error) => {
          console.warn("Portrait asset could not be loaded; keeping the Nityant monogram fallback.", error);
        },
      );
    }

    const resize = () => {
      const rect = region.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false);
      fluid.resize(width, height);
      composite.uniforms.uViewSize.value.set(width, height);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(region);

    const detachPointerSplats = attachPointerSplats(region, fluid);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry?.isIntersecting ?? true;
        lastFrame = performance.now();
      },
      { rootMargin: "120px", threshold: 0.01 },
    );
    intersectionObserver.observe(region);

    const frame = (now: number) => {
      frameId = window.requestAnimationFrame(frame);
      if (!heroVisible || document.hidden) {
        lastFrame = now;
        return;
      }

      if (import.meta.env.DEV) {
        const live = tuningRef.current;
        fluid.splatRadius = live.splatRadius;
        fluid.splatForce = live.splatForce;
        fluid.pressureIterations = live.pressureIterations;
        fluid.curlStrength = live.curlStrength;
        fluid.velocityDissipation = live.velocityDissipation;
        fluid.densityDissipation = live.densityDissipation;
        fluid.pressureDissipation = live.pressureDissipation;
        fluid.enableVorticity = live.enableVorticity;
        fluid.bfecc = live.useBFECC;
        fluid.reflectWalls = live.reflectWalls;
        composite.uniforms.uRevealThreshold.value = live.revealThreshold;
        composite.uniforms.uRevealSoftness.value = live.revealSoftness;
        composite.uniforms.uBoundaryDistortion.value = live.boundaryDistortion;
        composite.uniforms.uRimStrength.value =
          fluidRevealConfig.theme[themeRef.current].rimStrength * live.rimMultiplier;
      }

      const dt = Math.min(Math.max((now - lastFrame) / 1000, 1e-6), 1 / 60);
      lastFrame = now;
      fluid.step(dt);
      composite.uniforms.tDensity.value = fluid.densityTexture;
      composite.uniforms.tVelocity.value = fluid.velocityTexture;
      pass.render(renderer, null);
    };

    frameId = window.requestAnimationFrame(frame);

    return () => {
      disposed = true;
      materialRef.current = null;
      window.cancelAnimationFrame(frameId);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      detachPointerSplats();
      fluid.dispose();
      pass.dispose();
      identityTexture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [reducedMotion, rebuildRevision]);

  return (
    <div
      ref={regionRef}
      className={`hero-identity-reveal hero-fluid-reveal${reducedMotion ? " hero-fluid-reveal--static" : ""}`}
      role="img"
      aria-label={profile.portraitAlt}
    >
      <div className="hero-fluid-reveal__fallback" aria-hidden="true">
        {profile.portraitSrc ? (
          <img src={profile.portraitSrc} alt="" draggable={false} />
        ) : (
          <span className="hero-fluid-reveal__fallback-mark">{profile.initials}</span>
        )}
      </div>
      <div ref={canvasHostRef} className="hero-fluid-reveal__canvas-host" aria-hidden="true" />
    </div>
  );
}
