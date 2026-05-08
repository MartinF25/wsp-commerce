import { z } from "zod";
import { LocaleSchema } from "../catalog/query";
import { BlogStatusSchema } from "./query";

// ─── BlogPostTranslationInput ─────────────────────────────────────────────────

/**
 * Admin-Input für eine einzelne Sprachversion eines Blogbeitrags.
 *
 * Zeichenlimits für SEO-Felder orientieren sich an Google-Empfehlungen:
 *   metaTitle       ≤ 70 Zeichen
 *   metaDescription ≤ 160 Zeichen
 *   ogTitle         ≤ 70 Zeichen
 *   ogDescription   ≤ 200 Zeichen
 */
export const BlogPostTranslationInputSchema = z.object({
  locale: LocaleSchema,
  title: z.string().min(1, "Titel ist Pflichtfeld").max(200),
  excerpt: z.string().min(1, "Auszug ist Pflichtfeld").max(500),
  content: z.string().min(1, "Inhalt ist Pflichtfeld"),
  metaTitle: z.string().max(70).nullish(),
  metaDescription: z.string().max(160).nullish(),
  ogTitle: z.string().max(70).nullish(),
  ogDescription: z.string().max(200).nullish(),
});
export type BlogPostTranslationInput = z.infer<typeof BlogPostTranslationInputSchema>;

// ─── BlogPostInput ────────────────────────────────────────────────────────────

/**
 * Admin-Input für das Anlegen oder vollständige Aktualisieren eines Blogbeitrags.
 *
 * Validierungsregeln:
 * - slug:         Nur Kleinbuchstaben, Ziffern und Bindestriche (URL-safe).
 * - translations: Mindestens eine Translation, DE ist Pflicht.
 * - tagIds:       UUIDs der bestehenden BlogTag-Einträge.
 * - publishedAt:  ISO-8601-Datetime-String. Wird beim Setzen auf "published"
 *                 vom Service automatisch auf now() gesetzt wenn null.
 */
export const BlogPostInputSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten"),
  status: BlogStatusSchema.default("draft"),
  coverImageUrl: z.string().url("Ungültige URL").nullish(),
  coverImageAlt: z.string().max(200).nullish(),
  publishedAt: z.string().datetime().nullish(),
  readingTimeMinutes: z.number().int().min(1).max(60).nullish(),
  featured: z.boolean().default(false),
  categoryId: z.string().uuid().nullish(),
  authorName: z.string().max(100).nullish(),
  tagIds: z.array(z.string().uuid()).default([]),
  translations: z
    .array(BlogPostTranslationInputSchema)
    .min(1, "Mindestens eine Übersetzung erforderlich")
    .refine(
      (ts) => ts.some((t) => t.locale === "de"),
      "Deutsche Übersetzung (DE) ist Pflicht"
    ),
});
export type BlogPostInput = z.infer<typeof BlogPostInputSchema>;

// ─── BlogPostStatusInput ──────────────────────────────────────────────────────

/**
 * Minimaler Input für PATCH …/status Endpunkt.
 * Trennt Status-Änderungen von vollständigen Updates (kleinere Payloads, klare Semantik).
 */
export const BlogPostStatusInputSchema = z.object({
  status: BlogStatusSchema,
});
export type BlogPostStatusInput = z.infer<typeof BlogPostStatusInputSchema>;

// ─── BlogCategoryInput ────────────────────────────────────────────────────────

export const BlogCategoryInputSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten"),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  translations: z
    .array(
      z.object({
        locale: LocaleSchema,
        name: z.string().min(1).max(100),
        description: z.string().max(500).nullish(),
      })
    )
    .min(1, "Mindestens eine Übersetzung erforderlich")
    .refine(
      (ts) => ts.some((t) => t.locale === "de"),
      "Deutsche Übersetzung (DE) ist Pflicht"
    ),
});
export type BlogCategoryInput = z.infer<typeof BlogCategoryInputSchema>;

// ─── BlogTagInput ─────────────────────────────────────────────────────────────

export const BlogTagInputSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten"),
  name: z.string().min(1).max(80),
});
export type BlogTagInput = z.infer<typeof BlogTagInputSchema>;
