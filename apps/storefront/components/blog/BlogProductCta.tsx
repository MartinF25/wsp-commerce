import Image from "next/image";
import { Link } from "@/i18n/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlogProductCtaPreset =
  | "off-grid"
  | "hybrid"
  | "renewable"
  | "independence";

/**
 * "inline"  – compact card, drop anywhere in article flow (between H2 sections)
 * "section" – full-width panel, use at end of article or between major topics
 */
export type BlogProductCtaVariant = "inline" | "section";

export interface BlogProductCtaProps {
  preset: BlogProductCtaPreset;
  variant?: BlogProductCtaVariant;
  /** Override preset headline */
  headline?: string;
  /** Override preset body (2-3 sentences max) */
  body?: string;
  /** Override preset CTA button label */
  ctaLabel?: string;
  /** Override preset CTA href */
  ctaHref?: string;
  /** Optional secondary link */
  secondaryLabel?: string;
  secondaryHref?: string;
  /** Optional product image */
  imageUrl?: string;
  imageAlt?: string;
}

// ─── Preset data ──────────────────────────────────────────────────────────────

interface PresetData {
  icon: string;
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  /** Full Tailwind class strings — required for the content scanner */
  style: {
    border: string;
    bg: string;
    eyebrowText: string;
    badge: string;
    badgeBorder: string;
    buttonBg: string;
    buttonHover: string;
  };
}

