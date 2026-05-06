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
            <p className="text-sm text-gray-400 leading-relaxed">
              {t("brand_tagline")}
            </p>
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

      </div>
    </footer>
  );
}
