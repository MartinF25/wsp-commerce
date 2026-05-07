import { getPrismaClient } from "../lib/prisma";
import { CatalogError } from "../types";
import type { BlogPostWithRelations, BlogCategoryWithTranslations } from "../types";

/** Prisma-Include für einen vollständigen BlogPost (Translations, Category, Tags). */
const POST_INCLUDE = {
  translations: true,
  category: { include: { translations: true } },
  tags: { include: { tag: true } },
} as const;

/** Include für Kategorien in der öffentlichen API – zählt nur published Posts. */
const CATEGORY_INCLUDE_PUBLIC = {
  translations: true,
  _count: {
    select: { posts: { where: { status: "published" as const } } },
  },
} as const;

/** Include für Kategorien in der Admin-API – zählt alle Posts unabhängig vom Status. */
const CATEGORY_INCLUDE_ADMIN = {
  translations: true,
  _count: {
    select: { posts: true },
  },
} as const;

export class BlogService {
  // ─── Public ──────────────────────────────────────────────────────────────────

  /**
   * Paginierte Liste veröffentlichter Blogbeiträge.
   * Gibt [posts, total] zurück — ein einziger aggregierter DB-Roundtrip.
   */
  static async listPublishedPosts(opts: {
    limit: number;
    offset: number;
    categorySlug?: string;
    tagSlug?: string;
    featured?: boolean;
  }): Promise<[BlogPostWithRelations[], number]> {
    const prisma = getPrismaClient();

    const where = {
      status: "published" as const,
      ...(opts.featured ? { featured: true } : {}),
      ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}),
      ...(opts.tagSlug ? { tags: { some: { tag: { slug: opts.tagSlug } } } } : {}),
    };

    return Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { published_at: "desc" },
        take: opts.limit,
        skip: opts.offset,
        include: POST_INCLUDE,
      }),
      prisma.blogPost.count({ where }),
    ]);
  }

  /**
   * Einzelner veröffentlichter Blogbeitrag per Slug.
   * Gibt null zurück wenn nicht gefunden oder nicht veröffentlicht.
   */
  static async getPublishedPostBySlug(slug: string): Promise<BlogPostWithRelations | null> {
    const prisma = getPrismaClient();

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: POST_INCLUDE,
    });

    if (!post || post.status !== "published") return null;
    return post as BlogPostWithRelations;
  }

  /**
   * Alle aktiven Kategorien mit voraggregiertem Post-Count (nur published).
   */
  static async listPublishedCategories(): Promise<BlogCategoryWithTranslations[]> {
    const prisma = getPrismaClient();

    const categories = await prisma.blogCategory.findMany({
      where: { is_active: true },
      orderBy: { sort_order: "asc" },
      include: CATEGORY_INCLUDE_PUBLIC,
    });

    return categories as BlogCategoryWithTranslations[];
  }

  // ─── Admin ───────────────────────────────────────────────────────────────────

  /** Alle Blogbeiträge (alle Status) für Admin-Listenansicht. */
  static async listAllPosts(opts: {
    limit: number;
    offset: number;
    status?: "draft" | "published" | "archived";
    categorySlug?: string;
  }): Promise<[BlogPostWithRelations[], number]> {
    const prisma = getPrismaClient();

    const where = {
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}),
    };

    return Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { updated_at: "desc" },
        take: opts.limit,
        skip: opts.offset,
        include: POST_INCLUDE,
      }),
      prisma.blogPost.count({ where }),
    ]);
  }

  /** Einzelner Blogbeitrag per ID (alle Status) für Admin. */
  static async getPostById(id: string): Promise<BlogPostWithRelations | null> {
    const prisma = getPrismaClient();

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: POST_INCLUDE,
    });

    return post as BlogPostWithRelations | null;
  }

  /** Wirft CatalogError(404) wenn Post nicht existiert — Kurzform für Admin-Routen. */
  static async requirePostById(id: string): Promise<BlogPostWithRelations> {
    const post = await BlogService.getPostById(id);
    if (!post) {
      throw new CatalogError("BLOG_POST_NOT_FOUND", 404, `Blogbeitrag nicht gefunden: ${id}`);
    }
    return post;
  }

  /** Alle Kategorien (aktive + inaktive) für Admin. */
  static async listAllCategories(): Promise<BlogCategoryWithTranslations[]> {
    const prisma = getPrismaClient();

    const categories = await prisma.blogCategory.findMany({
      orderBy: { sort_order: "asc" },
      include: CATEGORY_INCLUDE_ADMIN,
    });

    return categories as BlogCategoryWithTranslations[];
  }
}
