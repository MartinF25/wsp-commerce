import type { StickerDisplay } from "@wsp/contracts";
import type { StickerWithRelations, ProductRuleContext } from "../types";
import { toStickerDisplay } from "../mappers/sticker";

/**
 * StickerRuleEngine
 *
 * Bewertet Sticker-Regeln in-memory gegenüber Produkt-Kontexten.
 * Wird pro Request mit einer vorab geladenen Liste aktiver Sticker initialisiert.
 *
 * Auswertungsreihenfolge:
 * 1. Sticker-Gültigkeit (valid_from/valid_until, status)
 * 2. Produkt-Ausschluss (excluded=true in StickerProductOverride)
 * 3. Manuelle Produktzuweisung (enabled=true Override → immer zeigen)
 * 4. Manuelle Deaktivierung (enabled=false Override → nie zeigen)
 * 5. Automatische Regeln (OR-verknüpft)
 * 6. Sortierung nach Priorität + Begrenzung auf max_per_product
 *
 * Caching: Die Sticker-Liste wird von StickerService gecacht (5 min TTL).
 * Diese Klasse rechnet rein in-memory – kein DB-Zugriff.
 */
export class StickerRuleEngine {
  private readonly stickers: StickerWithRelations[];
  private readonly now: Date;

  constructor(stickers: StickerWithRelations[], now: Date = new Date()) {
    this.stickers = stickers;
    this.now = now;
  }

  /**
   * Löst alle sichtbaren Sticker für ein Produkt auf.
   *
   * @param product   Produktkontext für die Regelauswertung
   * @param locale    Ziel-Locale für Text-Auflösung
   * @returns Sortierte Liste anzuzeigender Sticker (bereits als StickerDisplay)
   */
  resolve(product: ProductRuleContext, locale = "de"): StickerDisplay[] {
    const matchedStickers: StickerWithRelations[] = [];

    for (const sticker of this.stickers) {
      if (!this.isStickerValid(sticker)) continue;

      const override = sticker.product_overrides.find(
        (o) => o.product_id === product.id
      );

      // Produkt ist global von DIESEM Sticker ausgeschlossen
      if (override?.excluded) continue;
      // Sticker ist für dieses Produkt explizit deaktiviert
      if (override && !override.enabled) continue;

      // Manuelle Aktivierung: Override vorhanden + enabled=true → immer zeigen
      const isManuallyEnabled = override?.enabled === true;

      // Automatische Regeln prüfen (OR-Logik: mindestens eine Regel muss greifen)
      const rulesMatch = this.evaluateRules(sticker, product);

      if (isManuallyEnabled || rulesMatch) {
        matchedStickers.push(sticker);
      }
    }

    // Höhere Priorität zuerst
    matchedStickers.sort((a, b) => b.priority - a.priority);

    // Begrenzung: pro Produkt gilt das Minimum aus den max_per_product-Werten
    const globalMax = Math.min(...matchedStickers.map((s) => s.max_per_product).filter((n) => n > 0));
    const limited =
      matchedStickers.length > 0 && Number.isFinite(globalMax)
        ? matchedStickers.slice(0, globalMax)
        : matchedStickers;

    return limited.map((s) => toStickerDisplay(s, locale));
  }

  // ─── Privat ────────────────────────────────────────────────────────────────

  private isStickerValid(sticker: StickerWithRelations): boolean {
    if (sticker.status !== "active") return false;
    if (sticker.valid_from && sticker.valid_from > this.now) return false;
    if (sticker.valid_until && sticker.valid_until < this.now) return false;
    return true;
  }

  /**
   * Wertet alle Regeln eines Stickers aus (OR-Logik).
   * Sticker ohne Regeln bleiben NICHT aktiv – mindestens eine Regel ist Pflicht,
   * ausgenommen der rule_type=all_products.
   */
  private evaluateRules(
    sticker: StickerWithRelations,
    product: ProductRuleContext
  ): boolean {
    if (sticker.rules.length === 0) return false;

    return sticker.rules.some((rule) => {
      switch (rule.rule_type) {
        case "all_products":
          return true;

        case "category":
          return (
            rule.category_id !== null &&
            product.category_id === rule.category_id
          );

        case "price_range": {
          const price = product.min_price_cents;
          if (price === null) return false;
          const minOk = rule.price_min_cents === null || price >= rule.price_min_cents;
          const maxOk = rule.price_max_cents === null || price <= rule.price_max_cents;
          return minOk && maxOk;
        }

        case "availability":
          return (
            rule.availability_status !== null &&
            product.availability_status === rule.availability_status
          );

        case "new_arrival": {
          if (!rule.new_arrival_days) return false;
          const cutoff = new Date(this.now);
          cutoff.setDate(cutoff.getDate() - rule.new_arrival_days);
          return product.created_at >= cutoff;
        }

        default:
          return false;
      }
    });
  }
}

/**
 * Hilfsfunktion: Erstellt einen ProductRuleContext aus einem vollständig
 * geladenen Produkt (ProductWithVariants).
 */
export function toProductRuleContext(product: {
  id: string;
  category_id: string | null;
  availability_status: string;
  created_at: Date;
  variants: Array<{ is_active: boolean; price_cents: number | null }>;
}): ProductRuleContext {
  const activePrices = product.variants
    .filter((v) => v.is_active && v.price_cents !== null)
    .map((v) => v.price_cents as number);

  return {
    id: product.id,
    category_id: product.category_id,
    availability_status: product.availability_status as ProductRuleContext["availability_status"],
    created_at: product.created_at,
    min_price_cents: activePrices.length > 0 ? Math.min(...activePrices) : null,
  };
}
