import type { ProductWithVariants, PriceDisplay } from "../types/index";

/**
 * Check if product is directly purchasable.
 */
export function isDirectlyPurchasable(productType: string): boolean {
  return productType === "direct_purchase";
}

/**
 * Check if product is configurable.
 */
export function isConfigurable(productType: string): boolean {
  return productType === "configurable";
}

/**
 * Check if product is inquiry-only.
 */
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
 * Calculate price display based on product type and variants.
 * - direct_purchase: show fixed price (e.g. "1.299 €")
 * - configurable: show min price with "ab" prefix (e.g. "ab 1.299 €")
 * - inquiry_only: show "Preis auf Anfrage" or "ab X € (Richtpreis)"
 */
export function calculatePriceDisplay(
  product: ProductWithVariants
): PriceDisplay {
  const variants = product.variants || [];
  const currency = (variants[0]?.currency as string) || "EUR";

  if (isDirectlyPurchasable(product.product_type)) {
    const priceCents = variants[0]?.price_cents;
    if (priceCents === null || priceCents === undefined) {
      return { currencyCode: currency, displayText: "Preis auf Anfrage" };
    }
    return {
      minCents: priceCents,
      currencyCode: currency,
      displayText: formatCurrency(priceCents, currency),
    };
  }

  if (isConfigurable(product.product_type)) {
    const pricesInCents: number[] = variants
      .map((v: any) => v.price_cents)
      .filter((p: number | null) => p !== null) as number[];

    if (pricesInCents.length === 0) {
      return { currencyCode: currency, displayText: "Preis auf Anfrage" };
    }

    const minCents = Math.min(...pricesInCents);
    const maxCents = Math.max(...pricesInCents);

    return {
      minCents,
      maxCents,
      currencyCode: currency,
      displayText: `ab ${formatCurrency(minCents, currency)}`,
    };
  }

  if (isInquiryOnly(product.product_type)) {
    const pricesInCents: number[] = variants
      .map((v: any) => v.price_cents)
      .filter((p: number | null) => p !== null) as number[];

    if (pricesInCents.length === 0) {
      return { currencyCode: currency, displayText: "Preis auf Anfrage" };
    }

    const minCents = Math.min(...pricesInCents);
    return {
      minCents,
      currencyCode: currency,
      displayText: `ab ${formatCurrency(minCents, currency)} (Richtpreis)`,
    };
  }

  return { currencyCode: currency, displayText: "Preis auf Anfrage" };
}

/**
 * Validate that all variants in a product use the same currency.
 */
export function validateVariantCurrency(product: ProductWithVariants): void {
  const variants = product.variants || [];
  if (variants.length === 0) return;

  const currencies = [...new Set(variants.map((v) => v.currency))];
  if (currencies.length > 1) {
    throw new Error(
      `Product ${product.id} has variants with different currencies: ${currencies.join(", ")}`
    );
  }
}
