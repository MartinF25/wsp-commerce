import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { fetchProducts, fetchCategories } from "@/lib/catalog";

export const dynamic = "force-dynamic";
import { fetchBlogPosts } from "@/lib/blog";
import type { BlogPostSummary } from "@/lib/blog";
import type { Locale } from "@/i18n/routing";
import type { ProductSummary, CategorySummary } from "@wsp/types";
import { OfferCountdown } from "@/components/storefront/offer-countdown";

const STOREFRONT_URL = "https://webshop.wsp-solarenergie.de";
const LOGO_URL = `${STOREFRONT_URL}/favicon.svg`;

const WIND_GUIDES = {
  de: [
    { href: "/skywind-ng", label: "SkyWind NG im Detail", desc: "Technische Daten, Modellvergleich und Ertragsprognosen." },
    { href: "/micro-wind-turbine", label: "Micro Wind Turbine Guide", desc: "Kompakte Windkraft für Eigenheim und Grundstück." },
    { href: "/small-wind-turbine-for-home", label: "Kleinwindanlage für Zuhause", desc: "Eigenstrom aus Wind – ganzjährig, Tag und Nacht." },
    { href: "/rooftop-wind-turbine", label: "Dach-Windkraftanlage", desc: "SkyWind NG auf dem Dach: Installation und Planung." },
    { href: "/off-grid-wind-turbine", label: "Off-Grid Windkraft", desc: "Autarke Energieversorgung mit Batteriespeicher." },
    { href: "/hybrid-solar-wind-system", label: "Solar-Wind-Hybridsystem", desc: "Solar und Wind kombiniert für maximale Autarkie." },
  ],
  en: [
    { href: "/skywind-ng", label: "SkyWind NG in Detail", desc: "Technical specs, model comparison and yield forecasts." },
    { href: "/micro-wind-turbine", label: "Micro Wind Turbine", desc: "Compact wind power for homes and properties." },
    { href: "/small-wind-turbine-for-home", label: "Small Wind Turbine for Home", desc: "Generate your own electricity — day and night, all year." },
    { href: "/rooftop-wind-turbine", label: "Rooftop Wind Turbine", desc: "SkyWind NG on the roof: installation and planning guide." },
    { href: "/off-grid-wind-turbine", label: "Off-Grid Wind Turbine", desc: "Independent energy supply with battery storage." },
    { href: "/hybrid-solar-wind-system", label: "Hybrid Solar Wind System", desc: "Solar and wind combined for maximum self-sufficiency." },
  ],
  es: [
    { href: "/skywind-ng", label: "SkyWind NG en detalle", desc: "Especificaciones técnicas, comparación de modelos y previsiones." },
    { href: "/micro-wind-turbine", label: "Micro aerogenerador", desc: "Energía eólica compacta para hogares y propiedades." },
    { href: "/small-wind-turbine-for-home", label: "Pequeña turbina para el hogar", desc: "Genera tu propia electricidad día y noche, todo el año." },
    { href: "/rooftop-wind-turbine", label: "Aerogenerador en tejado", desc: "SkyWind NG en tejado: instalación y planificación." },
    { href: "/off-grid-wind-turbine", label: "Turbina eólica autónoma", desc: "Suministro de energía independiente con almacenamiento." },
    { href: "/hybrid-solar-wind-system", label: "Sistema solar-eólico híbrido", desc: "Solar y eólico combinados para máxima autosuficiencia." },
  ],
};

