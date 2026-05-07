import { Hono } from "hono";
import { BlogPostQuerySchema, LocaleSchema } from "@wsp/contracts";
import { BlogService } from "../../services/blogService";
import { toBlogPostSummary, toBlogPostDetail, toBlogCategorySummary } from "../../mappers/blog";
import { CatalogError } from "../../types";

/**
 * Öffentliche Blog-Routen
 *
 * Alle Endpunkte liefern nur published Beiträge.
 * Rohe Prisma-Objekte werden nie direkt zurückgegeben — Ausgabe läuft immer durch Mapper.
 * Locale-Fallback auf DE wenn EN/ES-Übersetzung fehlt (fallbackUsed=true in Response).
 *
 * Endpunkte (relativ zu /api/blog):
 *   GET /posts           → BlogPostSummary[] (paginiert, filterbar)
 *   GET /posts/:slug     → BlogPostDetail
 *   GET /categories      → BlogCategorySummary[]
 */
export const blogRoutes = new Hono();

// ─── GET /posts ───────────────────────────────────────────────────────────────

blogRoutes.get("/posts", async (c) => {
  const raw = c.req.query();
  const parsed = BlogPostQuerySchema.safeParse(raw);

  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_QUERY",
      422,
      `Ungültige Query-Parameter: ${parsed.error.issues.map((i: { message: string }) => i.message).join(", ")}`
    );
  }

  const { locale, limit, offset, category, tag, featured } = parsed.data;

  const [posts, total] = await BlogService.listPublishedPosts({
    limit,
    offset,
    categorySlug: category,
    tagSlug: tag,
    featured,
  });

  return c.json({
    data: posts.map((p) => toBlogPostSummary(p, locale)),
    meta: { total, limit, offset },
  });
});

// ─── GET /posts/:slug ─────────────────────────────────────────────────────────

blogRoutes.get("/posts/:slug", async (c) => {
  const slug = c.req.param("slug");
  const { data: locale = "de" } = LocaleSchema.safeParse(c.req.query("locale"));

  const post = await BlogService.getPublishedPostBySlug(slug);

  if (!post) {
    throw new CatalogError("BLOG_POST_NOT_FOUND", 404, `Blog-Beitrag nicht gefunden: ${slug}`);
  }

  return c.json({ data: toBlogPostDetail(post, locale) });
});

// ─── GET /categories ──────────────────────────────────────────────────────────

blogRoutes.get("/categories", async (c) => {
  const { data: locale = "de" } = LocaleSchema.safeParse(c.req.query("locale"));

  const categories = await BlogService.listPublishedCategories();

  return c.json({
    data: categories.map((cat) => toBlogCategorySummary(cat, locale)),
  });
});
