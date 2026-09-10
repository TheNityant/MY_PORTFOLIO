import { Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { coreStackTools, tools, type ToolMark } from "@/data/portfolio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

export function ToolMarkView({
  tool,
  large,
  iconOnly,
}: {
  tool: ToolMark;
  large?: boolean;
  iconOnly?: boolean;
}) {
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
        iconOnly && "tool-mark--icon-only",
        tool.icon ? "tool-mark--has-icon" : "tool-mark--text-only",
        tool.needsDarkVariant && "tool-mark--needs-dark-variant",
      )}
      style={style}
      title={tool.name}
      aria-label={iconOnly ? tool.name : undefined}
    >
      {tool.icon ? (
        <span className="tool-mark-icon" aria-hidden="true" />
      ) : (
        <Sparkles size={large ? 22 : 20} aria-hidden="true" />
      )}
      {!iconOnly ? <span>{tool.name}</span> : null}
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

function ToolLogoGroup({ toolsToRender, duplicate = false }: { toolsToRender: ToolMark[]; duplicate?: boolean }) {
  return (
    <div className="tools-marquee-group" aria-hidden={duplicate ? true : undefined}>
      {toolsToRender.map((tool) => (
        <ToolMarkView key={`${duplicate ? "copy" : "primary"}-${tool.name}`} tool={tool} iconOnly />
      ))}
    </div>
  );
}

export function ToolsMarquee() {
  const reducedMotion = usePrefersReducedMotion();
  const logoTools = tools.filter((tool) => Boolean(tool.icon));

  return (
    <div className="tools-marquee tools-marquee--logos" aria-label="Tools and technologies">
      <div className={cn("tools-track", reducedMotion && "tools-track--static")}>
        <ToolLogoGroup toolsToRender={logoTools} />
        {!reducedMotion ? <ToolLogoGroup toolsToRender={logoTools} duplicate /> : null}
      </div>
    </div>
  );
}
