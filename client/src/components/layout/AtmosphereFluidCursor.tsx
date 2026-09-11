import { useEffect, useRef, useState } from "react";
import {
  Color,
  ShaderMaterial,
  Uniform,
  WebGLRenderer,
} from "three";
import {
  FluidSimulation,
  FULLSCREEN_VERTEX,
  FullscreenPass,
} from "three-fluid-fx";
import {
  ATMOSPHERE_LAB_REBUILD_EVENT,
  ATMOSPHERE_LAB_UPDATE_EVENT,
  readAtmosphereLabSettings,
  type AtmosphereFluidSettings,
} from "@/config/atmosphereLab";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import styles from "./atmosphereFluidCursor.module.css";

function applyRuntimeSettings(
  fluid: FluidSimulation,
  material: ShaderMaterial,
  settings: AtmosphereFluidSettings,
) {
  fluid.splatRadius = settings.splatRadius;
  fluid.splatForce = settings.splatForce;
  fluid.pressureIterations = settings.pressureIterations;
  fluid.curlStrength = settings.curlStrength;
  fluid.enableVorticity = settings.curlStrength > 0;
  fluid.velocityDissipation = settings.velocityDissipation;
  fluid.densityDissipation = settings.densityDissipation;
  fluid.pressureDissipation = settings.pressureDissipation;

  material.uniforms.uThreshold.value = settings.threshold;
  material.uniforms.uSoftness.value = settings.softness;
  material.uniforms.uOpacity.value = settings.opacity;
  material.uniforms.uInkColor.value.set(settings.inkColor);
}

export function AtmosphereFluidCursor() {
  const hostRef = useRef<HTMLDivElement>(null);
  const fluidRef = useRef<FluidSimulation | null>(null);
  const materialRef = useRef<ShaderMaterial | null>(null);
  const settingsRef = useRef<AtmosphereFluidSettings>(readAtmosphereLabSettings());
  const [settings, setSettings] = useState<AtmosphereFluidSettings>(() => settingsRef.current);
  const [rebuildToken, setRebuildToken] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  settingsRef.current = settings;

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<AtmosphereFluidSettings>).detail;
      if (!detail) return;
      settingsRef.current = detail;
      setSettings(detail);
      if (fluidRef.current && materialRef.current) {
        applyRuntimeSettings(fluidRef.current, materialRef.current, detail);
      }
    };

    const onRebuild = () => setRebuildToken((value) => value + 1);
    window.addEventListener(ATMOSPHERE_LAB_UPDATE_EVENT, onUpdate);
    window.addEventListener(ATMOSPHERE_LAB_REBUILD_EVENT, onRebuild);
    return () => {
      window.removeEventListener(ATMOSPHERE_LAB_UPDATE_EVENT, onUpdate);
      window.removeEventListener(ATMOSPHERE_LAB_REBUILD_EVENT, onRebuild);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || reducedMotion || !settings.fluidEnabled) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const host = hostRef.current;
    if (!host) return;

    let frameId = 0;
    let lastFrame = performance.now();
    let pageVisible = !document.hidden;
    let hasPointer = false;
    let lastX = 0;
    let lastY = 0;
    let lastMoveTime = 0;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch (error) {
      console.warn("Atmosphere fluid cursor unavailable.", error);
      return;
    }

    const current = settingsRef.current;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, current.maxDpr));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = styles.canvas;
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const fluid = new FluidSimulation(renderer, {
      profile: "balanced",
      simResolution: current.simulationResolution,
      dyeResolution: current.densityResolution,
      pressureIterations: current.pressureIterations,
      velocityDissipation: current.velocityDissipation,
      densityDissipation: current.densityDissipation,
      pressureDissipation: current.pressureDissipation,
      curlStrength: current.curlStrength,
      enableVorticity: current.curlStrength > 0,
      splatRadius: current.splatRadius,
      splatForce: current.splatForce,
      bfecc: true,
      reflectWalls: false,
    });
    fluidRef.current = fluid;

    const material = new ShaderMaterial({
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tDensity;
        uniform float uThreshold;
        uniform float uSoftness;
        uniform float uOpacity;
        uniform vec3 uInkColor;

        void main() {
          float density = texture2D(tDensity, vUv).b;
          float low = max(0.0, uThreshold - uSoftness);
          float high = uThreshold + uSoftness;
          float ink = smoothstep(low, high, density) * uOpacity;
          gl_FragColor = vec4(uInkColor, ink);
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        tDensity: new Uniform(fluid.densityTexture),
        uThreshold: new Uniform(current.threshold),
        uSoftness: new Uniform(current.softness),
        uOpacity: new Uniform(current.opacity),
        uInkColor: new Uniform(new Color(current.inkColor)),
      },
    });
    materialRef.current = material;
    const pass = new FullscreenPass(material);

    const resize = () => {
      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settingsRef.current.maxDpr));
      renderer.setSize(width, height, false);
      fluid.resize(width, height);
    };
    resize();

    const resetPointer = () => {
      hasPointer = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      const now = event.timeStamp || performance.now();
      const gap = now - lastMoveTime;
      if (gap > 180) hasPointer = false;
      lastMoveTime = now;

      const x = event.clientX / Math.max(1, window.innerWidth);
      const y = 1 - event.clientY / Math.max(1, window.innerHeight);
      const dx = hasPointer ? event.movementX || event.clientX - lastX : 0;
      const dy = hasPointer ? -(event.movementY || event.clientY - lastY) : 0;
      lastX = event.clientX;
      lastY = event.clientY;
      hasPointer = true;

      if (Math.abs(dx) + Math.abs(dy) < 0.25) return;
      const force = fluid.splatForce;
      fluid.addSplat(x, y, dx * force, dy * force);
    };

    const onVisibilityChange = () => {
      pageVisible = !document.hidden;
      lastFrame = performance.now();
      if (!pageVisible) resetPointer();
    };

    const frame = (now: number) => {
      frameId = window.requestAnimationFrame(frame);
      if (!pageVisible) {
        lastFrame = now;
        return;
      }

      const dt = Math.min(Math.max((now - lastFrame) / 1000, 1e-6), 1 / 60);
      lastFrame = now;
      fluid.step(dt);
      material.uniforms.tDensity.value = fluid.densityTexture;
      pass.render(renderer, null);
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.addEventListener("visibilitychange", onVisibilityChange);
    frameId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", resetPointer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      fluidRef.current = null;
      materialRef.current = null;
      fluid.dispose();
      pass.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [rebuildToken, reducedMotion, settings.fluidEnabled]);

  if (!import.meta.env.DEV || reducedMotion || !settings.fluidEnabled) return null;

  return (
    <div
      ref={hostRef}
      className={styles.root}
      style={{ mixBlendMode: settings.blendMode }}
      aria-hidden="true"
    />
  );
}
