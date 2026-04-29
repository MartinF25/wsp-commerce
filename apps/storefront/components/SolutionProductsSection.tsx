import type { ProductSummary } from "@wsp/types";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/ProductCard";
import { useTranslations } from "next-intl";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  products: ProductSummary[];
};

export function SolutionProductsSection({ eyebrow, title, description, products }: Props) {
  const t = useTranslations("products");
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-brand-accent">
            {eyebrow}
          </p>
          <h2 className="mb-3 font-display text-3xl font-bold text-brand-text">{title}</h2>
          <p className="leading-relaxed text-brand-muted">{description}</p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8">
            <p className="mb-5 max-w-2xl text-sm leading-relaxed text-brand-muted">
              {t("empty_state_text")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/kontakt"
                className="inline-block rounded-xl bg-brand-accent px-6 py-3 text-center text-sm font-semibold text-white transition-colors duration-150 hover:bg-green-600"
              >
                {t("empty_cta_primary")}
              </Link>
              <Link
                href="/products"
                className="inline-block rounded-xl border border-gray-200 px-6 py-3 text-center text-sm font-semibold text-brand-text transition-colors duration-150 hover:border-brand-accent hover:text-brand-accent"
              >
                {t("empty_cta_secondary")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} showCategory={false} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
