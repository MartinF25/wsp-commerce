import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { fetchProducts } from "@/lib/catalog";
import type { Locale } from "@/i18n/routing";
import type { ProductSummary } from "@wsp/types";

export default async function HomePage({
  params,
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "home" });

  let products: ProductSummary[] = [];
  try {
    const result = await fetchProducts({ locale: params.locale, limit: 8 });
    products = result.items;
  } catch {
    // show page anyway
  }

  const benefits = t.raw("benefits") as { number: string; title: string; desc: string }[];
  const faqItems = t.raw("faq_items") as { q: string; a: string }[];

  return (
    <main>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[88vh] flex items-center">
        <Image src="/images/hero-bg.png" alt="Modernes Haus mit SkyWind" fill className="object-cover object-center" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
        <div className="relative w-full flex items-center min-h-[88vh]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 w-full">
            <div className="max-w-xl">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">
                {t("hero_eyebrow")}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
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
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">{t("products_eyebrow")}</p>
              <h2 className="font-display text-3xl font-bold text-brand-text">{t("products_h2")}</h2>
            </div>
            <Link href="/products" className="text-sm font-semibold text-brand-muted hover:text-brand-accent transition-colors duration-150 hidden sm:block">
              {t("products_all")}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} buyLabel={t("products_buy")} learnLabel={t("products_learn")} />
            ))}
          </div>
          <div className="mt-6 sm:hidden">
            <Link href="/products" className="text-sm font-semibold text-brand-muted hover:text-brand-accent">{t("products_all_mobile")}</Link>
          </div>
        </div>
      </section>

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

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  buyLabel,
  learnLabel,
}: {
  product: ProductSummary;
  buyLabel: string;
  learnLabel: string;
}) {
  const imageMap: Record<string, { src: string; alt: string }> = {
    solarzaun: { src: "/images/solarzaun-house.png", alt: "Solarzaun" },
    skywind: { src: "/images/skywind-hero.png", alt: "SkyWind" },
    kombiloesung: { src: "/images/skywind-rooftop.png", alt: "Kombilösung" },
    kombilösung: { src: "/images/skywind-rooftop.png", alt: "Kombilösung" },
  };
  const image = product.coverImageUrl
    ? { src: product.coverImageUrl, alt: product.name }
    : (imageMap[product.category?.slug ?? ""] ?? null);

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200 group">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative w-full h-52 overflow-hidden bg-gray-50">
          {image ? (
            <Image src={image.src} alt={image.alt} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
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
        <p className="text-brand-text font-bold text-xl mt-1">{product.priceDisplay.displayText}</p>
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
