import type { Metadata } from "next";
import type { CategorySummary } from "@wsp/types";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { fetchCategories } from "@/lib/catalog";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "categories" });
  const canonicalUrl = params.locale === "de"
    ? `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/categories`
    : `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/${params.locale}/categories`;

  return {
    title: t("meta_title"),
    description: t("meta_desc"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        de: `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/categories`,
        en: `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/en/categories`,
        es: `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://wsp-solar.de"}/es/categories`,
      },
    },
  };
}

export default async function CategoriesPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "categories" });

  let categories: CategorySummary[];
  try {
    categories = await fetchCategories();
  } catch (_err) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="font-display text-3xl font-bold text-brand-text mb-4">{t("error_title")}</h1>
        <p role="alert" className="text-brand-muted">{t("error_msg")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-brand-text mb-1">{t("page_title")}</h1>
        <p className="text-sm text-brand-muted">
          {categories.length === 0 ? t("no_categories") : `${categories.length}`}
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-brand-muted">{t("no_categories")}</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
          {categories.map((category) => (
            <li key={category.id}>
              <CategoryCard category={category} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12 pt-8 border-t border-gray-100">
        <Link
          href="/products"
          className="text-sm text-brand-muted hover:text-brand-text transition-colors duration-150"
        >
          {t("all_products")}
        </Link>
      </div>
    </div>
  );
}

function CategoryCard({ category }: { category: CategorySummary }) {
  const imageUrl = category.imageUrl ?? category.coverImageUrl;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-accent transition-all duration-200 overflow-hidden"
    >
      {imageUrl ? (
        <div className="relative w-full h-40 overflow-hidden">
          <Image
            src={imageUrl}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="w-full h-40 bg-gray-50 flex items-center justify-center">
          <span className="text-4xl text-gray-200">📦</span>
        </div>
      )}
      <div className="p-6">
        <h2 className="font-display font-semibold text-lg text-brand-text group-hover:text-brand-accent transition-colors duration-150 mb-1">
          {category.name}
        </h2>
        <p className="text-sm text-brand-muted">{category.productCount}</p>
      </div>
    </Link>
  );
}
