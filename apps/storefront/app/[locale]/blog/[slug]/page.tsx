import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import { fetchBlogPost } from "@/lib/blog";
import type { BlogLocale } from "@/lib/blog";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

type Props = { params: { slug: string; locale: string } };

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
    alternates: { languages: alternates },
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

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  const locale = params.locale as BlogLocale;
  const post = await fetchBlogPost(params.slug, locale);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: post.authorName ?? t("author_default") },
    datePublished: post.publishedAt,
    url: `${STOREFRONT_URL}/${locale === "de" ? "" : `${locale}/`}blog/${post.slug}`,
    ...(post.coverImageUrl && { image: post.coverImageUrl }),
  };

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t("breadcrumb_home"), item: STOREFRONT_URL },
              { "@type": "ListItem", position: 2, name: t("breadcrumb_blog"), item: `${STOREFRONT_URL}/blog` },
              ...(post.category
                ? [{ "@type": "ListItem", position: 3, name: post.category.name, item: `${STOREFRONT_URL}/blog?category=${post.category.slug}` },
                   { "@type": "ListItem", position: 4, name: post.title, item: `${STOREFRONT_URL}/${locale === "de" ? "" : `${locale}/`}blog/${post.slug}` }]
                : [{ "@type": "ListItem", position: 3, name: post.title, item: `${STOREFRONT_URL}/${locale === "de" ? "" : `${locale}/`}blog/${post.slug}` }]),
            ],
          }),
        }}
      />

      {/* ── Breadcrumb ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-2 text-sm text-brand-muted flex-wrap">
          <Link href="/" className="hover:text-brand-text transition-colors duration-150">
            {t("breadcrumb_home")}
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-brand-text transition-colors duration-150">
            {t("breadcrumb_blog")}
          </Link>
          {post.category && (
            <>
              <span>/</span>
              <Link
                href={`/blog?category=${post.category.slug}`}
                className="hover:text-brand-text transition-colors duration-150"
              >
                {post.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-brand-text font-medium truncate max-w-[200px]">{post.title}</span>
        </nav>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ── Tags + Category ── */}
        {(post.tags.length > 0 || post.category) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.category && (
              <Link
                href={`/blog?category=${post.category.slug}`}
                className="text-xs font-semibold text-brand-accent bg-green-50 px-2.5 py-1 rounded-full hover:bg-green-100 transition-colors duration-150"
              >
                {post.category.name}
              </Link>
            )}
            {post.tags.map((tag) => (
              <span
                key={tag.slug}
                className="text-xs font-medium text-brand-muted bg-gray-100 px-2.5 py-1 rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* ── Title ── */}
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-text leading-tight mb-4">
          {post.title}
        </h1>

        {/* ── Byline ── */}
        <div className="flex items-center gap-3 text-sm text-brand-muted mb-8 pb-6 border-b border-gray-100">
          <span>{post.authorName ?? t("author_default")}</span>
          {post.publishedAt && (
            <>
              <span aria-hidden>·</span>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, params.locale)}</time>
            </>
          )}
          {post.readingTimeMinutes != null && (
            <>
              <span aria-hidden>·</span>
              <span>{t("reading_time", { count: post.readingTimeMinutes })}</span>
            </>
          )}
        </div>

        {/* ── Fallback notice ── */}
        {post.fallbackUsed && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
            {t("fallback_notice")}
          </div>
        )}

        {/* ── Cover image ── */}
        {post.coverImageUrl && (
          <div className="relative mb-10 rounded-2xl overflow-hidden aspect-[16/7]">
            <Image
              src={post.coverImageUrl}
              alt={post.coverImageAlt ?? post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        )}

        {/* ── Excerpt (lead) ── */}
        {post.excerpt && (
          <p className="text-xl text-brand-muted leading-relaxed mb-8 font-light">{post.excerpt}</p>
        )}

        {/* ── Body ── */}
        <div className="prose prose-lg max-w-none text-brand-text prose-headings:font-display prose-headings:text-brand-text prose-a:text-brand-accent prose-strong:text-brand-text prose-img:rounded-xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        {/* ── Available in other locales ── */}
        {post.availableLocales.length > 1 && (
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-3">
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
      </article>

      {/* ── CTA ── */}
      <div className="border-t border-gray-100 bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl font-bold text-brand-text mb-3">{t("interest_h2")}</h2>
          <p className="text-brand-muted mb-6">{t("interest_sub")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/kontakt"
              className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150"
            >
              {t("cta_btn")}
            </Link>
            <Link
              href="/blog"
              className="inline-block border border-gray-200 text-brand-muted font-semibold px-8 py-3 rounded-xl hover:border-gray-400 hover:text-brand-text transition-colors duration-150"
            >
              {t("back")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const LOCALE_LABELS: Record<string, string> = {
  de: "Deutsch",
  en: "English",
  es: "Español",
};
