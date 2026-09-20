import { ShaderGradient } from "@shadergradient/react";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { useTheme } from "@/contexts/ThemeContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type SiteShaderSceneProps = {
  mediaPressure?: boolean;
};

function AdaptiveFrameTicker({ fps }: { fps: number }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    let frameId = 0;
    let lastFrame = 0;
    const frameInterval = 1000 / Math.max(1, fps);

    const tick = (timestamp: number) => {
      if (!document.hidden && timestamp - lastFrame >= frameInterval) {
        lastFrame = timestamp;
        invalidate();
      }
      frameId = window.requestAnimationFrame(tick);
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        lastFrame = 0;
        invalidate();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fps, invalidate]);

  return null;
}

// ShaderGradient applies the same compatibility shim internally. Our custom
// Canvas keeps that shim while letting us control the render cadence.
THREE.ShaderChunk["uv2_pars_vertex"] = "";
THREE.ShaderChunk["uv2_vertex"] = "";
THREE.ShaderChunk["uv2_pars_fragment"] = "";
THREE.ShaderChunk["encodings_fragment"] = "";

export default function SiteShaderScene({ mediaPressure = false }: SiteShaderSceneProps) {
  const { theme } = useTheme();
  const reducedMotion = usePrefersReducedMotion();

  // The background remains animated on desktop, but it no longer consumes a
  // full 60fps WebGL loop. When a portfolio video is on/near screen, give the
  // browser's decoder and compositor even more headroom without removing the
  // visual effect.
  const targetFps = mediaPressure ? 15 : 30;
  const animate = reducedMotion ? "off" : "on";
  const shaderSpeed = mediaPressure ? 0.12 : 0.22;

  return (
    <Canvas
      frameloop="demand"
      dpr={0.8}
      camera={{ fov: 45 }}
      linear
      flat
      gl={{
        antialias: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <AdaptiveFrameTicker fps={targetFps} />

      {theme === "dark" ? (
        <ShaderGradient
          control="props"
          animate={animate}
          type="waterPlane"
          wireframe={false}
          shader="defaults"
          uTime={8}
          uSpeed={shaderSpeed}
          uStrength={1.5}
          uDensity={1.5}
          uFrequency={0}
          uAmplitude={0}
          positionX={0}
          positionY={0}
          positionZ={0}
          rotationX={50}
          rotationY={0}
          rotationZ={-60}
          color1="#606080"
          color2="#8d7dca"
          color3="#212121"
          reflection={0.1}
          cAzimuthAngle={180}
          cPolarAngle={80}
          cDistance={2.8}
          cameraZoom={9.1}
          lightType="3d"
          brightness={1}
          envPreset="city"
          grain={mediaPressure ? "off" : "on"}
          toggleAxis={false}
          zoomOut={false}
          hoverState=""
          enableTransition={false}
        />
      ) : (
        <ShaderGradient
          control="props"
          animate={animate}
          type="waterPlane"
          wireframe={false}
          shader="defaults"
          uTime={0.2}
          uSpeed={shaderSpeed}
          uStrength={3}
          uDensity={1}
          uFrequency={5.5}
          uAmplitude={0}
          positionX={0}
          positionY={1.8}
          positionZ={0}
          rotationX={0}
          rotationY={0}
          rotationZ={-90}
          color1="#ebedff"
          color2="#f3f2f8"
          color3="#dbf8ff"
          reflection={0.1}
          cAzimuthAngle={180}
          cPolarAngle={120}
          cDistance={2.9}
          cameraZoom={1}
          lightType="3d"
          brightness={1.2}
          envPreset="city"
          grain="off"
          toggleAxis={false}
          zoomOut={false}
          hoverState=""
          enableTransition={false}
        />
      )}
    </Canvas>
  );
}
