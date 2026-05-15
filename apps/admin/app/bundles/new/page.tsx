import { BundleForm } from "@/components/BundleForm";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function NewBundlePage() {
  // Produkte und Kategorien für Assignment-Auswahl laden
  const [products, categories] = await Promise.allSettled([
    api.products.list(),
    api.categories.list(),
  ]);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Neues Bundle erstellen</h1>
        <p className="text-sm text-gray-500 mt-1">
          Definieren Sie ein Cross-Sell-Bundle mit Produkten, Rabatt und Anzeige-Optionen.
        </p>
      </div>

      <BundleForm
        mode="create"
        products={products.status === "fulfilled" ? products.value : []}
        categories={categories.status === "fulfilled" ? categories.value : []}
      />
    </div>
  );
}
