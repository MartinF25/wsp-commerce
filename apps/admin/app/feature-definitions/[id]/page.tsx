import { api } from "@/lib/api";
import { FeatureDefinitionForm } from "@/components/FeatureDefinitionForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditFeatureDefinitionPage({ params }: { params: { id: string } }) {
  const def = await api.featureDefinitions.get(params.id).catch(() => null);
  if (!def) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href="/feature-definitions" className="text-sm text-gray-500 hover:text-gray-700">← Zurück</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Definition bearbeiten</h1>
        <p className="text-xs text-gray-400 mt-1 font-mono">{def.id}</p>
      </div>
      <FeatureDefinitionForm mode="edit" definition={def} />
    </div>
  );
}
