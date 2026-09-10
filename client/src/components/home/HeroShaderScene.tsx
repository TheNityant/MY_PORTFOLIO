import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { useTheme } from "@/contexts/ThemeContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type HeroShaderSceneProps = {
  compact?: boolean;
};

/**
 * One ShaderGradient canvas, two deliberately different theme treatments.
 * Dark mode owns the Technical Noir sphere. Light mode reuses the same canvas
 * for a quiet Cotton Candy water-plane atmosphere so we never mount competing
 * WebGL scenes.
 */
export default function HeroShaderScene({ compact = false }: HeroShaderSceneProps) {
  const { theme } = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const animate = reducedMotion ? "off" : "on";

  return (
    <ShaderGradientCanvas
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      pixelDensity={compact ? 1 : 1.25}
      fov={45}
    >
      {theme === "dark" ? (
        <ShaderGradient
          control="props"
          animate={animate}
          type="sphere"
          wireframe={false}
          shader="defaults"
          uSpeed={0.3}
          uStrength={0.3}
          uDensity={0.8}
          uFrequency={5.5}
          uAmplitude={3.2}
          positionX={-0.1}
          positionY={0}
          positionZ={0}
          rotationX={0}
          rotationY={130}
          rotationZ={70}
          color1="#73bfc4"
          color2="#ff810a"
          color3="#8da0ce"
          reflection={0.4}
          cAzimuthAngle={270}
          cPolarAngle={180}
          cDistance={0.5}
          cameraZoom={15.1}
          lightType="env"
          brightness={0.8}
          envPreset="city"
          grain="on"
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
          uSpeed={0.3}
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
    </ShaderGradientCanvas>
  );
}
