import { api } from "@/lib/api";
import { FeatureVisualForm } from "@/components/FeatureVisualForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditFeatureVisualPage({ params }: { params: { id: string } }) {
  const [visual, definitions] = await Promise.all([
    api.featureVisuals.get(params.id).catch(() => null),
    api.featureDefinitions.list({ activeOnly: false }).catch(() => []),
  ]);

  if (!visual) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href="/feature-visuals" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
          ← Zurück zu Feature Visuals
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Visual bearbeiten</h1>
        <p className="text-sm text-gray-400 mt-1 font-mono text-xs">{visual.id}</p>
      </div>

      <FeatureVisualForm mode="edit" visual={visual} definitions={definitions} />
    </div>
  );
}
