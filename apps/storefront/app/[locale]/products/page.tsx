import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchProducts, fetchCategories } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

type Props = { params: { locale: string }; searchParams: { category?: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "products" });
  return { title: t("meta_title"), description: t("meta_desc") };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "products" });
  const selectedCategory = searchParams.category;

  const [result, categories] = await Promise.all([
    fetchProducts(selectedCategory ? { category: selectedCategory } : undefined).catch(() => null),
    fetchCategories().catch(() => []),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs text-brand-muted mb-6">
          <Link href="/" className="hover:text-brand-text transition-colors duration-150">{t("breadcrumb_home")}</Link>
          <span>/</span>
          <span className="text-brand-text">{t("page_title")}</span>
        </nav>
        <h1 className="font-display text-3xl font-bold text-brand-text mb-1">{t("page_title")}</h1>
        <p className="text-sm text-brand-muted">
          {result == null ? "" : result.total === 0 ? t("no_products") : `${result.total} Produkte`}
        </p>
      </div>

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
            Alle
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
