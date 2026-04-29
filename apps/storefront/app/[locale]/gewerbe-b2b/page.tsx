import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "gewerbe_b2b" });
  return { title: t("meta_title"), description: t("meta_desc") };
}

export default async function GewerbeB2BPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "gewerbe_b2b" });
  const targetGroups = t.raw("target_groups") as { label: string; description: string; fit: string[] }[];
  const scenarios = t.raw("scenarios") as { number: string; title: string; description: string }[];
  const solutions = t.raw("solutions") as { label: string; href: string; description: string; cta: string }[];
  const processSteps = t.raw("process_steps") as { step: string; title: string; description: string }[];
  const partnerCards = t.raw("partner_cards") as { title: string; text: string }[];

  return (
    <main>
      {/* ── Hero ── */}
      <section className="py-28 sm:py-36 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-brand-muted mb-10">
            <Link href="/" className="hover:text-brand-text transition-colors duration-150">{t("breadcrumb_home")}</Link>
            <span>/</span>
            <span className="text-brand-text">{t("breadcrumb")}</span>
          </nav>
          <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-5">{t("eyebrow")}</p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-brand-text leading-tight mb-6">
            {t("h1_line1")}<br />
            <span className="text-brand-accent">{t("h1_line2")}</span>
          </h1>
          <p className="text-lg text-brand-muted leading-relaxed max-w-2xl mb-10">{t("sub")}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/kontakt" className="inline-block bg-brand-accent text-white font-semibold px-9 py-3.5 rounded-xl hover:bg-green-600 transition-colors duration-150">
              {t("hero_cta_primary")}
            </Link>
            <Link href="/faq" className="inline-block border border-gray-200 text-brand-text font-semibold px-9 py-3.5 rounded-xl hover:border-brand-accent hover:text-brand-accent transition-colors duration-150">
              {t("hero_cta_secondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Zielgruppen ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">{t("target_eyebrow")}</p>
            <h2 className="font-display text-3xl font-bold text-brand-text mb-3">{t("target_h2")}</h2>
            <p className="text-brand-muted leading-relaxed">{t("target_sub")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {targetGroups.map((group) => (
              <div key={group.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-5">
                <div>
                  <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">{group.label}</p>
                  <p className="text-sm text-brand-muted leading-relaxed">{group.description}</p>
                </div>
                <ul className="space-y-2">
                  {group.fit.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-brand-muted">
                      <span className="mt-0.5 flex-shrink-0 text-brand-accent font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Szenarien ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-14">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">{t("scenarios_eyebrow")}</p>
            <h2 className="font-display text-3xl font-bold text-brand-text">{t("scenarios_h2")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {scenarios.map((item) => (
              <div key={item.number} className="flex gap-6">
                <p className="font-display text-2xl font-bold text-brand-accent flex-shrink-0 w-10">{item.number}</p>
                <div>
                  <h3 className="font-display font-semibold text-brand-text mb-2">{item.title}</h3>
                  <p className="text-sm text-brand-muted leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lösungen ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">{t("solutions_eyebrow")}</p>
            <h2 className="font-display text-3xl font-bold text-brand-text mb-3">{t("solutions_h2")}</h2>
            <p className="text-brand-muted leading-relaxed">{t("solutions_sub")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {solutions.map((solution) => (
              <div key={solution.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-5">
                <div>
                  <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">{solution.label}</p>
                  <p className="text-sm text-brand-muted leading-relaxed">{solution.description}</p>
                </div>
                <Link
                  href={solution.href}
                  className="self-start text-sm font-semibold text-brand-text border border-gray-200 rounded-xl px-5 py-2.5 hover:border-brand-accent hover:text-brand-accent transition-colors duration-150"
                >
                  {solution.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Projektablauf ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">{t("process_eyebrow")}</p>
              <h2 className="font-display text-3xl font-bold text-brand-text mb-5 leading-snug">
                {t("process_h2_line1")}<br />{t("process_h2_line2")}
              </h2>
              <p className="text-brand-muted leading-relaxed mb-4">{t("process_p1")}</p>
              <p className="text-brand-muted leading-relaxed mb-8">{t("process_p2")}</p>
              <Link
                href="/kontakt"
                className="inline-block bg-brand-accent text-white font-semibold px-7 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150"
              >
                {t("process_cta")}
              </Link>
            </div>
            <div className="space-y-8">
              {processSteps.map(({ step, title, description }) => (
                <div key={step} className="flex gap-5">
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-accent/10 text-brand-accent font-display font-bold text-sm flex items-center justify-center mt-0.5">
                    {step}
                  </span>
                  <div>
                    <p className="font-semibold text-brand-text mb-1.5">{title}</p>
                    <p className="text-sm text-brand-muted leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Partnerschaft ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">{t("partner_eyebrow")}</p>
            <h2 className="font-display text-3xl font-bold text-brand-text mb-5 leading-snug">{t("partner_h2")}</h2>
            <p className="text-brand-muted leading-relaxed mb-4">{t("partner_p1")}</p>
            <p className="text-brand-muted leading-relaxed mb-10">{t("partner_p2")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
              {partnerCards.map(({ title, text }) => (
                <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-display font-semibold text-brand-text mb-2 text-sm">{title}</h3>
                  <p className="text-sm text-brand-muted leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
            <Link
              href="/kontakt"
              className="inline-block border border-gray-200 text-brand-text font-semibold px-7 py-3 rounded-xl hover:border-brand-accent hover:text-brand-accent transition-colors duration-150"
            >
              {t("partner_cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Abschluss-CTA ── */}
      <section className="bg-brand-text py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-5">{t("cta_eyebrow")}</p>
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            {t("cta_h2_line1")}<br />{t("cta_h2_line2")}
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">{t("cta_sub")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/kontakt" className="inline-block bg-brand-accent text-white font-semibold px-9 py-3.5 rounded-xl hover:bg-green-600 transition-colors duration-150">
              {t("cta_primary")}
            </Link>
            <Link href="/faq" className="inline-block border border-gray-600 text-white font-semibold px-9 py-3.5 rounded-xl hover:border-gray-400 transition-colors duration-150">
              {t("cta_secondary")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
