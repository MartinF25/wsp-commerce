/**
 * FeatureBadge – Single Feature Visual Renderer
 *
 * Rendert ein einzelnes Feature mit optionalem Visual (SVG/Bild),
 * Label und Tooltip. Unterstützt alle FeatureDisplayMode-Varianten.
 *
 * Server Component (kein "use client") – der Tooltip-Teil ist
 * client-seitig via FeatureTooltip-Import isoliert.
 *
 * Performance:
 * - Bildabmessungen werden reserviert (width/height → kein CLS)
 * - SVG wird inline gerendert (kein Extra-Request)
 * - Lazy-load für <img> per default
 */

import type { ResolvedFeatureVisual, FeatureDisplayMode } from "@wsp/contracts";
import { ICON_SIZE_CLASSES } from "@wsp/contracts";
import Image from "next/image";
import { FeatureTooltip } from "./FeatureTooltip";

interface FeatureBadgeProps {
  visual: ResolvedFeatureVisual;
  displayMode?: FeatureDisplayMode;
  iconSize?: keyof typeof ICON_SIZE_CLASSES;
  showLabel?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  className?: string;
}

export function FeatureBadge({
  visual,
  displayMode = "icon_value",
  iconSize = "md",
  showLabel = true,
  showTooltip = true,
  animate = true,
  className = "",
}: FeatureBadgeProps) {
  const iconSizeClass = ICON_SIZE_CLASSES[iconSize] ?? ICON_SIZE_CLASSES["md"];
  const hasVisual = visual.imageUrl || visual.svgContent;
  const hasLabel = showLabel && visual.label;
  const hasTooltip = showTooltip && visual.tooltip;

  const wrapperClass = `
    inline-flex items-center gap-1.5
    ${animate ? "transition-transform duration-150 hover:scale-105" : ""}
    ${className}
  `.trim();

  const inner = (
    <span className={wrapperClass}>
      {/* Visual: SVG inline or Next.js Image */}
      {hasVisual && (
        <span
          className={`flex-shrink-0 ${iconSizeClass} flex items-center justify-center`}
          aria-hidden={hasLabel ? "true" : undefined}
          style={visual.colorPrimary ? { color: visual.colorPrimary } : undefined}
        >
          {visual.svgContent ? (
            <span
              className={`${iconSizeClass} [&>svg]:w-full [&>svg]:h-full`}
              // Safe: SVG content is admin-controlled, not user input
              dangerouslySetInnerHTML={{ __html: visual.svgContent }}
            />
          ) : visual.imageUrl ? (
            visual.imageWidth && visual.imageHeight ? (
              <Image
                src={visual.imageUrl}
                alt={visual.altText}
                width={visual.imageWidth}
                height={visual.imageHeight}
                className="object-contain w-full h-full"
                loading="lazy"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={visual.imageUrl}
                alt={visual.altText}
                className="object-contain w-full h-full"
                loading="lazy"
              />
            )
          ) : null}
        </span>
      )}

      {/* Label: shown based on displayMode */}
      {hasLabel && displayMode !== "compact" && displayMode !== "tooltip_only" && (
        <span
          className={`text-sm font-medium text-brand-text leading-tight ${visual.cssClass ?? ""}`}
          style={visual.colorPrimary ? { color: visual.colorPrimary } : undefined}
        >
          {displayMode === "icon_name_value" || displayMode === "grouped" ? (
            // Show both name + value separated
            <span className="flex flex-col leading-tight">
              <span className="text-xs text-brand-muted">{visual.featureValue ? visual.label.split(":")[0]?.trim() : visual.label}</span>
              {visual.featureValue && (
                <span className="font-semibold text-brand-text">{visual.featureValue}</span>
              )}
            </span>
          ) : (
            visual.label
          )}
        </span>
      )}
    </span>
  );

  // Wrap with link if configured
  const linked = visual.linkUrl ? (
    <a
      href={visual.linkUrl}
      target={visual.linkTarget ?? "_self"}
      rel={visual.linkRel ?? (visual.linkTarget === "_blank" ? "noopener noreferrer" : undefined)}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1 rounded"
      aria-label={visual.altText || visual.label}
    >
      {inner}
    </a>
  ) : inner;

  // Wrap with tooltip if configured
  if (hasTooltip && displayMode !== "tooltip_only") {
    return (
      <FeatureTooltip content={visual.tooltip}>
        {linked}
      </FeatureTooltip>
    );
  }

  if (displayMode === "tooltip_only" && hasTooltip) {
    return (
      <FeatureTooltip content={visual.tooltip}>
        <span tabIndex={0} className="cursor-help">
          {inner}
        </span>
      </FeatureTooltip>
    );
  }

  return linked;
}
