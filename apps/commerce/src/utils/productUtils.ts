import type { ProductWithVariants, PriceDisplay } from "../types/index";
import type { SaleStatus } from "@wsp/contracts";

export function isDirectlyPurchasable(productType: string): boolean {
  return productType === "direct_purchase";
}

export function isConfigurable(productType: string): boolean {
  return productType === "configurable";
}

export function isInquiryOnly(productType: string): boolean {
  return productType === "inquiry_only";
}

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Derives whether a variant's sale price is currently active.
 * All time comparisons use UTC. Never stored – always computed.
 */
export function computeSaleStatus(
  salePriceCents: number | null,
  saleStartsAt: Date | null,
  saleEndsAt: Date | null
): SaleStatus {
  if (salePriceCents === null) return "inactive";
  const now = new Date();
  if (saleStartsAt !== null && saleStartsAt > now) return "scheduled";
  if (saleEndsAt !== null && saleEndsAt <= now) return "expired";
  return "active";
}

/**
 * Builds the offer fields that are shared across all PriceDisplay return paths.
 * Returns isOnSale=false when no variant has an active sale price.
 */
function buildSaleFields(
  product: ProductWithVariants
): Pick<
  PriceDisplay,
  | "isOnSale"
  | "showCountdown"
  | "salePriceCents"
  | "originalPriceCents"
  | "saleLabel"
  | "saleEndsAt"
> {
  const activeSaleVariants = (product.variants ?? []).filter((v) => {
    return (
      computeSaleStatus(
        v.sale_price_cents,
        product.sale_starts_at,
        product.sale_ends_at
      ) === "active"
    );
  });

  if (activeSaleVariants.length === 0) {
    return { isOnSale: false, showCountdown: false };
  }

  const salePriceCents = Math.min(
    ...activeSaleVariants.map((v) => v.sale_price_cents as number)
  );
  const saleVariant = activeSaleVariants.find(
    (v) => v.sale_price_cents === salePriceCents
  );

  // Countdown only valid when explicitly enabled AND an end date exists
  const showCountdown =
    product.show_countdown === true && product.sale_ends_at !== null;

  return {
    isOnSale: true,
    showCountdown,
    salePriceCents,
    originalPriceCents: saleVariant?.price_cents ?? undefined,
    saleLabel: product.sale_label ?? undefined,
    saleEndsAt:
      showCountdown && product.sale_ends_at
        ? product.sale_ends_at.toISOString()
        : undefined,
  };
}

/**
 * Calculates price display for UI rendering.
 * When a sale is active, displayText shows the sale price.
 * originalPriceCents is set for strikethrough display in the UI.
 */
export function calculatePriceDisplay(
  product: ProductWithVariants
): PriceDisplay {
  const variants = product.variants ?? [];
  const currency = (variants[0]?.currency as string) || "EUR";
  const saleFields = buildSaleFields(product);

  // When on sale, use the active sale price as the primary display price
  const effectiveMinCents = saleFields.isOnSale
    ? saleFields.salePriceCents
    : undefined;

  if (isDirectlyPurchasable(product.product_type)) {
    const pricesInCents = variants
      .map((v) => v.price_cents)
      .filter((p): p is number => p !== null);

    if (pricesInCents.length === 0) {
      return { currencyCode: currency, displayText: "Preis auf Anfrage", isOnSale: false, showCountdown: false };
    }

    const minCents = effectiveMinCents ?? Math.min(...pricesInCents);
    const displayText =
      pricesInCents.length === 1 || saleFields.isOnSale
        ? formatCurrency(minCents, currency)
        : `ab ${formatCurrency(minCents, currency)}`;

    return { minCents, currencyCode: currency, displayText, ...saleFields };
  }

  if (isConfigurable(product.product_type)) {
    const pricesInCents = variants
      .map((v) => v.price_cents)
      .filter((p): p is number => p !== null);

    if (pricesInCents.length === 0) {
      return { currencyCode: currency, displayText: "Preis auf Anfrage", isOnSale: false, showCountdown: false };
    }

    const minCents = effectiveMinCents ?? Math.min(...pricesInCents);
    const maxCents = Math.max(...pricesInCents);

    return {
      minCents,
      maxCents,
      currencyCode: currency,
      displayText: `ab ${formatCurrency(minCents, currency)}`,
      ...saleFields,
    };
  }

  if (isInquiryOnly(product.product_type)) {
    const pricesInCents = variants
      .map((v) => v.price_cents)
      .filter((p): p is number => p !== null);

    if (pricesInCents.length === 0) {
      return { currencyCode: currency, displayText: "Preis auf Anfrage", isOnSale: false, showCountdown: false };
    }

    const minCents = effectiveMinCents ?? Math.min(...pricesInCents);
    return {
      minCents,
      currencyCode: currency,
      displayText: `ab ${formatCurrency(minCents, currency)} (Richtpreis)`,
      ...saleFields,
    };
  }

  return { currencyCode: currency, displayText: "Preis auf Anfrage", isOnSale: false, showCountdown: false };
}

/**
 * Validate that all variants in a product use the same currency.
 */
export function validateVariantCurrency(product: ProductWithVariants): void {
  const variants = product.variants ?? [];
  if (variants.length === 0) return;

  const currencies = [...new Set(variants.map((v) => v.currency))];
  if (currencies.length > 1) {
    throw new Error(
      `Product ${product.id} has variants with different currencies: ${currencies.join(", ")}`
    );
  }
}
