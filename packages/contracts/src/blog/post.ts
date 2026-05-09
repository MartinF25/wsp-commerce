import { z } from "zod";
import { LocaleSchema } from "../catalog/query";
import { BlogStatusSchema } from "./query";

// ─── BlogTagSummary ───────────────────────────────────────────────────────────

export const BlogTagSummarySchema = z.object({
  slug: z.string(),
  name: z.string(),
});
export type BlogTagSummary = z.infer<typeof BlogTagSummarySchema>;

// ─── BlogCategorySummary ──────────────────────────────────────────────────────

/**
 * Kompakte Kategorie-Darstellung für Filter, Breadcrumbs und Blogleisten.
 * postCount ist voraggregiert (nur published Beiträge).
 * name ist bereits auf die angefragte Locale aufgelöst.
 */
export const BlogCategorySummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  postCount: z.number().int().nonnegative(),
});
export type BlogCategorySummary = z.infer<typeof BlogCategorySummarySchema>;

// ─── BlogPostSummary – Listenansicht ─────────────────────────────────────────

/**
 * Kompakte Blogbeitrag-Darstellung für Übersichtsseiten und Kacheln.
 *
 * - Kein content (zu lang für Listen)
 * - Kein SEO-Felder (nur für Detailseite relevant)
 * - locale: tatsächlich gelieferte Sprache (kann von der angefragten abweichen)
 * - fallbackUsed: true wenn EN/ES fehlte und auf DE zurückgefallen wurde
 * - availableLocales: vorhandene Sprachversionen (für Sitemap-hreflang und Locale-Switcher)
 */
export const BlogPostSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  status: BlogStatusSchema,
  coverImageUrl: z.string().nullable(),
  coverImageAlt: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
  readingTimeMinutes: z.number().int().positive().nullable(),
  featured: z.boolean(),
  authorName: z.string().nullable(),
  // Aufgelöste Locale-Metadaten
  locale: LocaleSchema,
  fallbackUsed: z.boolean(),
  // Aufgelöste Translation-Felder
  title: z.string(),
  excerpt: z.string(),
  // Relationen
  category: BlogCategorySummarySchema.pick({ id: true, slug: true, name: true }).nullable(),
  tags: z.array(BlogTagSummarySchema),
  // Verfügbare Sprachversionen
  availableLocales: z.array(LocaleSchema),
});
export type BlogPostSummary = z.infer<typeof BlogPostSummarySchema>;

// ─── BlogPostDetail – Detailseite ─────────────────────────────────────────────

/**
 * Vollständige Blogbeitrag-Darstellung für Detailseiten.
 *
 * Erweitert BlogPostSummary um:
 * - content:          Markdown-Text des Beitrags
 * - SEO-Felder:       metaTitle, metaDescription, ogTitle, ogDescription
 * - availableLocales: Welche Sprachversionen existieren (für hreflang-Tags)
 *
 * availableLocales steuert hreflang:
 *   - Nur Locales mit vorhandener Translation werden ausgegeben.
 *   - Verhindert Duplicate-Content-Probleme bei fehlenden EN/ES-Versionen.
 */
export const BlogPostDetailSchema = BlogPostSummarySchema.extend({
  content: z.string(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  ogTitle: z.string().nullable(),
  ogDescription: z.string().nullable(),
  availableLocales: z.array(LocaleSchema),
});
export type BlogPostDetail = z.infer<typeof BlogPostDetailSchema>;

// ─── BlogPostListResult ───────────────────────────────────────────────────────

/**
 * Wrapper für paginierte Blog-Listenabfragen.
 * total ist Gesamtanzahl ohne Pagination (für UI-Pagination-Controls).
 */
export const BlogPostListResultSchema = z.object({
  items: z.array(BlogPostSummarySchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type BlogPostListResult = z.infer<typeof BlogPostListResultSchema>;
