import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchBlogPosts } from "@/lib/blog";

type Props = { params: { locale: string } };

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

export default async function BlogListPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  const { items: posts } = await fetchBlogPosts({ limit: 50 }).catch(() => ({
    items: [],
    total: 0,
    limit: 50,
    offset: 0,
  }));

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-brand-accent uppercase tracking-widest mb-3">
            {t("eyebrow")}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-text leading-tight mb-4">
            {t("h1")}
          </h1>
          <p className="text-brand-muted text-lg max-w-2xl">{t("sub")}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-brand-muted text-lg mb-2">{t("no_posts")}</p>
            <p className="text-brand-muted text-sm">{t("no_posts_soon")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {post.cover_image ? (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707" />
                    </svg>
                  </div>
                )}

                <div className="flex-1 p-5 flex flex-col">
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs font-medium text-brand-accent bg-green-50 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="font-display text-lg font-bold text-brand-text leading-snug mb-2 group-hover:text-brand-accent transition-colors duration-150">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-brand-muted text-sm leading-relaxed mb-4 flex-1">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-brand-muted mt-auto pt-3 border-t border-gray-100">
                    <span>{post.author ?? t("author_default")}</span>
                    <span>{formatDate(post.published_at, params.locale)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

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
