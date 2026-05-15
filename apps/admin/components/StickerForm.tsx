"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  StickerAdmin,
  StickerInput,
  StickerType,
  StickerPosition,
  StickerRuleType,
  Locale,
  Category,
} from "@/lib/api";
import { api } from "@/lib/api";

// ─── Konstanten ───────────────────────────────────────────────────────────────

const STICKER_TYPES: { value: StickerType; label: string }[] = [
  { value: "text", label: "Text-Label" },
  { value: "css_badge", label: "CSS-Badge" },
  { value: "image", label: "Bild-Sticker" },
  { value: "tooltip", label: "Tooltip-Label" },
  { value: "combined", label: "Bild + Text" },
];

const POSITIONS: { value: StickerPosition; label: string }[] = [
  { value: "top_left", label: "Oben links" },
  { value: "top_right", label: "Oben rechts" },
  { value: "bottom_left", label: "Unten links" },
  { value: "bottom_right", label: "Unten rechts" },
  { value: "center", label: "Mittig" },
  { value: "custom", label: "Frei (X/Y)" },
];

const RULE_TYPES: { value: StickerRuleType; label: string; desc: string }[] = [
  { value: "all_products", label: "Alle Produkte", desc: "Gilt für alle aktiven Produkte" },
  { value: "category", label: "Kategorie", desc: "Gilt für eine Produktkategorie" },
  { value: "price_range", label: "Preisbereich", desc: "Gilt für Produkte in einem Preisbereich" },
  { value: "availability", label: "Verfügbarkeit", desc: "Gilt für einen Verfügbarkeitsstatus" },
  { value: "new_arrival", label: "Neue Produkte", desc: "Gilt für neu angelegte Produkte" },
];

const AVAILABILITY_OPTIONS = [
  { value: "in_stock", label: "Auf Lager" },
  { value: "out_of_stock", label: "Nicht vorrätig" },
  { value: "preorder", label: "Vorbestellung" },
  { value: "discontinued", label: "Eingestellt" },
  { value: "on_request", label: "Auf Anfrage" },
];

const LOCALES: Locale[] = ["de", "en", "es"];
const LOCALE_LABELS: Record<Locale, string> = { de: "Deutsch", en: "English", es: "Español" };

// ─── Typen ────────────────────────────────────────────────────────────────────

interface RuleInput {
  rule_type: StickerRuleType;
  category_id?: string | null;
  price_min_cents?: number | null;
  price_max_cents?: number | null;
  availability_status?: string | null;
  new_arrival_days?: number | null;
}

interface TranslationInput {
  locale: Locale;
  text: string;
  tooltip: string;
  tooltip_link_label: string;
  tooltip_link_url: string;
  link_url: string;
}

