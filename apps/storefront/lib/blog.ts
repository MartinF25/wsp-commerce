import { env } from "./env";

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  author: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
};

export type BlogPostDetail = BlogPostSummary & {
  content: string;
};

type ApiListResponse<T> = {
  data: T[];
  meta: { total: number; limit: number; offset: number };
};

type ApiDetailResponse<T> = { data: T };

export type BlogListResult = {
  items: BlogPostSummary[];
  total: number;
  limit: number;
  offset: number;
};

export async function fetchBlogPosts(opts?: {
  limit?: number;
  offset?: number;
  tag?: string;
}): Promise<BlogListResult> {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  if (opts?.tag) params.set("tag", opts.tag);
  const qs = params.toString() ? `?${params}` : "";

  const res = await fetch(`${env.COMMERCE_API_URL}/api/blog/posts${qs}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`fetchBlogPosts: ${res.status}`);

  const body = (await res.json()) as ApiListResponse<BlogPostSummary>;
  return { items: body.data, total: body.meta.total, limit: body.meta.limit, offset: body.meta.offset };
}

export async function fetchBlogPost(slug: string): Promise<BlogPostDetail | null> {
  const res = await fetch(
    `${env.COMMERCE_API_URL}/api/blog/posts/${encodeURIComponent(slug)}`,
    { next: { revalidate: 60 } }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetchBlogPost: ${res.status}`);

  const body = (await res.json()) as ApiDetailResponse<BlogPostDetail>;
  return body.data;
}
