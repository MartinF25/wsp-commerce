import Image from "next/image";
import { Link } from "@/i18n/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BlogPostHeroProps {
  title: string;
  excerpt?: string | null;
  category?: { slug: string; name: string } | null;
  tags?: { slug: string; name: string }[];
  authorName?: string | null;
  publishedAt?: string | null;
  readingTimeMinutes?: number | null;
  coverImageUrl?: string | null;
  coverImageAlt?: string;
  breadcrumb: BreadcrumbItem[];
  locale: string;
  readingTimeLabel?: string;
  fallbackNotice?: string;
}

export function BlogPostHero({
  title,
  excerpt,
  category,
  tags = [],
  authorName,
  publishedAt,
  readingTimeMinutes,
  coverImageUrl,
  coverImageAlt,
  breadcrumb,
  locale,
  readingTimeLabel,
  fallbackNotice,
}: BlogPostHeroProps) {
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString(locale, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <header>
      {/* Cover image – full bleed with gradient overlay */}
      {coverImageUrl && (
        <div className="relative w-full aspect-[21/8] overflow-hidden bg-gray-900">
          <Image
            src={coverImageUrl}
            alt={coverImageAlt ?? title}
            fill
            className="object-cover opacity-75"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/10 to-gray-900/50" />
        </div>
      )}

      {/* No-image fallback: subtle technical grid background */}
      {!coverImageUrl && (
        <div className="w-full border-b border-gray-100 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] bg-white" />
      )}

      {/* Header content area */}
      <div className={`${coverImageUrl ? "bg-white" : "bg-white"} py-8 pb-10 border-b border-gray-100`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-brand-muted flex-wrap mb-7">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden className="text-gray-300">/</span>}
                {item.href ? (
                  <Link
                    href={item.href as any}
                    className="hover:text-brand-text transition-colors duration-150"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-brand-text font-medium truncate max-w-[220px]">{item.label}</span>
                )}
              </span>
            ))}
          </nav>

          {/* Category badge + tag chips */}
          {(category || tags.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {category && (
                <Link
                  href={`/blog?category=${category.slug}` as any}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent bg-green-50 border border-green-100 px-3 py-1 rounded-full hover:bg-green-100 transition-colors duration-150"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent inline-block" />
                  {category.name}
                </Link>
              )}
              {tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="inline-flex items-center text-xs font-medium text-brand-muted bg-gray-100 px-3 py-1 rounded-full"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* H1 */}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-text leading-tight mb-5">
            {title}
          </h1>

          {/* Excerpt / lead paragraph – with green left accent */}
          {excerpt && (
            <p className="text-lg sm:text-xl text-brand-muted leading-relaxed mb-7 font-light border-l-[3px] border-brand-accent pl-5">
              {excerpt}
            </p>
          )}

          {/* Byline row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-brand-muted border-t border-gray-100 pt-5">
            {authorName && (
              <span className="flex items-center gap-2 font-medium text-brand-text">
                {/* Author avatar: initial circle */}
                <span className="w-6 h-6 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-[10px] font-bold text-brand-accent select-none">
                  {authorName[0]?.toUpperCase()}
                </span>
                {authorName}
              </span>
            )}

            {date && (
              <time dateTime={publishedAt ?? undefined} className="tabular-nums">
                {date}
              </time>
            )}

            {readingTimeMinutes != null && (
              <span className="flex items-center gap-1.5">
                <span className="text-brand-accent font-bold">—</span>
                <span className="font-mono text-xs tracking-tight bg-gray-100 px-2 py-0.5 rounded">
                  {readingTimeLabel ?? `${readingTimeMinutes} min`}
                </span>
              </span>
            )}
          </div>

          {/* Fallback locale notice */}
          {fallbackNotice && (
            <div className="mt-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
              {fallbackNotice}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
