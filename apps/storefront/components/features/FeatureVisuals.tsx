/**
 * FeatureVisuals – Main Orchestrator & Hook System
 *
 * Der zentrale Einstiegspunkt für das Feature Visual Engine im Storefront.
 *
 * Hook-basiertes Rendering:
 *   <FeatureVisuals hook="afterProductGallery" product={p} locale="de" />
 *   <FeatureVisuals hook="productCard" product={p} locale="de" compact />
 *   <FeatureVisuals hook="facetFilter" features={features} locale="de" />
 *
 * Vordefinierte Hooks:
 *   afterProductGallery   → unterhalb der Bildgalerie (grid, settings-gesteuert)
 *   belowDescription      → unter der Produktbeschreibung (grouped)
 *   productCard           → Produktkarte (compact, max 4 Icons)
 *   quickView             → Quick-View-Modal (horizontal)
 *   facetFilter           → Facetten-Filter-Sidebar (icon + label)
 *   collectionBanner      → Kategorie-Banner (horizontal compact)
 *
 * Alle Daten-Fetches erfolgen Server-seitig. Keine client-side Hydration
 * nötig – außer für animierte Teile (FeatureTooltip ist "use client").
 */

import type {
  FeatureWithVisual,
  FeatureVisualSettings,
  FeatureDisplayMode,
  ResolvedFeatureVisual,
} from "@wsp/contracts";
import { FeatureGrid, FeatureGridSkeleton } from "./FeatureGrid";
import { FeatureMiniatureIcons } from "./FeatureMiniatureIcons";
import { Suspense } from "react";

// ─── Hook definitions ──────────────────────────────────────────────────────────

export type FeatureVisualsHook =
  | "afterProductGallery"
  | "belowDescription"
  | "productCard"
  | "quickView"
  | "facetFilter"
  | "collectionBanner"
  | (string & {}); // custom hooks

interface HookConfig {
  displayMode: FeatureDisplayMode;
  iconSize: "xs" | "sm" | "md" | "lg" | "xl";
  showLabels: boolean;
  showTooltips: boolean;
  maxItems?: number;
  skeletonCount: number;
}

const HOOK_CONFIGS: Record<string, HookConfig> = {
  afterProductGallery: {
    displayMode: "grid",
    iconSize: "md",
    showLabels: true,
    showTooltips: true,
    skeletonCount: 6,
  },
  belowDescription: {
    displayMode: "grouped",
    iconSize: "md",
    showLabels: true,
    showTooltips: true,
    skeletonCount: 4,
  },
  productCard: {
    displayMode: "compact",
    iconSize: "sm",
    showLabels: false,
    showTooltips: true,
    maxItems: 4,
    skeletonCount: 4,
  },
  quickView: {
    displayMode: "horizontal",
    iconSize: "sm",
    showLabels: true,
    showTooltips: true,
    maxItems: 6,
    skeletonCount: 4,
  },
  facetFilter: {
    displayMode: "icon_value",
    iconSize: "xs",
    showLabels: true,
    showTooltips: false,
    skeletonCount: 3,
  },
  collectionBanner: {
    displayMode: "compact",
    iconSize: "xs",
    showLabels: false,
    showTooltips: true,
    maxItems: 5,
    skeletonCount: 3,
  },
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface FeatureVisualsBaseProps {
  hook?: FeatureVisualsHook;
  settings?: FeatureVisualSettings | null;
  displayMode?: FeatureDisplayMode;
  iconSize?: "xs" | "sm" | "md" | "lg" | "xl";
  showLabels?: boolean;
  showTooltips?: boolean;
  animate?: boolean;
  maxItems?: number;
  title?: string;
  className?: string;
  // Analytics
  onVisualClick?: (visual: ResolvedFeatureVisual) => void;
}

interface FeatureVisualsWithFeaturesProps extends FeatureVisualsBaseProps {
  features: FeatureWithVisual[];
  compact?: never;
}

interface FeatureVisualsCompactProps extends FeatureVisualsBaseProps {
  features: FeatureWithVisual[];
  compact: true;
}

type FeatureVisualsProps = FeatureVisualsWithFeaturesProps | FeatureVisualsCompactProps;

// ─── Main Component ────────────────────────────────────────────────────────────

export function FeatureVisuals({
  features,
  hook = "afterProductGallery",
  settings,
  displayMode: displayModeOverride,
  iconSize: iconSizeOverride,
  showLabels: showLabelsOverride,
  showTooltips: showTooltipsOverride,
  animate = true,
  maxItems: maxItemsOverride,
  title,
  className = "",
  compact,
}: FeatureVisualsProps) {
  if (!features || features.length === 0) return null;

  // Merge hook config → props override → settings defaults
  const hookConfig = HOOK_CONFIGS[hook] ?? HOOK_CONFIGS["afterProductGallery"];

  const displayMode = displayModeOverride ?? hookConfig.displayMode;
  const iconSize = iconSizeOverride ?? hookConfig.iconSize;
  const showLabels = showLabelsOverride ?? hookConfig.showLabels ?? (settings?.show_labels ?? true);
  const showTooltips = showTooltipsOverride ?? hookConfig.showTooltips ?? (settings?.show_tooltips ?? true);
  const maxItems = maxItemsOverride ?? hookConfig.maxItems;

  // Limit items for performance
  const effectiveFeatures = maxItems ? features.slice(0, maxItems) : features;

  // Product card: use compact miniature renderer
  if (hook === "productCard" || compact) {
    const visuals = effectiveFeatures
      .filter((f) => f.visual !== null)
      .map((f) => f.visual!);
    return (
      <FeatureMiniatureIcons
        visuals={visuals}
        iconSize={iconSize}
        showTooltips={showTooltips}
        animate={animate}
        className={className}
      />
    );
  }

  return (
    <Suspense fallback={<FeatureGridSkeleton count={hookConfig.skeletonCount} mode={displayMode} />}>
      <FeatureGrid
        features={effectiveFeatures}
        settings={settings}
        displayMode={displayMode}
        iconSize={iconSize}
        showLabels={showLabels}
        showTooltips={showTooltips}
        animate={animate}
        title={title}
        className={className}
      />
    </Suspense>
  );
}

// ─── Named hook components (ergonomic API) ────────────────────────────────────

/**
 * Convenience-Wrapper für produktseitige Nutzung.
 * <ProductPageFeatures features={resolvedFeatures} settings={settings} />
 */
export function ProductPageFeatures({
  features,
  settings,
  className,
}: {
  features: FeatureWithVisual[];
  settings?: FeatureVisualSettings | null;
  className?: string;
}) {
  if (!features?.length) return null;
  return (
    <FeatureVisuals
      hook="afterProductGallery"
      features={features}
      settings={settings}
      displayMode={settings?.product_page_mode ?? "grid"}
      className={className}
    />
  );
}

/**
 * Convenience-Wrapper für Quick-View-Modals.
 */
export function QuickViewFeatures({
  features,
  settings,
  className,
}: {
  features: FeatureWithVisual[];
  settings?: FeatureVisualSettings | null;
  className?: string;
}) {
  if (!features?.length) return null;
  return (
    <FeatureVisuals
      hook="quickView"
      features={features}
      settings={settings}
      className={className}
    />
  );
}
