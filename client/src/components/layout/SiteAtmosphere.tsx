import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from "react";

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

function useWebGLAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const hasWebGL = Boolean(
      window.WebGLRenderingContext ||
        (window as typeof window & { WebGL2RenderingContext?: unknown }).WebGL2RenderingContext,
    );
    setAvailable(hasWebGL);
  }, []);

  return available;
}

export function SiteAtmosphere() {
  const webGLAvailable = useWebGLAvailable();

  return (
    <div className="site-atmosphere" aria-hidden="true">
      <div className="site-atmosphere__fallback" />
      {webGLAvailable ? (
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
