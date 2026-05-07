import { z } from "zod";
import { LocaleSchema, PaginationSchema } from "../catalog/query";

// ─── BlogStatus ───────────────────────────────────────────────────────────────

/** Spiegelt das Prisma BlogStatus-Enum wider, ohne davon abzuhängen. */
export const BlogStatusSchema = z.enum(["draft", "published", "archived"]);
export type BlogStatus = z.infer<typeof BlogStatusSchema>;

// ─── BlogPostQuery ────────────────────────────────────────────────────────────

/**
 * Query-Filter für öffentliche Blog-Listenabfragen.
 *
 * - locale:    Gewünschte Sprache. Fehlt eine Übersetzung → Fallback auf DE.
 * - category:  Kategorie-Slug zum Filtern.
 * - tag:       Tag-Slug zum Filtern.
 * - featured:  Nur hervorgehobene Beiträge liefern.
 *
 * limit ist auf 50 begrenzt (öffentliche API). Admin-seitig kein Schema nötig.
 */
export const BlogPostQuerySchema = PaginationSchema.extend({
  locale: LocaleSchema.default("de"),
  category: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  featured: z.coerce.boolean().optional(),
}).extend({
  // Öffentliche API: kleineres Default-Limit als Produkte
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export type BlogPostQuery = z.infer<typeof BlogPostQuerySchema>;
