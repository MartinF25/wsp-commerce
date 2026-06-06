import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchBlogPost, fetchRelatedPosts } from "@/lib/blog";
import type { BlogLocale } from "@/lib/blog";
import { BlogPostHero } from "@/components/blog/BlogPostHero";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { BlogRelatedLinks, type RelatedLink } from "@/components/blog/BlogRelatedLinks";
import { BlogRelatedArticles } from "@/components/blog/BlogRelatedArticles";
import { BlogPostCta } from "@/components/blog/BlogPostCta";
import { BlogProductCta, type BlogProductCtaPreset } from "@/components/blog/BlogProductCta";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

type Props = { params: { slug: string; locale: string } };

// ─── Internal related links per locale ───────────────────────────────────────

const RELATED_LINKS: Record<string, RelatedLink[]> = {
  en: [
    { href: "/skywind-ng",              label: "SkyWind NG",                description: "Product details, specs & pricing",      icon: "⚡" },
    { href: "/micro-wind-turbine",      label: "Micro Wind Turbine Guide",  description: "Everything about micro wind turbines",   icon: "🌬️" },
    { href: "/off-grid-wind-turbine",   label: "Off-Grid Wind Turbine",     description: "Standalone off-grid power systems",      icon: "🔋" },
    { href: "/hybrid-solar-wind-system",label: "Hybrid Solar-Wind System",  description: "Combine solar & wind for max output",    icon: "☀️" },
    { href: "/small-wind-turbine-for-home", label: "Wind Turbine for Home", description: "Residential wind energy solutions",     icon: "🏠" },
    { href: "/rooftop-wind-turbine",    label: "Rooftop Wind Turbine",      description: "Rooftop installation guide",             icon: "🏗️" },
  ],
  de: [
    { href: "/skywind-ng",              label: "SkyWind NG",                description: "Produktdetails, Technik & Preise",       icon: "⚡" },
    { href: "/micro-wind-turbine",      label: "Micro Wind Turbine",        description: "Kleinwindanlagen im Überblick",          icon: "🌬️" },
    { href: "/off-grid-wind-turbine",   label: "Off-Grid Windkraft",        description: "Autarke Energieversorgung",              icon: "🔋" },
    { href: "/hybrid-solar-wind-system",label: "Solar-Wind-Hybridsystem",   description: "Solar und Wind kombinieren",             icon: "☀️" },
    { href: "/small-wind-turbine-for-home", label: "Windanlage für Zuhause",description: "Lösungen für private Haushalte",        icon: "🏠" },
    { href: "/rooftop-wind-turbine",    label: "Windkraftanlage Dach",      description: "Dachmontage – Ratgeber & Tipps",         icon: "🏗️" },
  ],
  es: [
    { href: "/skywind-ng",              label: "SkyWind NG",                description: "Detalles, especificaciones y precios",   icon: "⚡" },
    { href: "/micro-wind-turbine",      label: "Mini Aerogenerador",        description: "Todo sobre los mini aerogeneradores",    icon: "🌬️" },
    { href: "/off-grid-wind-turbine",   label: "Aerogenerador Off-Grid",    description: "Sistemas de energía autónomos",          icon: "🔋" },
    { href: "/hybrid-solar-wind-system",label: "Sistema Híbrido Solar-Eólico", description: "Combina solar y eólico",             icon: "☀️" },
    { href: "/small-wind-turbine-for-home", label: "Aerogenerador para Casa", description: "Soluciones eólicas residenciales",   icon: "🏠" },
    { href: "/rooftop-wind-turbine",    label: "Aerogenerador en Tejado",   description: "Guía de instalación en tejado",          icon: "🏗️" },
  ],
};

// ─── Category → CTA preset mapping ───────────────────────────────────────────

const CATEGORY_PRESET: Record<string, BlogProductCtaPreset> = {
  "micro-wind-energy":         "renewable",
  "off-grid-power":            "off-grid",
  "hybrid-solar-wind-systems": "hybrid",
  "rooftop-wind-turbines":     "renewable",
  "energy-independence":       "independence",
  "battery-storage":           "off-grid",
  "skywind-ng":                "renewable",
};

function resolveCtaPreset(categorySlug?: string | null): BlogProductCtaPreset {
  return (categorySlug && CATEGORY_PRESET[categorySlug]) ?? "renewable";
}

// ─── Locale labels for the language switcher ─────────────────────────────────

const LOCALE_LABELS: Record<string, string> = { de: "Deutsch", en: "English", es: "Español" };

// ─── Strip duplicate H1 from Markdown content ────────────────────────────────

