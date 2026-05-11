"use client";

import { useState, useTransition } from "react";
import { saveTranslation, type CategoryWithTranslations } from "./actions";

const LOCALES: { key: "de" | "en" | "es"; label: string }[] = [
  { key: "de", label: "Deutsch" },
  { key: "en", label: "English" },
  { key: "es", label: "Español" },
];

type TranslationState = {
  name: string;
  description: string;
  meta_title: string;
  meta_description: string;
};

function emptyTranslation(): TranslationState {
  return { name: "", description: "", meta_title: "", meta_description: "" };
}

function buildInitial(category: CategoryWithTranslations): Record<string, TranslationState> {
  const result: Record<string, TranslationState> = {};
  for (const loc of LOCALES) {
    const t = (category.translations ?? []).find((t) => t.locale === loc.key);
    result[loc.key] = {
      name: t?.name ?? "",
      description: t?.description ?? "",
      meta_title: t?.meta_title ?? "",
      meta_description: t?.meta_description ?? "",
    };
  }
  return result;
}

export function CategoryTranslationEditor({ category }: { category: CategoryWithTranslations }) {
  const [activeLocale, setActiveLocale] = useState<"de" | "en" | "es">("de");
  const [state, setState] = useState(() => buildInitial(category));
  const [status, setStatus] = useState<Record<string, "idle" | "saving" | "ok" | "error">>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function update(locale: string, field: keyof TranslationState, value: string) {
    setState((prev) => ({ ...prev, [locale]: { ...prev[locale], [field]: value } }));
  }

  function handleSave(locale: "de" | "en" | "es") {
    startTransition(async () => {
      setStatus((p) => ({ ...p, [locale]: "saving" }));
      const result = await saveTranslation(category.id, locale, state[locale]);
      if (result.ok) {
        setStatus((p) => ({ ...p, [locale]: "ok" }));
        setTimeout(() => setStatus((p) => ({ ...p, [locale]: "idle" })), 2000);
      } else {
        setStatus((p) => ({ ...p, [locale]: "error" }));
        setErrors((p) => ({ ...p, [locale]: result.error ?? "Fehler" }));
      }
    });
  }

  const current = state[activeLocale];
  const currentStatus = status[activeLocale] ?? "idle";

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Category header */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="font-semibold text-gray-900">{category.name}</span>
          <span className="ml-2 text-xs text-gray-400 font-mono">{category.slug}</span>
          {!category.is_active && (
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">inaktiv</span>
          )}
        </div>
        <span className="text-xs text-gray-400">{category.productCount} Produkte</span>
      </div>

      {/* Locale tabs */}
      <div className="border-b border-gray-200 flex">
        {LOCALES.map((loc) => {
          const hasTranslation = (category.translations ?? []).some((t) => t.locale === loc.key);
          const isDirty = state[loc.key].name !== ((category.translations ?? []).find((t) => t.locale === loc.key)?.name ?? "");
          return (
            <button
              key={loc.key}
              onClick={() => setActiveLocale(loc.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeLocale === loc.key
                  ? "border-b-2 border-green-500 text-green-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {loc.label}
              {hasTranslation && <span className="ml-1 text-green-400">✓</span>}
              {isDirty && !hasTranslation && <span className="ml-1 text-orange-400">●</span>}
            </button>
          );
        })}
      </div>

      {/* Form */}
      <div className="p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={current.name}
            onChange={(e) => update(activeLocale, "name", e.target.value)}
            placeholder={`Kategoriename auf ${LOCALES.find((l) => l.key === activeLocale)?.label}`}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Beschreibung</label>
          <textarea
            value={current.description}
            onChange={(e) => update(activeLocale, "description", e.target.value)}
            rows={2}
            placeholder="Kurze Beschreibung der Kategorie"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">SEO Meta-Titel</label>
          <input
            type="text"
            value={current.meta_title}
            onChange={(e) => update(activeLocale, "meta_title", e.target.value)}
            placeholder="Titel für Google (max. 60 Zeichen empfohlen)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {current.meta_title.length > 0 && (
            <p className={`text-xs mt-0.5 ${current.meta_title.length > 60 ? "text-red-500" : "text-gray-400"}`}>
              {current.meta_title.length}/60 Zeichen
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">SEO Meta-Beschreibung</label>
          <textarea
            value={current.meta_description}
            onChange={(e) => update(activeLocale, "meta_description", e.target.value)}
            rows={2}
            placeholder="Kurze Beschreibung für Google (max. 160 Zeichen empfohlen)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
          />
          {current.meta_description.length > 0 && (
            <p className={`text-xs mt-0.5 ${current.meta_description.length > 160 ? "text-red-500" : "text-gray-400"}`}>
              {current.meta_description.length}/160 Zeichen
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => handleSave(activeLocale)}
            disabled={!current.name.trim() || isPending || currentStatus === "saving"}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {currentStatus === "saving" ? "Speichert…" : "Speichern"}
          </button>

          {currentStatus === "ok" && (
            <span className="text-sm text-green-600">Gespeichert</span>
          )}
          {currentStatus === "error" && (
            <span className="text-sm text-red-500">{errors[activeLocale]}</span>
          )}
        </div>
      </div>
    </div>
  );
}
