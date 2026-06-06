import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { BlogPostSummary } from "@/lib/blog";

export interface BlogRelatedArticlesProps {
  title?: string;
  viewAllLabel?: string;
  articles: BlogPostSummary[];
  locale: string;
}

export function BlogRelatedArticles({
  title = "Related Articles",
  viewAllLabel = "View all articles →",
  articles,
  locale,
}: BlogRelatedArticlesProps) {
  return (
    <section className="border-t border-gray-100 bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-brand-text">{title}</h2>
          <Link
            href="/blog"
            className="text-sm font-medium text-brand-muted hover:text-brand-accent transition-colors duration-150"
          >
            {viewAllLabel}
          </Link>
        </div>

        {articles.length === 0 ? (
          <PlaceholderGrid />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {articles.slice(0, 3).map((post) => (
              <ArticleCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Skeleton placeholder shown when no related articles are provided ─────────

function PlaceholderGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[
        { label: "Micro Wind Energy", color: "from-green-50 to-emerald-100" },
        { label: "Off-Grid Power", color: "from-blue-50 to-sky-100" },
        { label: "Hybrid Solar Wind", color: "from-amber-50 to-yellow-100" },
      ].map(({ label, color }) => (
        <div
          key={label}
          className="flex flex-col bg-white border border-dashed border-gray-200 rounded-xl overflow-hidden"
        >
          <div className={`aspect-[16/9] bg-gradient-to-br ${color} flex items-center justify-center`}>
            <span className="text-2xl opacity-40" aria-hidden>
              📄
            </span>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <span className="text-xs font-medium text-brand-accent">{label}</span>
            <div className="h-3 bg-gray-100 rounded w-4/5" />
            <div className="h-3 bg-gray-100 rounded w-3/5" />
            <span className="text-xs text-brand-muted mt-1 italic">Coming soon</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Real article card ────────────────────────────────────────────────────────

function ArticleCard({ post, locale }: { post: BlogPostSummary; locale: string }) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/blog/${post.slug}` as any}
      className="group flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-brand-accent hover:shadow-sm transition-all duration-150"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 300px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-50 via-gray-50 to-gray-100" />
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col">
        {post.category && (
          <span className="text-xs font-semibold text-brand-accent mb-1.5">{post.category.name}</span>
        )}
        <h3 className="font-display text-sm font-bold text-brand-text leading-snug mb-2 group-hover:text-brand-accent transition-colors duration-150 line-clamp-2">
          {post.title}
        </h3>
        {date && (
          <time dateTime={post.publishedAt ?? undefined} className="text-xs text-brand-muted mt-auto">
            {date}
          </time>
        )}
      </div>
    </Link>
  );
}
