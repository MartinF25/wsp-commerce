import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchBlogPost } from "@/lib/blog";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

type Props = { params: { slug: string; locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchBlogPost(params.slug);
  if (!post) return { title: "Not found" };

  return {
    title: `${post.title} | Blog – Solarzaun & SkyWind`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url: `${STOREFRONT_URL}/blog/${post.slug}`,
      type: "article",
      ...(post.cover_image && { images: [{ url: post.cover_image }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
      ...(post.cover_image && { images: [post.cover_image] }),
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
  const post = await fetchBlogPost(params.slug);
  if (!post) notFound();

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt ?? undefined,
            author: { "@type": "Person", name: post.author ?? t("author_default") },
            datePublished: post.published_at,
            dateModified: post.created_at,
            url: `${STOREFRONT_URL}/blog/${post.slug}`,
            ...(post.cover_image && { image: post.cover_image }),
          }),
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-2 text-sm text-brand-muted flex-wrap">
          <Link href="/" className="hover:text-brand-text transition-colors duration-150">{t("breadcrumb_home")}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-brand-text transition-colors duration-150">{t("breadcrumb_blog")}</Link>
          <span>/</span>
          <span className="text-brand-text font-medium truncate">{post.title}</span>
        </nav>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs font-medium text-brand-accent bg-green-50 px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-text leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 text-sm text-brand-muted mb-8 pb-6 border-b border-gray-100">
          <span>{post.author ?? t("author_default")}</span>
          {post.published_at && (
            <>
              <span>·</span>
              <time dateTime={post.published_at}>{formatDate(post.published_at, params.locale)}</time>
            </>
          )}
        </div>

        {post.cover_image && (
          <div className="mb-10 rounded-2xl overflow-hidden aspect-[16/7]">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {post.excerpt && (
          <p className="text-xl text-brand-muted leading-relaxed mb-8 font-light">{post.excerpt}</p>
        )}

        <div
          className="prose prose-lg max-w-none text-brand-text prose-headings:font-display prose-headings:text-brand-text prose-a:text-brand-accent prose-strong:text-brand-text"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

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
