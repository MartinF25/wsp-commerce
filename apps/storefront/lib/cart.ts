/**
 * Cart-State für den Storefront.
 *
 * Implementierung ohne externe State-Library via localStorage.
 * Der State wird über ein CustomEvent-System zwischen Komponenten synchronisiert.
 *
 * Struktur:
 *   CartItem        → Einzelnes Produkt im Warenkorb (mit optionaler Bundle-Referenz)
 *   Cart            → Gesamtwarenkorb mit berechneten Totals
 *   CartStore       → CRUD-Operationen auf dem Warenkorb
 */

const CART_STORAGE_KEY = "wsp_cart_v1";
const CART_UPDATED_EVENT = "wsp:cart:updated";

// ─── Typen ────────────────────────────────────────────────────────────────────

export interface CartItem {
  /** Eindeutiger Schlüssel: productId:variantId */
  key: string;
  productId: string;
  variantId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  imageUrl: string | null;
  quantity: number;
  /** Originalpreis in Cent. */
  unitPriceCents: number;
  /** Effektiver Preis nach Bundle-Rabatt in Cent. */
  effectivePriceCents: number;
  currency: string;
  /** Bundle-Referenz wenn Produkt als Teil eines Bundles hinzugefügt wurde. */
  bundleId: string | null;
  bundleTitle: string | null;
}

export interface CartDiscount {
  bundleId: string;
  bundleTitle: string;
  savingsCents: number;
  discountType: "percentage" | "fixed" | "per_item";
}

export interface Cart {
  items: CartItem[];
  /** Gesamtpreis ohne Rabatte in Cent. */
  subtotalOriginalCents: number;
  /** Gesamtpreis nach Rabatten in Cent. */
  subtotalCents: number;
  /** Gesamtersparnis in Cent. */
  totalSavingsCents: number;
  currencyCode: string;
  discounts: CartDiscount[];
  itemCount: number;
}

export interface AddToCartOptions {
  productId: string;
  variantId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  imageUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  effectivePriceCents: number;
  currency: string;
  bundleId?: string | null;
  bundleTitle?: string | null;
}

// ─── Persistenz ───────────────────────────────────────────────────────────────

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
  } catch {
    // localStorage nicht verfügbar (privater Modus etc.)
  }
}

// ─── Berechnungen ─────────────────────────────────────────────────────────────

export function computeCart(items: CartItem[]): Cart {
  const subtotalOriginalCents = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.effectivePriceCents * item.quantity,
    0
  );
  const totalSavingsCents = subtotalOriginalCents - subtotalCents;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Bundle-Rabatte zusammenfassen
  const bundleMap = new Map<string, CartDiscount>();
  for (const item of items) {
    if (!item.bundleId || item.effectivePriceCents >= item.unitPriceCents) continue;
    const saving = (item.unitPriceCents - item.effectivePriceCents) * item.quantity;
    const existing = bundleMap.get(item.bundleId);
    if (existing) {
      existing.savingsCents += saving;
    } else {
      bundleMap.set(item.bundleId, {
        bundleId: item.bundleId,
        bundleTitle: item.bundleTitle ?? "Bundle",
        savingsCents: saving,
        discountType: "per_item",
      });
    }
  }

  return {
    items,
    subtotalOriginalCents,
    subtotalCents,
    totalSavingsCents,
    currencyCode: items[0]?.currency ?? "EUR",
    discounts: Array.from(bundleMap.values()),
    itemCount,
  };
}

// ─── CartStore ────────────────────────────────────────────────────────────────

export const CartStore = {
  getItems(): CartItem[] {
    return loadCart();
  },

  getCart(): Cart {
    return computeCart(loadCart());
  },

  add(options: AddToCartOptions): void {
    const items = loadCart();
    const key = `${options.productId}:${options.variantId}`;

    const existing = items.find((i) => i.key === key);
    if (existing) {
      existing.quantity += options.quantity;
      // Bundle-Kontext aktualisieren wenn neu hinzugefügt via Bundle
      if (options.bundleId && !existing.bundleId) {
        existing.bundleId = options.bundleId;
        existing.bundleTitle = options.bundleTitle ?? null;
        existing.effectivePriceCents = options.effectivePriceCents;
      }
    } else {
      items.push({
        key,
        productId: options.productId,
        variantId: options.variantId,
        productSlug: options.productSlug,
        productName: options.productName,
        variantName: options.variantName,
        imageUrl: options.imageUrl,
        quantity: options.quantity,
        unitPriceCents: options.unitPriceCents,
        effectivePriceCents: options.effectivePriceCents,
        currency: options.currency,
        bundleId: options.bundleId ?? null,
        bundleTitle: options.bundleTitle ?? null,
      });
    }

    saveCart(items);
  },

  updateQuantity(key: string, quantity: number): void {
    const items = loadCart();
    const item = items.find((i) => i.key === key);
    if (item) {
      if (quantity <= 0) {
        this.remove(key);
        return;
      }
      item.quantity = quantity;
      saveCart(items);
    }
  },

  remove(key: string): void {
    const items = loadCart().filter((i) => i.key !== key);
    saveCart(items);
  },

  clear(): void {
    saveCart([]);
  },

  onUpdate(handler: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(CART_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handler);
  },
};

/**
 * Formatiert einen Cent-Betrag als Währungsstring (z.B. 12999 → "129,99 €").
 */
export function formatCartCurrency(cents: number, currency = "EUR", locale = "de-DE"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