function stripLeadingMarkdownH1(content: string, title: string): string {
  const normalizedTitle = title.trim().toLowerCase();
  const lines = content.split(/\r?\n/);
  const firstLine = lines[0]?.trim();
  const headingMatch = firstLine?.match(/^#\s+(.+)$/);
  if (!headingMatch) return content;
  const headingTitle = headingMatch[1].trim().toLowerCase();
  if (!headingTitle.includes(normalizedTitle) && !normalizedTitle.includes(headingTitle)) return content;
  return lines.slice(1).join("\n").replace(/^\s+/, "");
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = params.locale as BlogLocale;
  const post = await fetchBlogPost(params.slug, locale);
  if (!post) return { title: "Not found" };

  const title = post.metaTitle ?? `${post.title} | Blog – Solarzaun & SkyWind`;
  const description = post.metaDescription ?? post.excerpt;
  const url = `${STOREFRONT_URL}/${locale === "de" ? "" : `${locale}/`}blog/${post.slug}`;
  const image = post.coverImageUrl;

  const alternates: Record<string, string> = {};
  for (const loc of post.availableLocales) {
    alternates[loc] = `${STOREFRONT_URL}/${loc === "de" ? "" : `${loc}/`}blog/${post.slug}`;
  }

  return {
    title,
    description,
    alternates: { canonical: url, languages: alternates },
    openGraph: {
      title: post.ogTitle ?? title,
      description: post.ogDescription ?? description,
      url,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      ...(image && { images: [{ url: image, alt: post.coverImageAlt ?? post.title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.ogTitle ?? title,
      description: post.ogDescription ?? description,
      ...(image && { images: [image] }),
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  const locale = params.locale as BlogLocale;
  const post = await fetchBlogPost(params.slug, locale);
  if (!post) notFound();

  const [relatedPosts, content] = await Promise.all([
    fetchRelatedPosts(post.slug, locale, post.category?.slug),
    Promise.resolve(stripLeadingMarkdownH1(post.content, post.title)),
  ]);
  const postUrl = `${STOREFRONT_URL}/${locale === "de" ? "" : `${locale}/`}blog/${post.slug}`;

  const breadcrumb = [
    { label: t("breadcrumb_home"), href: "/" },
    { label: t("breadcrumb_blog"), href: "/blog" },
    ...(post.category
      ? [{ label: post.category.name, href: `/blog?category=${post.category.slug}` }]
      : []),
    { label: post.title },
  ];

  // Product/landing links + dynamic category page link (money pages first)
  const categoryLink: typeof RELATED_LINKS.en = post.category
    ? [{
        href: `/blog/category/${post.category.slug}`,
        label: locale === "de"
          ? `Mehr Artikel: ${post.category.name}`
          : locale === "es"
            ? `Más artículos: ${post.category.name}`
            : `More ${post.category.name} articles`,
        description: locale === "de"
          ? "Alle Guides und Ratgeber in dieser Kategorie"
          : locale === "es"
            ? "Todos los artículos en esta categoría"
            : "Browse all guides in this topic",
        icon: "📚",
      }]
    : [];
  const relatedLinks = [...(RELATED_LINKS[locale] ?? RELATED_LINKS.en), ...categoryLink];

  return (
    <div className="bg-white min-h-screen">

      {/* ── JSON-LD: Article schema ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            author: { "@type": "Person", name: post.authorName ?? t("author_default") },
            publisher: {
              "@type": "Organization",
              name: "WSP Solarenergie",
              logo: { "@type": "ImageObject", url: `${STOREFRONT_URL}/favicon.svg` },
            },
            datePublished: post.publishedAt,
            dateModified: post.publishedAt,
            url: postUrl,
            ...(post.coverImageUrl && { image: post.coverImageUrl }),
            mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
          }),
        }}
      />

      {/* ── JSON-LD: BreadcrumbList ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumb.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.label,
              ...(item.href && { item: `${STOREFRONT_URL}${item.href}` }),
            })),
          }),
        }}
      />

      {/* ── Hero: cover image, breadcrumb, title, meta ── */}
      <BlogPostHero
        title={post.title}
        excerpt={post.excerpt}
        category={post.category}
        tags={post.tags}
        authorName={post.authorName ?? t("author_default")}
        publishedAt={post.publishedAt}
        readingTimeMinutes={post.readingTimeMinutes}
        coverImageUrl={post.coverImageUrl}
        coverImageAlt={post.coverImageAlt ?? post.title}
        breadcrumb={breadcrumb}
        locale={params.locale}
        readingTimeLabel={
          post.readingTimeMinutes != null
            ? t("reading_time", { count: post.readingTimeMinutes })
            : undefined
        }
        fallbackNotice={post.fallbackUsed ? t("fallback_notice") : undefined}
      />

      {/* ── Article body: Markdown content ── */}
      <BlogPostBody content={content} />

      {/* ── In-article product CTA (section variant, below article body) ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlogProductCta
          preset={resolveCtaPreset(post.category?.slug)}
          variant="section"
          imageUrl={post.coverImageUrl ?? undefined}
          imageAlt={post.coverImageAlt ?? post.title}
          secondaryLabel={t("cta_btn")}
          secondaryHref="/kontakt"
        />
      </div>

      {/* ── Language switcher ── */}
      {post.availableLocales.length > 1 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 flex flex-wrap gap-3 border-b border-gray-100">
          {post.availableLocales
            .filter((loc) => loc !== locale)
            .map((loc) => (
              <Link
                key={loc}
                href={`/blog/${post.slug}`}
                locale={loc}
                className="text-xs font-medium text-brand-muted border border-gray-200 px-3 py-1.5 rounded-full hover:border-brand-accent hover:text-brand-accent transition-colors duration-150"
              >
                {LOCALE_LABELS[loc] ?? loc.toUpperCase()}
              </Link>
            ))}
        </div>
      )}

      {/* ── Related product & guide links ── */}
      <BlogRelatedLinks
        title={t("related_guides")}
        eyebrow={t("related_guides_eyebrow")}
        links={relatedLinks}
      />

      {/* ── Related articles (placeholder until seed data exists) ── */}
      <BlogRelatedArticles
        title={t("related_articles")}
        viewAllLabel={t("view_all_posts")}
        articles={relatedPosts}
        locale={params.locale}
      />

      {/* ── Bottom CTA ── */}
      <BlogPostCta
        heading={t("interest_h2")}
        subtext={t("interest_sub")}
        primaryLabel={t("cta_btn")}
        primaryHref="/kontakt"
        secondaryLabel={t("back")}
        secondaryHref="/blog"
        variant="light"
      />
    </div>
  );
}
