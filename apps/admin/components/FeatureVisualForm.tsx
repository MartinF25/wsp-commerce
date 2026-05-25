"use client";

/**
 * FeatureVisualForm – Create/Edit Feature Visual
 * Vollständiges Formular für Erstellung und Bearbeitung von Feature Visuals.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FeatureVisual, FeatureDefinition, FeatureVisualScope } from "@/lib/api";

interface Props {
  visual?: FeatureVisual;
  definitions: FeatureDefinition[];
  mode: "create" | "edit";
}

const SCOPE_OPTIONS: { value: FeatureVisualScope; label: string; description: string }[] = [
  { value: "global",   label: "Global",    description: "Gilt für alle Produkte und Kategorien" },
  { value: "category", label: "Kategorie", description: "Nur für Produkte dieser Kategorie" },
  { value: "product",  label: "Produkt",   description: "Nur für dieses spezifische Produkt" },
];

type FormState = {
  feature_definition_id: string;
  feature_value: string;
  scope: FeatureVisualScope;
  category_id: string;
  product_id: string;
  image_url: string;
  svg_content: string;
  image_width: string;
  image_height: string;
  label_de: string;
  label_en: string;
  label_es: string;
  tooltip_de: string;
  tooltip_en: string;
  alt_de: string;
  alt_en: string;
  link_url: string;
  link_target: string;
  link_rel: string;
  color_primary: string;
  color_secondary: string;
  css_class: string;
  priority: string;
  is_active: boolean;
};

function toFormState(visual?: FeatureVisual): FormState {
  return {
    feature_definition_id: visual?.feature_definition_id ?? "",
    feature_value: visual?.feature_value ?? "",
    scope: visual?.scope ?? "global",
    category_id: visual?.category_id ?? "",
    product_id: visual?.product_id ?? "",
    image_url: visual?.image_url ?? "",
    svg_content: visual?.svg_content ?? "",
    image_width: visual?.image_width?.toString() ?? "",
    image_height: visual?.image_height?.toString() ?? "",
    label_de: visual?.labels?.de ?? "",
    label_en: visual?.labels?.en ?? "",
    label_es: visual?.labels?.es ?? "",
    tooltip_de: visual?.tooltips?.de ?? "",
    tooltip_en: visual?.tooltips?.en ?? "",
    alt_de: visual?.alt_texts?.de ?? "",
    alt_en: visual?.alt_texts?.en ?? "",
    link_url: visual?.link_url ?? "",
    link_target: visual?.link_target ?? "_self",
    link_rel: visual?.link_rel ?? "",
    color_primary: visual?.color_primary ?? "",
    color_secondary: visual?.color_secondary ?? "",
    css_class: visual?.css_class ?? "",
    priority: visual?.priority?.toString() ?? "0",
    is_active: visual?.is_active ?? true,
  };
}

function toPayload(form: FormState) {
  return {
    feature_definition_id: form.feature_definition_id || undefined,
    feature_value: form.feature_value || undefined,
    scope: form.scope,
    category_id: form.scope === "category" ? form.category_id || undefined : undefined,
    product_id: form.scope === "product" ? form.product_id || undefined : undefined,
    image_url: form.image_url || undefined,
    svg_content: form.svg_content || undefined,
    image_width: form.image_width ? parseInt(form.image_width) : undefined,
    image_height: form.image_height ? parseInt(form.image_height) : undefined,
    labels: (form.label_de || form.label_en || form.label_es)
      ? { de: form.label_de || undefined, en: form.label_en || undefined, es: form.label_es || undefined }
      : undefined,
    tooltips: (form.tooltip_de || form.tooltip_en)
      ? { de: form.tooltip_de || undefined, en: form.tooltip_en || undefined }
      : undefined,
    alt_texts: (form.alt_de || form.alt_en)
      ? { de: form.alt_de || undefined, en: form.alt_en || undefined }
      : undefined,
    link_url: form.link_url || undefined,
    link_target: form.link_target || "_self",
    link_rel: form.link_rel || undefined,
    color_primary: form.color_primary || undefined,
    color_secondary: form.color_secondary || undefined,
    css_class: form.css_class || undefined,
    priority: parseInt(form.priority) || 0,
    is_active: form.is_active,
  };
}

const BASE = process.env.NEXT_PUBLIC_COMMERCE_API_URL ?? "";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";

export function FeatureVisualForm({ visual, definitions, mode }: Props) {
  const [form, setForm] = useState<FormState>(toFormState(visual));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url && !form.svg_content) {
      setError("Entweder Image URL oder SVG-Inhalt ist erforderlich.");
      return;
    }
    startTransition(async () => {
      try {
        const url = mode === "create"
          ? `${BASE}/api/admin/feature-visuals`
          : `${BASE}/api/admin/feature-visuals/${visual!.id}`;
        const res = await fetch(url, {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
          body: JSON.stringify(toPayload(form)),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message ?? "Fehler");
        router.push("/feature-visuals");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      }
    });
  };

  const handleDelete = () => {
    if (!visual || !confirm("Visual wirklich löschen?")) return;
    startTransition(async () => {
      try {
        await fetch(`${BASE}/api/admin/feature-visuals/${visual.id}`, {
          method: "DELETE",
          headers: { "X-Admin-Key": ADMIN_KEY },
        });
        router.push("/feature-visuals");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
      }
    });
  };

  // SVG preview
  const svgPreview = form.svg_content
    ? { __html: form.svg_content }
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ── Definition & Wert ─────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Verknüpfung
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feature-Definition
            </label>
            <select
              value={form.feature_definition_id}
              onChange={(e) => set({ feature_definition_id: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="">– Keine (freistehend) –</option>
              {definitions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.names?.de ?? d.slug} ({d.slug})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Bestimmt das Matching-Muster</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spezifischer Featurewert
            </label>
            <input
              type="text"
              value={form.feature_value}
              onChange={(e) => set({ feature_value: e.target.value })}
              placeholder="z.B. IP65, 400 W"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <p className="text-xs text-gray-400 mt-1">Leer = gilt für alle Werte</p>
          </div>
        </div>

        {/* Scope */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Geltungsbereich</label>
          <div className="flex gap-3">
            {SCOPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex-1 flex flex-col gap-1 border rounded-xl p-3 cursor-pointer transition-colors ${
                  form.scope === opt.value
                    ? "border-brand-accent bg-brand-accent/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  value={opt.value}
                  checked={form.scope === opt.value}
                  onChange={(e) => set({ scope: e.target.value as FeatureVisualScope })}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                <span className="text-xs text-gray-500">{opt.description}</span>
              </label>
            ))}
          </div>
        </div>

        {form.scope === "category" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie-ID</label>
            <input
              type="text"
              value={form.category_id}
              onChange={(e) => set({ category_id: e.target.value })}
              placeholder="UUID der Kategorie"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
        )}
        {form.scope === "product" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Produkt-ID</label>
            <input
              type="text"
              value={form.product_id}
              onChange={(e) => set({ product_id: e.target.value })}
              placeholder="UUID des Produkts"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
        )}
      </section>

      {/* ── Visual Assets ─────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Visual Asset
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {/* SVG Side */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SVG-Inhalt <span className="text-brand-accent font-normal">(bevorzugt)</span>
            </label>
            <textarea
              value={form.svg_content}
              onChange={(e) => set({ svg_content: e.target.value })}
              placeholder={`<svg viewBox="0 0 24 24" fill="none" ...>\n  ...\n</svg>`}
              rows={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
            />
          </div>

          {/* Image URL Side */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bild-URL (alternativ)
            </label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => set({ image_url: e.target.value })}
              placeholder="https://cdn.example.com/icon.png"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Breite (px)</label>
                <input
                  type="number"
                  value={form.image_width}
                  onChange={(e) => set({ image_width: e.target.value })}
                  placeholder="24"
                  className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Höhe (px)</label>
                <input
                  type="number"
                  value={form.image_height}
                  onChange={(e) => set({ image_height: e.target.value })}
                  placeholder="24"
                  className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Breite/Höhe angeben → kein Layout-Shift (CLS)</p>
          </div>
        </div>

        {/* Preview */}
        {(form.svg_content || form.image_url) && (
          <div className="mt-4 flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 font-medium">Vorschau:</p>
            {svgPreview ? (
              <span
                className="w-12 h-12 flex items-center justify-center text-gray-700 [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={svgPreview}
              />
            ) : form.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="Preview" className="w-12 h-12 object-contain" />
            ) : null}
            <div className="text-xs text-gray-500">
              {form.svg_content ? "✓ SVG erkannt" : ""}
              {form.image_url ? "✓ Bild-URL gesetzt" : ""}
            </div>
          </div>
        )}
      </section>

      {/* ── Mehrsprachige Texte ────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Texte & Labels
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {(["de", "en", "es"] as const).map((locale) => {
            const flag = { de: "🇩🇪", en: "🇬🇧", es: "🇪🇸" }[locale];
            return (
              <div key={locale} className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase">{flag} {locale.toUpperCase()}</h3>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={form[`label_${locale}` as "label_de" | "label_en" | "label_es"]}
                    onChange={(e) => set({ [`label_${locale}`]: e.target.value } as Partial<FormState>)}
                    placeholder={`Label auf ${locale}`}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
                {(locale === "de" || locale === "en") && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tooltip</label>
                    <input
                      type="text"
                      value={form[`tooltip_${locale}` as "tooltip_de" | "tooltip_en"]}
                      onChange={(e) => set({ [`tooltip_${locale}`]: e.target.value } as Partial<FormState>)}
                      placeholder="Hover-Tooltip"
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </div>
                )}
                {(locale === "de" || locale === "en") && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Alt-Text</label>
                    <input
                      type="text"
                      value={form[`alt_${locale}` as "alt_de" | "alt_en"]}
                      onChange={(e) => set({ [`alt_${locale}`]: e.target.value } as Partial<FormState>)}
                      placeholder="Für Screen-Reader"
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Styling & Link ─────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Styling & Link
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primärfarbe</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.color_primary || "#6B7280"}
                onChange={(e) => set({ color_primary: e.target.value })}
                className="h-9 w-12 rounded border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={form.color_primary}
                onChange={(e) => set({ color_primary: e.target.value })}
                placeholder="#22C55E"
                className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priorität</label>
            <input
              type="number"
              value={form.priority}
              onChange={(e) => set({ priority: e.target.value })}
              min={-100}
              max={1000}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CSS-Klassen</label>
            <input
              type="text"
              value={form.css_class}
              onChange={(e) => set({ css_class: e.target.value })}
              placeholder="custom-feature-badge"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link-URL</label>
            <input
              type="url"
              value={form.link_url}
              onChange={(e) => set({ link_url: e.target.value })}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link-Target</label>
            <select
              value={form.link_target}
              onChange={(e) => set({ link_target: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="_self">Gleicher Tab (_self)</option>
              <option value="_blank">Neuer Tab (_blank)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link-Rel</label>
            <input
              type="text"
              value={form.link_rel}
              onChange={(e) => set({ link_rel: e.target.value })}
              placeholder="noopener noreferrer"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
        </div>
      </section>

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-brand-accent text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60"
          >
            {isPending ? "Wird gespeichert…" : mode === "create" ? "Visual erstellen" : "Änderungen speichern"}
          </button>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set({ is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
            />
            <span className="text-sm text-gray-700">Aktiv</span>
          </label>
        </div>
        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Visual löschen
          </button>
        )}
      </div>
    </form>
  );
}
