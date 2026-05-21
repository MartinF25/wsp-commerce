import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchProducts, fetchCategories } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import type { CategorySummary } from "@wsp/types";

type Props = { params: { locale: string }; searchParams: { category?: string } };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "products" });
  const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://webshop.wsp-solarenergie.de";
  const canonicalUrl = params.locale === "de" ? `${BASE}/products` : `${BASE}/${params.locale}/products`;
  return {
    title: t("meta_title"),
    description: t("meta_desc"),
    ...(searchParams.category && { robots: { index: false, follow: true } }),
    alternates: {
      canonical: canonicalUrl,
      languages: { de: `${BASE}/products`, en: `${BASE}/en/products`, es: `${BASE}/es/products` },
    },
    openGraph: {
      title: t("meta_title"),
      description: t("meta_desc"),
      url: canonicalUrl,
      siteName: "Solarzaun & SkyWind",
      locale: params.locale === "de" ? "de_DE" : params.locale === "en" ? "en_US" : "es_ES",
      type: "website",
      images: [{ url: `${BASE}/images/hero-bg.png`, width: 1200, height: 630, alt: t("meta_title") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta_title"),
      description: t("meta_desc"),
      images: [`${BASE}/images/hero-bg.png`],
    },
  };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "products" });
  const selectedCategory = searchParams.category;

  const [result, categories] = await Promise.all([
    fetchProducts({ locale: params.locale as "de" | "en" | "es", ...(selectedCategory ? { category: selectedCategory } : {}) }).catch(() => null),
    fetchCategories(params.locale).catch(() => []),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ── Header ── */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs text-brand-muted mb-6">
          <Link href="/" className="hover:text-brand-text transition-colors duration-150">{t("breadcrumb_home")}</Link>
          <span>/</span>
          <span className="text-brand-text">{t("page_title")}</span>
        </nav>
        <h1 className="font-display text-3xl font-bold text-brand-text mb-1">{t("page_title")}</h1>
        <p className="text-sm text-brand-muted">
          {result == null ? "" : result.total === 0 ? t("no_products") : t("result_count", { count: result.total })}
        </p>
      </div>

      {/* ── Kategorie-Kacheln (nur wenn kein Filter aktiv) ── */}
      {!selectedCategory && categories.length > 0 && (
        <section className="mb-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-1">{t("categories_eyebrow")}</p>
              <h2 className="font-display text-xl font-bold text-brand-text">{t("categories_h2")}</h2>
            </div>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0">
            {categories.map((cat) => (
              <li key={cat.id}>
                <CategoryCard
                  category={cat}
                  productCountLabel={
                    cat.productCount === 0
                      ? t("category_no_products")
                      : t("category_product_count", { count: cat.productCount })
                  }
                />
              </li>
            ))}
          </ul>
          <hr className="mt-10 border-gray-100" />
        </section>
      )}

      {/* ── Filter-Tabs ── */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/products"
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-150 ${
              !selectedCategory
                ? "bg-brand-accent border-brand-accent text-white"
                : "bg-white border-gray-200 text-brand-muted hover:border-brand-accent hover:text-brand-accent"
            }`}
          >
            {t("filter_all")}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-150 ${
                selectedCategory === cat.slug
                  ? "bg-brand-accent border-brand-accent text-white"
                  : "bg-white border-gray-200 text-brand-muted hover:border-brand-accent hover:text-brand-accent"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* ── Produkt-Grid ── */}
      {result == null ? (
        <p role="alert" className="text-brand-muted">{t("no_products")}</p>
      ) : result.items.length === 0 ? (
        <p className="text-brand-muted">{t("no_products")}</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0">
          {result.items.map((product) => (
            <li key={product.id} className="flex">
              <ProductCard product={product} showCategory={!selectedCategory} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12 pt-8 border-t border-gray-100">
        <Link href="/categories" className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150">
          {t("browse_categories")}
        </Link>
      </div>
    </div>
  );
}

// ─── Kategorie-Kachel ─────────────────────────────────────────────────────────

function CategoryCard({ category, productCountLabel }: { category: CategorySummary; productCountLabel: string }) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
    >
      {/* Bild */}
      <div className="relative h-44 w-full overflow-hidden bg-gray-100">
        {category.coverImageUrl ? (
          <Image
            src={category.coverImageUrl}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <span className="text-4xl text-gray-400">📦</span>
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Text */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-lg text-brand-text group-hover:text-brand-accent transition-colors duration-150 mb-1">
          {category.name}
        </h3>
        <p className="text-sm text-brand-muted">{productCountLabel}</p>
      </div>
    </Link>
  );
}
