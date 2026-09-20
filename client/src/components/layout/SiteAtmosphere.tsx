import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const SiteShaderScene = lazy(() => import("./SiteShaderScene"));

class SiteShaderBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("Site ShaderGradient unavailable; using static atmosphere fallback.", error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function useRichAtmosphereAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const connection = (
      navigator as Navigator & {
        connection?: {
          saveData?: boolean;
        };
      }
    ).connection;

    const update = () => {
      const hasWebGL = Boolean(
        window.WebGLRenderingContext ||
          (window as typeof window & { WebGL2RenderingContext?: unknown }).WebGL2RenderingContext,
      );
      setAvailable(hasWebGL && media.matches && !connection?.saveData);
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return available;
}

export function SiteAtmosphere() {
  const richAtmosphereAvailable = useRichAtmosphereAvailable();
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="site-atmosphere" aria-hidden="true">
      <div className="site-atmosphere__fallback" />
      {richAtmosphereAvailable && !reducedMotion ? (
        <SiteShaderBoundary>
          <Suspense fallback={null}>
            <div className="site-atmosphere__shader">
              <SiteShaderScene />
            </div>
          </Suspense>
        </SiteShaderBoundary>
      ) : null}
      <div className="site-atmosphere__readability" />
    </div>
  );
}
