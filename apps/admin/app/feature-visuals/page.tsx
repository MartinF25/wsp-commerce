/**
 * Feature Visual Engine – Admin Overview
 * Lists all FeatureVisual entries with preview, scope, definition link.
 */

import { api } from "@/lib/api";
import type { FeatureVisual, FeatureDefinition } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

function ScopeBadge({ scope }: { scope: FeatureVisual["scope"] }) {
  const config = {
    global:   { label: "Global",    cls: "bg-blue-50 text-blue-700 border-blue-100" },
    category: { label: "Kategorie", cls: "bg-purple-50 text-purple-700 border-purple-100" },
    product:  { label: "Produkt",   cls: "bg-amber-50 text-amber-700 border-amber-100" },
  }[scope];
  return (
    <span className={`inline-block text-xs font-medium border px-2 py-0.5 rounded-full ${config.cls}`}>
      {config.label}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium border px-2 py-0.5 rounded-full ${
        active
          ? "bg-green-50 text-green-700 border-green-100"
          : "bg-gray-50 text-gray-500 border-gray-100"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
      {active ? "Aktiv" : "Inaktiv"}
    </span>
  );
}

function VisualPreview({ visual }: { visual: FeatureVisual }) {
  if (visual.svg_content) {
    return (
      <span
        className="inline-flex w-8 h-8 items-center justify-center text-brand-muted [&>svg]:w-6 [&>svg]:h-6"
        dangerouslySetInnerHTML={{ __html: visual.svg_content }}
        title="SVG Preview"
      />
    );
  }
  if (visual.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={visual.image_url}
        alt="Visual"
        className="w-8 h-8 object-contain rounded"
      />
    );
  }
  return (
    <span className="inline-flex w-8 h-8 items-center justify-center bg-gray-100 rounded text-gray-400">
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

export default async function FeatureVisualsPage() {
  const [visualsResult, defsResult] = await Promise.allSettled([
    api.featureVisuals.list({ activeOnly: false }),
    api.featureDefinitions.list({ activeOnly: false }),
  ]);

  const visuals: FeatureVisual[] = visualsResult.status === "fulfilled"
    ? (visualsResult.value as { data: FeatureVisual[] }).data
    : [];
  const defs: FeatureDefinition[] = defsResult.status === "fulfilled"
    ? defsResult.value
    : [];

  const defMap = new Map(defs.map((d) => [d.id, d]));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Visual Engine</h1>
          <p className="text-sm text-gray-500 mt-1">
            {visuals.length} Visuals · Verwalte Icons, Pictogramme und Badges für Produktmerkmale
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/feature-visuals/settings"
            className="text-sm px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ⚙ Einstellungen
          </Link>
          <Link
            href="/feature-definitions"
            className="text-sm px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            📐 Definitionen
          </Link>
          <Link
            href="/feature-visuals/new"
            className="text-sm px-4 py-1.5 bg-brand-accent text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            + Visual anlegen
          </Link>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Gesamt", value: visuals.length, color: "text-gray-900" },
          { label: "Aktiv", value: visuals.filter((v) => v.is_active).length, color: "text-green-700" },
          { label: "Mit SVG", value: visuals.filter((v) => v.svg_content).length, color: "text-blue-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {visuals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-4">🎨</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Noch keine Feature Visuals</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Erstelle Icons, SVGs oder Bildchen für deine Produktmerkmale. Sie erscheinen auf Produktseiten, Karten und in Filtern.
          </p>
          <Link
            href="/feature-visuals/new"
            className="inline-flex items-center gap-2 bg-brand-accent text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-green-600 transition-colors"
          >
            Erstes Visual anlegen
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Visual</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Label / Wert</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Definition</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Scope</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Priorität</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visuals.map((visual) => {
                const def = visual.feature_definition_id
                  ? defMap.get(visual.feature_definition_id)
                  : null;
                const label = visual.labels?.de || def?.names?.de || "–";
                return (
                  <tr key={visual.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <VisualPreview visual={visual} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{label}</p>
                      {visual.feature_value && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Wert: <code className="bg-gray-100 px-1 rounded">{visual.feature_value}</code>
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {def ? (
                        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {def.slug}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ScopeBadge scope={visual.scope} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600 tabular-nums">{visual.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ActiveBadge active={visual.is_active} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/feature-visuals/${visual.id}`}
                        className="text-xs text-brand-accent hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Bearbeiten
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
