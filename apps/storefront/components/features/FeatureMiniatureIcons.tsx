/**
 * FeatureMiniatureIcons – Compact Icon Strip for Product Cards
 *
 * Zeigt 2–5 Feature-Icons in einer kompakten horizontalen Reihe
 * am unteren Rand von Produktkarten.
 *
 * Design-Entscheidungen:
 * - Kein Layout-Shift: fixe Höhe von 28px für den Icon-Strip
 * - Overflow: versteckte Icons werden mit "+N mehr"-Badge angezeigt
 * - Tooltip on hover für jeden Icon
 * - Kein Text-Label in dieser Komponente (spart Platz auf Karten)
 *
 * Accessibility:
 * - aria-label am Container
 * - Jeder Icon-Wrapper hat title für Screen-Reader
 */

import type { ResolvedFeatureVisual } from "@wsp/contracts";
import { ICON_SIZE_CLASSES } from "@wsp/contracts";
import Image from "next/image";
import { FeatureTooltip } from "./FeatureTooltip";

interface FeatureMiniatureIconsProps {
  visuals: ResolvedFeatureVisual[];
  maxDisplay?: number;
  iconSize?: "xs" | "sm" | "md" | "lg" | "xl";
  showTooltips?: boolean;
  animate?: boolean;
  className?: string;
}

function SingleMiniatureIcon({
  visual,
  iconSizeClass,
  showTooltip,
  animate,
}: {
  visual: ResolvedFeatureVisual;
  iconSizeClass: string;
  showTooltip: boolean;
  animate: boolean;
}) {
  const icon = (
    <span
      className={`
        flex-shrink-0 ${iconSizeClass} flex items-center justify-center
        text-brand-muted rounded
        ${animate ? "transition-all duration-150 hover:text-brand-accent hover:scale-110" : ""}
      `}
      style={visual.colorPrimary ? { color: visual.colorPrimary } : undefined}
      title={visual.altText || visual.label}
    >
      {visual.svgContent ? (
        <span
          className={`${iconSizeClass} [&>svg]:w-full [&>svg]:h-full`}
          dangerouslySetInnerHTML={{ __html: visual.svgContent }}
        />
      ) : visual.imageUrl ? (
        visual.imageWidth && visual.imageHeight ? (
          <Image
            src={visual.imageUrl}
            alt={visual.altText || visual.label}
            width={visual.imageWidth}
            height={visual.imageHeight}
            className="object-contain w-full h-full"
            loading="lazy"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={visual.imageUrl}
            alt={visual.altText || visual.label}
            className="object-contain w-full h-full"
            loading="lazy"
          />
        )
      ) : (
        // Fallback: colored dot
        <span
          className="w-1.5 h-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
    </span>
  );

  if (showTooltip && visual.tooltip) {
    return <FeatureTooltip content={visual.tooltip}>{icon}</FeatureTooltip>;
  }
  if (showTooltip && visual.label) {
    return <FeatureTooltip content={visual.label}>{icon}</FeatureTooltip>;
  }
  return icon;
}

export function FeatureMiniatureIcons({
  visuals,
  maxDisplay = 5,
  iconSize = "sm",
  showTooltips = true,
  animate = true,
  className = "",
}: FeatureMiniatureIconsProps) {
  if (!visuals || visuals.length === 0) return null;

  const iconSizeClass = ICON_SIZE_CLASSES[iconSize] ?? ICON_SIZE_CLASSES["sm"];
  const displayed = visuals.slice(0, maxDisplay);
  const overflow = visuals.length - displayed.length;

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      role="list"
      aria-label="Produktmerkmale"
    >
      {displayed.map((visual) => (
        <div key={visual.id} role="listitem">
          <SingleMiniatureIcon
            visual={visual}
            iconSizeClass={iconSizeClass}
            showTooltip={showTooltips}
            animate={animate}
          />
        </div>
      ))}

      {overflow > 0 && (
        <span
          className="flex-shrink-0 text-xs font-medium text-brand-muted bg-gray-100 rounded-full px-1.5 py-0.5 leading-tight"
          aria-label={`${overflow} weitere Merkmale`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
