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

function useDeferredShaderMount(enabled: boolean) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }

    let cancelled = false;
    let idleHandle: number | null = null;
    let timeoutHandle: number | null = null;

    const schedule = () => {
      const browser = window as Window & {
        requestIdleCallback?: (
          callback: () => void,
          options?: { timeout: number },
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
      };

      const mount = () => {
        if (!cancelled) setReady(true);
      };

      if (browser.requestIdleCallback) {
        idleHandle = browser.requestIdleCallback(mount, { timeout: 1800 });
      } else {
        timeoutHandle = window.setTimeout(mount, 900);
      }
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (timeoutHandle !== null) window.clearTimeout(timeoutHandle);
      if (idleHandle !== null) {
        (window as Window & { cancelIdleCallback?: (handle: number) => void })
          .cancelIdleCallback?.(idleHandle);
      }
    };
  }, [enabled]);

  return ready;
}

function useMediaPressure() {
  const [mediaPressure, setMediaPressure] = useState(false);

  useEffect(() => {
    const visibility = new Map<Element, boolean>();

    const publish = () => {
      for (const element of Array.from(visibility.keys())) {
        if (!document.contains(element)) visibility.delete(element);
      }
      setMediaPressure(Array.from(visibility.values()).some(Boolean));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target, entry.isIntersecting);
        }
        publish();
      },
      {
        rootMargin: "240px 0px",
        threshold: 0.01,
      },
    );

    const observeVideos = (root: ParentNode) => {
      root.querySelectorAll("video").forEach((video) => {
        if (visibility.has(video)) return;
        visibility.set(video, false);
        observer.observe(video);
      });
    };

    observeVideos(document);

    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of Array.from(record.addedNodes)) {
          if (!(node instanceof Element)) continue;
          if (node.matches("video")) {
            visibility.set(node, false);
            observer.observe(node);
          }
          observeVideos(node);
        }
      }
      publish();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  return mediaPressure;
}

export function SiteAtmosphere() {
  const richAtmosphereAvailable = useRichAtmosphereAvailable();
  const reducedMotion = usePrefersReducedMotion();
  const mediaPressure = useMediaPressure();
  const shaderReady = useDeferredShaderMount(
    richAtmosphereAvailable && !reducedMotion,
  );

  return (
    <div className="site-atmosphere" aria-hidden="true">
      <div className="site-atmosphere__fallback" />
      {shaderReady ? (
        <SiteShaderBoundary>
          <Suspense fallback={null}>
            <div className="site-atmosphere__shader">
              <SiteShaderScene mediaPressure={mediaPressure} />
            </div>
          </Suspense>
        </SiteShaderBoundary>
      ) : null}
      <div className="site-atmosphere__readability" />
    </div>
  );
}
