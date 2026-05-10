import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SalesPopup } from "@/components/SalesPopup";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { NewsletterPopup } from "@/components/NewsletterPopup";
import { MobileNav } from "@/components/MobileNav";
import "../globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "home" });
  const canonicalUrl = params.locale === "de" ? `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/` : `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/${params.locale}`;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"),
    title: t("meta_title"),
    description: t("meta_description"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        de: `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/`,
        en: `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/en`,
        es: `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/es`,
      },
    },
    openGraph: {
      title: t("meta_title"),
      description: t("meta_description"),
      url: canonicalUrl,
      siteName: "Solarzaun & SkyWind",
      locale: params.locale === "de" ? "de_DE" : params.locale === "en" ? "en_US" : "es_ES",
      type: "website",
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/images/hero-bg.png`,
          width: 1200,
          height: 630,
          alt: t("meta_title"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta_title"),
      description: t("meta_description"),
      images: [`${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/images/hero-bg.png`],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "nav" });
  const tRoot = await getTranslations({ locale });

  return (
    <html lang={locale} className={`${sora.variable} ${inter.variable}`}>
      <body className="bg-white text-brand-text font-sans antialiased min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>

          {/* ── Ankündigungsstreifen ── */}
          <div className="bg-brand-text text-white text-xs py-2 text-center px-4">
            {tRoot("announcement")}
          </div>

          {/* ── Top-Navigation ── */}
          <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="font-display font-semibold text-brand-text hover:text-brand-accent transition-colors duration-150"
              >
                Solarzaun &amp; SkyWind
              </Link>

              {/* Desktop-Navigation – ab lg sichtbar */}
              <nav className="hidden lg:flex items-center gap-5">
                <Link href="/solarzaun" className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150">
                  {t("solarzaun")}
                </Link>
                <Link href="/skywind" className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150">
                  {t("skywind")}
                </Link>
                <Link href="/kombiloesungen" className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150">
                  {t("kombiloesungen")}
                </Link>
                <Link href="/products" className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150">
                  {t("products")}
                </Link>
                <Link href="/blog" className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150">
                  {t("blog")}
                </Link>
              </nav>

              {/* Rechte Seite: immer sichtbar */}
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <Link
                  href="/kontakt"
                  className="text-sm font-semibold text-white bg-brand-accent px-4 py-1.5 rounded-lg hover:bg-green-600 transition-colors duration-150"
                >
                  {t("cta")}
                </Link>
                <MobileNav
                  labels={{
                    solarzaun: t("solarzaun"),
                    skywind: t("skywind"),
                    kombiloesungen: t("kombiloesungen"),
                    products: t("products"),
                    blog: t("blog"),
                  }}
                />
              </div>
            </div>
          </header>

          <div className="flex-1">{children}</div>

          <SalesPopup />
          <NewsletterPopup />
          <Footer />

        </NextIntlClientProvider>

        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{page_path:window.location.pathname});`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