interface FormState {
  name: string;
  status: "active" | "inactive";
  priority: number;
  sort_order: number;
  type: StickerType;
  image_url: string;
  text_color: string;
  bg_color: string;
  border_color: string;
  font_size: string;
  font_bold: boolean;
  font_italic: boolean;
  border_radius: string;
  padding: string;
  opacity: string;
  css_class: string;
  custom_css: string;
  link_url: string;
  position: StickerPosition;
  position_x: string;
  position_y: string;
  size_homepage: string;
  size_listing: string;
  size_detail: string;
  size_search: string;
  valid_from: string;
  valid_until: string;
  max_per_product: number;
  allow_override: boolean;
  translations: TranslationInput[];
  rules: RuleInput[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInitialState(sticker?: StickerAdmin): FormState {
  const sizeConfig = sticker?.size_config ?? {};
  return {
    name: sticker?.name ?? "",
    status: sticker?.status ?? "inactive",
    priority: sticker?.priority ?? 0,
    sort_order: sticker?.sort_order ?? 0,
    type: sticker?.type ?? "text",
    image_url: sticker?.image_url ?? "",
    text_color: sticker?.text_color ?? "#ffffff",
    bg_color: sticker?.bg_color ?? "#22c55e",
    border_color: sticker?.border_color ?? "",
    font_size: sticker?.font_size ?? "12px",
    font_bold: sticker?.font_bold ?? false,
    font_italic: sticker?.font_italic ?? false,
    border_radius: sticker?.border_radius ?? "4px",
    padding: sticker?.padding ?? "4px 8px",
    opacity: sticker?.opacity != null ? String(sticker.opacity) : "1",
    css_class: sticker?.css_class ?? "",
    custom_css: sticker?.custom_css ?? "",
    link_url: sticker?.link_url ?? "",
    position: sticker?.position ?? "top_left",
    position_x: sticker?.position_x != null ? String(sticker.position_x) : "",
    position_y: sticker?.position_y != null ? String(sticker.position_y) : "",
    size_homepage: sizeConfig["homepage"] ?? "",
    size_listing: sizeConfig["listing"] ?? "",
    size_detail: sizeConfig["detail"] ?? "",
    size_search: sizeConfig["search"] ?? "",
    valid_from: sticker?.valid_from ? sticker.valid_from.slice(0, 16) : "",
    valid_until: sticker?.valid_until ? sticker.valid_until.slice(0, 16) : "",
    max_per_product: sticker?.max_per_product ?? 3,
    allow_override: sticker?.allow_override ?? true,
    translations: LOCALES.map((locale) => {
      const t = sticker?.translations.find((tr) => tr.locale === locale);
      return {
        locale,
        text: t?.text ?? "",
        tooltip: t?.tooltip ?? "",
        tooltip_link_label: t?.tooltip_link_label ?? "",
        tooltip_link_url: t?.tooltip_link_url ?? "",
        link_url: t?.link_url ?? "",
      };
    }),
    rules: sticker?.rules.map((r) => ({
      rule_type: r.rule_type,
      category_id: r.category_id,
      price_min_cents: r.price_min_cents,
      price_max_cents: r.price_max_cents,
      availability_status: r.availability_status,
      new_arrival_days: r.new_arrival_days,
    })) ?? [],
  };
}

function buildPayload(form: FormState): StickerInput {
  const size_config: Record<string, string> = {};
  if (form.size_homepage) size_config["homepage"] = form.size_homepage;
  if (form.size_listing) size_config["listing"] = form.size_listing;
  if (form.size_detail) size_config["detail"] = form.size_detail;
  if (form.size_search) size_config["search"] = form.size_search;

  return {
    name: form.name,
    status: form.status,
    priority: form.priority,
    sort_order: form.sort_order,
    type: form.type,
    image_url: form.image_url || null,
    text_color: form.text_color || null,
    bg_color: form.bg_color || null,
    border_color: form.border_color || null,
    font_size: form.font_size || null,
    font_bold: form.font_bold,
    font_italic: form.font_italic,
    border_radius: form.border_radius || null,
    padding: form.padding || null,
    opacity: form.opacity ? parseFloat(form.opacity) : null,
    css_class: form.css_class || null,
    custom_css: form.custom_css || null,
    link_url: form.link_url || null,
    position: form.position,
    position_x: form.position_x ? parseInt(form.position_x) : null,
    position_y: form.position_y ? parseInt(form.position_y) : null,
    size_config,
    valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
    valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
    max_per_product: form.max_per_product,
    allow_override: form.allow_override,
    translations: form.translations.map((t) => ({
      locale: t.locale,
      text: t.text || null,
      tooltip: t.tooltip || null,
      tooltip_link_label: t.tooltip_link_label || null,
      tooltip_link_url: t.tooltip_link_url || null,
      link_url: t.link_url || null,
    })),
    rules: form.rules,
  };
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";
const checkCls = "h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500";

// ─── StickerPreviewBox ────────────────────────────────────────────────────────

function StickerPreviewBox({ form }: { form: FormState }) {
  const deText = form.translations.find((t) => t.locale === "de")?.text ?? form.name;
  if (form.type === "image" && form.image_url) {
    return (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={form.image_url} alt="Preview" className="h-12 w-auto object-cover rounded" />
        <span className="text-xs text-gray-500">Bild-Vorschau</span>
      </div>
    );
  }
  return (
    <span
      className="inline-block"
      style={{
        color: form.text_color || "#fff",
        backgroundColor: form.bg_color || "#22c55e",
        border: form.border_color ? `1px solid ${form.border_color}` : undefined,
        borderRadius: form.border_radius || "4px",
        padding: form.padding || "4px 8px",
        fontSize: form.font_size || "12px",
        fontWeight: form.font_bold ? "bold" : "normal",
        fontStyle: form.font_italic ? "italic" : "normal",
        opacity: form.opacity ? parseFloat(form.opacity) : 1,
      }}
    >
      {deText || "Vorschau"}
    </span>
  );
}

// ─── StickerForm ──────────────────────────────────────────────────────────────

interface Props {
  sticker?: StickerAdmin;
  categories: Category[];
}

export function StickerForm({ sticker, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() => buildInitialState(sticker));
  const [activeLocale, setActiveLocale] = useState<Locale>("de");
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setTranslation(locale: Locale, field: keyof TranslationInput, value: string) {
    setForm((prev) => ({
      ...prev,
      translations: prev.translations.map((t) =>
        t.locale === locale ? { ...t, [field]: value } : t
      ),
    }));
  }

  function addRule() {
    setForm((prev) => ({
      ...prev,
      rules: [...prev.rules, { rule_type: "all_products" }],
    }));
  }

  function removeRule(idx: number) {
    setForm((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== idx),
    }));
  }

  function setRule(idx: number, updates: Partial<RuleInput>) {
    setForm((prev) => ({
      ...prev,
      rules: prev.rules.map((r, i) => (i === idx ? { ...r, ...updates } : r)),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const payload = buildPayload(form);
        if (sticker) {
          await api.stickers.update(sticker.id, payload);
        } else {
          await api.stickers.create(payload);
        }
        router.push("/stickers");
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  const t = form.translations.find((tr) => tr.locale === activeLocale)!;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* ── Basis ─────────────────────────────────────────────────────────── */}
      <Section title="Allgemein">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Interner Name *">
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
              placeholder="z. B. NEU-Badge Solarzaun"
            />
          </Field>

          <Field label="Typ">
            <select value={form.type} onChange={(e) => set("type", e.target.value as StickerType)} className={inputCls}>
              {STICKER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value as "active" | "inactive")} className={inputCls}>
              <option value="inactive">Inaktiv</option>
              <option value="active">Aktiv</option>
            </select>
          </Field>

          <Field label="Priorität">
            <input
              type="number"
              value={form.priority}
              onChange={(e) => set("priority", parseInt(e.target.value) || 0)}
              className={inputCls}
              placeholder="0"
            />
          </Field>

          <Field label="Gültig ab">
            <input
              type="datetime-local"
              value={form.valid_from}
              onChange={(e) => set("valid_from", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Gültig bis">
            <input
              type="datetime-local"
              value={form.valid_until}
              onChange={(e) => set("valid_until", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Max. Sticker pro Produkt">
            <input
              type="number"
              min={0}
              value={form.max_per_product}
              onChange={(e) => set("max_per_product", parseInt(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="allow_override"
              checked={form.allow_override}
              onChange={(e) => set("allow_override", e.target.checked)}
              className={checkCls}
            />
            <label htmlFor="allow_override" className="text-sm text-gray-700">
              Manuelle Produkt-Overrides erlauben
            </label>
          </div>
        </div>
      </Section>

      {/* ── Bild ──────────────────────────────────────────────────────────── */}
      {(form.type === "image" || form.type === "combined") && (
        <Section title="Bild">
          <Field label="Bild-URL">
            <input
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              className={inputCls}
              placeholder="https://..."
            />
          </Field>
        </Section>
      )}

      {/* ── Styling ───────────────────────────────────────────────────────── */}
      {form.type !== "image" && (
        <Section title="Darstellung &amp; Styling">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Textfarbe">
              <div className="flex gap-2">
                <input type="color" value={form.text_color} onChange={(e) => set("text_color", e.target.value)} className="h-9 w-12 rounded border border-gray-200 cursor-pointer" />
                <input value={form.text_color} onChange={(e) => set("text_color", e.target.value)} className={`${inputCls} flex-1`} placeholder="#ffffff" />
              </div>
            </Field>

            <Field label="Hintergrundfarbe">
              <div className="flex gap-2">
                <input type="color" value={form.bg_color} onChange={(e) => set("bg_color", e.target.value)} className="h-9 w-12 rounded border border-gray-200 cursor-pointer" />
                <input value={form.bg_color} onChange={(e) => set("bg_color", e.target.value)} className={`${inputCls} flex-1`} placeholder="#22c55e" />
              </div>
            </Field>

            <Field label="Rahmenfarbe">
              <input value={form.border_color} onChange={(e) => set("border_color", e.target.value)} className={inputCls} placeholder="#16a34a" />
            </Field>

            <Field label="Schriftgröße">
              <input value={form.font_size} onChange={(e) => set("font_size", e.target.value)} className={inputCls} placeholder="12px" />
            </Field>

            <Field label="Border-Radius">
              <input value={form.border_radius} onChange={(e) => set("border_radius", e.target.value)} className={inputCls} placeholder="4px" />
            </Field>

            <Field label="Padding">
              <input value={form.padding} onChange={(e) => set("padding", e.target.value)} className={inputCls} placeholder="4px 8px" />
            </Field>

            <Field label="Transparenz (0–1)">
              <input type="number" min={0} max={1} step={0.05} value={form.opacity} onChange={(e) => set("opacity", e.target.value)} className={inputCls} placeholder="1" />
            </Field>

            <Field label="CSS-Klasse">
              <input value={form.css_class} onChange={(e) => set("css_class", e.target.value)} className={inputCls} placeholder="animate-bounce" />
            </Field>
          </div>

          <div className="flex gap-5 mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.font_bold} onChange={(e) => set("font_bold", e.target.checked)} className={checkCls} />
              Fett
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.font_italic} onChange={(e) => set("font_italic", e.target.checked)} className={checkCls} />
              Kursiv
            </label>
          </div>

          <div className="mt-4">
            <Field label="Eigenes CSS (überschreibt alle Stilfelder)">
              <textarea
                value={form.custom_css}
                onChange={(e) => set("custom_css", e.target.value)}
                rows={3}
                className={`${inputCls} font-mono text-xs`}
                placeholder="font-family: 'Sora'; letter-spacing: 0.05em;"
              />
            </Field>
          </div>

          {/* Vorschau */}
          <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 mb-3">Live-Vorschau</p>
            <div className="relative inline-block w-48 h-32 bg-gray-200 rounded-lg overflow-hidden">
              <div className="absolute top-2 left-2">
                <StickerPreviewBox form={form} />
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ── Position & Größe ───────────────────────────────────────────────── */}
      <Section title="Position &amp; Größe">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Position">
            <select value={form.position} onChange={(e) => set("position", e.target.value as StickerPosition)} className={inputCls}>
              {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>

          {form.position === "custom" && (
            <>
              <Field label="X-Offset (px)">
                <input type="number" value={form.position_x} onChange={(e) => set("position_x", e.target.value)} className={inputCls} placeholder="0" />
              </Field>
              <Field label="Y-Offset (px)">
                <input type="number" value={form.position_y} onChange={(e) => set("position_y", e.target.value)} className={inputCls} placeholder="0" />
              </Field>
            </>
          )}

          <Field label="Link-URL (optional)">
            <input value={form.link_url} onChange={(e) => set("link_url", e.target.value)} className={inputCls} placeholder="https://..." />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mt-4">
          {[
            { key: "size_homepage" as const, label: "Startseite" },
            { key: "size_listing" as const, label: "Kategorie / Liste" },
            { key: "size_detail" as const, label: "Detailseite" },
            { key: "size_search" as const, label: "Suche" },
          ].map(({ key, label }) => (
            <Field key={key} label={`Größe: ${label}`}>
              <input value={form[key]} onChange={(e) => set(key, e.target.value)} className={inputCls} placeholder="70px" />
            </Field>
          ))}
        </div>
      </Section>

      {/* ── Texte & Übersetzungen ─────────────────────────────────────────── */}
      <Section title="Texte &amp; Übersetzungen">
        <div className="flex gap-1 mb-5">
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActiveLocale(locale)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeLocale === locale
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {LOCALE_LABELS[locale]}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <Field label="Label-Text">
            <input
              value={t.text}
              onChange={(e) => setTranslation(activeLocale, "text", e.target.value)}
              className={inputCls}
              placeholder="z. B. NEU, SALE, Bestseller"
            />
          </Field>

          {(form.type === "tooltip" || form.type === "combined") && (
            <>
              <Field label="Tooltip-Text">
                <textarea
                  rows={3}
                  value={t.tooltip}
                  onChange={(e) => setTranslation(activeLocale, "tooltip", e.target.value)}
                  className={inputCls}
                  placeholder="Hover-Text der im Tooltip erscheint…"
                />
              </Field>
              <Field label="Tooltip-Link-Label">
                <input
                  value={t.tooltip_link_label}
                  onChange={(e) => setTranslation(activeLocale, "tooltip_link_label", e.target.value)}
                  className={inputCls}
                  placeholder="Mehr erfahren"
                />
              </Field>
              <Field label="Tooltip-Link-URL">
                <input
                  value={t.tooltip_link_url}
                  onChange={(e) => setTranslation(activeLocale, "tooltip_link_url", e.target.value)}
                  className={inputCls}
                  placeholder="https://..."
                />
              </Field>
            </>
          )}

          <Field label="Locale-spezifische Link-URL">
            <input
              value={t.link_url}
              onChange={(e) => setTranslation(activeLocale, "link_url", e.target.value)}
              className={inputCls}
              placeholder="Überschreibt globale Link-URL für diese Sprache"
            />
          </Field>
        </div>
      </Section>

      {/* ── Automatische Regeln ───────────────────────────────────────────── */}
      <Section title="Automatische Zuweisungsregeln">
        <p className="text-xs text-gray-500 mb-4">
          Mehrere Regeln werden OR-verknüpft: der Sticker erscheint, wenn mindestens eine Regel zutrifft.
        </p>

        <div className="space-y-3">
          {form.rules.map((rule, idx) => (
            <div key={idx} className="flex gap-3 items-start p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Regeltyp">
                  <select
                    value={rule.rule_type}
                    onChange={(e) => setRule(idx, { rule_type: e.target.value as StickerRuleType, category_id: null, price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null })}
                    className={inputCls}
                  >
                    {RULE_TYPES.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                  </select>
                </Field>

                {rule.rule_type === "category" && (
                  <Field label="Kategorie">
                    <select
                      value={rule.category_id ?? ""}
                      onChange={(e) => setRule(idx, { category_id: e.target.value || null })}
                      className={inputCls}
                    >
                      <option value="">– Kategorie wählen –</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </Field>
                )}

                {rule.rule_type === "price_range" && (
                  <>
                    <Field label="Min-Preis (€)">
                      <input
                        type="number"
                        min={0}
                        value={rule.price_min_cents != null ? rule.price_min_cents / 100 : ""}
                        onChange={(e) => setRule(idx, { price_min_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })}
                        className={inputCls}
                        placeholder="0"
                      />
                    </Field>
                    <Field label="Max-Preis (€)">
                      <input
                        type="number"
                        min={0}
                        value={rule.price_max_cents != null ? rule.price_max_cents / 100 : ""}
                        onChange={(e) => setRule(idx, { price_max_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })}
                        className={inputCls}
                        placeholder="99999"
                      />
                    </Field>
                  </>
                )}

                {rule.rule_type === "availability" && (
                  <Field label="Verfügbarkeitsstatus">
                    <select
                      value={rule.availability_status ?? ""}
                      onChange={(e) => setRule(idx, { availability_status: e.target.value || null })}
                      className={inputCls}
                    >
                      <option value="">– Status wählen –</option>
                      {AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                )}

                {rule.rule_type === "new_arrival" && (
                  <Field label="Neu innerhalb von (Tagen)">
                    <input
                      type="number"
                      min={1}
                      value={rule.new_arrival_days ?? ""}
                      onChange={(e) => setRule(idx, { new_arrival_days: e.target.value ? parseInt(e.target.value) : null })}
                      className={inputCls}
                      placeholder="30"
                    />
                  </Field>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeRule(idx)}
                className="mt-6 text-red-400 hover:text-red-600 transition-colors text-lg"
                title="Regel entfernen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRule}
          className="mt-4 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors w-full"
        >
          + Regel hinzufügen
        </button>
      </Section>

      {/* ── Aktionen ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Speichern…" : sticker ? "Änderungen speichern" : "Sticker erstellen"}
        </button>
      </div>
    </form>
  );
}
