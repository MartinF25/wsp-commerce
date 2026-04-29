import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchCategory } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

type Props = {
  params: { slug: string; locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "categories" });
  const category = await fetchCategory(params.slug);
  if (!category) return { title: t("category_not_found") };

  return {
    title: `${category.name} – Solarzaun & SkyWind`,
    description: `${category.name}`,
  };
}

export default async function CategoryDetailPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "categories" });
  const category = await fetchCategory(params.slug);
  if (!category) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        <h1 className="font-display text-3xl font-bold text-brand-text mb-1">{category.name}</h1>
        <p className="text-sm text-brand-muted">
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
