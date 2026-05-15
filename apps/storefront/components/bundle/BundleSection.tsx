import type { Bundle } from "@wsp/types";
import { fetchBundlesForProduct } from "@/lib/bundles";
import { BundleTabs } from "./BundleTabs";

interface BundleSectionProps {
  productId: string;
  locale?: string;
}

/**
 * Server-Komponente: Lädt Bundles für ein Produkt und rendert die BundleTabs.
 * Gibt null zurück wenn keine aktiven Bundles vorhanden (kein leeres UI).
 */
export async function BundleSection({ productId, locale = "de" }: BundleSectionProps) {
  const bundles = await fetchBundlesForProduct(productId, locale);

  if (bundles.length === 0) return null;

  return (
    <section aria-label="Passende Produkt-Bundles" className="mt-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-100" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-brand-dark whitespace-nowrap">
          Häufig zusammen gekauft
        </h2>
        <div className="flex-1 h-px bg-gray-100" aria-hidden="true" />
      </div>

      <BundleTabs bundles={bundles} locale={locale} />
    </section>
  );
}
