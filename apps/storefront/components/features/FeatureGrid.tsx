/**
 * FeatureGrid – Responsive Layout Engine für Feature Visuals
 *
 * Unterstützte Display-Modi:
 *   grid       → Kachel-Layout (3 Spalten Desktop, 2 Tablet, 2 Mobile)
 *   horizontal → Horizontale Scroll-Zeile
 *   vertical   → Vertikaler Stack
 *   compact    → Dichte Icon-Reihe ohne Labels
 *   grouped    → Gruppiert nach Feature-Key mit Abschnitt-Header
 *
 * Responsive-Konfiguration über Props – vollständig von Außen steuerbar.
 * Skeleton-Loading für suspense-fähige Nutzung.
 */

import type {
  FeatureWithVisual,
  FeatureDisplayMode,
  FeatureVisualSettings,
} from "@wsp/contracts";
import { FeatureBadge } from "./FeatureBadge";

interface FeatureGridProps {
  features: FeatureWithVisual[];
  settings?: FeatureVisualSettings | null;
  displayMode?: FeatureDisplayMode;
  columns?: number;
  iconSize?: "xs" | "sm" | "md" | "lg" | "xl";
  showLabels?: boolean;
  showTooltips?: boolean;
  animate?: boolean;
  gap?: "xs" | "sm" | "md" | "lg";
  title?: string;
  className?: string;
}

// ─── Layout Resolvers ──────────────────────────────────────────────────────────

function getGridClass(mode: FeatureDisplayMode, columns: number): string {
  switch (mode) {
    case "grid":
      return `grid gap-3 grid-cols-2 sm:grid-cols-${Math.min(columns, 4)}`;
    case "horizontal":
      return "flex flex-row flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-thin";
    case "vertical":
      return "flex flex-col gap-2";
    case "compact":
      return "flex flex-row flex-wrap gap-1.5";
    case "grouped":
      return "flex flex-col gap-4";
    case "icon_value":
    case "icon_name_value":
      return "flex flex-row flex-wrap gap-3";
    default:
      return "flex flex-col gap-2";
  }
}

function getItemClass(mode: FeatureDisplayMode): string {
  switch (mode) {
    case "grid":
      return "flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-accent/30 transition-colors duration-150";
    case "horizontal":
      return "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm";
    case "compact":
      return "flex-shrink-0";
    case "vertical":
      return "flex items-center gap-2.5";
    case "grouped":
      return "flex items-center gap-2";
    default:
      return "flex items-center gap-2";
  }
}

// ─── Grouped Renderer ──────────────────────────────────────────────────────────

function GroupedFeatures({
  features,
  iconSize,
  showTooltips,
  animate,
}: Pick<FeatureGridProps, "features" | "iconSize" | "showTooltips" | "animate">) {
  // Group by feature key
  const groups = new Map<string, FeatureWithVisual[]>();
  const ungrouped: FeatureWithVisual[] = [];

  for (const f of features) {
    if (f.key) {
      const g = groups.get(f.key) ?? [];
      g.push(f);
      groups.set(f.key, g);
    } else {
      ungrouped.push(f);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {Array.from(groups.entries()).map(([key, items]) => (
        <div key={key}>
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">
            {key}
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((f) =>
              f.visual ? (
                <span key={f.raw} className="flex items-center gap-1.5 text-sm text-brand-text">
                  <FeatureBadge
                    visual={f.visual}
                    displayMode="compact"
                    iconSize={iconSize}
                    showTooltip={showTooltips}
                    animate={animate}
                  />
                  <span>{f.value ?? f.raw}</span>
                </span>
              ) : (
                <span key={f.raw} className="text-sm text-brand-text">
                  {f.value ?? f.raw}
                </span>
              ),
            )}
          </div>
        </div>
      ))}
      {ungrouped.map((f) =>
        f.visual ? (
          <FeatureBadge
            key={f.raw}
            visual={f.visual}
            displayMode="icon_value"
            iconSize={iconSize}
            showTooltip={showTooltips}
            animate={animate}
          />
        ) : (
          <span key={f.raw} className="text-sm text-brand-text flex items-center gap-2">
            <span className="text-brand-muted">•</span>
            {f.raw}
          </span>
        ),
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function FeatureGridSkeleton({
  count = 6,
  mode = "grid",
}: { count?: number; mode?: FeatureDisplayMode }) {
  const isGrid = mode === "grid";
  return (
    <div
      className={isGrid ? "grid grid-cols-2 sm:grid-cols-3 gap-3" : "flex flex-wrap gap-2"}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-100 rounded-xl ${
            isGrid ? "h-14" : "h-8 w-20"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FeatureGrid({
  features,
  settings,
  displayMode,
  columns,
  iconSize = "md",
  showLabels,
  showTooltips,
  animate = true,
  gap,
  title,
  className = "",
}: FeatureGridProps) {
  // Merge with global settings as defaults
  const effectiveMode = displayMode ?? settings?.product_page_mode ?? "vertical";
  const effectiveCols = columns ?? settings?.product_page_columns ?? 3;
  const effectiveShowLabels = showLabels ?? settings?.show_labels ?? true;
  const effectiveShowTooltips = showTooltips ?? settings?.show_tooltips ?? true;
  const effectiveAnimate = animate && (settings?.enable_animations ?? true);

  const featuresWithVisual = features.filter((f) => f.visual !== null);
  const featuresWithoutVisual = features.filter((f) => f.visual === null);

  if (features.length === 0) return null;

  if (effectiveMode === "grouped") {
    return (
      <div className={className}>
        {title && (
          <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-3">
            {title}
          </h3>
        )}
        <GroupedFeatures
          features={features}
          iconSize={iconSize}
          showTooltips={effectiveShowTooltips}
          animate={effectiveAnimate}
        />
      </div>
    );
  }

  const gridClass = getGridClass(effectiveMode, effectiveCols);
  const itemClass = getItemClass(effectiveMode);

  return (
    <div className={className} role="list" aria-label={title ?? "Produktmerkmale"}>
      {title && (
        <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-3">
          {title}
        </h3>
      )}

      <div className={gridClass}>
        {/* Features WITH visuals */}
        {featuresWithVisual.map((f) => (
          <div key={f.raw} className={itemClass} role="listitem">
            <FeatureBadge
              visual={f.visual!}
              displayMode={effectiveMode}
              iconSize={iconSize}
              showLabel={effectiveShowLabels}
              showTooltip={effectiveShowTooltips}
              animate={effectiveAnimate}
            />
          </div>
        ))}

        {/* Features WITHOUT visuals – plain text fallback */}
        {featuresWithoutVisual.map((f) => (
          <div key={f.raw} className={itemClass} role="listitem">
            <span className="flex items-center gap-2 text-sm text-brand-text">
              {effectiveMode === "grid" && (
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-accent" aria-hidden="true" />
              )}
              <span>
                {f.key ? (
                  <>
                    <span className="text-brand-muted">{f.key}: </span>
                    <span className="font-medium">{f.value}</span>
                  </>
                ) : (
                  f.raw
                )}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
