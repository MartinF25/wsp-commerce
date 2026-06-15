import type { Metadata } from "next";
import type { ProductDetail, ProductType } from "@wsp/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchProduct, fetchProducts } from "@/lib/catalog";
import {
  resolveProductFeatures,
  fetchFeatureVisualSettings,
  isFeatureVisualsEnabled,
} from "@/lib/feature-visuals";
import { VariantSelector } from "@/components/VariantSelector";
import { PaymentOptions } from "@/components/PaymentOptions";
import { AffiliateButton } from "@/components/AffiliateButton";
import { ProductCard } from "@/components/ProductCard";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { StickerOverlay } from "@/components/sticker/StickerOverlay";
import { ShareButtons } from "@/components/ShareButtons";
import { OfferCountdown } from "@/components/storefront/offer-countdown";
import { ProductTicker } from "@/components/storefront/product-ticker";
import { BundleSection } from "@/components/bundle/BundleSection";
import { ProductPageFeatures } from "@/components/features";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

type Props = { params: { slug: string; locale: string } };

const CATEGORY_IMAGES: Record<string, { src: string; alt: string }> = {
  solarzaun: { src: "/images/solarzaun-house.png", alt: "Solarzaun am modernen Wohnhaus" },
  skywind: { src: "/images/skywind-hero.png", alt: "SkyWind Kleinwindanlage" },
  kombiloesung: { src: "/images/skywind-rooftop.png", alt: "SkyWind auf Hausdach mit Solar" },
  "kombilösung": { src: "/images/skywind-rooftop.png", alt: "SkyWind auf Hausdach mit Solar" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let product: Awaited<ReturnType<typeof fetchProduct>>;
  try {
    product = await fetchProduct(params.slug, params.locale);
  } catch {
    return { title: "Not found" };
  }
  if (!product) return { title: "Not found" };

  const title = product.meta_title ?? `${product.name} – Solarzaun & SkyWind`;
  const description = product.meta_description ?? product.short_description ?? product.description ?? "";
  const localePrefix = params.locale === "de" ? "" : `/${params.locale}`;
  const canonicalUrl = `${STOREFRONT_URL}${localePrefix}/products/${params.slug}`;
  const image = product.images[0]?.url ?? null;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        de: `${STOREFRONT_URL}/products/${params.slug}`,
        en: `${STOREFRONT_URL}/en/products/${params.slug}`,
        es: `${STOREFRONT_URL}/es/products/${params.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      ...(image && { images: [{ url: image, alt: product.name }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "product" });

  const [product, relatedResult, fvSettings] = await Promise.allSettled([
    fetchProduct(params.slug, params.locale),
    fetchProducts({ locale: params.locale as "de" | "en" | "es", limit: 4 }),
    fetchFeatureVisualSettings(),
  ]);

  if (product.status === "rejected" || !product.value) notFound();
  const p = product.value;

  const related = relatedResult.status === "fulfilled"
    ? relatedResult.value.items.filter((item) => item.slug !== params.slug).slice(0, 3)
    : [];

  const fvSettingsValue = fvSettings.status === "fulfilled" ? fvSettings.value : null;
  const showFeatureVisuals = isFeatureVisualsEnabled(fvSettingsValue, "product_page");

  // Resolve feature visuals server-side (parallel to other fetches)
  const resolvedFeatures = showFeatureVisuals
    ? await resolveProductFeatures(p.features, {
        productId: p.id,
        categoryId: p.category?.id,
        locale: params.locale,
      })
    : [];

  const mainImage = p.images.length > 0
    ? { src: p.images[0].url, alt: p.images[0].alt ?? p.name }
    : (CATEGORY_IMAGES[p.category?.slug ?? ""] ?? { src: "/images/solarzaun-house.png", alt: p.name });

  const specs = deriveSpecs(p, t);
  const trustBadges = getTrustBadges(p.product_type, t);
  const deliveryHint = getDeliveryHint(p.product_type, t);
  const totalStock = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0);

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify((() => {
            const activeVariants = p.variants.filter((v) => v.price_cents != null);
            const isAffiliate = p.product_type === "affiliate_external";
            const availability = p.availabilityStatus === "in_stock"
              ? "https://schema.org/InStock"
              : p.availabilityStatus === "out_of_stock"
              ? "https://schema.org/OutOfStock"
              : p.availabilityStatus === "preorder"
              ? "https://schema.org/PreOrder"
              : "https://schema.org/OnlineOnly";

            let offers: Record<string, unknown> | undefined;

            if (!isAffiliate && activeVariants.length > 0) {
              const prices = activeVariants.map((v) => v.price_cents as number);
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              const currency = p.priceDisplay.currencyCode;
              const productUrl = `${STOREFRONT_URL}/products/${p.slug}`;
              const seller = { "@type": "Organization", name: "WSP Solarenergie", url: STOREFRONT_URL };

              if (activeVariants.length === 1 || minPrice === maxPrice) {
                // Einzelpreis → Offer
                offers = {
                  "@type": "Offer",
                  url: productUrl,
                  price: (minPrice / 100).toFixed(2),
                  priceCurrency: currency,
                  availability,
                  seller,
                  ...(p.priceDisplay.isOnSale && p.priceDisplay.saleEndsAt && {
                    priceValidUntil: p.priceDisplay.saleEndsAt.split("T")[0],
                  }),
                };
              } else {
                // Mehrere Preise → AggregateOffer mit lowPrice + highPrice + offerCount
                offers = {
                  "@type": "AggregateOffer",
                  url: productUrl,
                  lowPrice: (minPrice / 100).toFixed(2),
                  highPrice: (maxPrice / 100).toFixed(2),
                  offerCount: activeVariants.length,
                  priceCurrency: currency,
                  availability,
                  seller,
                };
              }
            }

            return {
              "@context": "https://schema.org",
              "@type": "Product",
              name: p.name,
              description: p.short_description ?? p.description ?? undefined,
              url: `${STOREFRONT_URL}/products/${p.slug}`,
              ...(p.images.length > 0 && { image: p.images.map((img) => img.url) }),
              ...(p.category && { category: p.category.name }),
              brand: { "@type": "Brand", name: "WSP Solarenergie" },
              ...(offers && { offers }),
            };
          })()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t("breadcrumb_home"), item: STOREFRONT_URL },
              { "@type": "ListItem", position: 2, name: t("breadcrumb_products"), item: `${STOREFRONT_URL}/products` },
              ...(p.category
                ? [{ "@type": "ListItem", position: 3, name: p.category.name, item: `${STOREFRONT_URL}/categories/${p.category.slug}` },
                   { "@type": "ListItem", position: 4, name: p.name, item: `${STOREFRONT_URL}/products/${p.slug}` }]
                : [{ "@type": "ListItem", position: 3, name: p.name, item: `${STOREFRONT_URL}/products/${p.slug}` }]),
            ],
          }),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-2 text-sm text-brand-muted flex-wrap">
          <Link href="/" className="hover:text-brand-text transition-colors duration-150">{t("breadcrumb_home")}</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-brand-text transition-colors duration-150">{t("breadcrumb_products")}</Link>
          <span>/</span>
          {p.category && (
            <>
              <Link href={`/categories/${p.category.slug}`} className="hover:text-brand-text transition-colors duration-150">
                {p.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-brand-text font-medium truncate">{p.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          <div className="lg:sticky lg:top-24">
            <div className="relative">
              <ProductImageGallery
                images={p.images}
                fallback={mainImage}
                categoryName={p.category?.name}
              />
              {p.stickers && p.stickers.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  <StickerOverlay stickers={p.stickers} pageContext="detail">
                    <div className="w-full h-full" />
                  </StickerOverlay>
                </div>
              )}
            </div>

            {specs.length > 0 && (
              <div className="mt-4 bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-3">{t("specs")}</p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  {specs.map((s) => (
                    <div key={s.label}>
                      <dt className="text-xs text-brand-muted">{s.label}</dt>
                      <dd className="text-sm font-semibold text-brand-text">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* ─── Feature Visuals ──────────────────────────────── */}
            {showFeatureVisuals && resolvedFeatures.length > 0 && (
              <div className="mt-4">
                <ProductPageFeatures
                  features={resolvedFeatures}
                  settings={fvSettingsValue}
                />
              </div>
            )}
          </div>

          <div>
            {p.category && (
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">
                {p.category.name}
              </p>
            )}

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-text leading-tight mb-1">
              {p.name}
            </h1>

            {p.short_description && (
              <p className="text-brand-muted text-base leading-relaxed mb-5">{p.short_description}</p>
            )}

            {p.priceDisplay.isOnSale && (
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block text-sm font-semibold text-white bg-orange-500 px-3 py-1 rounded-full">
                  {p.priceDisplay.saleLabel ?? t("sale_badge")}
                </span>
                {p.priceDisplay.originalPriceCents != null && (
                  <span className="text-sm text-brand-muted line-through">
                    {new Intl.NumberFormat("de-DE", {
                      style: "currency",
                      currency: p.priceDisplay.currencyCode,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }).format(p.priceDisplay.originalPriceCents / 100)}
                  </span>
                )}
              </div>
            )}

            {p.priceDisplay.showCountdown && p.priceDisplay.saleEndsAt && (
              <OfferCountdown
                endsAt={p.priceDisplay.saleEndsAt}
                label={t("countdown_label")}
                expiredText={t("countdown_expired")}
                footnote={t("countdown_footnote")}
                className="mb-5"
              />
            )}

            <div className="mb-5">
              <ProductTicker
                productType={p.product_type}
                availabilityStatus={p.availabilityStatus}
                isOnSale={p.priceDisplay.isOnSale}
                saleEndsAt={p.priceDisplay.saleEndsAt}
              />
            </div>

            {p.product_type !== "affiliate_external" && (
              <VariantSelector
                variants={p.variants}
                productType={p.product_type}
                productPriceDisplay={p.priceDisplay}
                waitlistEligible={p.waitlistEligible}
                productId={p.id}
                productSlug={p.slug}
                productName={p.name}
                sourcePath={`/${params.locale !== "de" ? `${params.locale}/` : ""}products/${p.slug}`}
              />
            )}

            {p.product_type === "affiliate_external" && p.affiliateEnabled && p.affiliateUrl ? (
              <AffiliateButton
                productId={p.id}
                affiliateUrl={p.affiliateUrl}
                buttonLabel={p.affiliateButtonLabel ?? t("affiliate_cta")}
                disclosureText={p.affiliateDisclosure ?? t("affiliate_disclosure")}
                locale={params.locale}
                affiliateProvider={p.affiliateProvider ?? undefined}
                source="product_detail"
              />
            ) : p.product_type !== "affiliate_external" && p.purchasable ? (
              <div className="mb-6">
                <PaymentOptions
                  paypalUrl={p.paypal_url}
                  stripeUrl={p.stripe_url}
                />
              </div>
            ) : null}

            {deliveryHint && (
              <p className="text-xs text-brand-muted mb-6">{deliveryHint}</p>
            )}

            <div className="border border-gray-100 rounded-2xl p-4 grid grid-cols-2 gap-3 mb-6">
              {trustBadges.map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <span className="text-brand-accent font-bold text-sm">✓</span>
                  <span className="text-xs text-brand-muted">{text}</span>
                </div>
              ))}
            </div>

            {p.product_type !== "affiliate_external" && (
              <div className="flex items-center gap-2 mb-6">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  p.waitlistEligible ? "bg-orange-400" : p.purchasable ? "bg-emerald-500" : "bg-amber-400"
                }`} />
                <span className="text-sm text-brand-muted">
                  {p.waitlistEligible ? t("out_of_stock") : p.purchasable ? t("available") : t("on_request")}
                </span>
              </div>
            )}

            <ShareButtons
              url={`${STOREFRONT_URL}/products/${p.slug}`}
              title={p.name}
            />
          </div>
        </div>
      </div>

      {(p.description || p.product_type !== "affiliate_external") && (
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {p.description && (
              <>
                <h2 className="font-display text-2xl font-bold text-brand-text mb-6">{t("description")}</h2>
                <p className="text-brand-muted leading-relaxed text-base whitespace-pre-line max-w-3xl mb-8">
                  {p.description}
                </p>
              </>
            )}
            {p.product_type !== "affiliate_external" && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-brand-text">{t("stock_label")}:</span>
                {totalStock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    {t("stock_in_stock", { count: totalStock })}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {t("stock_out_of_stock")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {p.documents.length > 0 && (
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-brand-text mb-6">
              {t("documents_title")}
            </h2>
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden max-w-2xl">
              {p.documents.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 px-6 py-4 bg-white hover:bg-gray-50 transition-colors duration-150 group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-brand-accent/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-text truncate group-hover:text-brand-accent transition-colors duration-150">
                          {doc.name}
                        </p>
                        <p className="text-xs text-brand-muted">{getDocTypeLabel(doc.type, t)}</p>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-xs font-semibold text-brand-muted group-hover:text-brand-accent transition-colors duration-150 flex items-center gap-1">
                      {t("documents_download")}
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ─── Bundle Cross-Sell ──────────────────────────────────────────── */}
      <div className="py-12 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BundleSection productId={p.id} locale={params.locale} />
        </div>
      </div>

      {related.length > 0 && (
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-brand-text mb-8">{t("related")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} showCategory />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/products" className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150">
            {t("back")}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDocTypeLabel(type: string, t: any): string {
  switch (type) {
    case "datasheet":    return t("documents_type_datasheet");
    case "manual":       return t("documents_type_manual");
    case "certificate":  return t("documents_type_certificate");
    default:             return t("documents_type_other");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDeliveryHint(product_type: ProductType, t: any): string | null {
  switch (product_type) {
    case "direct_purchase": return t("delivery_direct");
    case "configurable": return t("delivery_configurable");
    case "inquiry_only": return t("delivery_inquiry");
    case "affiliate_external": return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTrustBadges(product_type: ProductType, t: any): string[] {
  switch (product_type) {
    case "direct_purchase": return t.raw("trust_direct") as string[];
    case "configurable": return t.raw("trust_configurable") as string[];
    case "inquiry_only": return t.raw("trust_inquiry") as string[];
    case "affiliate_external": return t.raw("trust_affiliate_external") as string[];
  }
}

type Spec = { label: string; value: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deriveSpecs(product: ProductDetail, t: any): Spec[] {
  if (product.variants.length === 0) return [];

  const attrs = product.variants.map((v) => v.attributes ?? {});
  const keys = [...new Set(attrs.flatMap((a) => Object.keys(a)))];

  const LABEL_MAP: Record<string, string> = {
    laenge_m: t("spec_length"),
    farbe: t("spec_color"),
    leistung_wp: t("spec_power"),
    leistung_kw: t("spec_power"),
    rotordurchmesser_m: t("spec_rotor"),
    zielgruppe: t("spec_target"),
    hinweis: t("spec_note"),
  };

  const specs: Spec[] = [];

  for (const key of keys) {
    const label = LABEL_MAP[key] ?? key;
    const uniqueValues = [...new Set(attrs.map((a) => a[key]).filter(Boolean).map(String))];
    if (uniqueValues.length === 0) continue;

    let value: string;
    if (key === "laenge_m") {
      value = uniqueValues.map((v) => `${v} m`).join(", ");
    } else if (key === "leistung_wp") {
      const max = Math.max(...uniqueValues.map(Number));
      value = `bis ${max} Wp`;
    } else if (key === "leistung_kw") {
      value = uniqueValues.map((v) => `${v} kW`).join(" / ");
    } else if (key === "rotordurchmesser_m") {
      value = uniqueValues.map((v) => `${v} m`).join(" / ");
    } else {
      value = uniqueValues.join(", ");
    }

    specs.push({ label, value });
  }

  return specs;
}
