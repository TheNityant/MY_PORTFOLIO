import { createPortal } from "react-dom";
import { HoverFeatureMedia } from "@/components/ui/HoverFeatureMedia";
import type { HoverFeatureMedia as HoverFeatureMediaAsset } from "@/data/media";

export function FeatureMediaPortal({
  media,
  active,
  variant,
}: {
  media: HoverFeatureMediaAsset;
  active: boolean;
  variant: "experience" | "writing";
}) {
  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <aside
      className={`feature-media-portal feature-media-portal--${variant}`}
      aria-hidden="true"
    >
      <HoverFeatureMedia media={media} active />
    </aside>,
    document.body,
  );
}
