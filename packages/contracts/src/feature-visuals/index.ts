/**
 * Feature Visual Engine – öffentliche Contracts
 *
 * Typen, Zod-Schemas und Hilfsfunktionen für den gesamten Feature-Visual-Stack.
 * Verwendet von: Commerce API, Storefront, Admin.
 *
 * Prioritätsregel: product > category > global, dann priority DESC.
 */

import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const FeatureMatchTypeSchema = z.enum([
  "exact",
  "contains",
  "starts",
  "ends",
  "regex",
]);
export type FeatureMatchType = z.infer<typeof FeatureMatchTypeSchema>;

export const FeatureVisualScopeSchema = z.enum([
  "global",
  "category",
  "product",
]);
export type FeatureVisualScope = z.infer<typeof FeatureVisualScopeSchema>;

export const FeatureDisplayModeSchema = z.enum([
  "icon_value",
  "icon_name_value",
  "grouped",
  "compact",
  "tooltip_only",
  "grid",
  "horizontal",
  "vertical",
]);
export type FeatureDisplayMode = z.infer<typeof FeatureDisplayModeSchema>;

// ─── LocalizedText ────────────────────────────────────────────────────────────

/** Mehrsprachige Texte. Fallback: de → en → es → leerer String. */
export const LocalizedTextSchema = z.object({
  de: z.string().optional(),
  en: z.string().optional(),
  es: z.string().optional(),
});
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

/** Wählt den besten Text für ein Locale aus (mit Fallback-Kette). */
export function resolveLocalized(
  texts: LocalizedText | null | undefined,
  locale: string,
): string {
  if (!texts) return "";
  const chain = [locale, "de", "en", "es"] as const;
  for (const l of chain) {
    const v = texts[l as keyof LocalizedText];
    if (v) return v;
  }
  return "";
}

// ─── FeatureDefinition ────────────────────────────────────────────────────────

export const FeatureDefinitionSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  names: LocalizedTextSchema,
  descriptions: LocalizedTextSchema.nullable(),
  match_pattern: z.string().nullable(),
  match_type: FeatureMatchTypeSchema,
  category_id: z.string().uuid().nullable(),
  sort_order: z.number().int(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type FeatureDefinition = z.infer<typeof FeatureDefinitionSchema>;

export const CreateFeatureDefinitionSchema = z.object({
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-_]+$/, "Nur Kleinbuchstaben, Zahlen, - und _"),
  names: LocalizedTextSchema,
  descriptions: LocalizedTextSchema.optional(),
  match_pattern: z.string().max(512).optional(),
  match_type: FeatureMatchTypeSchema.default("contains"),
  category_id: z.string().uuid().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});
export type CreateFeatureDefinition = z.infer<typeof CreateFeatureDefinitionSchema>;

export const UpdateFeatureDefinitionSchema = CreateFeatureDefinitionSchema.partial();
export type UpdateFeatureDefinition = z.infer<typeof UpdateFeatureDefinitionSchema>;

// ─── FeatureVisual ────────────────────────────────────────────────────────────

