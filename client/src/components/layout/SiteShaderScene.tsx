import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { useTheme } from "@/contexts/ThemeContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * One persistent ShaderGradient canvas for the whole site.
 * Dark mode uses the quieter Nighty Nighty water-plane preset so the portfolio
 * reads first and the atmosphere supports it. Light mode keeps the approved
 * Cotton Candy counterpart on the same single WebGL canvas.
 */
export default function SiteShaderScene() {
  const { theme } = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const animate = reducedMotion ? "off" : "on";

  return (
    <ShaderGradientCanvas
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      pixelDensity={1}
      fov={45}
    >
      {theme === "dark" ? (
        <ShaderGradient
          control="props"
          animate={animate}
          type="waterPlane"
          wireframe={false}
          shader="defaults"
          uTime={8}
          uSpeed={0.3}
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
          uTime={0.2}
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
