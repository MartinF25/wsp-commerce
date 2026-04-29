import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SalesPopup } from "@/components/SalesPopup";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import "../globals.css";

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
  return {
    title: t("meta_title"),
    description: t("meta_description"),
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
  const tFooter = await getTranslations({ locale, namespace: "footer" });
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
          <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="font-display font-semibold text-brand-text hover:text-brand-accent transition-colors duration-150"
              >
                Solarzaun &amp; SkyWind
              </Link>

              <nav className="flex items-center gap-5">
                <Link href="/solarzaun" className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150 hidden sm:inline">
                  {t("solarzaun")}
                </Link>
                <Link href="/skywind" className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150 hidden md:inline">
                  {t("skywind")}
                </Link>
                <Link href="/kombiloesungen" className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150 hidden lg:inline">
                  {t("kombiloesungen")}
                </Link>
                <Link href="/products" className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150">
                  {t("products")}
                </Link>
                <Link href="/blog" className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150 hidden sm:inline">
                  {t("blog")}
                </Link>

                <LanguageSwitcher />

                <Link
                  href="/kontakt"
                  className="text-sm font-semibold text-white bg-brand-accent px-4 py-1.5 rounded-lg hover:bg-green-600 transition-colors duration-150"
                >
                  {t("cta")}
                </Link>
              </nav>
            </div>
          </header>

          <div className="flex-1">{children}</div>

          <SalesPopup />

          {/* ── Footer ── */}
          <footer className="border-t border-gray-100 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-muted">
                <span>&copy; {new Date().getFullYear()} {tFooter("copyright")}</span>
                <nav className="flex items-center gap-6 flex-wrap justify-center">
                  <Link href="/privatkunden" className="hover:text-brand-text transition-colors duration-150">{tFooter("privatkunden")}</Link>
                  <Link href="/gewerbe-b2b" className="hover:text-brand-text transition-colors duration-150">{tFooter("gewerbe")}</Link>
                  <Link href="/blog" className="hover:text-brand-text transition-colors duration-150">Blog</Link>
                  <Link href="/faq" className="hover:text-brand-text transition-colors duration-150">{tFooter("faq")}</Link>
                  <Link href="/kontakt" className="hover:text-brand-text transition-colors duration-150">{tFooter("kontakt")}</Link>
                  <Link href="/impressum" className="hover:text-brand-text transition-colors duration-150">{tFooter("impressum")}</Link>
                  <Link href="/datenschutz" className="hover:text-brand-text transition-colors duration-150">{tFooter("datenschutz")}</Link>
                </nav>
              </div>
            </div>
          </footer>

        </NextIntlClientProvider>
      </body>
    </html>
  );
}