export const FeatureVisualSchema = z.object({
  id: z.string().uuid(),
  feature_definition_id: z.string().uuid().nullable(),
  feature_value: z.string().nullable(),
  scope: FeatureVisualScopeSchema,
  category_id: z.string().uuid().nullable(),
  product_id: z.string().uuid().nullable(),

  // Assets
  image_url: z.string().url().nullable(),
  svg_content: z.string().nullable(),
  image_width: z.number().int().positive().nullable(),
  image_height: z.number().int().positive().nullable(),

  // Multilingual meta
  alt_texts: LocalizedTextSchema.nullable(),
  labels: LocalizedTextSchema.nullable(),
  tooltips: LocalizedTextSchema.nullable(),

  // Link
  link_url: z.string().url().nullable(),
  link_target: z.string().nullable(),
  link_rel: z.string().nullable(),

  // Styling
  color_primary: z.string().nullable(),
  color_secondary: z.string().nullable(),
  css_class: z.string().nullable(),

  // Meta
  priority: z.number().int(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type FeatureVisual = z.infer<typeof FeatureVisualSchema>;

export const CreateFeatureVisualSchema = z.object({
  feature_definition_id: z.string().uuid().optional(),
  feature_value: z.string().max(256).optional(),
  scope: FeatureVisualScopeSchema.default("global"),
  category_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),

  image_url: z.string().url().optional(),
  svg_content: z.string().optional(),
  image_width: z.number().int().positive().optional(),
  image_height: z.number().int().positive().optional(),

  alt_texts: LocalizedTextSchema.optional(),
  labels: LocalizedTextSchema.optional(),
  tooltips: LocalizedTextSchema.optional(),

  link_url: z.string().url().optional(),
  link_target: z.enum(["_self", "_blank"]).default("_self"),
  link_rel: z.string().max(128).optional(),

  color_primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  color_secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  css_class: z.string().max(256).optional(),

  priority: z.number().int().default(0),
  is_active: z.boolean().default(true),
});
export type CreateFeatureVisual = z.infer<typeof CreateFeatureVisualSchema>;

export const UpdateFeatureVisualSchema = CreateFeatureVisualSchema.partial();
export type UpdateFeatureVisual = z.infer<typeof UpdateFeatureVisualSchema>;

// ─── FeatureVisualSettings ────────────────────────────────────────────────────

export const ResponsiveBreakpointConfigSchema = z.object({
  columns: z.number().int().min(1).max(6).optional(),
  gap: z.enum(["xs", "sm", "md", "lg", "xl"]).optional(),
  iconSize: z.enum(["xs", "sm", "md", "lg", "xl", "2xl"]).optional(),
  showLabels: z.boolean().optional(),
  showTooltips: z.boolean().optional(),
});
export type ResponsiveBreakpointConfig = z.infer<typeof ResponsiveBreakpointConfigSchema>;

export const ResponsiveConfigSchema = z.object({
  desktop: ResponsiveBreakpointConfigSchema.optional(),
  tablet: ResponsiveBreakpointConfigSchema.optional(),
  mobile: ResponsiveBreakpointConfigSchema.optional(),
});
export type ResponsiveConfig = z.infer<typeof ResponsiveConfigSchema>;

export const FeatureVisualSettingsSchema = z.object({
  id: z.literal("singleton"),

  // Locations
  enable_product_page: z.boolean(),
  enable_quick_view: z.boolean(),
  enable_miniature: z.boolean(),
  enable_faceted_search: z.boolean(),
  enable_collection: z.boolean(),
  enable_search_results: z.boolean(),

  // Defaults
  default_display_mode: FeatureDisplayModeSchema,
  default_icon_size: z.string(),
  show_labels: z.boolean(),
  show_tooltips: z.boolean(),
  enable_animations: z.boolean(),

  responsive_config: ResponsiveConfigSchema.nullable(),

  // Product page
  product_page_mode: FeatureDisplayModeSchema,
  product_page_position: z.string(),
  product_page_columns: z.number().int(),

  // Miniature
  miniature_mode: FeatureDisplayModeSchema,
  miniature_max_icons: z.number().int(),
  miniature_position: z.string(),

  // Facets
  facet_show_icons: z.boolean(),
  facet_show_labels: z.boolean(),
  facet_collapsible: z.boolean(),
  facet_lazy_render: z.boolean(),

  // Typography
  font_size: z.string(),
  font_weight: z.string(),

  // Analytics
  track_interactions: z.boolean(),
  enable_ab_testing: z.boolean(),

  updated_at: z.string().datetime(),
});
export type FeatureVisualSettings = z.infer<typeof FeatureVisualSettingsSchema>;

export const UpdateFeatureVisualSettingsSchema = FeatureVisualSettingsSchema
  .omit({ id: true, updated_at: true })
  .partial();
export type UpdateFeatureVisualSettings = z.infer<typeof UpdateFeatureVisualSettingsSchema>;

// ─── Resolved / Render types ──────────────────────────────────────────────────

/**
 * Vollständig aufgelöster Feature-Visual für die UI-Renderebene.
 * Alle locale-abhängigen Texte sind bereits aufgelöst.
 * Erzeugt im Commerce Service Layer.
 */
export const ResolvedFeatureVisualSchema = z.object({
  id: z.string().uuid(),
  /** Aufgelöster Anzeigename (aus labels oder definition.names). */
  label: z.string(),
  /** Aufgelöster Tooltip-Text. Leer = kein Tooltip anzeigen. */
  tooltip: z.string(),
  /** Alt-Text für Barrierefreiheit. */
  altText: z.string(),

  // Assets (max. eines von beiden gesetzt)
  imageUrl: z.string().url().nullable(),
  svgContent: z.string().nullable(),
  imageWidth: z.number().int().nullable(),
  imageHeight: z.number().int().nullable(),

  // Link (null = kein Link)
  linkUrl: z.string().url().nullable(),
  linkTarget: z.string(),
  linkRel: z.string().nullable(),

  // Styling
  colorPrimary: z.string().nullable(),
  colorSecondary: z.string().nullable(),
  cssClass: z.string().nullable(),

  // Kontext – für Logging/Analytics
  scope: FeatureVisualScopeSchema,
  featureValue: z.string().nullable(),
  definitionSlug: z.string().nullable(),
});
export type ResolvedFeatureVisual = z.infer<typeof ResolvedFeatureVisualSchema>;

/**
 * Ein Feature-String mit optionalem aufgelösten Visual.
 * Wird für das Rendering auf Produktseiten verwendet.
 */
export const FeatureWithVisualSchema = z.object({
  /** Originaler Feature-String aus ProductTranslation.features. */
  raw: z.string(),
  /** Geparster Feature-Key, z.B. "Leistung" (vor dem ersten ":"). */
  key: z.string().nullable(),
  /** Geparster Feature-Wert, z.B. "400 W" (nach dem ersten ":"). */
  value: z.string().nullable(),
  /** Aufgelöstes Visual oder null wenn keins gefunden. */
  visual: ResolvedFeatureVisualSchema.nullable(),
});
export type FeatureWithVisual = z.infer<typeof FeatureWithVisualSchema>;

// ─── API Response Shapes ──────────────────────────────────────────────────────

export const FeatureVisualListResultSchema = z.object({
  items: z.array(FeatureVisualSchema),
  total: z.number().int(),
});
export type FeatureVisualListResult = z.infer<typeof FeatureVisualListResultSchema>;

export const FeatureDefinitionListResultSchema = z.object({
  items: z.array(FeatureDefinitionSchema),
  total: z.number().int(),
});
export type FeatureDefinitionListResult = z.infer<typeof FeatureDefinitionListResultSchema>;

// ─── Query Helpers ────────────────────────────────────────────────────────────

/**
 * Parst einen Feature-String in Key und Value.
 * "Leistung: 400 W" → { key: "Leistung", value: "400 W" }
 * "IP65 Schutzklasse" → { key: null, value: "IP65 Schutzklasse" }
 */
export function parseFeatureString(raw: string): { key: string | null; value: string | null } {
  const colonIdx = raw.indexOf(":");
  if (colonIdx > 0 && colonIdx < raw.length - 1) {
    return {
      key: raw.slice(0, colonIdx).trim(),
      value: raw.slice(colonIdx + 1).trim(),
    };
  }
  return { key: null, value: raw.trim() };
}

/**
 * Prüft ob ein Feature-String einem FeatureDefinition-Pattern entspricht.
 */
export function matchesDefinition(
  raw: string,
  pattern: string,
  matchType: FeatureMatchType,
): boolean {
  const haystack = raw.toLowerCase();
  const needle = pattern.toLowerCase();
  switch (matchType) {
    case "exact":    return haystack === needle;
    case "contains": return haystack.includes(needle);
    case "starts":   return haystack.startsWith(needle);
    case "ends":     return haystack.endsWith(needle);
    case "regex": {
      try {
        return new RegExp(pattern, "i").test(raw);
      } catch {
        return false;
      }
    }
  }
}

/** Tailwind icon-size Klassen für verschiedene Größen. */
export const ICON_SIZE_CLASSES: Record<string, string> = {
  xs:  "w-4 h-4",
  sm:  "w-5 h-5",
  md:  "w-6 h-6",
  lg:  "w-8 h-8",
  xl:  "w-10 h-10",
  "2xl": "w-12 h-12",
};

/** Tailwind gap-Klassen. */
export const GAP_CLASSES: Record<string, string> = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
};