export default async function HomePage({
  params,
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "home" });

  let products: ProductSummary[] = [];
  try {
    const result = await fetchProducts({ locale: params.locale, limit: 50 });
    products = result.items;
  } catch {
    // show page anyway
  }

  let blogPosts: BlogPostSummary[] = [];
  try {
    const blogResult = await fetchBlogPosts({ locale: params.locale as "de" | "en" | "es", limit: 3, featured: true });
    if (blogResult.items.length === 0) {
      const fallback = await fetchBlogPosts({ locale: params.locale as "de" | "en" | "es", limit: 3 });
      blogPosts = fallback.items;
    } else {
      blogPosts = blogResult.items;
    }
  } catch {
    // show page without blog section
  }

  let categories: CategorySummary[] = [];
  try {
    const allCategories = await fetchCategories(params.locale);
    categories = allCategories.filter((cat) => cat.parent_id === null);
  } catch {
    // show page without categories section
  }

  const benefits = t.raw("benefits") as { number: string; title: string; desc: string }[];
  const faqItems = t.raw("faq_items") as { q: string; a: string }[];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "WSP Solarenergie",
            url: STOREFRONT_URL,
            logo: LOGO_URL,
            description: "Experte für Solarzaun und SkyWind Kleinwindanlagen – nachhaltige Energie für Privat und Gewerbe.",
            address: { "@type": "PostalAddress", addressCountry: "DE" },
            contactPoint: { "@type": "ContactPoint", contactType: "customer service", availableLanguage: ["German", "English", "Spanish"], url: `${STOREFRONT_URL}/kontakt` },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "WSP Solarenergie",
            url: STOREFRONT_URL,
            potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${STOREFRONT_URL}/products?q={search_term_string}` }, "query-input": "required name=search_term_string" },
          }),
        }}
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden flex items-end" style={{ minHeight: "100svh" }}>
        <Image src="/images/hero-bg.png" alt="Modernes Haus mit SkyWind" fill className="object-cover object-center" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 pb-16 sm:pb-24 pt-32">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent flex-shrink-0" />
            <span className="text-xs font-medium text-white/90 tracking-wide uppercase">{t("hero_eyebrow")}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6 max-w-3xl">
            {t("hero_h1_line1")}<br />
            <span className="text-brand-accent">{t("hero_h1_line2")}</span>
          </h1>
          <p className="text-lg text-white/65 leading-relaxed mb-10 max-w-lg">{t("hero_sub")}</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-brand-accent text-white font-semibold px-8 py-4 rounded-2xl hover:bg-green-600 transition-colors duration-200 text-base"
            >
              {t("hero_cta_primary")}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
            <Link
              href="/solarzaun"
              className="inline-flex items-center justify-center border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 hover:border-white/60 transition-colors duration-200 text-base"
            >
              {t("hero_cta_secondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Strip ── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {[
              {
                icon: (
                  <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ),
                title: t("trust_delivery"), sub: t("trust_delivery_sub"),
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: t("trust_warranty"), sub: t("trust_warranty_sub"),
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                ),
                title: t("trust_montage"), sub: t("trust_montage_sub"),
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: t("trust_foerderung"), sub: t("trust_foerderung_sub"),
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="flex-shrink-0">{item.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-brand-text leading-tight">{item.title}</p>
                  <p className="text-xs text-brand-muted mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="bg-gray-50 py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">{t("categories_eyebrow")}</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-text">{t("categories_h2")}</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} locale={params.locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Products ── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">{t("products_eyebrow")}</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-text">{t("products_h2")}</h2>
            </div>
            <Link href="/products" className="text-sm font-semibold text-brand-muted hover:text-brand-accent transition-colors hidden sm:inline-flex items-center gap-1">
              {t("products_all")}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} buyLabel={t("products_buy")} learnLabel={t("products_learn")} />
            ))}
          </div>
          <div className="mt-8 sm:hidden">
            <Link href="/products" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-accent hover:text-green-700">{t("products_all_mobile")}</Link>
          </div>
        </div>
      </section>

      {/* ── Benefits – Editorial sticky layout ── */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[1fr_1.6fr] lg:gap-20 items-start">
            {/* Sticky heading */}
            <div className="mb-12 lg:mb-0 lg:sticky lg:top-24">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">{t("benefits_eyebrow")}</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-text leading-tight">{t("benefits_h2")}</h2>
              <div className="mt-6 w-10 h-0.5 bg-brand-accent" />
            </div>

            {/* Benefit rows */}
            <div className="divide-y divide-gray-200">
              {benefits.map((b) => (
                <div key={b.number} className="flex gap-6 py-8 group">
                  <span className="font-display text-sm font-bold text-brand-accent w-8 flex-shrink-0 mt-1">{b.number}</span>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-brand-text mb-2">{b.title}</h3>
                    <p className="text-brand-muted leading-relaxed text-sm">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Wind Energy Guides ── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">{t("guides_eyebrow")}</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-text">{t("guides_h2")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(WIND_GUIDES[params.locale as keyof typeof WIND_GUIDES] ?? WIND_GUIDES.en).map((guide) => (
              <Link
                key={guide.href}
                href={guide.href as any}
                className="group flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-5 hover:border-brand-accent hover:shadow-md transition-all duration-200"
              >
                <div className="mt-0.5 w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                  <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-brand-text mb-1 group-hover:text-brand-accent transition-colors">{guide.label}</p>
                  <p className="text-xs text-brand-muted leading-relaxed">{guide.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-gray-50 py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[1fr_1.6fr] lg:gap-20 items-start">
            <div className="mb-10 lg:mb-0 lg:sticky lg:top-24">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">{t("faq_eyebrow")}</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-text">{t("faq_h2")}</h2>
              <div className="mt-8">
                <Link href="/faq" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-text border border-gray-300 rounded-xl px-5 py-2.5 hover:border-brand-accent hover:text-brand-accent transition-colors">
                  {t("faq_all")}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {faqItems.map((item) => (
                <details key={item.q} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 font-display font-semibold text-brand-text hover:text-brand-accent transition-colors [&::-webkit-details-marker]:hidden">
                    <span className="text-base leading-snug">{item.q}</span>
                    <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 group-hover:bg-green-50 flex items-center justify-center transition-colors">
                      <svg className="w-3.5 h-3.5 text-brand-muted group-open:rotate-180 transition-transform duration-200 group-hover:text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <p className="text-sm text-brand-muted leading-relaxed pb-5 pr-10">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Blog Teaser ── */}
      {blogPosts.length > 0 && (
        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">{t("blog_eyebrow")}</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-text">{t("blog_h2")}</h2>
              </div>
              <Link href="/blog" className="text-sm font-semibold text-brand-muted hover:text-brand-accent transition-colors hidden sm:block">{t("blog_all")}</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <BlogTeaserCard key={post.id} post={post} readMoreLabel={t("blog_read_more")} />
              ))}
            </div>
            <div className="mt-6 sm:hidden">
              <Link href="/blog" className="text-sm font-semibold text-brand-muted hover:text-brand-accent">{t("blog_all")}</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Contact CTA – Dark with green glow ── */}
      <section className="relative overflow-hidden bg-[#0a0f0a] py-24 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(34,197,94,0.18),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_80%_110%,rgba(34,197,94,0.08),transparent)]" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">WSP Solarenergie</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
            {t("cta_h2_line1")}<br /><span className="text-brand-accent">{t("cta_h2_line2")}</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-xl mx-auto mb-10">{t("cta_sub")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/kontakt" className="inline-flex items-center justify-center gap-2 bg-brand-accent text-white font-semibold px-10 py-4 rounded-2xl hover:bg-green-600 transition-colors text-base">
              {t("cta_primary")}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/products" className="inline-flex items-center justify-center border border-white/20 text-white font-semibold px-10 py-4 rounded-2xl hover:border-white/40 hover:bg-white/5 transition-colors text-base">
              {t("cta_secondary")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── Blog Teaser Card ─────────────────────────────────────────────────────────

function BlogTeaserCard({ post, readMoreLabel }: { post: BlogPostSummary; readMoreLabel: string }) {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200 group">
      {post.coverImageUrl && (
        <Link href={`/blog/${post.slug}`} className="block">
          <div className="relative w-full h-44 overflow-hidden bg-gray-50">
            <Image
              src={post.coverImageUrl}
              alt={post.coverImageAlt ?? post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        </Link>
      )}
      <div className="p-5 flex flex-col gap-2 flex-1">
        {post.category && (
          <p className="text-xs font-medium text-brand-accent uppercase tracking-widest">{post.category.name}</p>
        )}
        <h3 className="font-display font-semibold text-base text-brand-text leading-snug">
          <Link href={`/blog/${post.slug}`} className="hover:text-brand-accent transition-colors duration-150 line-clamp-2">
            {post.title}
          </Link>
        </h3>
        <p className="text-sm text-brand-muted leading-relaxed line-clamp-2 flex-1">{post.excerpt}</p>
        <div className="mt-auto pt-3">
          <Link href={`/blog/${post.slug}`} className="text-sm font-semibold text-brand-accent hover:text-green-700 transition-colors duration-150">
            {readMoreLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────

const CATEGORY_FALLBACK_IMAGES: Record<string, { src: string; alt: string }> = {
  solarzaun:                   { src: "/images/solarzaun-house.png",  alt: "Solarzaun" },
  "skywind-ng-kleinwindanlage": { src: "/images/skywind-hero.png",    alt: "SkyWind NG Kleinwindanlage" },
  skywind:                     { src: "/images/skywind-hero.png",     alt: "SkyWind Kleinwindanlage" },
  kombiloesung:                { src: "/images/skywind-rooftop.png",  alt: "Kombilösung Solar & Wind" },
  "kombilösung":               { src: "/images/skywind-rooftop.png",  alt: "Kombilösung Solar & Wind" },
  "solar-zubehoer":            { src: "/images/solarzaun-house.png",  alt: "Solar Zubehör" },
};

const CATEGORY_ENRICHMENT: Record<string, {
  description: Record<string, string>;
  subcategories: Array<{ name: Record<string, string>; href: string }>;
  ctaLabel: Record<string, string>;
}> = {
  "skywind-ng-kleinwindanlage": {
    description: {
      de: "Entdecken Sie moderne SkyWind NG Kleinwindanlagen für Haus, Gewerbe und Hybridlösungen mit Photovoltaik.",
      en: "Discover modern SkyWind NG small wind turbines for homes, business and hybrid solar-wind solutions.",
      es: "Descubra las modernas aeroturbinas SkyWind NG para hogar, empresa y soluciones híbridas con fotovoltaica.",
    },
    subcategories: [
      { name: { de: "SkyWind NG Komplettsets", en: "Complete Sets", es: "Kits Completos" }, href: "/categories/skywind-ng-kleinwindanlage" },
      { name: { de: "Masten & Halterungen", en: "Masts & Mounts", es: "Mástiles y Soportes" }, href: "/categories/skywind-ng-kleinwindanlage" },
      { name: { de: "Hybridlösungen mit PV", en: "Hybrid Solutions", es: "Soluciones Híbridas" }, href: "/categories/skywind-ng-kleinwindanlage" },
      { name: { de: "Zubehör SkyWind NG", en: "Accessories", es: "Accesorios" }, href: "/categories/zubehoer-skywind-ng" },
    ],
    ctaLabel: { de: "SkyWind NG entdecken", en: "Explore SkyWind NG", es: "Explorar SkyWind NG" },
  },
  solarzaun: {
    description: {
      de: "Solarzaun Komplettsets mit bifazialen Solarmodulen, stabilen Profilen und passender Wechselrichtertechnik.",
      en: "Solar fence complete sets with bifacial modules, sturdy profiles and matching inverter technology.",
      es: "Kits completos de valla solar con módulos bifaciales, perfiles sólidos y tecnología de inversor.",
    },
    subcategories: [
      { name: { de: "Solarzaun Komplettsets", en: "Complete Sets", es: "Kits Completos" }, href: "/categories/solarzaun" },
      { name: { de: "Pfosten & Profile", en: "Posts & Profiles", es: "Postes y Perfiles" }, href: "/categories/solarzaun" },
      { name: { de: "Bifaziale Zaunmodule", en: "Bifacial Modules", es: "Módulos Bifaciales" }, href: "/categories/solarzaun" },
      { name: { de: "Wechselrichter für Solarzaun", en: "Inverters", es: "Inversores" }, href: "/categories/solarzaun" },
    ],
    ctaLabel: { de: "Solarzaun entdecken", en: "Explore Solar Fence", es: "Explorar Valla Solar" },
  },
  solaranlagen: {
    description: {
      de: "Photovoltaikanlagen für Eigenheim und Gewerbe – nachhaltige Stromerzeugung mit moderner Solartechnik.",
      en: "Photovoltaic systems for homes and businesses – sustainable power generation with modern solar technology.",
      es: "Sistemas fotovoltaicos para hogares y empresas – generación de energía sostenible con tecnología solar.",
    },
    subcategories: [
      { name: { de: "PV-Komplettsysteme", en: "Complete PV Systems", es: "Sistemas PV Completos" }, href: "/categories/solaranlagen" },
      { name: { de: "Solarmodule", en: "Solar Modules", es: "Módulos Solares" }, href: "/categories/solaranlagen" },
      { name: { de: "Wechselrichter", en: "Inverters", es: "Inversores" }, href: "/categories/wechselrichter" },
      { name: { de: "Batteriespeicher", en: "Battery Storage", es: "Almacenamiento" }, href: "/categories/solaranlagen" },
    ],
    ctaLabel: { de: "Solaranlagen entdecken", en: "Explore Solar Systems", es: "Explorar Sistemas Solares" },
  },
  wechselrichter: {
    description: {
      de: "Leistungsstarke Wechselrichter für PV-Anlagen: String-, Hybrid- und einphasige Modelle für jeden Bedarf.",
      en: "Powerful inverters for PV systems: string, hybrid and single-phase models for every requirement.",
      es: "Potentes inversores para sistemas PV: modelos string, híbridos y monofásicos para cada necesidad.",
    },
    subcategories: [
      { name: { de: "Hybrid-Wechselrichter", en: "Hybrid Inverters", es: "Inversores Híbridos" }, href: "/categories/wechselrichter" },
      { name: { de: "String-Wechselrichter", en: "String Inverters", es: "Inversores String" }, href: "/categories/wechselrichter" },
      { name: { de: "Einphasige Modelle", en: "Single-Phase", es: "Monofásicos" }, href: "/categories/wechselrichter" },
      { name: { de: "Dreiphasige Modelle", en: "Three-Phase", es: "Trifásicos" }, href: "/categories/wechselrichter" },
    ],
    ctaLabel: { de: "Wechselrichter entdecken", en: "Explore Inverters", es: "Explorar Inversores" },
  },
  carport: {
    description: {
      de: "Solarcarport – Stellplatz und Solarstrom clever kombiniert. Wetterschutz, Design und erneuerbare Energie in einem.",
      en: "Solar carport – parking and solar power cleverly combined. Weather protection, design and renewable energy in one.",
      es: "Carport solar – estacionamiento y energía solar combinados inteligentemente.",
    },
    subcategories: [
      { name: { de: "Solarcarport Komplett", en: "Complete Solar Carport", es: "Carport Solar Completo" }, href: "/categories/carport" },
      { name: { de: "PV-Module für Carport", en: "PV Modules", es: "Módulos PV" }, href: "/categories/carport" },
      { name: { de: "Wechselrichter & Speicher", en: "Inverter & Storage", es: "Inversor y Almacenamiento" }, href: "/categories/wechselrichter" },
      { name: { de: "Montagezubehör", en: "Mounting Accessories", es: "Accesorios de Montaje" }, href: "/categories/carport" },
    ],
    ctaLabel: { de: "Solarcarports entdecken", en: "Explore Solar Carports", es: "Explorar Carports Solares" },
  },
  outdoor: {
    description: {
      de: "Solar Outdoor Produkte für Garten, Terrasse und Einfahrt – autarke Beleuchtung ohne Stromanschluss.",
      en: "Solar outdoor products for garden, terrace and driveway – autonomous lighting without power connection.",
      es: "Productos solares outdoor para jardín, terraza y entrada – iluminación autónoma sin conexión eléctrica.",
    },
    subcategories: [
      { name: { de: "Solar Wandleuchten", en: "Solar Wall Lights", es: "Luces de Pared Solar" }, href: "/categories/outdoor" },
      { name: { de: "Gartenbeleuchtung", en: "Garden Lighting", es: "Iluminación de Jardín" }, href: "/categories/outdoor" },
      { name: { de: "Leuchten für Zäune", en: "Fence Lights", es: "Luces para Vallas" }, href: "/categories/outdoor" },
      { name: { de: "Smarte Outdoor-Technik", en: "Smart Outdoor Tech", es: "Tecnología Outdoor" }, href: "/categories/outdoor" },
    ],
    ctaLabel: { de: "Outdoor-Produkte entdecken", en: "Explore Outdoor Products", es: "Explorar Productos Outdoor" },
  },
  "zubehoer-skywind-ng": {
    description: {
      de: "Zubehör für die SkyWind NG Kleinwindanlage – Komponenten für Montage, Anschluss und Systembetrieb.",
      en: "Accessories for the SkyWind NG small wind turbine – components for installation, connection and operation.",
      es: "Accesorios para la aeroturbina SkyWind NG – componentes para montaje, conexión y operación.",
    },
    subcategories: [
      { name: { de: "Mastmontage", en: "Mast Mounting", es: "Montaje de Mástil" }, href: "/categories/zubehoer-skywind-ng" },
      { name: { de: "Anschlussmaterial", en: "Connection Material", es: "Material de Conexión" }, href: "/categories/zubehoer-skywind-ng" },
      { name: { de: "Monitoring", en: "Monitoring", es: "Monitoreo" }, href: "/categories/zubehoer-skywind-ng" },
      { name: { de: "Systemkomponenten", en: "System Components", es: "Componentes del Sistema" }, href: "/categories/zubehoer-skywind-ng" },
    ],
    ctaLabel: { de: "Zubehör entdecken", en: "Explore Accessories", es: "Explorar Accesorios" },
  },
  kombiloesung: {
    description: {
      de: "Solar und Wind kombiniert – maximale Autarkie durch ganzjährige Stromerzeugung bei jedem Wetter.",
      en: "Solar and wind combined – maximum energy independence through year-round power generation in any weather.",
      es: "Solar y eólico combinados – máxima autonomía energética con generación eléctrica todo el año.",
    },
    subcategories: [
      { name: { de: "Kombiprojekt Privat", en: "Private Combo Project", es: "Proyecto Combinado Privado" }, href: "/products/solar-wind-kombiloesung" },
      { name: { de: "Kombiprojekt Gewerbe", en: "Commercial Combo Project", es: "Proyecto Combinado Comercial" }, href: "/products/solar-wind-kombiloesung" },
      { name: { de: "Planung & Beratung", en: "Planning & Consulting", es: "Planificación y Asesoría" }, href: "/kontakt" },
      { name: { de: "Solarzaun + SkyWind", en: "Solar Fence + SkyWind", es: "Valla Solar + SkyWind" }, href: "/products/solar-wind-kombiloesung" },
    ],
    ctaLabel: { de: "Kombilösungen entdecken", en: "Explore Combo Solutions", es: "Explorar Soluciones Combinadas" },
  },
  "solar-zubehoer": {
    description: {
      de: "Wechselrichter, Laderegler, Optimizer und Halterungen – alles was Ihre Solaranlage vervollständigt.",
      en: "Inverters, charge controllers, optimisers and mounting systems – everything to complete your solar installation.",
      es: "Inversores, reguladores de carga, optimizadores y soportes – todo para completar su instalación solar.",
    },
    subcategories: [
      { name: { de: "Wechselrichter", en: "Inverters", es: "Inversores" }, href: "/categories/solar-zubehoer" },
      { name: { de: "Laderegler", en: "Charge Controllers", es: "Reguladores de Carga" }, href: "/categories/solar-zubehoer" },
      { name: { de: "Optimizer", en: "Optimisers", es: "Optimizadores" }, href: "/categories/solar-zubehoer" },
      { name: { de: "Halterungen", en: "Mounting Systems", es: "Sistemas de Montaje" }, href: "/categories/solar-zubehoer" },
    ],
    ctaLabel: { de: "Zubehör entdecken", en: "Explore Accessories", es: "Explorar Accesorios" },
  },
};

function CategoryCard({
  category,
  locale,
}: {
  category: CategorySummary;
  locale: string;
}) {
  const fallback = CATEGORY_FALLBACK_IMAGES[category.slug];
  const imageSrc = category.coverImageUrl ?? fallback?.src ?? null;
  const imageAlt = fallback?.alt ?? category.name;
  const enrichment = CATEGORY_ENRICHMENT[category.slug];
  const lang = locale as string;
  const subcategories = enrichment?.subcategories ?? [];
  const description = enrichment?.description[lang] ?? enrichment?.description["de"] ?? category.description ?? "";
  const ctaLabel = enrichment?.ctaLabel[lang] ?? enrichment?.ctaLabel["de"] ?? "Entdecken →";

  return (
    <div className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
      {/* ── Bildbereich mit Gradient-Overlay ── */}
      <Link href={`/categories/${category.slug}`} className="relative block h-52 sm:h-60 overflow-hidden bg-gray-900">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="font-display text-xl font-bold text-white leading-snug mb-1">
            {category.name}
          </h3>
          {description && (
            <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">{description}</p>
          )}
        </div>
      </Link>

      {/* ── Unterkategorien 2×2-Grid ── */}
      <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl flex flex-col flex-1">
        {subcategories.length > 0 && (
          <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 flex-1">
            {subcategories.map((sub) => (
              <Link
                key={sub.name.de}
                href={sub.href as any}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-brand-text hover:text-brand-accent hover:bg-green-50 transition-colors duration-150"
              >
                <span className="text-brand-accent flex-shrink-0">›</span>
                <span className="truncate">{sub.name[lang] ?? sub.name.de}</span>
              </Link>
            ))}
          </div>
        )}
        <Link
          href={`/categories/${category.slug}`}
          className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 text-sm font-semibold text-brand-accent hover:text-green-700 transition-colors duration-150"
        >
          <span>{ctaLabel}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function ProductCard({
  product,
  buyLabel,
  learnLabel,
}: {
  product: ProductSummary;
  buyLabel: string;
  learnLabel: string;
}) {
  const tProducts = useTranslations("products");
  const imageMap: Record<string, { src: string; alt: string }> = {
    solarzaun:         { src: "/images/solarzaun-house.png", alt: "Solarzaun" },
    skywind:           { src: "/images/skywind-hero.png",    alt: "SkyWind" },
    kombiloesung:      { src: "/images/skywind-rooftop.png", alt: "Kombilösung" },
    kombilösung:       { src: "/images/skywind-rooftop.png", alt: "Kombilösung" },
    "solar-zubehoer":  { src: "/images/solarzaun-house.png", alt: "Solar Zubehör" },
  };
  const image = product.coverImageUrl
    ? { src: product.coverImageUrl, alt: product.name }
    : (imageMap[product.category?.slug ?? ""] ?? null);

  const { priceDisplay } = product;

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200 group">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative w-full h-52 overflow-hidden bg-gray-50">
          {image ? (
            <Image src={image.src} alt={image.alt} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
          )}

          {/* Angebots-Badge */}
          {priceDisplay.isOnSale && (
            <span className="absolute top-3 left-3 inline-block text-xs font-semibold text-white bg-orange-500 px-2.5 py-1 rounded-full shadow-sm">
              {priceDisplay.saleLabel ?? "Angebot"}
            </span>
          )}
        </div>
      </Link>
      <div className="p-5 flex flex-col gap-2 flex-1">
        {product.category && (
          <p className="text-xs font-medium text-brand-muted uppercase tracking-widest">{product.category.name}</p>
        )}
        <h3 className="font-display font-semibold text-lg text-brand-text leading-snug">
          <Link href={`/products/${product.slug}`} className="hover:text-brand-accent transition-colors duration-150">{product.name}</Link>
        </h3>

        {/* Preis mit optionalem Durchstreichpreis */}
        <div className="mt-1">
          <p className={`font-bold text-xl leading-tight ${priceDisplay.isOnSale ? "text-orange-600" : "text-brand-text"}`}>
            {priceDisplay.displayText}
          </p>
          {priceDisplay.isOnSale && priceDisplay.originalPriceCents != null && (
            <p className="text-sm text-brand-muted line-through">
              {formatCents(priceDisplay.originalPriceCents, priceDisplay.currencyCode)}
            </p>
          )}
        </div>

        {priceDisplay.showCountdown && priceDisplay.saleEndsAt && (
          <OfferCountdown
            endsAt={priceDisplay.saleEndsAt}
            label={tProducts("countdown_label")}
            expiredText={tProducts("countdown_expired")}
            compact
            className="mb-1"
          />
        )}

        <div className="mt-auto pt-3">
          {product.purchasable ? (
            <Link href={`/products/${product.slug}`} className="block w-full text-center bg-brand-accent text-white font-semibold py-2.5 rounded-xl hover:bg-green-600 transition-colors duration-150 text-sm">
              {buyLabel}
            </Link>
          ) : (
            <Link href={`/products/${product.slug}`} className="block w-full text-center border border-gray-200 text-brand-text font-semibold py-2.5 rounded-xl hover:border-brand-accent hover:text-brand-accent transition-colors duration-150 text-sm">
              {learnLabel}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
