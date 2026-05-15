import type { BundleWithItems } from "../types";
import type { BundlePriceInfo } from "@wsp/contracts";

/**
 * Prüft ob der Bundle-Rabatt aktuell zeitlich gültig ist.
 * Ein Bundle ohne Zeiteinschränkung gilt immer als gültig.
 */
export function isBundleDiscountActive(bundle: BundleWithItems): boolean {
  const now = new Date();

  if (bundle.valid_from_discount && new Date(bundle.valid_from_discount) > now) return false;
  if (bundle.valid_until_discount && new Date(bundle.valid_until_discount) < now) return false;
  if (bundle.discount_type === "none") return false;

  return true;
}

/**
 * Prüft ob das Bundle selbst noch gültig ist (gültig_von / gültig_bis).
 */
export function isBundleValid(bundle: BundleWithItems): boolean {
  const now = new Date();

  if (bundle.valid_from && new Date(bundle.valid_from) > now) return false;
  if (bundle.valid_until && new Date(bundle.valid_until) < now) return false;

  return bundle.status === "active";
}

/**
 * Berechnet den effektiven Preis eines Bundle-Items nach Produkt-Rabatt.
 *
 * Priorität:
 *   1. item.discount_percent (produktspezifischer %-Rabatt)
 *   2. item.discount_cents   (produktspezifischer €-Rabatt)
 *   3. Kein Produkt-Rabatt → Originalpreis zurückgeben
 *
 * Gibt null zurück wenn das Produkt keinen kaufbaren Preis hat.
 */
export function calculateItemPrice(
  basePriceCents: number | null,
  discountPercent: number | null,
  discountCents: number | null
): number | null {
  if (basePriceCents === null) return null;

  if (discountPercent !== null && discountPercent > 0) {
    const discount = Math.round((basePriceCents * Number(discountPercent)) / 100);
    return Math.max(0, basePriceCents - discount);
  }

  if (discountCents !== null && discountCents > 0) {
    return Math.max(0, basePriceCents - discountCents);
  }

  return basePriceCents;
}

/**
 * Berechnet die vollständige Bundle-Preisinformation für die Storefront-Anzeige.
 *
 * Rabattlogik (Prioritäten):
 *   1. discount_type=per_item → jedes Produkt hat eigene Rabatte (item.discount_*)
 *   2. discount_type=percentage → prozentualer Rabatt auf Gesamtpreis
 *   3. discount_type=fixed → fester Euro-Betrag Rabatt
 *   4. discount_type=none → kein Rabatt
 *
 * selectedCount: Anzahl der vom Kunden ausgewählten Bundle-Produkte.
 * Wird für discount_mode=min_count und all_items genutzt.
 */
export function calculateBundlePriceInfo(
  bundle: BundleWithItems,
  selectedCount?: number
): BundlePriceInfo | null {
  const currency = "EUR";

  // Nur kaufbare Produkte (mit Preis) berücksichtigen
  const priceableItems = bundle.items.filter((item) => {
    const variant = item.product.variants.find((v) => v.is_active && v.price_cents !== null);
    return variant !== undefined;
  });

  if (priceableItems.length === 0) return null;

  // Originaler Gesamtpreis aller Items (Mindestpreis je Produkt × Menge)
  let originalTotalCents = 0;
  for (const item of priceableItems) {
    const activeVariants = item.product.variants.filter((v) => v.is_active && v.price_cents !== null);
    const minPrice = Math.min(...activeVariants.map((v) => v.price_cents!));
    originalTotalCents += minPrice * item.quantity;
  }

  const discountActive = isBundleDiscountActive(bundle);

  // Prüfen ob Rabatt aufgrund discount_mode gilt
  const effectiveCount = selectedCount ?? bundle.items.length;
  let discountApplies = discountActive;

  if (discountActive) {
    switch (bundle.discount_mode) {
      case "all_items": {
        const requiredCount = bundle.items.filter((i) => i.is_required).length;
        if (effectiveCount < requiredCount) discountApplies = false;
        break;
      }
      case "min_count": {
        if (effectiveCount < bundle.min_items_for_discount) discountApplies = false;
        break;
      }
      case "any_item":
        break;
    }
  }

  let discountedTotalCents = originalTotalCents;

  if (discountApplies) {
    switch (bundle.discount_type) {
      case "percentage": {
        if (bundle.discount_percent !== null) {
          const saving = Math.round((originalTotalCents * Number(bundle.discount_percent)) / 100);
          discountedTotalCents = Math.max(0, originalTotalCents - saving);
        }
        break;
      }
      case "fixed": {
        if (bundle.discount_cents !== null) {
          discountedTotalCents = Math.max(0, originalTotalCents - bundle.discount_cents);
        }
        break;
      }
      case "per_item": {
        // Rabatt pro Produkt aus BundleItem
        let perItemTotal = 0;
        for (const item of priceableItems) {
          const activeVariants = item.product.variants.filter((v) => v.is_active && v.price_cents !== null);
          const minPrice = Math.min(...activeVariants.map((v) => v.price_cents!));
          const effectivePrice = calculateItemPrice(
            minPrice,
            item.discount_percent !== null ? Number(item.discount_percent) : null,
            item.discount_cents
          );
          perItemTotal += (effectivePrice ?? minPrice) * item.quantity;
        }
        discountedTotalCents = perItemTotal;
        break;
      }
      case "none":
        break;
    }
  }

  const savingsCents = Math.max(0, originalTotalCents - discountedTotalCents);
  const savingsPercent =
    originalTotalCents > 0
      ? Math.round((savingsCents / originalTotalCents) * 1000) / 10
      : 0;

  const isTimeLimited = discountActive && bundle.valid_until_discount !== null;

  return {
    originalTotalCents,
    discountedTotalCents,
    savingsCents,
    savingsPercent,
    currencyCode: currency,
    hasDiscount: savingsCents > 0,
    isTimeLimitedDiscount: isTimeLimited,
    discountEndsAt: bundle.valid_until_discount?.toISOString() ?? null,
  };
}
