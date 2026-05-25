import { api } from "@/lib/api";
import { FeatureVisualForm } from "@/components/FeatureVisualForm";

export const dynamic = "force-dynamic";

export default async function NewFeatureVisualPage() {
  const definitions = await api.featureDefinitions.list({ activeOnly: false }).catch(() => []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href="/feature-visuals" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
          ← Zurück zu Feature Visuals
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Visual anlegen</h1>
        <p className="text-sm text-gray-500 mt-1">
          Neues Icon, SVG oder Bild für ein Produktmerkmal.
        </p>
      </div>

      <FeatureVisualForm mode="create" definitions={definitions} />
    </div>
  );
}