const PRESETS: Record<BlogProductCtaPreset, PresetData> = {
  "off-grid": {
    icon: "🔋",
    eyebrow: "Off-Grid Solution",
    headline: "Power Your Off-Grid Life with Wind",
    body: "The SkyWind NG generates clean electricity around the clock — including at night and in overcast conditions. Purpose-built for cabins, farms and standalone power systems.",
    ctaLabel: "See the SkyWind NG →",
    ctaHref: "/skywind-ng",
    style: {
      border: "border-l-blue-400",
      bg: "bg-blue-50/60",
      eyebrowText: "text-blue-700",
      badge: "bg-blue-100",
      badgeBorder: "border-blue-200",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
      buttonHover: "hover:text-blue-700 hover:border-blue-400",
    },
  },

  "hybrid": {
    icon: "☀️",
    eyebrow: "Hybrid Energy System",
    headline: "Wind + Solar: The Perfect Combination",
    body: "Solar peaks in summer. Wind picks up in autumn and winter. The SkyWind NG pairs naturally with solar panels — covering the gaps and increasing your year-round self-sufficiency.",
    ctaLabel: "See the SkyWind NG →",
    ctaHref: "/skywind-ng",
    style: {
      border: "border-l-amber-400",
      bg: "bg-amber-50/60",
      eyebrowText: "text-amber-700",
      badge: "bg-amber-100",
      badgeBorder: "border-amber-200",
      buttonBg: "bg-amber-500 hover:bg-amber-600",
      buttonHover: "hover:text-amber-700 hover:border-amber-400",
    },
  },

  "renewable": {
    icon: "🌿",
    eyebrow: "Renewable Energy",
    headline: "Your Own Renewable Energy Source",
    body: "Small enough for a residential plot, powerful enough to make a real difference. The SkyWind NG brings practical wind energy to homes, farms and small businesses — with no grid dependency required.",
    ctaLabel: "See the SkyWind NG →",
    ctaHref: "/skywind-ng",
    style: {
      border: "border-l-green-400",
      bg: "bg-green-50/60",
      eyebrowText: "text-green-700",
      badge: "bg-green-100",
      badgeBorder: "border-green-200",
      buttonBg: "bg-green-600 hover:bg-green-700",
      buttonHover: "hover:text-green-700 hover:border-green-400",
    },
  },

  "independence": {
    icon: "⚡",
    eyebrow: "Energy Independence",
    headline: "Every kWh You Generate Is One You Don't Pay For",
    body: "The SkyWind NG is a practical step toward genuine energy independence. Reduce your grid reliance, lower your electricity bills, and take control of your energy supply — at home, on a farm, or at a remote site.",
    ctaLabel: "See the SkyWind NG →",
    ctaHref: "/skywind-ng",
    style: {
      border: "border-l-emerald-400",
      bg: "bg-emerald-50/60",
      eyebrowText: "text-emerald-700",
      badge: "bg-emerald-100",
      badgeBorder: "border-emerald-200",
      buttonBg: "bg-emerald-600 hover:bg-emerald-700",
      buttonHover: "hover:text-emerald-700 hover:border-emerald-400",
    },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BlogProductCta({
  preset,
  variant = "inline",
  headline,
  body,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref = "/kontakt",
  imageUrl,
  imageAlt,
}: BlogProductCtaProps) {
  const p = PRESETS[preset];
  const resolvedHeadline = headline ?? p.headline;
  const resolvedBody = body ?? p.body;
  const resolvedCtaLabel = ctaLabel ?? p.ctaLabel;
  const resolvedCtaHref = ctaHref ?? p.ctaHref;

  if (variant === "section") {
    return (
      <SectionVariant
        preset={p}
        headline={resolvedHeadline}
        body={resolvedBody}
        ctaLabel={resolvedCtaLabel}
        ctaHref={resolvedCtaHref}
        secondaryLabel={secondaryLabel}
        secondaryHref={secondaryHref}
        imageUrl={imageUrl}
        imageAlt={imageAlt ?? resolvedHeadline}
      />
    );
  }

  return (
    <InlineVariant
      preset={p}
      headline={resolvedHeadline}
      body={resolvedBody}
      ctaLabel={resolvedCtaLabel}
      ctaHref={resolvedCtaHref}
      secondaryLabel={secondaryLabel}
      secondaryHref={secondaryHref}
      imageUrl={imageUrl}
      imageAlt={imageAlt ?? resolvedHeadline}
    />
  );
}

// ─── Inline variant ───────────────────────────────────────────────────────────

interface VariantProps {
  preset: PresetData;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref: string;
  imageUrl?: string;
  imageAlt: string;
}

function InlineVariant({
  preset: p,
  headline,
  body,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  imageUrl,
  imageAlt,
}: VariantProps) {
  return (
    <aside
      className={`
        not-prose my-8
        flex items-start gap-5
        border-l-4 ${p.style.border}
        ${p.style.bg}
        rounded-r-2xl p-6
        border border-l-4 border-gray-100
      `}
      aria-label="Product recommendation"
    >
      {/* Text content */}
      <div className="flex-1 min-w-0">
        {/* Eyebrow */}
        <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 ${p.style.eyebrowText}`}>
          <span aria-hidden>{p.icon}</span>
          {p.eyebrow}
        </p>

        {/* Headline */}
        <h3 className="font-display text-lg sm:text-xl font-bold text-brand-text leading-snug mb-2">
          {headline}
        </h3>

        {/* Body */}
        <p className="text-sm text-brand-muted leading-relaxed mb-4">{body}</p>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={ctaHref as any}
            className={`inline-block text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-colors duration-150 ${p.style.buttonBg}`}
          >
            {ctaLabel}
          </Link>
          {secondaryLabel && (
            <Link
              href={secondaryHref as any}
              className={`inline-block text-sm font-medium text-brand-muted border border-gray-200 px-5 py-2.5 rounded-xl transition-colors duration-150 ${p.style.buttonHover}`}
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>

      {/* Optional image */}
      {imageUrl && (
        <div className="hidden sm:block shrink-0 relative w-28 h-28 rounded-xl overflow-hidden border border-gray-100">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>
      )}
    </aside>
  );
}

// ─── Section variant ──────────────────────────────────────────────────────────

function SectionVariant({
  preset: p,
  headline,
  body,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  imageUrl,
  imageAlt,
}: VariantProps) {
  return (
    <aside
      className={`not-prose my-12 rounded-2xl overflow-hidden border border-gray-100 ${p.style.bg}`}
      aria-label="Product recommendation"
    >
      <div className="flex flex-col sm:flex-row items-stretch">

        {/* Text column */}
        <div className="flex-1 p-8 sm:p-10">
          {/* Eyebrow badge */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border mb-5 ${p.style.badge} ${p.style.badgeBorder} ${p.style.eyebrowText}`}
          >
            <span aria-hidden>{p.icon}</span>
            {p.eyebrow}
          </span>

          {/* Headline */}
          <h3 className="font-display text-xl sm:text-2xl font-bold text-brand-text leading-snug mb-3">
            {headline}
          </h3>

          {/* Body */}
          <p className="text-brand-muted leading-relaxed mb-6 max-w-lg">{body}</p>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={ctaHref as any}
              className={`inline-block text-sm font-semibold text-white px-6 py-3 rounded-xl transition-colors duration-150 ${p.style.buttonBg}`}
            >
              {ctaLabel}
            </Link>
            {secondaryLabel && (
              <Link
                href={secondaryHref as any}
                className={`inline-block text-sm font-medium text-brand-muted border border-gray-200 bg-white/70 px-6 py-3 rounded-xl transition-colors duration-150 ${p.style.buttonHover}`}
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>

        {/* Optional image column */}
        {imageUrl && (
          <div className="hidden sm:block shrink-0 relative w-56 self-stretch">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="224px"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
