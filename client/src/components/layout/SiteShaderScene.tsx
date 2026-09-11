import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { useEffect, useState } from "react";
import {
  ATMOSPHERE_LAB_UPDATE_EVENT,
  readAtmosphereLabSettings,
  type AtmosphereFluidSettings,
  type AtmospherePreset,
} from "@/config/atmosphereLab";
import { useTheme } from "@/contexts/ThemeContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export default function SiteShaderScene() {
  const { theme } = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const animate = reducedMotion ? "off" : "on";
  const [darkPreset, setDarkPreset] = useState<AtmospherePreset>(() =>
    import.meta.env.DEV ? readAtmosphereLabSettings().preset : "nighty",
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<AtmosphereFluidSettings>).detail;
      if (detail?.preset) setDarkPreset(detail.preset);
    };
    window.addEventListener(ATMOSPHERE_LAB_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(ATMOSPHERE_LAB_UPDATE_EVENT, onUpdate);
  }, []);

  return (
    <ShaderGradientCanvas
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      pixelDensity={1}
      fov={45}
    >
      {theme === "dark" && darkPreset === "interstella" ? (
        <ShaderGradient
          control="props"
          animate={animate}
          type="sphere"
          wireframe={false}
          shader="defaults"
          uTime={0}
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
      ) : theme === "dark" ? (
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
