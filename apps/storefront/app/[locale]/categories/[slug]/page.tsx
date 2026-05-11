import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { fetchCategory } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

type Props = {
  params: { slug: string; locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "categories" });
  const category = await fetchCategory(params.slug, params.locale);
  if (!category) return { title: t("category_not_found") };

  const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://wsp-solar.de";
  const localePrefix = params.locale === "de" ? "" : `/${params.locale}`;
  const canonicalUrl = `${BASE}${localePrefix}/categories/${params.slug}`;

  const title = category.metaTitle ?? `${category.name} – Solarzaun & SkyWind`;
  const description = category.metaDescription ?? category.description ?? category.name;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        de: `${BASE}/categories/${params.slug}`,
        en: `${BASE}/en/categories/${params.slug}`,
        es: `${BASE}/es/categories/${params.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      ...(category.imageUrl ? { images: [{ url: category.imageUrl, alt: category.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(category.imageUrl ? { images: [category.imageUrl] } : {}),
    },
  };
}

export default async function CategoryDetailPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "categories" });
  const category = await fetchCategory(params.slug, params.locale);
  if (!category) notFound();

  const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://wsp-solar.de";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t("page_title"), item: `${BASE}/categories` },
              { "@type": "ListItem", position: 2, name: category.name, item: `${BASE}/categories/${category.slug}` },
            ],
          }),
        }}
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-brand-muted mb-8">
        <Link
          href="/categories"
          className="hover:text-brand-text transition-colors duration-150"
        >
          {t("page_title")}
        </Link>
        <span>/</span>
        <span className="text-brand-text">{category.name}</span>
      </nav>

      {/* Kategoriekopf */}
      <header className="mb-10">
        {category.imageUrl && (
          <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6">
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1280px"
              priority
            />
          </div>
        )}
        <h1 className="font-display text-3xl font-bold text-brand-text mb-1">{category.name}</h1>
        {category.description && (
          <p className="text-brand-muted mt-2 max-w-2xl">{category.description}</p>
        )}
        <p className="text-sm text-brand-muted mt-1">
          {category.products.length === 0 ? "" : `${category.products.length}`}
        </p>
      </header>

      {/* Unterkategorien */}
      {category.children.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display font-semibold text-lg text-brand-text mb-4">{t("subcategories")}</h2>
          <ul className="flex flex-wrap gap-3 list-none p-0 m-0">
            {category.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/categories/${child.slug}`}
                  className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm text-brand-text hover:border-brand-accent hover:text-brand-accent transition-colors duration-150"
                >
                  <span>{child.name}</span>
                  <span className="text-brand-muted text-xs">{child.productCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Produktliste */}
      <section>
        {category.products.length === 0 ? (
          <p className="text-brand-muted">{t("no_products_in_category")}</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0">
            {category.products.map((product) => (
              <li key={product.id} className="flex">
                <ProductCard product={product} showCategory={false} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Navigation */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <Link
          href="/categories"
          className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150"
        >
          {t("back_categories")}
        </Link>
      </div>
    </div>
  );
}
