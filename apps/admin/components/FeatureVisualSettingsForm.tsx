"use client";

/**
 * FeatureVisualSettingsForm – Client-Component
 * Formular für globale Feature-Visual-Einstellungen.
 */

import { useState, useTransition } from "react";
import type { FeatureVisualSettings, FeatureDisplayMode } from "@/lib/api";

interface Props {
  initialSettings: FeatureVisualSettings | null;
}

const DISPLAY_MODES: { value: FeatureDisplayMode; label: string }[] = [
  { value: "grid",           label: "Kachel-Grid" },
  { value: "horizontal",     label: "Horizontal (Scroll-Reihe)" },
  { value: "vertical",       label: "Vertikal (Stack)" },
  { value: "compact",        label: "Kompakt (nur Icons)" },
  { value: "grouped",        label: "Gruppiert nach Feature-Name" },
  { value: "icon_value",     label: "Icon + Wert" },
  { value: "icon_name_value",label: "Icon + Name + Wert" },
  { value: "tooltip_only",   label: "Nur Tooltip (unsichtbar)" },
];

const defaultSettings: Partial<FeatureVisualSettings> = {
  enable_product_page: true,
  enable_quick_view: true,
  enable_miniature: false,
  enable_faceted_search: true,
  enable_collection: true,
  enable_search_results: true,
  default_display_mode: "vertical",
  default_icon_size: "md",
  show_labels: true,
  show_tooltips: true,
  enable_animations: true,
  product_page_mode: "grid",
  product_page_position: "below_description",
  product_page_columns: 3,
  miniature_mode: "compact",
  miniature_max_icons: 4,
  miniature_position: "bottom",
  facet_show_icons: true,
  facet_show_labels: false,
  facet_collapsible: true,
  font_size: "sm",
  font_weight: "medium",
  track_interactions: false,
  enable_ab_testing: false,
};

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={`w-10 h-6 rounded-full transition-colors duration-200 ${
            checked ? "bg-brand-accent" : "bg-gray-200"
          }`}
        />
        <div
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(parseInt(e.target.value) || min)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
      />
    </div>
  );
}

export function FeatureVisualSettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState<Partial<FeatureVisualSettings>>(
    initialSettings ?? defaultSettings,
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const update = (patch: Partial<FeatureVisualSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_COMMERCE_API_URL ?? ""}/api/admin/feature-visual-settings`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Admin-Key": process.env.NEXT_PUBLIC_ADMIN_KEY ?? "",
            },
            body: JSON.stringify(settings),
          },
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.error?.message ?? "Speichern fehlgeschlagen");
        }
        setSaved(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* ── Anzeige-Standorte ──────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Anzeige-Standorte
        </h2>
        <div className="space-y-4">
          <Toggle
            label="Produktdetailseite"
            description="Feature Visuals auf /products/[slug] anzeigen"
            checked={settings.enable_product_page ?? true}
            onChange={(v) => update({ enable_product_page: v })}
          />
          <Toggle
            label="Quick View Modal"
            description="Feature Visuals im Quick-View-Popup anzeigen"
            checked={settings.enable_quick_view ?? true}
            onChange={(v) => update({ enable_quick_view: v })}
          />
          <Toggle
            label="Produktkarte (Miniatur)"
            description="Kompakte Icon-Zeile unterhalb des Produktnamens"
            checked={settings.enable_miniature ?? false}
            onChange={(v) => update({ enable_miniature: v })}
          />
          <Toggle
            label="Facetten-Filter"
            description="Icons neben Filter-Optionen in der Such-Sidebar"
            checked={settings.enable_faceted_search ?? true}
            onChange={(v) => update({ enable_faceted_search: v })}
          />
          <Toggle
            label="Kategorie-Seite"
            description="Feature Visuals in der Produktliste"
            checked={settings.enable_collection ?? true}
            onChange={(v) => update({ enable_collection: v })}
          />
        </div>
      </section>

      {/* ── Produktdetailseite ─────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Produktdetailseite
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Darstellungsmodus"
            value={settings.product_page_mode ?? "grid"}
            options={DISPLAY_MODES}
            onChange={(v) => update({ product_page_mode: v as FeatureDisplayMode })}
          />
          <NumberInput
            label="Spalten (Desktop)"
            value={settings.product_page_columns ?? 3}
            min={1}
            max={6}
            onChange={(v) => update({ product_page_columns: v })}
          />
          <Select
            label="Position"
            value={settings.product_page_position ?? "below_description"}
            options={[
              { value: "below_gallery",      label: "Unter der Bildgalerie" },
              { value: "below_description",  label: "Unter der Beschreibung" },
              { value: "sidebar",            label: "In der rechten Spalte" },
            ]}
            onChange={(v) => update({ product_page_position: v })}
          />
          <Select
            label="Icon-Größe"
            value={settings.default_icon_size ?? "md"}
            options={[
              { value: "xs",  label: "XS (16px)" },
              { value: "sm",  label: "SM (20px)" },
              { value: "md",  label: "MD (24px)" },
              { value: "lg",  label: "LG (32px)" },
              { value: "xl",  label: "XL (40px)" },
              { value: "2xl", label: "2XL (48px)" },
            ]}
            onChange={(v) => update({ default_icon_size: v })}
          />
        </div>
      </section>

      {/* ── Produktkarte ───────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Produktkarte (Miniatur)
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput
            label="Max. Icons"
            value={settings.miniature_max_icons ?? 4}
            min={1}
            max={8}
            onChange={(v) => update({ miniature_max_icons: v })}
          />
          <Select
            label="Position"
            value={settings.miniature_position ?? "bottom"}
            options={[
              { value: "bottom",     label: "Unten (vor dem CTA)" },
              { value: "top_left",   label: "Oben links (Bild-Overlay)" },
              { value: "top_right",  label: "Oben rechts (Bild-Overlay)" },
            ]}
            onChange={(v) => update({ miniature_position: v })}
          />
        </div>
      </section>

      {/* ── Global ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Globale Einstellungen
        </h2>
        <div className="space-y-4">
          <Toggle
            label="Labels anzeigen"
            description="Text-Labels neben Icons einblenden"
            checked={settings.show_labels ?? true}
            onChange={(v) => update({ show_labels: v })}
          />
          <Toggle
            label="Tooltips aktivieren"
            description="Tooltip-Text bei Hover/Fokus anzeigen"
            checked={settings.show_tooltips ?? true}
            onChange={(v) => update({ show_tooltips: v })}
          />
          <Toggle
            label="Animationen"
            description="Sanfte Hover-Animationen (scale, fade)"
            checked={settings.enable_animations ?? true}
            onChange={(v) => update({ enable_animations: v })}
          />
          <Toggle
            label="Klick-Tracking"
            description="Icon-Interaktionen für Analytics tracken"
            checked={settings.track_interactions ?? false}
            onChange={(v) => update({ track_interactions: v })}
          />
        </div>
      </section>

      {/* ── Save ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2 bg-brand-accent text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60"
        >
          {isPending ? "Wird gespeichert…" : "Einstellungen speichern"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            ✓ Gespeichert
          </span>
        )}
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
      </div>
    </div>
  );
}
