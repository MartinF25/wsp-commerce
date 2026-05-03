import { z } from "zod";
import { ProductTypeSchema } from "./query";

// ─── SaleStatus ───────────────────────────────────────────────────────────────

/** Abgeleitet – nie gespeichert. Berechnung: computeSaleStatus() im Commerce-Service. */
export const SaleStatusSchema = z.enum([
  "active",    // Angebotspreis gilt jetzt
  "scheduled", // Angebot beginnt in der Zukunft
  "expired",   // Angebot ist abgelaufen
  "inactive",  // kein sale_price_cents gesetzt
]);
export type SaleStatus = z.infer<typeof SaleStatusSchema>;

// ─── Variant ──────────────────────────────────────────────────────────────────

/**
 * Eine einzelne Produktvariante im öffentlichen Contract.
 * price_cents ist nullable – bei inquiry_only kann ein Richtpreis fehlen.
 * attributes ist ein offenes Record – Validierung der Inhalte obliegt dem Aufrufer.
 */
export const VariantSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  price_cents: z.number().int().nullable(),
  currency: z.string().length(3), // ISO 4217
  stock_quantity: z.number().int().nonnegative(),
  attributes: z.record(z.unknown()),
  weight_kg: z.number().nonnegative().nullable(),
  dimensions: z.record(z.unknown()).nullable(),
  sale_price_cents: z.number().int().nullable(),
  sale_status: SaleStatusSchema,
});
export type Variant = z.infer<typeof VariantSchema>;

// ─── PriceDisplay ─────────────────────────────────────────────────────────────

/**
 * Vorberechnete Preisanzeige für UI-Rendering.
 * displayText ist fertig formatiert (z. B. "ab €1.299,00" oder "Preis auf Anfrage").
 * Alle Preislogik lebt im Commerce-Service, nicht in der UI.
 */
export const PriceDisplaySchema = z.object({
  minCents: z.number().int().optional(),
  maxCents: z.number().int().optional(),
  currencyCode: z.string().length(3),
  displayText: z.string(),
  // Offer/Sale fields – abgeleitet, nie gespeichert
  isOnSale: z.boolean(),
  showCountdown: z.boolean(),
  salePriceCents: z.number().int().optional(),
  originalPriceCents: z.number().int().optional(),
  saleLabel: z.string().optional(),
  /** ISO-String – nur gesetzt wenn showCountdown true und sale_ends_at vorhanden. */
  saleEndsAt: z.string().datetime().optional(),
});
export type PriceDisplay = z.infer<typeof PriceDisplaySchema>;

// ─── ProductImage ─────────────────────────────────────────────────────────────

export const ProductImageSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  alt: z.string().nullable(),
  sort_order: z.number().int(),
});
export type ProductImage = z.infer<typeof ProductImageSchema>;

// ─── ProductDocument ──────────────────────────────────────────────────────────

export const ProductDocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string(),
  type: z.string(), // datasheet | manual | certificate | other
  sort_order: z.number().int(),
});
export type ProductDocument = z.infer<typeof ProductDocumentSchema>;

// ─── ProductSummary – Listenansicht ──────────────────────────────────────────

/**
 * Kompakte Produktdarstellung für Listenansichten, Kacheln und Suchergebnisse.
 *
 * - Kein description (zu lang für Listen)
 * - Kein variants-Array (nur priceDisplay für die Preisanzeige)
 * - purchasable als abgeleitetes Boolean (keine Enum-Kenntnis nötig)
 * - coverImageUrl: erstes Bild aus images[], null wenn keine Bilder
 */
export const ProductSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  short_description: z.string().nullable(),
  product_type: ProductTypeSchema,
  purchasable: z.boolean(),
  category: z
    .object({
      slug: z.string(),
      name: z.string(),
    })
    .nullable(),
  priceDisplay: PriceDisplaySchema,
  coverImageUrl: z.string().nullable(),
  coverImageAlt: z.string().nullable(),
});
export type ProductSummary = z.infer<typeof ProductSummarySchema>;

// ─── ProductDetail – Detailseite ─────────────────────────────────────────────

/**
 * Vollständige Produktdarstellung für Detailseiten.
 *
 * Enthält description, alle Varianten und alle Bilder.
 * product_type + purchasable ermöglichen dem Storefront zu entscheiden:
 *   purchasable=true  → Variantenauswahl + Warenkorb-Button
 *   purchasable=false → Lead-Formular-Button ("Beratung anfragen")
 */
export const ProductDetailSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  short_description: z.string().nullable(),
  description: z.string().nullable(),
  delivery_note: z.string().nullable(),
  features: z.array(z.string()),
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  mounting_note: z.string().nullable(),
  project_note: z.string().nullable(),
  product_type: ProductTypeSchema,
  purchasable: z.boolean(),
  paypal_url: z.string().nullable(),
  stripe_url: z.string().nullable(),
  category: z
    .object({
      id: z.string().uuid(),
      slug: z.string(),
      name: z.string(),
    })
    .nullable(),
  variants: z.array(VariantSchema),
  images: z.array(ProductImageSchema),
  documents: z.array(ProductDocumentSchema),
  priceDisplay: PriceDisplaySchema,
});
export type ProductDetail = z.infer<typeof ProductDetailSchema>;

// ─── Paginiertes Listenergebnis ───────────────────────────────────────────────

/**
 * Wrapper für paginierte Produktlisten.
 * total ist die Gesamtanzahl ohne Pagination (für UI-Pagination-Controls).
 */
export const ProductListResultSchema = z.object({
  items: z.array(ProductSummarySchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type ProductListResult = z.infer<typeof ProductListResultSchema>;
