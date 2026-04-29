import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { KontaktForm } from "./KontaktForm";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "kontakt" });
  return {
    title: `${t("breadcrumb")} – Solarzaun & SkyWind`,
    description: t("sub"),
  };
}

export default async function KontaktPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "kontakt" });
  const processSteps = t.raw("process_steps") as { number: string; title: string; description: string }[];
  const expectations = t.raw("expectations") as string[];
  const productLines = t.raw("product_lines") as { name: string; description: string }[];

  return (
    <main>
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

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 lg:gap-20">

            <div className="lg:col-span-2 space-y-10">
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

              <div>
                <h3 className="font-display font-semibold text-brand-text mb-3">{t("product_lines_h3")}</h3>
                <div className="space-y-2">
                  {productLines.map((line) => (
                    <div key={line.name} className="flex items-start gap-3">
                      <span className="mt-0.5 text-xs font-medium text-brand-accent uppercase tracking-widest w-24 flex-shrink-0">
                        {line.name}
                      </span>
                      <span className="text-sm text-brand-muted">{line.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <KontaktForm />
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
