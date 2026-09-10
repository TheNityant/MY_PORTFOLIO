import { ArrowUpRight, Music } from "lucide-react";
import type { CSSProperties } from "react";
import { type DashboardFeature } from "@/data/portfolio";

export function FeatureCard({ feature }: { feature: DashboardFeature }) {
  if (feature.kind === "music") {
    return (
      <div
        className="feature-card feature-card--music"
        style={feature.accent ? ({ "--feature-accent": feature.accent } as CSSProperties) : undefined}
      >
        <div className="feature-artwork" aria-hidden={!feature.artwork}>
          {feature.artwork ? <img src={feature.artwork} alt="" /> : <Music size={28} />}
        </div>
        <div className="feature-copy">
          <p className="tile-prose tile-prose--large">{feature.title}</p>
          <p className="tile-prose">{feature.artist}</p>
          {feature.album ? <p className="tile-metric-caption">{feature.album}</p> : null}
          {feature.spotifyUrl ? (
            <a className="tile-link" href={feature.spotifyUrl} target="_blank" rel="noopener noreferrer">
              Spotify <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  const body = (
    <div className="feature-card feature-card--building">
      <div className="feature-building-icon" aria-hidden="true">
        <span className="feature-hammer" />
        <span className="feature-spark" />
      </div>
      <div className="feature-copy">
        <p className="tile-prose tile-prose--large">{feature.title}</p>
        <p className="tile-prose">{feature.description}</p>
      </div>
    </div>
  );

  if (feature.href) {
    return (
      <a className="feature-card-link" href={feature.href} target="_blank" rel="noopener noreferrer">
        {body}
      </a>
    );
  }

  return body;
}

export function featureCardTitle(feature: DashboardFeature) {
  return feature.kind === "building" ? "Now building" : "Last played";
}
