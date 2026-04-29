import { Hono } from "hono";
import { getPrismaClient } from "../../lib/prisma";
import { CatalogError } from "../../types";

const prisma = getPrismaClient();

export const blogRoutes = new Hono();

// ─── GET /posts ───────────────────────────────────────────────────────────────

blogRoutes.get("/posts", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 100);
  const offset = Number(c.req.query("offset") ?? 0);
  const tag = c.req.query("tag");

  const where = {
    status: "published" as const,
    ...(tag ? { tags: { has: tag } } : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { published_at: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        cover_image: true,
        author: true,
        tags: true,
        published_at: true,
        created_at: true,
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return c.json({ data: posts, meta: { total, limit, offset } });
});

// ─── GET /posts/:slug ─────────────────────────────────────────────────────────

blogRoutes.get("/posts/:slug", async (c) => {
  const slug = c.req.param("slug");

  const post = await prisma.blogPost.findUnique({ where: { slug } });

  if (!post || post.status !== "published") {
    throw new CatalogError("NOT_FOUND", 404, `Blog-Beitrag nicht gefunden: ${slug}`);
  }

  return c.json({ data: post });
});

// ─── POST /posts  (n8n / AI webhook) ─────────────────────────────────────────

blogRoutes.post("/posts", async (c) => {
  const apiKey = c.req.header("x-api-key");
  if (!apiKey || apiKey !== process.env.BLOG_API_KEY) {
    throw new CatalogError("UNAUTHORIZED", 401, "Ungültiger API-Key");
  }

  const body = await c.req.json<{
    slug: string;
    title: string;
    excerpt?: string;
    content: string;
    cover_image?: string;
    author?: string;
    tags?: string[];
    status?: "draft" | "published";
  }>();

  if (!body.slug || !body.title || !body.content) {
    throw new CatalogError("INVALID_INPUT", 422, "slug, title und content sind Pflichtfelder");
  }

  const existing = await prisma.blogPost.findUnique({ where: { slug: body.slug } });

  if (existing) {
    const updated = await prisma.blogPost.update({
      where: { slug: body.slug },
      data: {
        title: body.title,
        excerpt: body.excerpt ?? null,
        content: body.content,
        cover_image: body.cover_image ?? null,
        author: body.author ?? null,
        tags: body.tags ?? [],
        status: body.status ?? "published",
        published_at: body.status === "published" ? (existing.published_at ?? new Date()) : existing.published_at,
      },
    });
    return c.json({ data: updated }, 200);
  }

  const post = await prisma.blogPost.create({
    data: {
      slug: body.slug,
      title: body.title,
      excerpt: body.excerpt ?? null,
      content: body.content,
      cover_image: body.cover_image ?? null,
      author: body.author ?? null,
      tags: body.tags ?? [],
      status: body.status ?? "published",
      published_at: body.status === "published" ? new Date() : null,
    },
  });

  return c.json({ data: post }, 201);
});

// ─── PATCH /posts/:slug  (Admin – Status ändern) ──────────────────────────────

blogRoutes.patch("/posts/:slug", async (c) => {
  const apiKey = c.req.header("x-api-key");
  if (!apiKey || apiKey !== process.env.BLOG_API_KEY) {
    throw new CatalogError("UNAUTHORIZED", 401, "Ungültiger API-Key");
  }

  const slug = c.req.param("slug");
  const body = await c.req.json<{ status: "draft" | "published" | "archived" }>();

  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) throw new CatalogError("NOT_FOUND", 404, `Blog-Beitrag nicht gefunden: ${slug}`);

  const updated = await prisma.blogPost.update({
    where: { slug },
    data: {
      status: body.status,
      published_at: body.status === "published" && !post.published_at ? new Date() : post.published_at,
    },
  });

  return c.json({ data: updated });
});
