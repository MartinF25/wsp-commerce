import { FeatureDefinitionForm } from "@/components/FeatureDefinitionForm";

export default function NewFeatureDefinitionPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href="/feature-definitions" className="text-sm text-gray-500 hover:text-gray-700">← Zurück</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Definition anlegen</h1>
      </div>
      <FeatureDefinitionForm mode="create" />
    </div>
  );
}
