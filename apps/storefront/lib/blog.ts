/**
 * Fetcher-Layer für die Blog-API.
 *
 * Typen spiegeln den BlogPostSummary / BlogPostDetail Contract wider,
 * ohne direkt von @wsp/contracts zur Laufzeit abzuhängen (tgz-Paket).
 * Alle Felder sind camelCase – analog zur Commerce-API-Antwort.
 */

import { env } from "./env";

// ─── Typen ────────────────────────────────────────────────────────────────────

export type BlogLocale = "de" | "en" | "es";

export type BlogTagSummary = {
  slug: string;
  name: string;
};

export type BlogCategoryRef = {
  id: string;
  slug: string;
  name: string;
};

export type BlogCategorySummary = BlogCategoryRef & {
  description: string | null;
  postCount: number;
};

export type BlogPostSummary = {
  id: string;
  slug: string;
  status: "draft" | "published" | "archived";
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  publishedAt: string | null;
  readingTimeMinutes: number | null;
  featured: boolean;
  authorName: string | null;
  locale: BlogLocale;
  fallbackUsed: boolean;
  title: string;
  excerpt: string;
  category: BlogCategoryRef | null;
  tags: BlogTagSummary[];
};

export type BlogPostDetail = BlogPostSummary & {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  availableLocales: BlogLocale[];
};

export type BlogListResult = {
  items: BlogPostSummary[];
  total: number;
  limit: number;
  offset: number;
};

// ─── Interne Envelope-Typen ───────────────────────────────────────────────────

type ApiListResponse<T> = {
  data: T[];
  meta: { total: number; limit: number; offset: number };
};

type ApiDetailResponse<T> = { data: T };

// ─── Query-Builder ────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

export async function fetchBlogPosts(opts?: {
  locale?: BlogLocale;
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
  featured?: boolean;
}): Promise<BlogListResult> {
  const qs = buildQuery({
    locale: opts?.locale ?? "de",
    limit: opts?.limit,
    offset: opts?.offset,
    category: opts?.category,
    tag: opts?.tag,
    featured: opts?.featured,
  });

  const res = await fetch(`${env.COMMERCE_API_URL}/api/blog/posts${qs}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`fetchBlogPosts: ${res.status}`);

  const body = (await res.json()) as ApiListResponse<BlogPostSummary>;
  return {
    items: body.data,
    total: body.meta.total,
    limit: body.meta.limit,
    offset: body.meta.offset,
  };
}

export async function fetchBlogPost(
  slug: string,
  locale?: BlogLocale
): Promise<BlogPostDetail | null> {
  const qs = locale ? `?locale=${locale}` : "";
  const res = await fetch(
    `${env.COMMERCE_API_URL}/api/blog/posts/${encodeURIComponent(slug)}${qs}`,
    { next: { revalidate: 60 } }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetchBlogPost: ${res.status}`);

  const body = (await res.json()) as ApiDetailResponse<BlogPostDetail>;
  return body.data;
}

export async function fetchBlogCategories(locale?: BlogLocale): Promise<BlogCategorySummary[]> {
  const qs = locale ? `?locale=${locale}` : "";
  const res = await fetch(`${env.COMMERCE_API_URL}/api/blog/categories${qs}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];

  const body = (await res.json()) as { data: BlogCategorySummary[] };
  return body.data;
}
