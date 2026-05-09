import type { MetadataRoute } from "next";
import { fetchProducts, fetchCategories } from "@/lib/catalog";
import { fetchBlogPosts } from "@/lib/blog";

const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

function localeUrl(locale: string, path: string): string {
  const prefix = locale === "de" ? "" : `/${locale}`;
  return `${BASE}${prefix}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsResult, categoriesResult, blogResult] = await Promise.allSettled([
    fetchProducts({ locale: "de", limit: 100 }),
    fetchCategories(),
    fetchBlogPosts({ locale: "de", limit: 500 }),
  ]);

  const productUrls: MetadataRoute.Sitemap =
    productsResult.status === "fulfilled"
      ? productsResult.value.items.map((p) => ({
          url: `${BASE}/products/${p.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
      : [];

  const categoryUrls: MetadataRoute.Sitemap =
    categoriesResult.status === "fulfilled"
      ? categoriesResult.value.map((c) => ({
          url: `${BASE}/categories/${c.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }))
      : [];

  const blogUrls: MetadataRoute.Sitemap =
    blogResult.status === "fulfilled"
      ? blogResult.value.items.map((p) => {
          const languages: Record<string, string> = {};
          for (const loc of p.availableLocales) {
            languages[loc] = localeUrl(loc, `/blog/${p.slug}`);
          }
          return {
            url: localeUrl("de", `/blog/${p.slug}`),
            lastModified: p.publishedAt ? new Date(p.publishedAt) : new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.7,
            alternates: { languages },
          };
        })
      : [];

  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      alternates: { languages: { de: BASE, en: `${BASE}/en`, es: `${BASE}/es` } },
    },
    { url: `${BASE}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    {
      url: localeUrl("de", "/blog"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: {
          de: localeUrl("de", "/blog"),
          en: localeUrl("en", "/blog"),
          es: localeUrl("es", "/blog"),
        },
      },
    },
    { url: `${BASE}/kontakt`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...productUrls,
    ...blogUrls,
    ...categoryUrls,
  ];
}
