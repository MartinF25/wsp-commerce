import type { Bundle as BundleContract, BundleItem as BundleItemContract } from "@wsp/contracts";
import type { BundleWithItems, BundleItemWithProduct } from "../types";
import { toProductSummary } from "./catalog";
import { calculateBundlePriceInfo, isBundleValid } from "../utils/bundleDiscount";
import { resolveVariantTranslation } from "../utils/localeUtils";
import { computeSaleStatus } from "../utils/productUtils";

/**
 * Löst die Bundle-Übersetzung auf. Fallback-Kette: gewünschte Locale → DE → erste verfügbare.
 */
function resolveBundleTranslation(
  translations: BundleWithItems["translations"],
  locale: string
) {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === "de") ??
    translations[0] ??
    null
  );
}

/**
 * Wandelt einen BundleItem in den öffentlichen BundleItem-Contract um.
 * Gibt null zurück wenn das Produkt nicht aktiv ist (Edge Case: gelöschtes Produkt).
 */
export function toBundleItem(
  item: BundleItemWithProduct,
  locale = "de"
): BundleItemContract | null {
  if (!item.product || item.product.status !== "active") return null;

  const productSummary = toProductSummary(item.product, locale);
  const variants = item.product.variants
    .filter((v) => v.is_active)
    .map((v) => {
      const vt = resolveVariantTranslation(v.translations, locale);
      return {
        id: v.id,
        sku: v.sku,
        name: vt?.name ?? "",
        price_cents: v.price_cents ?? null,
        currency: v.currency,
        stock_quantity: v.stock_quantity,
        attributes: v.attributes as Record<string, unknown>,
        weight_kg: v.weight_kg ?? null,
        dimensions: (v.dimensions ?? null) as Record<string, unknown> | null,
        sale_price_cents: v.sale_price_cents ?? null,
        sale_status: computeSaleStatus(
          v.sale_price_cents,
          item.product.sale_starts_at,
          item.product.sale_ends_at
        ),
      };
    });

  return {
    id: item.id,
    product: { ...productSummary, variants },
    quantity: item.quantity,
    is_required: item.is_required,
    sort_order: item.sort_order,
    discount_percent: item.discount_percent !== null ? Number(item.discount_percent) : null,
    discount_cents: item.discount_cents ?? null,
  };
}

/**
 * Wandelt ein vollständig geladenes Bundle in den öffentlichen Bundle-Contract um.
 *
 * Filtert inaktive Produkte aus den Items heraus (Edge Case: Produkt nachträglich deaktiviert).
 * Berechnet priceInfo nur wenn kaufbare Produkte im Bundle vorhanden sind.
 *
 * Gibt null zurück wenn das Bundle abgelaufen oder inaktiv ist (für öffentliche API).
 */
export function toBundle(
  bundle: BundleWithItems,
  locale = "de",
  options: { skipValidityCheck?: boolean } = {}
): BundleContract | null {
  if (!options.skipValidityCheck && !isBundleValid(bundle)) return null;

  const t = resolveBundleTranslation(bundle.translations, locale);

  const items: BundleItemContract[] = bundle.items
    .map((item) => toBundleItem(item, locale))
    .filter((item): item is BundleItemContract => item !== null)
    .sort((a, b) => a.sort_order - b.sort_order);

  const priceInfo = calculateBundlePriceInfo(bundle);

  return {
    id: bundle.id,
    status: bundle.status,
    title: t?.title ?? "",
    description: t?.description ?? null,
    tab_name: t?.tab_name ?? null,
    image_url: bundle.image_url ?? null,
    valid_from: bundle.valid_from?.toISOString() ?? null,
    valid_until: bundle.valid_until?.toISOString() ?? null,
    discount_type: bundle.discount_type,
    discount_percent: bundle.discount_percent !== null ? Number(bundle.discount_percent) : null,
    discount_cents: bundle.discount_cents ?? null,
    discount_mode: bundle.discount_mode,
    min_items_for_discount: bundle.min_items_for_discount,
    display_mode: bundle.display_mode,
    tab_group: bundle.tab_group ?? null,
    sort_order: bundle.sort_order,
    items,
    priceInfo,
  };
}

/**
 * Admin-Mapper: Gibt alle Bundle-Felder zurück, ohne Gültigkeitscheck.
 * Für Admin-Routen, die auch inaktive/abgelaufene Bundles zeigen müssen.
 */
export function toBundleAdmin(bundle: BundleWithItems, locale = "de"): BundleContract {
  return toBundle(bundle, locale, { skipValidityCheck: true }) as BundleContract;
}
