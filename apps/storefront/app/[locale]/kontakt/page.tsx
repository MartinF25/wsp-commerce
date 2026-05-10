import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { KontaktForm } from "./KontaktForm";
import { fetchBlogPosts } from "@/lib/blog";

// ─── Social-Media-Links (hier anpassen) ──────────────────────────────────────
const SOCIAL_LINKS = {
  instagram: "https://instagram.com/solarwind_official",
  linkedin: "https://linkedin.com/company/solarwind",
  youtube: "https://youtube.com/@solarwind",
} as const;

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "kontakt" });
  const canonicalUrl = params.locale === "de" ? `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/kontakt` : `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/${params.locale}/kontakt`;
  return {
    title: `${t("breadcrumb")} – Solarzaun & SkyWind`,
    description: t("sub"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        de: `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/kontakt`,
        en: `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/en/kontakt`,
        es: `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/es/kontakt`,
      },
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

export default async function KontaktPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "kontakt" });
  const processSteps = t.raw("process_steps") as { number: string; title: string; description: string }[];
  const expectations = t.raw("expectations") as string[];

  // Blog-Beiträge für Marketing-Sektion – graceful fallback wenn API nicht erreichbar
  const { items: recentPosts } = await fetchBlogPosts({ limit: 3 }).catch(() => ({
    items: [],
    total: 0,
    limit: 3,
    offset: 0,
  }));

  const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://wsp-solar.de";

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "WSP Solarenergie",
            url: BASE,
            description: "Beratung und Installation von Solarzaun und SkyWind Kleinwindanlagen für nachhaltige Energie.",
            address: {
              "@type": "PostalAddress",
              addressCountry: "DE",
            },
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              url: `${BASE}/kontakt`,
              availableLanguage: ["German", "English", "Spanish"],
            },
            areaServed: "Deutschland",
            serviceType: ["Solarzaun", "SkyWind Kleinwindanlagen", "Kombilösungen"],
          }),
        }}
      />

      {/* ── Hero ── */}
      <section className="py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-brand-muted mb-8">
            <Link href="/" className="hover:text-brand-text transition-colors duration-150">
              {t("breadcrumb_home")}
            </Link>
            <span>/</span>
            <span className="text-brand-text">{t("breadcrumb")}</span>
          </nav>

          <div className="max-w-2xl">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">
              {t("eyebrow")}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-text leading-tight mb-5">
              {t("h1_line1")}<br />{t("h1_line2")}
            </h1>
            <p className="text-lg text-brand-muted leading-relaxed">{t("sub")}</p>
          </div>
        </div>
      </section>

      {/* ── Kontakt-Info-Strip ── */}
      <div className="border-b border-gray-100 bg-gray-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Adresse */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-accent/10 flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1">
                  {t("info_address_label")}
                </p>
                <p className="text-sm text-brand-text font-medium">{t("info_address_line1")}</p>
                <p className="text-sm text-brand-muted">{t("info_address_line2")}</p>
                <p className="text-sm text-brand-muted">{t("info_address_line3")}</p>
              </div>
            </div>

            {/* Telefon */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-accent/10 flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1">
                  {t("info_phone_label")}
                </p>
                <a
                  href={`tel:${t("info_phone_value").replace(/[\s-]/g, "")}`}
                  className="text-sm text-brand-text font-medium hover:text-brand-accent transition-colors duration-150"
                >
                  {t("info_phone_value")}
                </a>
              </div>
            </div>

            {/* E-Mail */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-accent/10 flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1">
                  {t("info_email_label")}
                </p>
                <a
                  href={`mailto:${t("info_email_value")}`}
                  className="text-sm text-brand-text font-medium hover:text-brand-accent transition-colors duration-150 break-all"
                >
                  {t("info_email_value")}
                </a>
              </div>
            </div>

            {/* Erreichbarkeit */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-accent/10 flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1">
                  {t("info_hours_label")}
                </p>
                <p className="text-sm text-brand-text font-medium">{t("info_hours_value")}</p>
                <p className="text-xs text-brand-accent mt-1 font-medium">
                  {t("info_response_label")}: {t("info_response_value")}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Formular + Sidebar ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 lg:gap-20">

            {/* Formular */}
            <div className="lg:col-span-3 order-1 lg:order-1">
              <KontaktForm />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 order-2 lg:order-2 space-y-10">

              {/* Ablauf */}
              <div>
                <h2 className="font-display font-semibold text-brand-text text-xl mb-5">
                  {t("process_h2")}
                </h2>
                <ol className="space-y-5">
                  {processSteps.map((step) => (
                    <li key={step.number} className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-accent/10 text-brand-accent font-display font-bold text-sm flex items-center justify-center mt-0.5">
                        {step.number}
                      </span>
                      <div>
                        <p className="font-medium text-brand-text text-sm mb-1">{step.title}</p>
                        <p className="text-sm text-brand-muted leading-relaxed">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Erwartungen */}
              <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                <h3 className="font-display font-semibold text-brand-text">{t("expectations_h3")}</h3>
                <ul className="space-y-2">
                  {expectations.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-brand-muted">
                      <span className="mt-0.5 flex-shrink-0 text-brand-accent font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="font-display font-semibold text-brand-text mb-4">{t("social_title")}</h3>
                <div className="flex items-center gap-3">

                  {/* Instagram */}
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("social_instagram")}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-brand-accent/10 hover:text-brand-accent text-brand-muted flex items-center justify-center transition-colors duration-150"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={SOCIAL_LINKS.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("social_linkedin")}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-brand-accent/10 hover:text-brand-accent text-brand-muted flex items-center justify-center transition-colors duration-150"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>

                  {/* YouTube */}
                  <a
                    href={SOCIAL_LINKS.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("social_youtube")}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-brand-accent/10 hover:text-brand-accent text-brand-muted flex items-center justify-center transition-colors duration-150"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Marketing: Blog-Beiträge ── */}
      <section className="border-t border-gray-100 bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">
                {t("marketing_blog_title")}
              </p>
              <p className="text-brand-muted text-sm max-w-lg">{t("marketing_blog_sub")}</p>
            </div>
            <Link
              href="/blog"
              className="text-sm font-semibold text-brand-muted hover:text-brand-accent transition-colors duration-150 hidden sm:block whitespace-nowrap ml-8"
            >
              {t("marketing_blog_all")}
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p className="text-sm text-brand-muted max-w-sm mx-auto">{t("marketing_blog_empty")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  {post.coverImageUrl ? (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-brand-accent/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 p-5 flex flex-col">
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span key={tag.slug} className="text-xs font-medium text-brand-accent bg-green-50 px-2 py-0.5 rounded-full">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <h3 className="font-display text-base font-bold text-brand-text leading-snug mb-2 flex-1 group-hover:text-brand-accent transition-colors duration-150">
                      {post.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-brand-muted mt-3 pt-3 border-t border-gray-100">
                      <span>{post.publishedAt ? formatDate(post.publishedAt, params.locale) : ""}</span>
                      <span className="font-medium text-brand-accent group-hover:underline">{t("marketing_blog_read")} →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 sm:hidden text-center">
            <Link href="/blog" className="text-sm font-semibold text-brand-muted hover:text-brand-accent">
              {t("marketing_blog_all")}
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
