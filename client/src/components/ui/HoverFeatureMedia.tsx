import { useEffect, useRef } from "react";
import type { HoverFeatureMedia as HoverFeatureMediaAsset } from "@/data/media";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function HoverFeatureMedia({
  media,
  active,
}: {
  media: HoverFeatureMediaAsset;
  active: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (media.kind !== "video") return;
    const video = videoRef.current;
    if (!video) return;

    if (active && !reducedMotion) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [active, media, reducedMotion]);

  if (media.kind === "video") {
    return (
      <video
        ref={videoRef}
        src={media.src}
        poster={media.poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
    );
  }

  return <img src={media.src} alt="" aria-hidden="true" />;
}
