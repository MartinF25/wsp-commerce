"use client";

/**
 * StickerBadge – rendert einen einzelnen aufgelösten Sticker.
 *
 * pageContext steuert welche Größe aus size_config verwendet wird.
 * Hat der Sticker keinen Eintrag für den aktuellen Kontext, greift
 * folgende Fallback-Kette: listing → detail → homepage → search → "70px".
 *
 * Tooltip-Funktion:
 *   - Desktop: Tooltip erscheint beim Hover (CSS :hover)
 *   - Mobile: Tooltip erscheint beim ersten Tap, verschwindet nach 2 s
 */

import { useState, useCallback } from "react";
import type { StickerDisplay } from "@wsp/types";

export type PageContext = "homepage" | "listing" | "detail" | "search";

interface Props {
  sticker: StickerDisplay;
  pageContext?: PageContext;
}

function resolveSize(config: Record<string, string>, ctx: PageContext): string {
  return (
    config[ctx] ??
    config["listing"] ??
    config["detail"] ??
    config["homepage"] ??
    config["search"] ??
    "70px"
  );
}

export function StickerBadge({ sticker, pageContext = "listing" }: Props) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const size = resolveSize(sticker.size_config, pageContext);

  const handleTap = useCallback(() => {
    if (!sticker.tooltip) return;
    setTooltipVisible(true);
    setTimeout(() => setTooltipVisible(false), 2000);
  }, [sticker.tooltip]);

  const wrapperStyle: React.CSSProperties = sticker.link_url
    ? { cursor: "pointer" }
    : {};

  const content = renderStickerContent(sticker, size);

  const inner = (
    <span
      className={`relative inline-block ${sticker.css_class ?? ""}`}
      style={wrapperStyle}
      onClick={handleTap}
      aria-label={sticker.text ?? undefined}
    >
      {content}
      {sticker.tooltip && (
        <span
          role="tooltip"
          className={`
            absolute z-50 left-0 top-full mt-1.5
            min-w-[160px] max-w-[280px]
            rounded-lg px-3 py-2 text-xs leading-snug
            bg-gray-900 text-white shadow-xl
            pointer-events-none select-none
            transition-opacity duration-150
            ${tooltipVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
          `}
        >
          {sticker.tooltip}
          {sticker.tooltip_link_label && sticker.tooltip_link_url && (
            <a
              href={sticker.tooltip_link_url}
              className="block mt-1.5 underline text-blue-300 pointer-events-auto"
              rel="noopener noreferrer"
            >
              {sticker.tooltip_link_label}
            </a>
          )}
        </span>
      )}
    </span>
  );

  if (sticker.link_url) {
    return (
      <a
        href={sticker.link_url}
        className="group"
        rel="noopener noreferrer"
        tabIndex={0}
        aria-label={sticker.text ?? "Sticker-Link"}
      >
        {inner}
      </a>
    );
  }

  return <span className="group">{inner}</span>;
}

// ─── Render-Helfer ────────────────────────────────────────────────────────────

function renderStickerContent(sticker: StickerDisplay, size: string): React.ReactNode {
  const opacityVal = sticker.opacity ?? 1;

  if (sticker.type === "image" && sticker.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sticker.image_url}
        alt={sticker.text ?? ""}
        style={{ width: size, height: "auto", opacity: opacityVal }}
        className="block"
        loading="lazy"
        draggable={false}
      />
    );
  }

  const labelStyle: React.CSSProperties = {
    display: "inline-block",
    color: sticker.text_color ?? "#ffffff",
    backgroundColor: sticker.bg_color ?? "#22c55e",
    border: sticker.border_color ? `1px solid ${sticker.border_color}` : undefined,
    borderRadius: sticker.border_radius ?? "4px",
    padding: sticker.padding ?? "3px 8px",
    fontSize: sticker.font_size ?? "11px",
    fontWeight: sticker.font_bold ? "bold" : "600",
    fontStyle: sticker.font_italic ? "italic" : "normal",
    opacity: opacityVal,
    lineHeight: 1.3,
    whiteSpace: "nowrap",
    ...(sticker.custom_css ? parseCssString(sticker.custom_css) : {}),
  };

  if (sticker.type === "combined" && sticker.image_url) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sticker.image_url}
          alt=""
          style={{ width: size, height: "auto" }}
          loading="lazy"
          draggable={false}
        />
        {sticker.text && <span style={labelStyle}>{sticker.text}</span>}
      </span>
    );
  }

  return <span style={labelStyle}>{sticker.text ?? ""}</span>;
}

/** Rudimentärer CSS-String-Parser für simple inline-style Angaben (key: value; …). */
function parseCssString(css: string): React.CSSProperties {
  const result: Record<string, string> = {};
  css.split(";").forEach((decl) => {
    const [prop, ...rest] = decl.split(":");
    if (!prop || rest.length === 0) return;
    const camel = prop.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    result[camel] = rest.join(":").trim();
  });
  return result as React.CSSProperties;
}
