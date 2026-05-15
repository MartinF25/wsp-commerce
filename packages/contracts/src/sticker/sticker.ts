import { z } from "zod";

// ─── Enum Schemas ─────────────────────────────────────────────────────────────

export const StickerStatusSchema = z.enum(["active", "inactive"]);
export type StickerStatus = z.infer<typeof StickerStatusSchema>;

export const StickerTypeSchema = z.enum([
  "image",
  "text",
  "css_badge",
  "tooltip",
  "combined",
]);
export type StickerType = z.infer<typeof StickerTypeSchema>;

export const StickerPositionSchema = z.enum([
  "top_left",
  "top_right",
  "bottom_left",
  "bottom_right",
  "center",
  "custom",
]);
export type StickerPosition = z.infer<typeof StickerPositionSchema>;

export const StickerRuleTypeSchema = z.enum([
  "all_products",
  "category",
  "price_range",
  "availability",
  "new_arrival",
]);
export type StickerRuleType = z.infer<typeof StickerRuleTypeSchema>;

// ─── StickerDisplay – öffentlicher Contract für Storefront ────────────────────

/**
 * Fertig aufgelöster Sticker, der dem Storefront übergeben wird.
 * Enthält alle Render-Daten für die UI-Komponenten.
 * Alle locale-spezifischen Texte sind bereits aufgelöst (text/tooltip).
 */
export const StickerDisplaySchema = z.object({
  id: z.string().uuid(),
  type: StickerTypeSchema,
  position: StickerPositionSchema,
  position_x: z.number().int().nullable(),
  position_y: z.number().int().nullable(),
  priority: z.number().int(),

  /** Größe je Seitenkontext: { homepage, listing, detail, search } */
  size_config: z.record(z.string()),

  // Image
  image_url: z.string().nullable(),

  // Text / CSS
  text: z.string().nullable(),
  text_color: z.string().nullable(),
  bg_color: z.string().nullable(),
  border_color: z.string().nullable(),
  font_size: z.string().nullable(),
  font_bold: z.boolean(),
  font_italic: z.boolean(),
  border_radius: z.string().nullable(),
  padding: z.string().nullable(),
  /** CSS opacity 0.00–1.00 */
  opacity: z.number().nullable(),
  css_class: z.string().nullable(),
  custom_css: z.string().nullable(),

  // Link
  link_url: z.string().nullable(),

  // Tooltip
  tooltip: z.string().nullable(),
  tooltip_link_label: z.string().nullable(),
  tooltip_link_url: z.string().nullable(),
});
export type StickerDisplay = z.infer<typeof StickerDisplaySchema>;

// ─── StickerRule – öffentliche Darstellung einer Regelkonfiguration ───────────

export const StickerRuleSchema = z.object({
  id: z.string().uuid(),
  rule_type: StickerRuleTypeSchema,
  category_id: z.string().nullable(),
  price_min_cents: z.number().int().nullable(),
  price_max_cents: z.number().int().nullable(),
  availability_status: z.string().nullable(),
  new_arrival_days: z.number().int().nullable(),
});
export type StickerRule = z.infer<typeof StickerRuleSchema>;

// ─── StickerTranslationInput – Admin-Input für eine Sprachversion ─────────────

export const StickerTranslationInputSchema = z.object({
  locale: z.enum(["de", "en", "es"]),
  text: z.string().max(100).optional(),
  tooltip: z.string().max(500).optional(),
  tooltip_link_label: z.string().max(100).optional(),
  tooltip_link_url: z.string().max(500).optional(),
  link_url: z.string().max(500).optional(),
});
export type StickerTranslationInput = z.infer<typeof StickerTranslationInputSchema>;

// ─── StickerRuleInput – Admin-Input für eine Regel ───────────────────────────

export const StickerRuleInputSchema = z.object({
  rule_type: StickerRuleTypeSchema,
  category_id: z.string().uuid().optional(),
  price_min_cents: z.number().int().nonnegative().optional(),
  price_max_cents: z.number().int().nonnegative().optional(),
  availability_status: z.string().optional(),
  new_arrival_days: z.number().int().positive().optional(),
});
export type StickerRuleInput = z.infer<typeof StickerRuleInputSchema>;

// ─── StickerCreateInput ───────────────────────────────────────────────────────

