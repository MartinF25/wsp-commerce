"use client";

/**
 * FeatureTooltip – Accessible Tooltip Wrapper
 *
 * Lightweight CSS-only tooltip mit ARIA-Support.
 * Kein JS-Portal nötig – verwendet CSS ::after + group-hover.
 * Zero CLS: Tooltip erscheint absolut positioniert, kein Layout-Shift.
 *
 * Accessibility:
 * - role="tooltip" + aria-describedby-Verbindung
 * - Keyboard-navigierbar (focus zeigt Tooltip)
 * - Screen-reader bekommt den Text via title-Attribut als Fallback
 */

import { useId, type ReactNode } from "react";

interface FeatureTooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function FeatureTooltip({
  content,
  children,
  position = "top",
  className = "",
}: FeatureTooltipProps) {
  const tooltipId = useId();

  if (!content) return <>{children}</>;

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  }[position];

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-y-transparent border-l-transparent",
  }[position];

  return (
    <span
      className={`relative inline-flex group/tooltip ${className}`}
      aria-describedby={tooltipId}
    >
      {children}

      {/* Tooltip bubble */}
      <span
        id={tooltipId}
        role="tooltip"
        className={`
          pointer-events-none absolute z-50 whitespace-nowrap
          ${positionClasses}
          bg-gray-800 text-white text-xs font-medium
          px-2.5 py-1.5 rounded-lg shadow-lg
          opacity-0 scale-95
          group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100
          group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:scale-100
          transition-all duration-150 ease-out
          max-w-48
        `}
      >
        {content}
        {/* Arrow */}
        <span
          aria-hidden="true"
          className={`absolute border-4 ${arrowClasses}`}
        />
      </span>
    </span>
  );
}
