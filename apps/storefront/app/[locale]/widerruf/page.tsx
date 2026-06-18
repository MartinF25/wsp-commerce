import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CancellationForm } from "./CancellationForm";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "widerruf" });
  const base = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://webshop.wsp-solarenergie.de";
  const prefix = params.locale === "de" ? "" : `/${params.locale}`;

  return {
    title:       t("meta_title"),
    description: t("meta_description"),
    alternates: {
      canonical: `${base}${prefix}/widerruf`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function WiderrufPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "widerruf" });

  // Datenschutz-Link – passt sich an das Locale an
  const datenschutzHref = "/datenschutz";

  return (
    <div className="min-h-screen bg-white">
      {/* Hero-Bereich */}
      <section className="bg-gray-50 border-b border-gray-100 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">
            {t("page_title")}
          </h1>
          <p className="text-brand-muted leading-relaxed">
            {t("page_subtitle")}
          </p>
        </div>
      </section>

      {/* Rechtlicher Hinweis */}
      <section className="max-w-2xl mx-auto px-4 pt-8">
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-4 flex gap-3">
          <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-800 leading-relaxed">
            {t("legal_notice")}
          </p>
        </div>
      </section>

      {/* Formular */}
      <section className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="font-display font-semibold text-xl text-brand-text mb-8">
          {t("form_title")}
        </h2>
        <CancellationForm datenschutzHref={datenschutzHref} />
      </section>

      {/* Gast-Hinweis */}
      <section className="max-w-2xl mx-auto px-4 pb-16">
        <p className="text-sm text-brand-muted text-center">
          {t("guest_info")}
        </p>
      </section>
    </div>
  );
}
