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
    categories = await fetchCategories(params.locale);
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
            address: {
              "@type": "PostalAddress",
              addressCountry: "DE",
            },
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              availableLanguage: ["German", "English", "Spanish"],
              url: `${STOREFRONT_URL}/kontakt`,
            },
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
            description: "Solarzaun und SkyWind Kleinwindanlagen – nachhaltige Energie für Ihr Zuhause und Gewerbe.",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${STOREFRONT_URL}/products?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name: "WSP Solarenergie",
            description: "Beratung und Installation von Solarzaun und SkyWind Kleinwindanlagen für nachhaltige Energie.",
            url: STOREFRONT_URL,
            address: {
              "@type": "PostalAddress",
              addressCountry: "DE",
            },
            serviceType: "Solarenergie-Beratung",
            areaServed: "Deutschland",
          }),
        }}
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[60vh] sm:min-h-[88vh] flex items-center">
        <Image src="/images/hero-bg.png" alt="Modernes Haus mit SkyWind" fill className="object-cover object-center" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
        <div className="relative w-full flex items-center min-h-[60vh] sm:min-h-[88vh]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 w-full">
            <div className="max-w-xl">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3 sm:mb-4">
                {t("hero_eyebrow")}
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white leading-tight mb-4 sm:mb-5">
                {t("hero_h1_line1")}<br />
                <span className="text-brand-accent">{t("hero_h1_line2")}</span>
              </h1>
              <p className="text-base text-white/75 leading-relaxed mb-8 max-w-lg">{t("hero_sub")}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/products" className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150 text-center">
                  {t("hero_cta_primary")}
                </Link>
                <Link href="/solarzaun" className="inline-block border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:border-white hover:bg-white/10 transition-colors duration-150 text-center">
                  {t("hero_cta_secondary")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Strip ── */}
      <div className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🚚", title: t("trust_delivery"), sub: t("trust_delivery_sub") },
              { icon: "🛡️", title: t("trust_warranty"), sub: t("trust_warranty_sub") },
              { icon: "🔧", title: t("trust_montage"), sub: t("trust_montage_sub") },
              { icon: "💶", title: t("trust_foerderung"), sub: t("trust_foerderung_sub") },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-brand-text">{item.title}</p>
                  <p className="text-xs text-brand-muted">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Products ── */}
      <section className="py-10 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6 sm:mb-10">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">{t("products_eyebrow")}</p>
              <h2 className="font-display text-3xl font-bold text-brand-text">{t("products_h2")}</h2>
            </div>
            <Link href="/products" className="text-sm font-semibold text-brand-muted hover:text-brand-accent transition-colors duration-150 hidden sm:block">
              {t("products_all")}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} buyLabel={t("products_buy")} learnLabel={t("products_learn")} />
            ))}
          </div>
          <div className="mt-6 sm:hidden">
            <Link href="/products" className="text-sm font-semibold text-brand-muted hover:text-brand-accent">{t("products_all_mobile")}</Link>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">
                {t("categories_eyebrow")}
              </p>
              <h2 className="font-display text-3xl font-bold text-brand-text">
                {t("categories_h2")}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  locale={params.locale}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Benefits ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">{t("benefits_eyebrow")}</p>
            <h2 className="font-display text-3xl font-bold text-brand-text">{t("benefits_h2")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((b) => (
              <div key={b.number}>
                <p className="font-display text-2xl font-bold text-brand-accent mb-2">{b.number}</p>
                <h3 className="font-display font-semibold text-brand-text mb-1">{b.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Wind Energy Guides ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">
              {params.locale === "de" ? "Ratgeber & Guides" : params.locale === "es" ? "Guías de Energía Eólica" : "Wind Energy Guides"}
            </p>
            <h2 className="font-display text-3xl font-bold text-brand-text">
              {params.locale === "de" ? "Alles zur SkyWind NG Windkraftanlage" : params.locale === "es" ? "Todo sobre la turbina eólica SkyWind NG" : "All About the SkyWind NG Wind Turbine"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(WIND_GUIDES[params.locale as keyof typeof WIND_GUIDES] ?? WIND_GUIDES.en).map((guide) => (
              <Link
                key={guide.href}
                href={guide.href as any}
                className="group bg-gray-50 rounded-2xl border border-gray-100 p-5 hover:border-brand-accent hover:bg-white hover:shadow-sm transition-all duration-150"
              >
                <p className="font-display font-semibold text-brand-text text-sm mb-1.5 group-hover:text-brand-accent transition-colors">{guide.label}</p>
                <p className="text-xs text-brand-muted leading-relaxed">{guide.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">{t("faq_eyebrow")}</p>
            <h2 className="font-display text-3xl font-bold text-brand-text">{t("faq_h2")}</h2>
          </div>
          <div className="max-w-3xl divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {faqItems.map((item) => (
              <details key={item.q} className="group bg-white">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 font-display font-semibold text-brand-text hover:text-brand-accent transition-colors duration-150 [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span className="mt-0.5 flex-shrink-0 text-brand-muted text-sm transition-transform duration-200 group-open:rotate-180">↓</span>
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-sm text-brand-muted leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/faq" className="inline-block text-sm font-semibold text-brand-text border border-gray-200 rounded-xl px-5 py-2.5 hover:border-brand-accent hover:text-brand-accent transition-colors duration-150">
              {t("faq_all")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Blog Teaser ── */}
      {blogPosts.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 sm:mb-10">
              <div>
                <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">{t("blog_eyebrow")}</p>
                <h2 className="font-display text-3xl font-bold text-brand-text">{t("blog_h2")}</h2>
              </div>
              <Link href="/blog" className="text-sm font-semibold text-brand-muted hover:text-brand-accent transition-colors duration-150 hidden sm:block">
                {t("blog_all")}
              </Link>
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

      {/* ── Contact CTA ── */}
      <section className="bg-brand-text py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            {t("cta_h2_line1")}<br />{t("cta_h2_line2")}
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">{t("cta_sub")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/kontakt" className="inline-block bg-brand-accent text-white font-semibold px-9 py-3.5 rounded-xl hover:bg-green-600 transition-colors duration-150">
              {t("cta_primary")}
            </Link>
            <Link href="/products" className="inline-block border border-gray-600 text-white font-semibold px-9 py-3.5 rounded-xl hover:border-gray-400 transition-colors duration-150">
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
  solarzaun:                   { src: "/images/solarzaun-house.png", alt: "Solarzaun" },
  "skywind-ng-kleinwindanlage": { src: "/images/skywind-hero.png",   alt: "SkyWind NG Kleinwindanlage" },
  skywind:                     { src: "/images/skywind-hero.png",    alt: "SkyWind Kleinwindanlage" },
  kombiloesung:                { src: "/images/skywind-rooftop.png", alt: "Kombilösung Solar & Wind" },
  "kombilösung":               { src: "/images/skywind-rooftop.png", alt: "Kombilösung Solar & Wind" },
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
  const lang = (enrichment?.description[locale] ? locale : "de") as string;
  const description = enrichment?.description[lang] ?? null;
  const subcategories = enrichment?.subcategories ?? [];
  const ctaLabel = enrichment?.ctaLabel[lang] ?? (locale === "en" ? "View category" : locale === "es" ? "Ver categoría" : "Kategorie ansehen");

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-accent hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Image */}
      <Link href={`/categories/${category.slug}`} className="block relative h-44 overflow-hidden bg-gray-100 shrink-0">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-xl text-brand-text mb-2 leading-tight">
          {category.name}
        </h3>

        {description && (
          <p className="text-sm text-brand-muted leading-relaxed mb-4 flex-1">
            {description}
          </p>
        )}

        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {subcategories.map((sub) => (
              <Link
                key={sub.name.de}
                href={sub.href as any}
                className="text-xs text-brand-muted bg-gray-100 hover:bg-green-50 hover:text-brand-accent px-2.5 py-1 rounded-full transition-colors duration-150"
              >
                {sub.name[lang] ?? sub.name.de}
              </Link>
            ))}
          </div>
        )}

        <Link
          href={`/categories/${category.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:text-green-700 transition-colors duration-150 mt-auto"
        >
          {ctaLabel}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
    solarzaun: { src: "/images/solarzaun-house.png", alt: "Solarzaun" },
    skywind: { src: "/images/skywind-hero.png", alt: "SkyWind" },
    kombiloesung: { src: "/images/skywind-rooftop.png", alt: "Kombilösung" },
    kombilösung: { src: "/images/skywind-rooftop.png", alt: "Kombilösung" },
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
