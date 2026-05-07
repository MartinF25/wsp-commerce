import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchBlogPosts, fetchBlogCategories } from "@/lib/blog";
import type { BlogPostSummary, BlogLocale } from "@/lib/blog";

type Props = {
  params: { locale: string };
  searchParams: { category?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  return { title: t("meta_title"), description: t("meta_desc") };
}

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogListPage({ params, searchParams }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  const locale = params.locale as BlogLocale;
  const selectedCategory = searchParams.category;

  const [{ items: posts }, categories] = await Promise.all([
    fetchBlogPosts({
      locale,
      limit: 50,
      category: selectedCategory,
    }).catch(() => ({ items: [] as BlogPostSummary[], total: 0, limit: 50, offset: 0 })),
    fetchBlogCategories(locale).catch(() => []),
  ]);

  const featuredPosts = !selectedCategory ? posts.filter((p) => p.featured) : [];
  const regularPosts = !selectedCategory
    ? posts.filter((p) => !p.featured)
    : posts;

  return (
    <div className="bg-white min-h-screen">
      {/* ── Hero ── */}
      <div className="bg-gray-50 border-b border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-brand-muted mb-6">
            <Link href="/" className="hover:text-brand-text transition-colors duration-150">
              {t("breadcrumb_home")}
            </Link>
            <span>/</span>
            <span className="text-brand-text">{t("breadcrumb_blog")}</span>
          </nav>
          <p className="text-xs font-semibold text-brand-accent uppercase tracking-widest mb-3">
            {t("eyebrow")}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-text leading-tight mb-4">
            {t("h1")}
          </h1>
          <p className="text-brand-muted text-lg max-w-2xl">{t("sub")}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ── Kategorie-Filter ── */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <Link
              href="/blog"
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-150 ${
                !selectedCategory
                  ? "bg-brand-accent border-brand-accent text-white"
                  : "bg-white border-gray-200 text-brand-muted hover:border-brand-accent hover:text-brand-accent"
              }`}
            >
              {t("all_categories")}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-150 ${
                  selectedCategory === cat.slug
                    ? "bg-brand-accent border-brand-accent text-white"
                    : "bg-white border-gray-200 text-brand-muted hover:border-brand-accent hover:text-brand-accent"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-brand-muted text-lg mb-2">{t("no_posts")}</p>
            <p className="text-brand-muted text-sm">{t("no_posts_soon")}</p>
          </div>
        ) : (
          <>
            {/* ── Featured Posts ── */}
            {featuredPosts.length > 0 && (
              <section className="mb-14">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {featuredPosts.map((post) => (
                    <FeaturedCard key={post.id} post={post} locale={params.locale} t={t} />
                  ))}
                </div>
                {regularPosts.length > 0 && <hr className="mt-12 border-gray-100" />}
              </section>
            )}

            {/* ── Regular Posts ── */}
            {regularPosts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPosts.map((post) => (
                  <PostCard key={post.id} post={post} locale={params.locale} t={t} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CTA ── */}
      <div className="border-t border-gray-100 bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl font-bold text-brand-text mb-3">{t("cta_h2")}</h2>
          <p className="text-brand-muted mb-6">{t("cta_sub")}</p>
          <Link
            href="/kontakt"
            className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150"
          >
            {t("cta_btn")}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Karten-Komponenten ───────────────────────────────────────────────────────

type CardProps = {
  post: BlogPostSummary;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
};

function FeaturedCard({ post, locale, t }: CardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
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
          {t("featured_label")}
        </span>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <PostMeta post={post} locale={locale} t={t} />
        <h2 className="font-display text-xl font-bold text-brand-text leading-snug mb-3 group-hover:text-brand-accent transition-colors duration-150">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-brand-muted text-sm leading-relaxed mb-4 flex-1">{post.excerpt}</p>
        )}
        {post.fallbackUsed && <FallbackNotice t={t} />}
        <span className="text-sm font-medium text-brand-accent mt-auto">{t("read_more")}</span>
      </div>
    </Link>
  );
}

function PostCard({ post, locale, t }: CardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
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
        <PostMeta post={post} locale={locale} t={t} />
        <h2 className="font-display text-lg font-bold text-brand-text leading-snug mb-2 group-hover:text-brand-accent transition-colors duration-150">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-brand-muted text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
            {post.excerpt}
          </p>
        )}
        {post.fallbackUsed && <FallbackNotice t={t} />}
        <div className="flex items-center justify-between text-xs text-brand-muted mt-auto pt-3 border-t border-gray-100">
          <span>{post.authorName ?? t("author_default")}</span>
          <span>{formatDate(post.publishedAt, locale)}</span>
        </div>
      </div>
    </Link>
  );
}

function PostMeta({ post, locale, t }: CardProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {post.category && (
        <span className="text-xs font-medium text-brand-accent bg-green-50 px-2 py-0.5 rounded-full">
          {post.category.name}
        </span>
      )}
      {post.tags.slice(0, 2).map((tag) => (
        <span key={tag.slug} className="text-xs text-brand-muted bg-gray-100 px-2 py-0.5 rounded-full">
          {tag.name}
        </span>
      ))}
      {post.readingTimeMinutes != null && (
        <span className="text-xs text-brand-muted ml-auto">
          {t("reading_time", { count: post.readingTimeMinutes })}
        </span>
      )}
    </div>
  );
}

function FallbackNotice({ t }: { t: CardProps["t"] }) {
  return (
    <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mb-3">
      {t("fallback_notice")}
    </p>
  );
}
