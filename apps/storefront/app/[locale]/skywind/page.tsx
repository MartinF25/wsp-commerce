import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SolutionHero } from "@/components/SolutionHero";
import { SolutionProductsSection } from "@/components/SolutionProductsSection";
import { fetchProducts } from "@/lib/catalog";
import type { ProductSummary } from "@wsp/types";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "skywind" });
  return { title: t("meta_title"), description: t("meta_desc") };
}

export default async function SkyWindPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "skywind" });
  const highlights = t.raw("highlights") as { number: string; title: string; desc: string }[];
  const usecases = t.raw("usecases") as { label: string; desc: string; scenarios: string[] }[];
  const processSteps = t.raw("process_steps") as { step: string; title: string; text: string }[];
  const faqItems = t.raw("faq_items") as { q: string; a: string }[];
  let products: ProductSummary[] = [];

  try {
    products = (await fetchProducts({ category: "skywind", limit: 6 })).items;
  } catch {
    products = [];
  }

  return (
    <main>
      <SolutionHero
        breadcrumbHome={t("breadcrumb_home")}
        breadcrumbLabel="SkyWind"
        eyebrow={t("eyebrow")}
        h1Line1={t("h1_line1")}
        h1Line2={t("h1_line2")}
        subline={t("sub")}
        primaryCta={t("cta_primary")}
        primaryHref="/kontakt"
        secondaryCta={t("cta_secondary")}
        secondaryHref="/products"
        image={{ src: "/images/skywind-hero.png", alt: "SkyWind Kleinwindanlage am Gebäude" }}
        imageLabel="SkyWind NG als dezentrale Windenergie-Lösung für Gebäude und Projekte."
      />

      <SolutionProductsSection
        eyebrow="Produkte"
        title="Passende SkyWind-Produkte"
        description="Aktive Produkte aus der Kategorie SkyWind, passend zu dieser Lösung."
        products={products}
      />

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-14">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">{t("highlights_eyebrow")}</p>
            <h2 className="font-display text-3xl font-bold text-brand-text">{t("highlights_h2")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((item) => (
              <div key={item.number}>
                <p className="font-display text-2xl font-bold text-brand-accent mb-3">{item.number}</p>
                <h3 className="font-display font-semibold text-brand-text mb-2">{item.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">{t("usecases_eyebrow")}</p>
            <h2 className="font-display text-3xl font-bold text-brand-text mb-3">{t("usecases_h2")}</h2>
            <p className="text-brand-muted leading-relaxed">{t("usecases_sub")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {usecases.map((item) => (
              <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-5">
                <div>
                  <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">{item.label}</p>
                  <p className="text-sm text-brand-muted leading-relaxed">{item.desc}</p>
                </div>
                <ul className="space-y-2">
                  {item.scenarios.map((s) => (
                    <li key={s} className="flex items-start gap-2.5 text-sm text-brand-muted">
                      <span className="mt-0.5 flex-shrink-0 text-brand-accent font-bold">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">{t("trust_eyebrow")}</p>
              <h2 className="font-display text-3xl font-bold text-brand-text mb-5 leading-snug">
                {t("trust_h2_line1")}<br />{t("trust_h2_line2")}
              </h2>
              <p className="text-brand-muted leading-relaxed mb-4">{t("trust_p1")}</p>
              <p className="text-brand-muted leading-relaxed">{t("trust_p2")}</p>
            </div>
            <div className="space-y-6">
              <h3 className="font-display font-semibold text-brand-text mb-2">{t("process_h3")}</h3>
              {processSteps.map(({ step, title, text }) => (
                <div key={step} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-accent/10 text-brand-accent font-display font-bold text-sm flex items-center justify-center mt-0.5">{step}</span>
                  <div>
                    <p className="font-semibold text-brand-text text-sm mb-1">{title}</p>
                    <p className="text-sm text-brand-muted leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">{t("faq_eyebrow")}</p>
            <h2 className="font-display text-3xl font-bold text-brand-text">{t("faq_h2")}</h2>
          </div>
          <div className="max-w-3xl divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {faqItems.map((item) => (
              <details key={item.q} className="group bg-white">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 font-display font-semibold text-brand-text hover:text-brand-accent transition-colors duration-150 [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span className="mt-0.5 flex-shrink-0 text-brand-muted text-sm group-open:rotate-180 transition-transform duration-200">↓</span>
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-sm text-brand-muted leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-text py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-5">{t("cta_eyebrow")}</p>
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            {t("cta_h2_line1")}<br />{t("cta_h2_line2")}
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">{t("cta_sub")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/kontakt" className="inline-block bg-brand-accent text-white font-semibold px-9 py-3.5 rounded-xl hover:bg-green-600 transition-colors duration-150">{t("cta_primary")}</Link>
            <Link href="/kombiloesungen" className="inline-block border border-gray-600 text-white font-semibold px-9 py-3.5 rounded-xl hover:border-gray-400 transition-colors duration-150">{t("cta_secondary")}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
