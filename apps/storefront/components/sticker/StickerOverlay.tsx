/**
 * StickerOverlay – legt Sticker über ein Produktbild.
 *
 * Server Component – kein "use client" erforderlich,
 * da StickerBadge selbst Client-Interaktivität für Tooltips enthält.
 *
 * Verwendung:
 *   <StickerOverlay stickers={product.stickers} pageContext="listing">
 *     <Image ... />
 *   </StickerOverlay>
 *
 * Position-Mapping:
 *   top_left      → absolute top-2 left-2
 *   top_right     → absolute top-2 right-2
 *   bottom_left   → absolute bottom-2 left-2
 *   bottom_right  → absolute bottom-2 right-2
 *   center        → absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
 *   custom        → absolute, inline top/left via style
 *
 * Mehrere Sticker derselben Position werden vertikal gestapelt (gap-1).
 */

import type { StickerDisplay } from "@wsp/types";
import { StickerBadge, type PageContext } from "./StickerBadge";

interface Props {
  stickers: StickerDisplay[];
  pageContext?: PageContext;
  children: React.ReactNode;
}

type Position = StickerDisplay["position"];

const POSITION_CLASSES: Record<Exclude<Position, "custom">, string> = {
  top_left: "top-2 left-2",
  top_right: "top-2 right-2",
  bottom_left: "bottom-2 left-2",
  bottom_right: "bottom-2 right-2",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

export function StickerOverlay({ stickers, pageContext = "listing", children }: Props) {
  if (stickers.length === 0) {
    return <>{children}</>;
  }

  // Gruppiere Sticker nach Position für saubere Stapelung
  const byPosition = new Map<string, StickerDisplay[]>();
  for (const sticker of stickers) {
    const key =
      sticker.position === "custom"
        ? `custom-${sticker.position_x ?? 0}-${sticker.position_y ?? 0}`
        : sticker.position;
    const group = byPosition.get(key) ?? [];
    group.push(sticker);
    byPosition.set(key, group);
  }

  return (
    <div className="relative w-full h-full">
      {children}
      {Array.from(byPosition.entries()).map(([key, group]) => {
        const first = group[0];
        const isCustom = first.position === "custom";

        const positionStyle: React.CSSProperties = isCustom
          ? {
              top: first.position_y != null ? `${first.position_y}px` : undefined,
              left: first.position_x != null ? `${first.position_x}px` : undefined,
            }
          : {};

        const positionClass =
          !isCustom && first.position in POSITION_CLASSES
            ? POSITION_CLASSES[first.position as Exclude<Position, "custom">]
            : "";

        return (
          <div
            key={key}
            className={`absolute z-10 flex flex-col gap-1 pointer-events-none ${positionClass}`}
            style={positionStyle}
          >
            {group.map((sticker) => (
              <div key={sticker.id} className="pointer-events-auto">
                <StickerBadge sticker={sticker} pageContext={pageContext} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
