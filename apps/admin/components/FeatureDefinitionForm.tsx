"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FeatureDefinition } from "@/lib/api";

interface Props {
  definition?: FeatureDefinition;
  mode: "create" | "edit";
}

type FormState = {
  slug: string;
  name_de: string;
  name_en: string;
  name_es: string;
  desc_de: string;
  match_pattern: string;
  match_type: FeatureDefinition["match_type"];
  category_id: string;
  sort_order: string;
  is_active: boolean;
};

const MATCH_TYPES: { value: FeatureDefinition["match_type"]; label: string; description: string }[] = [
  { value: "contains", label: "Enthält",      description: "Feature-String enthält das Muster" },
  { value: "exact",    label: "Exakt",         description: "Exaktes Match (case-insensitive)" },
  { value: "starts",   label: "Beginnt mit",   description: "Feature-String beginnt mit dem Muster" },
  { value: "ends",     label: "Endet mit",     description: "Feature-String endet mit dem Muster" },
  { value: "regex",    label: "Regex",         description: "Regulärer Ausdruck (JavaScript)" },
];

const BASE = process.env.NEXT_PUBLIC_COMMERCE_API_URL ?? "";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";

export function FeatureDefinitionForm({ definition, mode }: Props) {
  const [form, setForm] = useState<FormState>({
    slug: definition?.slug ?? "",
    name_de: definition?.names?.de ?? "",
    name_en: definition?.names?.en ?? "",
    name_es: definition?.names?.es ?? "",
    desc_de: definition?.descriptions?.de ?? "",
    match_pattern: definition?.match_pattern ?? "",
    match_type: definition?.match_type ?? "contains",
    category_id: definition?.category_id ?? "",
    sort_order: definition?.sort_order?.toString() ?? "0",
    is_active: definition?.is_active ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const set = (patch: Partial<FormState>) => setForm((p) => ({ ...p, ...patch }));

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          slug: form.slug,
          names: { de: form.name_de || undefined, en: form.name_en || undefined, es: form.name_es || undefined },
          descriptions: form.desc_de ? { de: form.desc_de } : undefined,
          match_pattern: form.match_pattern || undefined,
          match_type: form.match_type,
          category_id: form.category_id || undefined,
          sort_order: parseInt(form.sort_order) || 0,
          is_active: form.is_active,
        };
        const url = mode === "create"
          ? `${BASE}/api/admin/feature-definitions`
          : `${BASE}/api/admin/feature-definitions/${definition!.id}`;
        const res = await fetch(url, {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message ?? "Fehler");
        router.push("/feature-definitions");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fehler");
      }
    });
  };

  const handleDelete = () => {
    if (!definition || !confirm("Definition löschen? Verknüpfte Visuals bleiben erhalten.")) return;
    startTransition(async () => {
      await fetch(`${BASE}/api/admin/feature-definitions/${definition.id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": ADMIN_KEY },
      });
      router.push("/feature-definitions");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Basis</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => set({ slug: slugify(e.target.value) })}
              placeholder="leistung"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <p className="text-xs text-gray-400 mt-1">Nur Kleinbuchstaben, Zahlen und –</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sortierung</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => set({ sort_order: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(["de", "en", "es"] as const).map((l) => (
            <div key={l}>
              <label className="block text-xs text-gray-500 mb-1">
                {({ de: "🇩🇪 Name (DE)", en: "🇬🇧 Name (EN)", es: "🇪🇸 Name (ES)" })[l]}
              </label>
              <input
                type="text"
                value={form[`name_${l}` as "name_de" | "name_en" | "name_es"]}
                onChange={(e) => {
                  const patch: Partial<FormState> = { [`name_${l}`]: e.target.value };
                  if (l === "de" && !form.slug) patch.slug = slugify(e.target.value);
                  set(patch);
                }}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Match-Konfiguration</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Match-Typ</label>
          <div className="flex gap-2 flex-wrap">
            {MATCH_TYPES.map((t) => (
              <label
                key={t.value}
                className={`flex flex-col border rounded-xl p-2.5 cursor-pointer text-xs transition-colors min-w-24 ${
                  form.match_type === t.value
                    ? "border-brand-accent bg-brand-accent/5 text-brand-accent"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <input type="radio" name="match_type" value={t.value}
                  checked={form.match_type === t.value}
                  onChange={(e) => set({ match_type: e.target.value as FeatureDefinition["match_type"] })}
                  className="sr-only"
                />
                <span className="font-semibold">{t.label}</span>
                <span className="text-gray-400 mt-0.5">{t.description}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
          <input
            type="text"
            value={form.match_pattern}
            onChange={(e) => set({ match_pattern: e.target.value })}
            placeholder={form.match_type === "regex" ? "^Leistung:\\s*(\\d+)\\s*W" : "Leistung:"}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
          <p className="text-xs text-gray-400 mt-1">
            Beispiel: Feature-String &quot;Leistung: 400 W&quot; — Pattern &quot;Leistung:&quot; mit Typ &quot;Beginnt mit&quot;
          </p>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={isPending}
            className="px-6 py-2 bg-brand-accent text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60"
          >
            {isPending ? "…" : mode === "create" ? "Definition erstellen" : "Speichern"}
          </button>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-brand-accent" />
            <span className="text-sm text-gray-700">Aktiv</span>
          </label>
        </div>
        {mode === "edit" && (
          <button type="button" onClick={handleDelete} disabled={isPending}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Löschen
          </button>
        )}
      </div>
    </form>
  );
}
