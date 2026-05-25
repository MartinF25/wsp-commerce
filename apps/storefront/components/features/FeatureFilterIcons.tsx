/**
 * FeatureFilterIcons – Feature Visuals in Faceted Search Filters
 *
 * Zeigt Feature-Icons neben Filter-Optionen in der Such-Sidebar.
 *
 * Zwei Modi:
 * 1. Filter-Option mit Icon: [Icon] Label (Checkbox/Radio)
 * 2. Icon-only Schnellfilter: horizontale Icon-Reihe als Filterknöpfe
 *
 * Performance-Optimierungen:
 * - Virtualisierung wird beim elterlichen Container erwartet
 * - Kein unnötiges Re-Render: Visuals als Map gecacht
 * - Debounced Hover-States via CSS (kein JS-Debounce nötig)
 *
 * Accessibility:
 * - Jede Filter-Option hat aria-label
 * - Focus-Ring immer sichtbar
 * - Keyboard: Enter/Space zum Aktivieren
 */

import type { ResolvedFeatureVisual } from "@wsp/contracts";
import { ICON_SIZE_CLASSES } from "@wsp/contracts";
import Image from "next/image";
import { FeatureTooltip } from "./FeatureTooltip";

// ─── Single Filter Option ─────────────────────────────────────────────────────

interface FeatureFilterOptionProps {
  /** Der Anzeigetext der Filteroption */
  label: string;
  /** Zugehöriges Feature Visual (optional) */
  visual?: ResolvedFeatureVisual | null;
  /** Ist diese Option aktuell aktiv? */
  isActive?: boolean;
  /** Anzahl der Produkte mit dieser Option */
  count?: number;
  showIcon?: boolean;
  showLabel?: boolean;
  showCount?: boolean;
  showTooltip?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FeatureFilterOption({
  label,
  visual,
  isActive = false,
  count,
  showIcon = true,
  showLabel = true,
  showCount = true,
  showTooltip = false,
  onClick,
  className = "",
}: FeatureFilterOptionProps) {
  const iconSizeClass = ICON_SIZE_CLASSES["xs"];

  const iconEl = visual && showIcon ? (
    <span
      className={`flex-shrink-0 ${iconSizeClass} flex items-center justify-center text-brand-muted`}
      style={visual.colorPrimary ? { color: visual.colorPrimary } : undefined}
      aria-hidden="true"
    >
      {visual.svgContent ? (
        <span
          className={`${iconSizeClass} [&>svg]:w-full [&>svg]:h-full`}
          dangerouslySetInnerHTML={{ __html: visual.svgContent }}
        />
      ) : visual.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={visual.imageUrl}
          alt=""
          className="object-contain w-full h-full"
          loading="lazy"
        />
      ) : null}
    </span>
  ) : null;

  const content = (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={`${label}${count !== undefined ? ` (${count})` : ""}`}
      className={`
        group w-full flex items-center gap-2 text-left
        px-2 py-1.5 rounded-lg text-sm
        transition-colors duration-100
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1
        ${isActive
          ? "bg-brand-accent/10 text-brand-accent font-medium"
          : "text-brand-text hover:bg-gray-50"
        }
        ${className}
      `}
    >
      {iconEl}

      {showLabel && (
        <span className="flex-1 truncate">{label}</span>
      )}

      {showCount && count !== undefined && (
        <span
          className={`flex-shrink-0 text-xs tabular-nums ${
            isActive ? "text-brand-accent" : "text-brand-muted"
          }`}
        >
          {count}
        </span>
      )}

      {/* Active indicator */}
      {isActive && (
        <span
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-brand-accent">
            <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
          </svg>
        </span>
      )}
    </button>
  );

  if (showTooltip && visual?.tooltip) {
    return <FeatureTooltip content={visual.tooltip} position="right">{content}</FeatureTooltip>;
  }

  return content;
}

// ─── Filter Group ─────────────────────────────────────────────────────────────

interface FeatureFilterGroupProps {
  title: string;
  options: Array<{
    value: string;
    label: string;
    visual?: ResolvedFeatureVisual | null;
    count?: number;
    isActive?: boolean;
  }>;
  collapsible?: boolean;
  defaultOpen?: boolean;
  showIcons?: boolean;
  showCounts?: boolean;
  onOptionClick?: (value: string) => void;
  className?: string;
}

export function FeatureFilterGroup({
  title,
  options,
  collapsible = true,
  defaultOpen = true,
  showIcons = true,
  showCounts = true,
  onOptionClick,
  className = "",
}: FeatureFilterGroupProps) {
  // Note: collapsed state needs "use client" - kept simple here as server-rendered
  // For full interactivity, wrap with a client boundary
  return (
    <div className={`border-b border-gray-100 pb-4 last:border-0 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
          {title}
        </h4>
      </div>

      <div className="space-y-0.5" role="group" aria-label={title}>
        {options.map((opt) => (
          <FeatureFilterOption
            key={opt.value}
            label={opt.label}
            visual={opt.visual}
            isActive={opt.isActive}
            count={opt.count}
            showIcon={showIcons}
            showCount={showCounts}
            onClick={() => onOptionClick?.(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Icon-Only Quick Filter Bar ───────────────────────────────────────────────

interface FeatureIconQuickFilterProps {
  options: Array<{
    value: string;
    visual: ResolvedFeatureVisual;
    isActive?: boolean;
  }>;
  onOptionClick?: (value: string) => void;
  className?: string;
}

export function FeatureIconQuickFilter({
  options,
  onOptionClick,
  className = "",
}: FeatureIconQuickFilterProps) {
  const iconSizeClass = ICON_SIZE_CLASSES["sm"];

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} role="group">
      {options.map((opt) => {
        const btn = (
          <button
            key={opt.value}
            type="button"
            onClick={() => onOptionClick?.(opt.value)}
            aria-pressed={opt.isActive}
            aria-label={opt.visual.label}
            className={`
              flex-shrink-0 ${iconSizeClass}
              flex items-center justify-center
              rounded-lg border p-1.5
              transition-all duration-100
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent
              ${opt.isActive
                ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                : "border-gray-200 text-brand-muted hover:border-brand-accent/50 hover:text-brand-accent"
              }
            `}
            style={
              opt.isActive && opt.visual.colorPrimary
                ? { borderColor: opt.visual.colorPrimary, color: opt.visual.colorPrimary }
                : undefined
            }
          >
            {opt.visual.svgContent ? (
              <span
                className={`${iconSizeClass} [&>svg]:w-full [&>svg]:h-full`}
                dangerouslySetInnerHTML={{ __html: opt.visual.svgContent }}
              />
            ) : opt.visual.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={opt.visual.imageUrl}
                alt={opt.visual.altText || opt.visual.label}
                className="object-contain w-full h-full"
                loading="lazy"
              />
            ) : (
              <span className="w-2 h-2 rounded-full bg-current" aria-hidden="true" />
            )}
          </button>
        );

        if (opt.visual.tooltip || opt.visual.label) {
          return (
            <FeatureTooltip key={opt.value} content={opt.visual.tooltip || opt.visual.label}>
              {btn}
            </FeatureTooltip>
          );
        }
        return btn;
      })}
    </div>
  );
}
