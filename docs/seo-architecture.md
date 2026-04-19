# SEO Architecture

## URL Structure
- `/shop` — catalog root
- `/shop/[category]` — category pages
- `/shop/[category]/[product-slug]` — product pages
- `/solarzaun`, `/skywind`, `/kombilösungen` — landing pages

## Technical SEO
- Next.js `generateMetadata` for dynamic meta tags
- `sitemap.xml` generated at build time (or on-demand ISR)
- `robots.txt` served from `/public`
- Structured data: `Product`, `BreadcrumbList`, `Organization` (JSON-LD)
- Canonical URLs on all pages
- `hreflang` if multilingual support is added

## Performance (Core Web Vitals)
- Images: Next.js `<Image>` with WebP + AVIF
- Fonts: `next/font` with `display: swap`
- Critical CSS inlined
- ISR for product pages (revalidate: 60s)

## Content SEO
- Each product page has unique title, meta description, H1
- Category pages have intro copy
- Blog / Ratgeber section for long-tail keywords (Phase 2)
