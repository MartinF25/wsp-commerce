import { z } from "zod";
import { ProductSummarySchema, VariantSchema } from "../catalog/product";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const BundleStatusSchema = z.enum(["active", "inactive"]);
export type BundleStatus = z.infer<typeof BundleStatusSchema>;

export const BundleDiscountTypeSchema = z.enum(["none", "percentage", "fixed", "per_item"]);
export type BundleDiscountType = z.infer<typeof BundleDiscountTypeSchema>;

export const BundleDiscountModeSchema = z.enum(["all_items", "min_count", "any_item"]);
export type BundleDiscountMode = z.infer<typeof BundleDiscountModeSchema>;

export const BundleDisplayModeSchema = z.enum(["card", "list", "slider", "tabs"]);
export type BundleDisplayMode = z.infer<typeof BundleDisplayModeSchema>;

// ─── BundleItem ───────────────────────────────────────────────────────────────

/**
 * Ein Produkt innerhalb eines Bundles mit Rabatt- und Pflicht-Informationen.
 * product enthält die vollständige ProductSummary inkl. Varianten-Preisinformationen.
 */
export const BundleItemSchema = z.object({
  id: z.string().uuid(),
  product: ProductSummarySchema.extend({
    variants: z.array(VariantSchema).optional(),
  }),
  quantity: z.number().int().positive(),
  is_required: z.boolean(),
  sort_order: z.number().int(),
  /** Individueller Produkt-Rabatt in Prozent (überschreibt Bundle-Rabatt). */
  discount_percent: z.number().nonnegative().nullable(),
  /** Individueller Produkt-Rabatt als fester Betrag in Cent. */
  discount_cents: z.number().int().nonnegative().nullable(),
});
export type BundleItem = z.infer<typeof BundleItemSchema>;

// ─── BundlePriceInfo ──────────────────────────────────────────────────────────

/**
 * Vorberechnete Preisanzeige für ein Bundle.
 * Alle Berechnungen erfolgen im Commerce-Service, nicht in der UI.
 */
export const BundlePriceInfoSchema = z.object({
  /** Gesamtpreis aller Bundle-Produkte in Cent (ohne Rabatt). */
  originalTotalCents: z.number().int().nonnegative(),
  /** Bundle-Preis nach Rabatt in Cent. */
  discountedTotalCents: z.number().int().nonnegative(),
  /** Ersparnis in Cent. */
  savingsCents: z.number().int().nonnegative(),
  /** Ersparnis in Prozent (0–100), gerundet auf 1 Dezimalstelle. */
  savingsPercent: z.number().nonnegative(),
  currencyCode: z.string().length(3),
  /** true wenn ein aktiver Rabatt gilt. */
  hasDiscount: z.boolean(),
  /** true wenn der Rabatt zeitlich begrenzt und noch aktiv ist. */
  isTimeLimitedDiscount: z.boolean(),
  discountEndsAt: z.string().datetime().nullable(),
});
export type BundlePriceInfo = z.infer<typeof BundlePriceInfoSchema>;

// ─── Bundle ───────────────────────────────────────────────────────────────────

/**
 * Öffentlicher Bundle-Contract für das Storefront.
 * Enthält alle Items mit ProductSummary, Rabattinformationen und lokalisierte Texte.
 */
export const BundleSchema = z.object({
  id: z.string().uuid(),
  status: BundleStatusSchema,
  title: z.string(),
  description: z.string().nullable(),
  /** Label für Tab-Darstellung, z.B. "Zubehör" oder "Häufig zusammen gekauft". */
  tab_name: z.string().nullable(),
  image_url: z.string().nullable(),
  valid_from: z.string().datetime().nullable(),
  valid_until: z.string().datetime().nullable(),
  discount_type: BundleDiscountTypeSchema,
  discount_percent: z.number().nonnegative().nullable(),
  discount_cents: z.number().int().nonnegative().nullable(),
  discount_mode: BundleDiscountModeSchema,
  min_items_for_discount: z.number().int().positive(),
  display_mode: BundleDisplayModeSchema,
  tab_group: z.string().nullable(),
  sort_order: z.number().int(),
  items: z.array(BundleItemSchema),
  /** Vorberechnete Preisinformationen. null wenn keine kaufbaren Produkte im Bundle. */
  priceInfo: BundlePriceInfoSchema.nullable(),
});
export type Bundle = z.infer<typeof BundleSchema>;

// ─── Admin-Input-Schemas ──────────────────────────────────────────────────────

export const BundleCreateInputSchema = z.object({
  status: BundleStatusSchema.optional().default("inactive"),
  sort_order: z.number().int().optional().default(0),
  image_url: z.string().url().nullable().optional(),
  valid_from: z.string().datetime().nullable().optional(),
  valid_until: z.string().datetime().nullable().optional(),
  store_id: z.string().nullable().optional(),
  discount_type: BundleDiscountTypeSchema.optional().default("none"),
  discount_percent: z.number().min(0).max(100).nullable().optional(),
  discount_cents: z.number().int().nonnegative().nullable().optional(),
  discount_mode: BundleDiscountModeSchema.optional().default("all_items"),
  min_items_for_discount: z.number().int().positive().optional().default(1),
  valid_from_discount: z.string().datetime().nullable().optional(),
  valid_until_discount: z.string().datetime().nullable().optional(),
  display_mode: BundleDisplayModeSchema.optional().default("card"),
  tab_group: z.string().nullable().optional(),
  /** DE-Pflichtübersetzung + optionale weitere Locales. */
  translations: z.array(
    z.object({
      locale: z.enum(["de", "en", "es"]),
      title: z.string().min(1),
      description: z.string().nullable().optional(),
      tab_name: z.string().nullable().optional(),
    })
  ).min(1),
});
export type BundleCreateInput = z.infer<typeof BundleCreateInputSchema>;

export const BundleUpdateInputSchema = BundleCreateInputSchema.partial();
export type BundleUpdateInput = z.infer<typeof BundleUpdateInputSchema>;

export const BundleItemInputSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().optional().default(1),
  is_required: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
  discount_percent: z.number().min(0).max(100).nullable().optional(),
  discount_cents: z.number().int().nonnegative().nullable().optional(),
});
export type BundleItemInput = z.infer<typeof BundleItemInputSchema>;

export const BundleItemUpdateInputSchema = BundleItemInputSchema.omit({ product_id: true }).partial();
export type BundleItemUpdateInput = z.infer<typeof BundleItemUpdateInputSchema>;

export const BundleStatusUpdateSchema = z.object({
  status: BundleStatusSchema,
});
export type BundleStatusUpdate = z.infer<typeof BundleStatusUpdateSchema>;

export const BundleAssignmentInputSchema = z.object({
  product_ids: z.array(z.string().uuid()).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
});
export type BundleAssignmentInput = z.infer<typeof BundleAssignmentInputSchema>;
