import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * Unterstützte Inhaltssprachen. DE ist Pflicht (Source of Truth).
 * Fehlende Übersetzungen fallen auf DE zurück (Service-Layer).
 */
export const LocaleSchema = z.enum(["de", "en", "es"]);
export type Locale = z.infer<typeof LocaleSchema>;

/**
 * Produkttyp-Enum – spiegelt das Prisma-Schema wider, ohne davon abzuhängen.
 * Steuert Kauf- vs. Anfragelogik in allen Schichten (API, Storefront, Admin).
 */
export const ProductTypeSchema = z.enum([
  "direct_purchase",
  "configurable",
  "inquiry_only",
]);
export type ProductType = z.infer<typeof ProductTypeSchema>;

export const ProductStatusSchema = z.enum(["draft", "active", "archived"]);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

// ─── Sortierung ───────────────────────────────────────────────────────────────

/**
 * Verfügbare Sortieroptionen für Produktlisten.
 *
 * newest / oldest    → nach Einstelldatum (Standard: newest)
 * name_asc/desc      → alphabetisch – sinnvoll für Kategorienseiten
 * price_asc/desc     → nach geringstem Variantenpreis (nulls last/first)
 *                      Nur aussagekräftig wenn Produkte Varianten mit Preisen haben.
 *                      inquiry_only-Produkte ohne Richtpreis wandern ans Ende (price_asc)
 *                      bzw. an den Anfang (price_desc).
 *
 * Bewusst nicht enthalten (spätere Tasks):
 *   - relevance (Volltextsuche)
 *   - popularity / sales_count (erfordert Order-Daten)
 *   - rating (kein Review-System in Phase 2)
 */
export const SortBySchema = z
  .enum([
    "newest",     // created_at DESC – Standardsortierung
    "oldest",     // created_at ASC
    "name_asc",   // name ASC  (A → Z)
    "name_desc",  // name DESC (Z → A)
    "price_asc",  // min(variant.price_cents) ASC  – günstigste zuerst
    "price_desc", // min(variant.price_cents) DESC – teuerste zuerst
  ])
  .default("newest");
export type SortBy = z.infer<typeof SortBySchema>;

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type Pagination = z.infer<typeof PaginationSchema>;

// ─── Catalog Filter ───────────────────────────────────────────────────────────

/**
 * Eingabe-Filter für Katalogabfragen.
 *
 * `purchasable` ist eine Domain-Abstraktion:
 *   true  → direct_purchase + configurable (Warenkorb möglich)
 *   false → inquiry_only (nur Lead-Formular)
 *   unset → alle Typen
 *
 * `purchasable` hat Vorrang vor `type`, wenn beide gesetzt sind.
 *
 * `status` wird in der öffentlichen API von der Route auf "active" fixiert.
 * Im Admin-Kontext kann status frei gewählt werden.
 */
export const CatalogFilterSchema = z.object({
  type: ProductTypeSchema.optional(),
  category: z.string().min(1).optional(), // category slug
  status: ProductStatusSchema.optional(),
  purchasable: z.coerce.boolean().optional(),
  locale: LocaleSchema.default("de"),
});
export type CatalogFilter = z.infer<typeof CatalogFilterSchema>;

/**
 * Vollständiger Query-Input: Filter + Sortierung + Pagination.
 * Wird von API-Routen validiert und 1:1 an den Service weitergegeben.
 */
export const ProductQuerySchema = CatalogFilterSchema.merge(PaginationSchema).extend({
  sortBy: SortBySchema,
});
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
