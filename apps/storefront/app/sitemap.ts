import type { MetadataRoute } from "next";
import { fetchProducts, fetchCategories } from "@/lib/catalog";
import { fetchBlogPosts } from "@/lib/blog";

export const revalidate = 3600; // stündlich neu generieren

const BASE = (process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000").trim().replace(/\/$/, "");

function localeUrl(locale: string, path: string): string {
  const prefix = locale === "de" ? "" : `/${locale}`;
  return `${BASE}${prefix}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsResult, categoriesResult, blogResult] = await Promise.allSettled([
    fetchProducts({ locale: "de", limit: 100 }),
    fetchCategories("de"),
    fetchBlogPosts({ locale: "de", limit: 500 }),
  ]);

  const productUrls: MetadataRoute.Sitemap =
    productsResult.status === "fulfilled"
      ? productsResult.value.items.map((p) => ({
          url: `${BASE}/products/${p.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
          alternates: {
            languages: {
              "x-default": `${BASE}/products/${p.slug}`,
              de: `${BASE}/products/${p.slug}`,
              en: `${BASE}/en/products/${p.slug}`,
              es: `${BASE}/es/products/${p.slug}`,
            },
          },
        }))
      : [];

  const categoryUrls: MetadataRoute.Sitemap =
    categoriesResult.status === "fulfilled"
      ? categoriesResult.value.map((c) => ({
          url: `${BASE}/categories/${c.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.6,
          alternates: {
            languages: {
              "x-default": `${BASE}/categories/${c.slug}`,
              de: `${BASE}/categories/${c.slug}`,
              en: `${BASE}/en/categories/${c.slug}`,
              es: `${BASE}/es/categories/${c.slug}`,
            },
          },
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

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE,
      changeFrequency: "daily",
      priority: 1.0,
      alternates: { languages: { "x-default": BASE, de: BASE, en: `${BASE}/en`, es: `${BASE}/es` } },
    },
    {
      url: `${BASE}/products`,
      changeFrequency: "daily",
      priority: 0.9,
      alternates: { languages: { "x-default": `${BASE}/products`, de: `${BASE}/products`, en: `${BASE}/en/products`, es: `${BASE}/es/products` } },
    },
    {
      url: `${BASE}/categories`,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: { "x-default": `${BASE}/categories`, de: `${BASE}/categories`, en: `${BASE}/en/categories`, es: `${BASE}/es/categories` } },
    },
    {
      url: localeUrl("de", "/blog"),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: { languages: { "x-default": localeUrl("de", "/blog"), de: localeUrl("de", "/blog"), en: localeUrl("en", "/blog"), es: localeUrl("es", "/blog") } },
    },
    {
      url: `${BASE}/solarzaun`,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: { languages: { "x-default": `${BASE}/solarzaun`, de: `${BASE}/solarzaun`, en: `${BASE}/en/solarzaun`, es: `${BASE}/es/solarzaun` } },
    },
    {
      url: `${BASE}/skywind`,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: { languages: { "x-default": `${BASE}/skywind`, de: `${BASE}/skywind`, en: `${BASE}/en/skywind`, es: `${BASE}/es/skywind` } },
    },
    {
      url: `${BASE}/skywind-ng`,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: { "x-default": `${BASE}/skywind-ng`, de: `${BASE}/skywind-ng`, en: `${BASE}/en/skywind-ng`, es: `${BASE}/es/skywind-ng` } },
    },
    {
      url: `${BASE}/kombiloesungen`,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: { languages: { "x-default": `${BASE}/kombiloesungen`, de: `${BASE}/kombiloesungen`, en: `${BASE}/en/kombiloesungen`, es: `${BASE}/es/kombiloesungen` } },
    },
    {
      url: `${BASE}/gewerbe-b2b`,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: { languages: { "x-default": `${BASE}/gewerbe-b2b`, de: `${BASE}/gewerbe-b2b`, en: `${BASE}/en/gewerbe-b2b`, es: `${BASE}/es/gewerbe-b2b` } },
    },
    {
      url: `${BASE}/privatkunden`,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: { languages: { "x-default": `${BASE}/privatkunden`, de: `${BASE}/privatkunden`, en: `${BASE}/en/privatkunden`, es: `${BASE}/es/privatkunden` } },
    },
    {
      url: `${BASE}/faq`,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: { languages: { "x-default": `${BASE}/faq`, de: `${BASE}/faq`, en: `${BASE}/en/faq`, es: `${BASE}/es/faq` } },
    },
    {
      url: `${BASE}/kontakt`,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: { languages: { "x-default": `${BASE}/kontakt`, de: `${BASE}/kontakt`, en: `${BASE}/en/kontakt`, es: `${BASE}/es/kontakt` } },
    },
  ];

  return [
    ...staticPages,
    ...productUrls,
    ...blogUrls,
    ...categoryUrls,
  ];
}
