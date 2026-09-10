import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const HeroShaderScene = lazy(() => import("./HeroShaderScene"));

class ShaderBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("Hero ShaderGradient unavailable; using static Technical Noir fallback.", error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function useHeroShaderEligibility() {
  const reducedMotion = usePrefersReducedMotion();
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 700px)");
    const update = () => {
      const hasWebGL = Boolean(window.WebGLRenderingContext || (window as typeof window & { WebGL2RenderingContext?: unknown }).WebGL2RenderingContext);
      setEligible(query.matches && hasWebGL && !reducedMotion);
    };

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [reducedMotion]);

  return eligible;
}

export function HeroAtmosphere() {
  const eligible = useHeroShaderEligibility();

  return (
    <div className="hero-atmosphere" aria-hidden="true">
      <div className="hero-atmosphere__fallback" />
      {eligible ? (
        <ShaderBoundary>
          <Suspense fallback={null}>
            <div className="hero-atmosphere__shader">
              <HeroShaderScene />
            </div>
          </Suspense>
        </ShaderBoundary>
      ) : null}
      <div className="hero-atmosphere__vignette" />
      <div className="hero-atmosphere__grain" />
    </div>
  );
}
