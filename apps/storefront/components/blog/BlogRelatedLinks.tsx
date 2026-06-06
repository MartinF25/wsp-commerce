import { Link } from "@/i18n/navigation";

export interface RelatedLink {
  href: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface BlogRelatedLinksProps {
  title?: string;
  eyebrow?: string;
  links: RelatedLink[];
}

export function BlogRelatedLinks({
  title = "Related Guides & Products",
  eyebrow = "Explore",
  links,
}: BlogRelatedLinksProps) {
  if (links.length === 0) return null;

  return (
    <aside className="border-t border-gray-100 bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold text-brand-accent uppercase tracking-widest mb-2">
          {eyebrow}
        </p>
        <h2 className="font-display text-xl font-bold text-brand-text mb-6">{title}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href as any}
              className="group flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-accent hover:shadow-sm transition-all duration-150"
            >
              {link.icon && (
                <span className="text-lg shrink-0 mt-0.5 leading-none" aria-hidden>
                  {link.icon}
                </span>
              )}
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-sm text-brand-text group-hover:text-brand-accent transition-colors duration-150 mb-0.5 leading-snug">
                  {link.label}
                </span>
                {link.description && (
                  <span className="block text-xs text-brand-muted leading-snug">
                    {link.description}
                  </span>
                )}
              </span>
              <span
                className="text-brand-muted group-hover:text-brand-accent transition-colors duration-150 text-sm shrink-0 mt-0.5"
                aria-hidden
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
