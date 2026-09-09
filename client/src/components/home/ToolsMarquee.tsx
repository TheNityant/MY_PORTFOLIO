import { Sparkles } from "lucide-react";
import { favoriteTools, tools, type ToolMark } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

export function ToolMarkView({ tool, large }: { tool: ToolMark; large?: boolean }) {
  return (
    <span className={cn("tool-mark", large && "tool-mark--large")}>
      {tool.icon ? (
        <img src={tool.icon} alt="" width={large ? 28 : 16} height={large ? 28 : 16} />
      ) : (
        <Sparkles size={large ? 22 : 14} aria-hidden="true" />
      )}
      <span>{tool.name}</span>
    </span>
  );
}

export function FavoriteTools() {
  return (
    <ul className="favorite-tools">
      {favoriteTools.map((tool) => (
        <li key={tool.name}>
          <ToolMarkView large tool={tool} />
        </li>
      ))}
    </ul>
  );
}

export function ToolsMarquee() {
  const reducedMotion = usePrefersReducedMotion();
  const items = reducedMotion ? tools : [...tools, ...tools];

  return (
    <div className="tools-marquee" aria-label="Tools">
      <div className={cn("tools-track", reducedMotion && "tools-track--static")}>
        {items.map((tool, index) => (
          <ToolMarkView key={`${tool.name}-${index}`} tool={tool} />
        ))}
      </div>
    </div>
  );
}
