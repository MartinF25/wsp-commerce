import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-brand-text text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">

        {/* Grid: Markenblock + 3 Spalten */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Markenblock */}
          <div className="lg:col-span-1">
            <p className="font-display font-semibold text-lg text-white mb-2">
              Solarzaun &amp; SkyWind
            </p>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              {t("brand_tagline")}
            </p>
            <a
              href="https://www.wsp-solarenergie.de"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors duration-150"
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              wsp-solarenergie.de
            </a>
          </div>

          {/* Spalte 1: Produkte */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              {t("col_products")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/solarzaun" className="text-sm text-gray-300 hover:text-white transition-colors duration-150">
                  {t("solarzaun")}
                </Link>
              </li>
              <li>
                <Link href="/skywind-ng" className="text-sm text-gray-300 hover:text-white transition-colors duration-150">
                  SkyWind NG
                </Link>
              </li>
              <li>
                <Link href="/skywind" className="text-sm text-gray-300 hover:text-white transition-colors duration-150">
                  {t("skywind")}
                </Link>
              </li>
              <li>
                <Link href="/kombiloesungen" className="text-sm text-gray-300 hover:text-white transition-colors duration-150">
                  {t("kombiloesungen")}
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-sm text-brand-accent hover:text-green-400 transition-colors duration-150">
                  {t("all_products")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Spalte 2: Informationen */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              {t("col_info")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privatkunden" className="text-sm text-gray-300 hover:text-white transition-colors duration-150">
                  {t("privatkunden")}
                </Link>
              </li>
              <li>
                <Link href="/gewerbe-b2b" className="text-sm text-gray-300 hover:text-white transition-colors duration-150">
                  {t("gewerbe")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-gray-300 hover:text-white transition-colors duration-150">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-gray-300 hover:text-white transition-colors duration-150">
                  {t("faq")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Spalte 3: Rechtliches */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              {t("col_legal")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/kontakt" className="text-sm text-gray-300 hover:text-white transition-colors duration-150">
                  {t("kontakt")}
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="text-sm text-gray-300 hover:text-white transition-colors duration-150">
                  {t("impressum")}
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-sm text-gray-300 hover:text-white transition-colors duration-150">
                  {t("datenschutz")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom-Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} {t("copyright")}
          </p>
          <p className="text-xs text-gray-600">{t("made_in")}</p>
        </div>

        {/* Affiliate-Disclosure */}
        <p className="mt-4 text-xs text-gray-600 leading-relaxed">
          {t("affiliate_notice")}
        </p>

      </div>
    </footer>
  );
}
