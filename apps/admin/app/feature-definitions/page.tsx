/**
 * Feature Definitions – Admin Overview
 * Verwaltet FeatureDefinition-Einträge (Matching-Patterns für Feature-Strings).
 */

import { api } from "@/lib/api";
import type { FeatureDefinition } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MATCH_TYPE_LABELS: Record<FeatureDefinition["match_type"], string> = {
  exact:    "Exakt",
  contains: "Enthält",
  starts:   "Beginnt mit",
  ends:     "Endet mit",
  regex:    "Regex",
};

export default async function FeatureDefinitionsPage() {
  const defs = await api.featureDefinitions.list({ activeOnly: false }).catch(() => [] as FeatureDefinition[]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <a href="/feature-visuals" className="text-sm text-gray-400 hover:text-gray-600">← Feature Visuals</a>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Feature-Definitionen</h1>
          <p className="text-sm text-gray-500 mt-1">
            Definiere, welche Feature-Strings welchem Typ entsprechen.
          </p>
        </div>
        <Link
          href="/feature-definitions/new"
          className="text-sm px-4 py-1.5 bg-brand-accent text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
        >
          + Definition anlegen
        </Link>
      </div>

      {defs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-4">📐</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Keine Definitionen</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Feature-Definitionen beschreiben, welche Textmuster zu welchem Merkmals-Typ gehören.
          </p>
          <Link
            href="/feature-definitions/new"
            className="inline-flex items-center gap-2 bg-brand-accent text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-green-600 transition-colors"
          >
            Erste Definition anlegen
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name (DE)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Match-Pattern</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Typ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Reihenfolge</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {defs.map((def) => (
                <tr key={def.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{def.slug}</code>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{def.names?.de ?? "–"}</td>
                  <td className="px-4 py-3">
                    {def.match_pattern ? (
                      <code className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{def.match_pattern}</code>
                    ) : (
                      <span className="text-gray-400 text-xs">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600">{MATCH_TYPE_LABELS[def.match_type]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 tabular-nums">{def.sort_order}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium border px-2 py-0.5 rounded-full ${
                      def.is_active
                        ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-gray-50 text-gray-500 border-gray-100"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${def.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                      {def.is_active ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/feature-definitions/${def.id}`}
                      className="text-xs text-brand-accent hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
