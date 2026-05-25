/**
 * Feature Visual Engine – Global Display Settings
 * Verwaltet alle Anzeige-Einstellungen für das Feature Visual Engine.
 */

import { api } from "@/lib/api";
import type { FeatureVisualSettings } from "@/lib/api";
import { FeatureVisualSettingsForm } from "@/components/FeatureVisualSettingsForm";

export const dynamic = "force-dynamic";

export default async function FeatureVisualSettingsPage() {
  let settings: FeatureVisualSettings | null = null;
  try {
    settings = await api.featureVisualSettings.get();
  } catch {
    // Will render with defaults
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href="/feature-visuals" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1">
          ← Zurück zu Feature Visuals
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Anzeigeeinstellungen</h1>
        <p className="text-sm text-gray-500 mt-1">
          Steuere, wo und wie Feature Visuals im Storefront angezeigt werden.
        </p>
      </div>

      <FeatureVisualSettingsForm initialSettings={settings} />
    </div>
  );
}
