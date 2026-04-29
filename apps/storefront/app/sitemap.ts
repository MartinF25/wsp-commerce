import type { MetadataRoute } from "next";
import { fetchProducts, fetchCategories } from "@/lib/catalog";
import { fetchBlogPosts } from "@/lib/blog";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsResult, categoriesResult, blogResult] = await Promise.allSettled([
    fetchProducts({ limit: 100 }),
    fetchCategories(),
    fetchBlogPosts({ limit: 200 }),
  ]);

  const productUrls: MetadataRoute.Sitemap =
    productsResult.status === "fulfilled"
      ? productsResult.value.items.map((p) => ({
          url: `${STOREFRONT_URL}/products/${p.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        }))
      : [];

  const categoryUrls: MetadataRoute.Sitemap =
    categoriesResult.status === "fulfilled"
      ? categoriesResult.value.map((c) => ({
          url: `${STOREFRONT_URL}/categories/${c.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        }))
      : [];

  const blogUrls: MetadataRoute.Sitemap =
    blogResult.status === "fulfilled"
      ? blogResult.value.items.map((p) => ({
          url: `${STOREFRONT_URL}/blog/${p.slug}`,
          lastModified: p.published_at ? new Date(p.published_at) : new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
        }))
      : [];

  return [
    { url: STOREFRONT_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${STOREFRONT_URL}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${STOREFRONT_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${STOREFRONT_URL}/kontakt`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...productUrls,
    ...blogUrls,
    ...categoryUrls,
  ];
}
