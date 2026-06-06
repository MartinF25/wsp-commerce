import { Link } from "@/i18n/navigation";

export interface BlogPostCtaProps {
  heading: string;
  subtext?: string;
  primaryLabel: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  /** "light" = gray-50 bg | "dark" = anthracite bg | "accent" = green bg */
  variant?: "light" | "dark" | "accent";
}

export function BlogPostCta({
  heading,
  subtext,
  primaryLabel,
  primaryHref = "/kontakt",
  secondaryLabel,
  secondaryHref = "/blog",
  variant = "light",
}: BlogPostCtaProps) {
  const bg: Record<typeof variant, string> = {
    light: "bg-gray-50 border-t border-gray-100",
    dark: "bg-brand-text",
    accent: "bg-brand-accent",
  };

  const headingCls: Record<typeof variant, string> = {
    light: "text-brand-text",
    dark: "text-white",
    accent: "text-white",
  };

  const subtextCls: Record<typeof variant, string> = {
    light: "text-brand-muted",
    dark: "text-gray-400",
    accent: "text-green-50",
  };

  const primaryBtnCls: Record<typeof variant, string> = {
    light: "bg-brand-accent text-white hover:bg-green-600",
    dark: "bg-brand-accent text-white hover:bg-green-600",
    accent: "bg-white text-brand-accent hover:bg-green-50",
  };

  const secondaryBtnCls: Record<typeof variant, string> = {
    light: "border border-gray-200 text-brand-muted hover:border-gray-400 hover:text-brand-text",
    dark: "border border-white/20 text-white/70 hover:border-white hover:text-white",
    accent: "border border-white/30 text-white/80 hover:border-white hover:text-white",
  };

  return (
    <div className={`${bg[variant]} py-16`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className={`font-display text-2xl sm:text-3xl font-bold ${headingCls[variant]} mb-3`}>
          {heading}
        </h2>
        {subtext && (
          <p className={`${subtextCls[variant]} text-base max-w-xl mx-auto mb-8`}>{subtext}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={primaryHref as any}
            className={`inline-block font-semibold px-8 py-3.5 rounded-xl transition-colors duration-150 ${primaryBtnCls[variant]}`}
          >
            {primaryLabel}
          </Link>
          {secondaryLabel && (
            <Link
              href={secondaryHref as any}
              className={`inline-block font-semibold px-8 py-3.5 rounded-xl transition-colors duration-150 ${secondaryBtnCls[variant]}`}
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