export const StickerCreateInputSchema = z.object({
  name: z.string().min(1).max(120),
  status: StickerStatusSchema.default("inactive"),
  priority: z.number().int().default(0),
  sort_order: z.number().int().default(0),
  type: StickerTypeSchema.default("text"),

  image_url: z.string().max(500).optional(),

  text_color: z.string().max(20).optional(),
  bg_color: z.string().max(20).optional(),
  border_color: z.string().max(20).optional(),
  font_size: z.string().max(20).optional(),
  font_bold: z.boolean().default(false),
  font_italic: z.boolean().default(false),
  border_radius: z.string().max(40).optional(),
  padding: z.string().max(40).optional(),
  opacity: z.number().min(0).max(1).optional(),
  css_class: z.string().max(200).optional(),
  custom_css: z.string().max(2000).optional(),

  link_url: z.string().max(500).optional(),

  position: StickerPositionSchema.default("top_left"),
  position_x: z.number().int().optional(),
  position_y: z.number().int().optional(),

  size_config: z.record(z.string()).default({}),

  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional(),

  store_id: z.string().optional(),
  customer_groups: z.array(z.string()).optional(),

  max_per_product: z.number().int().nonnegative().default(3),
  allow_override: z.boolean().default(true),

  translations: z.array(StickerTranslationInputSchema).min(1),
  rules: z.array(StickerRuleInputSchema).default([]),
});
export type StickerCreateInput = z.infer<typeof StickerCreateInputSchema>;

// ─── StickerUpdateInput ───────────────────────────────────────────────────────

export const StickerUpdateInputSchema = StickerCreateInputSchema.partial().extend({
  translations: z.array(StickerTranslationInputSchema).optional(),
  rules: z.array(StickerRuleInputSchema).optional(),
});
export type StickerUpdateInput = z.infer<typeof StickerUpdateInputSchema>;

// ─── StickerStatusUpdateSchema ────────────────────────────────────────────────

export const StickerStatusUpdateSchema = z.object({
  status: StickerStatusSchema,
});

// ─── StickerProductOverrideInput ──────────────────────────────────────────────

export const StickerProductOverrideInputSchema = z.object({
  product_id: z.string().uuid(),
  enabled: z.boolean().default(true),
  excluded: z.boolean().default(false),
});
export type StickerProductOverrideInput = z.infer<typeof StickerProductOverrideInputSchema>;

// ─── StickerAdmin – vollständiger Admin-Contract ──────────────────────────────

/**
 * Vollständige Sticker-Darstellung für Admin-Ansichten.
 * Enthält alle Felder inkl. Regeln, Übersetzungen und Overrides.
 */
export const StickerAdminSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: StickerStatusSchema,
  priority: z.number().int(),
  sort_order: z.number().int(),
  type: StickerTypeSchema,
  image_url: z.string().nullable(),
  text_color: z.string().nullable(),
  bg_color: z.string().nullable(),
  border_color: z.string().nullable(),
  font_size: z.string().nullable(),
  font_bold: z.boolean(),
  font_italic: z.boolean(),
  border_radius: z.string().nullable(),
  padding: z.string().nullable(),
  opacity: z.number().nullable(),
  css_class: z.string().nullable(),
  custom_css: z.string().nullable(),
  link_url: z.string().nullable(),
  position: StickerPositionSchema,
  position_x: z.number().int().nullable(),
  position_y: z.number().int().nullable(),
  size_config: z.record(z.string()),
  valid_from: z.string().datetime().nullable(),
  valid_until: z.string().datetime().nullable(),
  store_id: z.string().nullable(),
  customer_groups: z.array(z.string()).nullable(),
  max_per_product: z.number().int(),
  allow_override: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  translations: z.array(
    z.object({
      id: z.string().uuid(),
      locale: z.enum(["de", "en", "es"]),
      text: z.string().nullable(),
      tooltip: z.string().nullable(),
      tooltip_link_label: z.string().nullable(),
      tooltip_link_url: z.string().nullable(),
      link_url: z.string().nullable(),
    })
  ),
  rules: z.array(StickerRuleSchema),
  override_count: z.number().int(),
});
export type StickerAdmin = z.infer<typeof StickerAdminSchema>;
