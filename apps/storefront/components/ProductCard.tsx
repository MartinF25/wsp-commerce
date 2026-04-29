/**
 * ProductCard – gemeinsame Produktkarte für Listen- und Kategorie-Ansichten.
 *
 * Server Component: keine Client-Direktive nötig.
 *
 * showCategory (default: true):
 *   - true  → Kategorie-Label oberhalb des Namens anzeigen
 *   - false → Kategorie weglassen
 */

import type { ProductSummary } from "@wsp/types";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

type Props = {
  product: ProductSummary;
  showCategory?: boolean;
};

// Gradient + Icon je nach Kategorie-Slug
function ProductImagePlaceholder({ categorySlug }: { categorySlug: string | null }) {
  const config = getCategoryVisual(categorySlug);
  return (
    <div className={`w-full h-full flex items-center justify-center ${config.gradient}`}>
      <div className="opacity-80">{config.icon}</div>
    </div>
  );
}

function getCategoryVisual(slug: string | null) {
  switch (slug) {
    case "solarzaun":
      return {
        gradient: "bg-gradient-to-br from-emerald-400 to-green-600",
        icon: <SolarIcon />,
      };
    case "skywind":
      return {
        gradient: "bg-gradient-to-br from-sky-400 to-blue-600",
        icon: <WindIcon />,
      };
    case "kombiloesung":
    case "kombilösung":
      return {
        gradient: "bg-gradient-to-br from-violet-400 to-purple-600",
        icon: <CombiIcon />,
      };
    default:
      return {
        gradient: "bg-gradient-to-br from-gray-300 to-gray-400",
        icon: <DefaultIcon />,
      };
  }
}

function SolarIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Solarpanel-Gitter als Zaun */}
      <rect x="4" y="20" width="56" height="30" rx="3" fill="white" fillOpacity="0.25" />
      <line x1="4" y1="30" x2="60" y2="30" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
      <line x1="4" y1="40" x2="60" y2="40" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
      <line x1="22" y1="20" x2="22" y2="50" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
      <line x1="42" y1="20" x2="42" y2="50" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
      {/* Sonne */}
      <circle cx="32" cy="12" r="5" fill="white" fillOpacity="0.9" />
      <line x1="32" y1="4" x2="32" y2="7" stroke="white" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round" />
      <line x1="40" y1="12" x2="43" y2="12" stroke="white" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round" />
      <line x1="24" y1="12" x2="21" y2="12" stroke="white" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round" />
    </svg>
  );
}

function WindIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Windturbinen-Mast */}
      <line x1="32" y1="32" x2="32" y2="58" stroke="white" strokeWidth="3" strokeOpacity="0.9" strokeLinecap="round" />
      {/* Nabe */}
      <circle cx="32" cy="32" r="3" fill="white" fillOpacity="0.9" />
      {/* Rotorblätter */}
      <path d="M32 29 C30 22 24 16 20 14 C24 18 28 24 32 29Z" fill="white" fillOpacity="0.85" />
      <path d="M34.6 33.5 C41.5 33 48 36 50 39 C46 36 40 34 34.6 33.5Z" fill="white" fillOpacity="0.85" />
      <path d="M29.4 33.5 C22.5 36 18 42 18 46 C20 42 25 37 29.4 33.5Z" fill="white" fillOpacity="0.85" />
    </svg>
  );
}

function CombiIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Solar links */}
      <rect x="4" y="28" width="24" height="18" rx="2" fill="white" fillOpacity="0.25" />
      <line x1="4" y1="34" x2="28" y2="34" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
      <line x1="4" y1="40" x2="28" y2="40" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
      <line x1="16" y1="28" x2="16" y2="46" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
      {/* Wind rechts */}
      <line x1="48" y1="36" x2="48" y2="56" stroke="white" strokeWidth="2.5" strokeOpacity="0.9" strokeLinecap="round" />
      <circle cx="48" cy="36" r="2.5" fill="white" fillOpacity="0.9" />
      <path d="M48 33.5 C46.5 28 42 23 39 22 C42 25 45.5 29 48 33.5Z" fill="white" fillOpacity="0.85" />
      <path d="M50 37.5 C55 37 59.5 39.5 61 42 C58 39.5 54 38 50 37.5Z" fill="white" fillOpacity="0.85" />
      <path d="M46 37.5 C41 39.5 38 44.5 38 48 C39.5 44.5 43 40 46 37.5Z" fill="white" fillOpacity="0.85" />
      {/* Verbindung */}
      <line x1="28" y1="37" x2="38" y2="37" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="2 2" />
    </svg>
  );
}

function DefaultIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
      <path d="M24 14 L24 24 L30 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
    </svg>
  );
}

export function ProductCard({ product, showCategory = true }: Props) {
  const t = useTranslations("products");
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-lg hover:border-gray-200 transition-all duration-200 overflow-hidden group">

      {/* Bild-Bereich – klickbar, Zoom-Effekt beim Hover */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative w-full h-48 overflow-hidden bg-gray-50 shrink-0"
        tabIndex={-1}
        aria-hidden="true"
      >
        {product.coverImageUrl ? (
          <Image
            src={product.coverImageUrl}
            alt={product.coverImageAlt ?? product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <ProductImagePlaceholder categorySlug={product.category?.slug ?? null} />
        )}
      </Link>

      {/* Inhalt */}
      <div className="p-5 flex flex-col flex-1">

        {/* Kategorie-Label */}
        {showCategory && product.category !== null && (
          <p className="text-xs font-medium text-brand-muted uppercase tracking-widest mb-2">
            {product.category.name}
          </p>
        )}

        {/* Produktname */}
        <h3 className="font-display font-semibold text-lg text-brand-text leading-snug mb-2">
          <Link
            href={`/products/${product.slug}`}
            className="hover:text-brand-accent transition-colors duration-150"
          >
            {product.name}
          </Link>
        </h3>

        {/* Kurzbeschreibung */}
        {product.short_description && (
          <p className="text-sm text-brand-muted leading-relaxed line-clamp-2 mb-3">
            {product.short_description}
          </p>
        )}

        {/* Preis */}
        <p className="font-display font-bold text-2xl text-brand-text leading-tight mb-4">
          {product.priceDisplay.displayText}
        </p>

        {/* Footer: Badge links + CTA rechts */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <span
            className={
              product.purchasable
                ? "inline-block text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap"
                : "inline-block text-xs font-medium text-brand-muted bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap"
            }
          >
            {product.purchasable ? t("available") : t("on_request")}
          </span>

          <Link
            href={`/products/${product.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold bg-brand-accent text-white px-4 py-1.5 rounded-full hover:bg-green-600 transition-colors duration-150 whitespace-nowrap"
            aria-label={t("view_aria", { name: product.name })}
          >
            {t("view_product")}
          </Link>
        </div>

      </div>
    </article>
  );
}
