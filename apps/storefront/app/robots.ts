import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000")
  .trim()
  .replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/_next/",
          "/checkout",
          "/cart",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
