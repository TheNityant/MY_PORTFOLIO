import { Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { coreStackTools, tools, type ToolMark } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

export function ToolMarkView({ tool, large }: { tool: ToolMark; large?: boolean }) {
  const style = {
    ...(tool.accent ? { "--tool-accent": tool.accent } : {}),
    ...(tool.iconColor || tool.accent ? { "--tool-icon-color": tool.iconColor ?? tool.accent } : {}),
    ...(tool.icon ? { "--tool-icon-url": `url(${tool.icon})` } : {}),
  } as CSSProperties;

  return (
    <span
      className={cn(
        "tool-mark",
        large && "tool-mark--large",
        tool.icon ? "tool-mark--has-icon" : "tool-mark--text-only",
        tool.needsDarkVariant && "tool-mark--needs-dark-variant",
      )}
      style={style}
      title={tool.needsDarkVariant ? `${tool.name} — dark icon variant recommended` : undefined}
    >
      {tool.icon ? (
        <span className="tool-mark-icon" aria-hidden="true" />
      ) : (
        <Sparkles size={large ? 22 : 14} aria-hidden="true" />
      )}
      <span>{tool.name}</span>
    </span>
  );
}

export function CoreStackTools() {
  return (
    <ul className="favorite-tools">
      {coreStackTools.map((tool) => (
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
