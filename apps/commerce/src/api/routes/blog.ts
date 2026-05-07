import { Hono } from "hono";
import { getPrismaClient } from "../../lib/prisma";
import { CatalogError } from "../../types";
import type { Locale } from "@prisma/client";

const prisma = getPrismaClient();

export const blogRoutes = new Hono();

const VALID_LOCALES: Locale[] = ["de", "en", "es"];

function parseLocale(raw: string | undefined): Locale {
  if (raw && VALID_LOCALES.includes(raw as Locale)) return raw as Locale;
  return "de";
}

// Wählt die Translation für die angefragte Locale, fällt auf DE zurück.
function resolveTranslation<T extends { locale: Locale }>(
  translations: T[],
  locale: Locale
): { translation: T; fallbackUsed: boolean } | null {
  const exact = translations.find((t) => t.locale === locale);
  if (exact) return { translation: exact, fallbackUsed: false };
  const de = translations.find((t) => t.locale === "de");
  if (de) return { translation: de, fallbackUsed: true };
  return null;
}

// ─── GET /posts ───────────────────────────────────────────────────────────────

blogRoutes.get("/posts", async (c) => {
  const locale = parseLocale(c.req.query("locale"));
  const limit = Math.min(Number(c.req.query("limit") ?? 12), 50);
  const offset = Number(c.req.query("offset") ?? 0);
  const categorySlug = c.req.query("category");
  const tagSlug = c.req.query("tag");
  const featuredOnly = c.req.query("featured") === "true";

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        status: "published",
        ...(featuredOnly ? { featured: true } : {}),
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
      },
      orderBy: { published_at: "desc" },
      take: limit,
      skip: offset,
      include: {
        translations: true,
        category: {
          include: { translations: true },
        },
        tags: { include: { tag: true } },
      },
    }),
    prisma.blogPost.count({
      where: {
        status: "published",
        ...(featuredOnly ? { featured: true } : {}),
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
      },
    }),
  ]);

  const items = posts.map((post) => {
    const resolved = resolveTranslation(post.translations, locale);
    if (!resolved) return null;
    const { translation, fallbackUsed } = resolved;

    const categoryTranslation = post.category
      ? resolveTranslation(post.category.translations, locale)
      : null;

    return {
      id: post.id,
      slug: post.slug,
      status: post.status,
      coverImageUrl: post.cover_image_url,
      coverImageAlt: post.cover_image_alt,
      publishedAt: post.published_at?.toISOString() ?? null,
      readingTimeMinutes: post.reading_time_minutes,
      featured: post.featured,
      authorName: post.author_name,
      locale: fallbackUsed ? ("de" as Locale) : locale,
      fallbackUsed,
      title: translation.title,
      excerpt: translation.excerpt,
      category: post.category
        ? {
            id: post.category.id,
            slug: post.category.slug,
            name: categoryTranslation?.translation.name ?? post.category.slug,
          }
        : null,
      tags: post.tags.map((pt) => ({ slug: pt.tag.slug, name: pt.tag.name })),
    };
  }).filter(Boolean);

  return c.json({ data: items, meta: { total, limit, offset } });
});

// ─── GET /posts/:slug ─────────────────────────────────────────────────────────

blogRoutes.get("/posts/:slug", async (c) => {
  const slug = c.req.param("slug");
  const locale = parseLocale(c.req.query("locale"));

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      translations: true,
      category: { include: { translations: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!post || post.status !== "published") {
    throw new CatalogError("NOT_FOUND", 404, `Blog-Beitrag nicht gefunden: ${slug}`);
  }

  const resolved = resolveTranslation(post.translations, locale);
  if (!resolved) {
    throw new CatalogError("NOT_FOUND", 404, `Keine Übersetzung verfügbar für: ${slug}`);
  }

  const { translation, fallbackUsed } = resolved;
  const categoryTranslation = post.category
    ? resolveTranslation(post.category.translations, locale)
    : null;

  const availableLocales = post.translations.map((t) => t.locale);

  return c.json({
    data: {
      id: post.id,
      slug: post.slug,
      status: post.status,
      coverImageUrl: post.cover_image_url,
      coverImageAlt: post.cover_image_alt,
      publishedAt: post.published_at?.toISOString() ?? null,
      readingTimeMinutes: post.reading_time_minutes,
      featured: post.featured,
      authorName: post.author_name,
      locale: fallbackUsed ? ("de" as Locale) : locale,
      fallbackUsed,
      availableLocales,
      title: translation.title,
      excerpt: translation.excerpt,
      content: translation.content,
      metaTitle: translation.meta_title,
      metaDescription: translation.meta_description,
      ogTitle: translation.og_title,
      ogDescription: translation.og_description,
      category: post.category
        ? {
            id: post.category.id,
            slug: post.category.slug,
            name: categoryTranslation?.translation.name ?? post.category.slug,
          }
        : null,
      tags: post.tags.map((pt) => ({ slug: pt.tag.slug, name: pt.tag.name })),
    },
  });
});

// ─── GET /categories ──────────────────────────────────────────────────────────

blogRoutes.get("/categories", async (c) => {
  const locale = parseLocale(c.req.query("locale"));

  const categories = await prisma.blogCategory.findMany({
    where: { is_active: true },
    orderBy: { sort_order: "asc" },
    include: {
      translations: true,
      _count: { select: { posts: { where: { status: "published" } } } },
    },
  });

  const data = categories.map((cat) => {
    const resolved = resolveTranslation(cat.translations, locale);
    return {
      id: cat.id,
      slug: cat.slug,
      name: resolved?.translation.name ?? cat.slug,
      description: resolved?.translation.description ?? null,
      postCount: cat._count.posts,
    };
  });

  return c.json({ data });
});
