import type { BlogPostSummary, BlogPostDetail, BlogCategorySummary } from "@wsp/contracts";
import type { Locale } from "@prisma/client";
import { resolveLocale } from "../utils/localeUtils";
import type { BlogPostWithRelations, BlogCategoryWithTranslations } from "../types";

// ─── BlogCategorySummary-Mapper ───────────────────────────────────────────────

export function toBlogCategorySummary(
  category: BlogCategoryWithTranslations,
  locale: string
): BlogCategorySummary {
  const resolved = resolveLocale(category.translations, locale);
  return {
    id: category.id,
    slug: category.slug,
    name: resolved?.value.name ?? category.slug,
    description: resolved?.value.description ?? null,
    postCount: category._count?.posts ?? 0,
  };
}

// ─── BlogPostSummary-Mapper ───────────────────────────────────────────────────

function buildPostSummary(
  post: BlogPostWithRelations,
  locale: string,
  resolved: { value: { title: string; excerpt: string }; fallbackUsed: boolean }
): BlogPostSummary {
  const categoryResolved = post.category
    ? resolveLocale(post.category.translations, locale)
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
    locale: (resolved.fallbackUsed ? "de" : locale) as Locale,
    fallbackUsed: resolved.fallbackUsed,
    title: resolved.value.title,
    excerpt: resolved.value.excerpt,
    category: post.category
      ? {
          id: post.category.id,
          slug: post.category.slug,
          name: categoryResolved?.value.name ?? post.category.slug,
        }
      : null,
    tags: post.tags.map((pt) => ({ slug: pt.tag.slug, name: pt.tag.name })),
  };
}

export function toBlogPostSummary(post: BlogPostWithRelations, locale: string): BlogPostSummary {
  const resolved = resolveLocale(post.translations, locale);
  if (!resolved) throw new Error(`Keine DE-Übersetzung für Blogpost ${post.slug}`);
  return buildPostSummary(post, locale, resolved);
}

// ─── BlogPostDetail-Mapper ────────────────────────────────────────────────────

export function toBlogPostDetail(post: BlogPostWithRelations, locale: string): BlogPostDetail {
  const resolved = resolveLocale(post.translations, locale);
  if (!resolved) throw new Error(`Keine DE-Übersetzung für Blogpost ${post.slug}`);

  return {
    ...buildPostSummary(post, locale, resolved),
    content: resolved.value.content,
    metaTitle: resolved.value.meta_title,
    metaDescription: resolved.value.meta_description,
    ogTitle: resolved.value.og_title,
    ogDescription: resolved.value.og_description,
    availableLocales: post.translations.map((t) => t.locale as Locale),
  };
}
