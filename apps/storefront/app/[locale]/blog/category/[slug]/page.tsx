import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchBlogPosts, fetchBlogCategories } from "@/lib/blog";
import type { BlogLocale, BlogPostSummary } from "@/lib/blog";
import { findCategory, CATEGORY_SLUGS } from "@/lib/blogCategories";
import { BlogRelatedLinks } from "@/components/blog/BlogRelatedLinks";
import { BlogRelatedArticles } from "@/components/blog/BlogRelatedArticles";
import { BlogPostCta } from "@/components/blog/BlogPostCta";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

type Props = { params: { slug: string; locale: string } };

// ─── Visual identity per category slug ───────────────────────────────────────
// Full class strings here so Tailwind can detect them at build time.

const CATEGORY_STYLES: Record<
  string,
  { accent: string; bg: string; border: string; gradient: string }
> = {
  "micro-wind-energy":        { accent: "text-green-700",   bg: "bg-green-50",   border: "border-green-100",  gradient: "from-green-50 to-emerald-100/60" },
  "off-grid-power":           { accent: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-100",   gradient: "from-blue-50 to-sky-100/60" },
  "hybrid-solar-wind-systems":{ accent: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-100",  gradient: "from-amber-50 to-yellow-100/60" },
  "rooftop-wind-turbines":    { accent: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-100",  gradient: "from-slate-50 to-gray-100/60" },
  "energy-independence":      { accent: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100",gradient: "from-emerald-50 to-green-100/60" },
  "battery-storage":          { accent: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-100", gradient: "from-violet-50 to-purple-100/60" },
};

const DEFAULT_STYLE = { accent: "text-brand-accent", bg: "bg-green-50", border: "border-green-100", gradient: "from-green-50 to-gray-100" };

// ─── Static params: all 6 known category slugs ───────────────────────────────

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }));
}

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = findCategory(params.slug);
  if (!cat) return { title: "Not found" };

  const locale = params.locale as "de" | "en" | "es";
  const data = cat.locales[locale] ?? cat.locales.en;
  const url = `${STOREFRONT_URL}/${locale === "de" ? "" : `${locale}/`}blog/category/${cat.slug}`;

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    alternates: {
      canonical: url,
      languages: {
        de: `${STOREFRONT_URL}/blog/category/${cat.slug}`,
        en: `${STOREFRONT_URL}/en/blog/category/${cat.slug}`,
        es: `${STOREFRONT_URL}/es/blog/category/${cat.slug}`,
      },
    },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url,
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogCategoryPage({ params }: Props) {
  const cat = findCategory(params.slug);
  if (!cat) notFound();

  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  const locale = params.locale as BlogLocale;
  const data = cat.locales[locale as "de" | "en" | "es"] ?? cat.locales.en;
  const style = CATEGORY_STYLES[cat.slug] ?? DEFAULT_STYLE;

  const [{ items: posts }] = await Promise.all([
    fetchBlogPosts({ locale, limit: 50, category: cat.slug }).catch(
      () => ({ items: [] as BlogPostSummary[], total: 0, limit: 50, offset: 0 })
    ),
  ]);

  const featuredPosts = posts.filter((p) => p.featured);
  const regularPosts = posts.filter((p) => !p.featured);

  const pageUrl = `${STOREFRONT_URL}/${locale === "de" ? "" : `${locale}/`}blog/category/${cat.slug}`;

  return (
    <div className="bg-white min-h-screen">

      {/* ── JSON-LD: BreadcrumbList ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t("breadcrumb_home"), item: STOREFRONT_URL },
              { "@type": "ListItem", position: 2, name: t("breadcrumb_blog"), item: `${STOREFRONT_URL}/blog` },
              { "@type": "ListItem", position: 3, name: data.name, item: pageUrl },
            ],
          }),
        }}
      />

      {/* ── Hero ── */}
      <div className={`bg-gradient-to-br ${style.gradient} border-b border-gray-100`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-14">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-brand-muted flex-wrap mb-8">
            <Link href="/" className="hover:text-brand-text transition-colors duration-150">
              {t("breadcrumb_home")}
            </Link>
            <span aria-hidden className="text-gray-300">/</span>
            <Link href="/blog" className="hover:text-brand-text transition-colors duration-150">
              {t("breadcrumb_blog")}
            </Link>
            <span aria-hidden className="text-gray-300">/</span>
            <span className="text-brand-text font-medium">{data.name}</span>
          </nav>

          <div className="flex items-start gap-5">
            {/* Category icon */}
            <div
              className={`shrink-0 w-14 h-14 rounded-2xl ${style.bg} ${style.border} border flex items-center justify-center text-2xl shadow-sm`}
              aria-hidden
            >
              {cat.icon}
            </div>

            <div>
              {/* Eyebrow */}
              <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${style.accent}`}>
                {t("category_eyebrow")}
              </p>

              {/* H1 */}
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-text leading-tight mb-3">
                {data.name}
              </h1>

              {/* Description */}
              <p className="text-brand-muted text-base sm:text-lg max-w-2xl leading-relaxed">
                {data.description}
              </p>

              {/* Post count badge */}
              {posts.length > 0 && (
                <div className="mt-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.bg} ${style.accent} ${style.border} border px-3 py-1 rounded-full`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden />
                    {posts.length} {posts.length === 1 ? "article" : "articles"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Article grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Back link */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/blog"
            className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150 flex items-center gap-1"
          >
            ← {t("back")}
          </Link>
          {posts.length > 0 && (
            <span className="text-xs text-brand-muted">{posts.length} {posts.length === 1 ? "article" : "articles"}</span>
          )}
        </div>

        {posts.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <>
            {/* Featured */}
            {featuredPosts.length > 0 && (
              <section className="mb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featuredPosts.map((post) => (
                    <FeaturedCard key={post.id} post={post} locale={params.locale} featuredLabel={t("featured_label")} readMoreLabel={t("read_more")} />
                  ))}
                </div>
                {regularPosts.length > 0 && <hr className="mt-10 border-gray-100" />}
              </section>
            )}

            {/* Regular */}
            {regularPosts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {regularPosts.map((post) => (
                  <PostCard key={post.id} post={post} locale={params.locale} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Related product & guide links ── */}
      <BlogRelatedLinks
        title={t("related_guides")}
        eyebrow={t("related_guides_eyebrow")}
        links={cat.relatedLinks}
      />

      {/* ── Related articles from other categories (placeholder) ── */}
      <BlogRelatedArticles
        title={t("related_articles")}
        viewAllLabel={t("view_all_posts")}
        articles={[]}
        locale={params.locale}
      />

      {/* ── CTA ── */}
      <BlogPostCta
        heading={t("cta_h2")}
        subtext={t("cta_sub")}
        primaryLabel={t("cta_btn")}
        primaryHref="/kontakt"
        variant="light"
      />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  return (
    <div className="text-center py-20">
      <div className="text-4xl mb-4" aria-hidden>📝</div>
      <p className="text-brand-muted text-lg mb-2">{t("no_posts")}</p>
      <p className="text-brand-muted text-sm">{t("no_posts_soon")}</p>
      <Link
        href="/blog"
        className="inline-block mt-6 text-sm font-medium text-brand-muted border border-gray-200 px-5 py-2.5 rounded-xl hover:border-brand-accent hover:text-brand-accent transition-colors duration-150"
      >
        {t("back")}
      </Link>
    </div>
  );
}

// ─── Card components ──────────────────────────────────────────────────────────

import Image from "next/image";

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
}

function FeaturedCard({
  post,
  locale,
  featuredLabel,
  readMoreLabel,
}: {
  post: BlogPostSummary;
  locale: string;
  featuredLabel: string;
  readMoreLabel: string;
}) {
  return (
    <Link
      href={`/blog/${post.slug}` as any}
      className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-50 to-gray-100" />
        )}
        <span className="absolute top-3 left-3 text-xs font-semibold bg-brand-accent text-white px-2.5 py-1 rounded-full">
          {featuredLabel}
        </span>
      </div>
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.slice(0, 2).map((tag) => (
            <span key={tag.slug} className="text-xs text-brand-muted bg-gray-100 px-2 py-0.5 rounded-full">
              {tag.name}
            </span>
          ))}
        </div>
        <h2 className="font-display text-xl font-bold text-brand-text leading-snug mb-3 group-hover:text-brand-accent transition-colors duration-150">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-brand-muted text-sm leading-relaxed mb-4 flex-1">{post.excerpt}</p>
        )}
        <div className="flex items-center justify-between text-xs text-brand-muted mt-auto pt-3 border-t border-gray-100">
          <span>{post.authorName ?? "Editorial Team"}</span>
          <span>{formatDate(post.publishedAt, locale)}</span>
        </div>
        <span className="text-sm font-medium text-brand-accent mt-3">{readMoreLabel}</span>
      </div>
    </Link>
  );
}

function PostCard({ post, locale }: { post: BlogPostSummary; locale: string }) {
  return (
    <Link
      href={`/blog/${post.slug}` as any}
      className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
      </div>
      <div className="flex-1 p-5 flex flex-col">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.tags.slice(0, 2).map((tag) => (
              <span key={tag.slug} className="text-xs text-brand-muted bg-gray-100 px-2 py-0.5 rounded-full">
                {tag.name}
              </span>
            ))}
          </div>
        )}
        <h2 className="font-display text-lg font-bold text-brand-text leading-snug mb-2 group-hover:text-brand-accent transition-colors duration-150">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-brand-muted text-sm leading-relaxed mb-4 flex-1 line-clamp-3">{post.excerpt}</p>
        )}
        <div className="flex items-center justify-between text-xs text-brand-muted mt-auto pt-3 border-t border-gray-100">
          <span>{post.authorName ?? "Editorial Team"}</span>
          <span>{formatDate(post.publishedAt, locale)}</span>
        </div>
      </div>
    </Link>
  );
}
