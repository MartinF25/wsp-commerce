"use client";

import { useState } from "react";
import type { CategoryTranslation, Locale } from "@/lib/api";

const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "es", label: "Español", flag: "🇪🇸" },
];

interface Props {
  categoryId: string;
  initialTranslations: CategoryTranslation[];
}

type TranslationState = {
  name: string;
  description: string;
  meta_title: string;
  meta_description: string;
};

function toState(t: CategoryTranslation | undefined): TranslationState {
  return {
    name: t?.name ?? "",
    description: t?.description ?? "",
    meta_title: t?.meta_title ?? "",
    meta_description: t?.meta_description ?? "",
  };
}

export default function CategoryTranslationEditor({ categoryId, initialTranslations }: Props) {
  const [activeLocale, setActiveLocale] = useState<Locale>("de");
  const [translations, setTranslations] = useState<Record<Locale, TranslationState>>({
    de: toState(initialTranslations.find((t) => t.locale === "de")),
    en: toState(initialTranslations.find((t) => t.locale === "en")),
    es: toState(initialTranslations.find((t) => t.locale === "es")),
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ locale: Locale; ok: boolean; msg: string } | null>(null);

  const current = translations[activeLocale];

  function update(field: keyof TranslationState, value: string) {
    setTranslations((prev) => ({
      ...prev,
      [activeLocale]: { ...prev[activeLocale], [field]: value },
    }));
  }

  async function handleSave() {
    if (!current.name.trim()) {
      setStatus({ locale: activeLocale, ok: false, msg: "Name ist ein Pflichtfeld." });
      return;
    }
    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch(
        `/api/admin-proxy/categories/${categoryId}/translations/${activeLocale}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: current.name.trim(),
            description: current.description.trim() || null,
            meta_title: current.meta_title.trim() || null,
            meta_description: current.meta_description.trim() || null,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);

      setStatus({ locale: activeLocale, ok: true, msg: "Gespeichert." });
    } catch (e) {
      setStatus({ locale: activeLocale, ok: false, msg: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  const localeInfo = LOCALES.find((l) => l.value === activeLocale)!;

  return (
    <div className="form-card" style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Übersetzungen
      </h3>

      {/* Locale Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid #e5e7eb", paddingBottom: 0 }}>
        {LOCALES.map((loc) => {
          const filled = translations[loc.value].name.trim().length > 0;
          const isActive = loc.value === activeLocale;
          return (
            <button
              key={loc.value}
              type="button"
              onClick={() => { setActiveLocale(loc.value); setStatus(null); }}
              style={{
                padding: "8px 16px",
                border: "none",
                borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                background: "none",
                cursor: "pointer",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#3b82f6" : "#6b7280",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: -1,
              }}
            >
              <span>{loc.flag}</span>
              <span>{loc.label}</span>
              {filled && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#22c55e", display: "inline-block",
                }} />
              )}
            </button>
          );
        })}
      </div>

      {status && status.locale === activeLocale && (
        <div className={`alert ${status.ok ? "alert-success" : "alert-error"}`} style={{ marginBottom: 16 }}>
          {status.msg}
        </div>
      )}

      <div className="form-row">
        <div>
          <label>
            Name ({localeInfo.label}) <span className="req">*</span>
          </label>
          <input
            type="text"
            value={current.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder={`Kategoriename auf ${localeInfo.label}`}
          />
        </div>
      </div>

      <div className="form-row">
        <div>
          <label>Beschreibung ({localeInfo.label}) <span className="opt">(optional)</span></label>
          <textarea
            value={current.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder={`Kurze Beschreibung auf ${localeInfo.label}`}
            rows={3}
          />
        </div>
      </div>

      <hr style={{ margin: "20px 0", borderColor: "#e5e7eb" }} />
      <h4 style={{ marginBottom: 12, fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        SEO ({localeInfo.label})
      </h4>

      <div className="form-row">
        <div>
          <label>Meta-Titel <span className="opt">(optional, max. 60 Zeichen)</span></label>
          <input
            type="text"
            value={current.meta_title}
            onChange={(e) => update("meta_title", e.target.value)}
            placeholder={`SEO-Titel auf ${localeInfo.label}`}
            maxLength={120}
          />
          <p style={{ fontSize: 12, color: current.meta_title.length > 60 ? "#ef4444" : "#9ca3af", marginTop: 4 }}>
            {current.meta_title.length}/60 Zeichen {current.meta_title.length > 60 ? "— zu lang für Google" : ""}
          </p>
        </div>
      </div>

      <div className="form-row">
        <div>
          <label>Meta-Beschreibung <span className="opt">(optional, max. 160 Zeichen)</span></label>
          <textarea
            value={current.meta_description}
            onChange={(e) => update("meta_description", e.target.value)}
            placeholder={`Meta-Beschreibung auf ${localeInfo.label}`}
            maxLength={320}
            rows={3}
          />
          <p style={{ fontSize: 12, color: current.meta_description.length > 160 ? "#ef4444" : "#9ca3af", marginTop: 4 }}>
            {current.meta_description.length}/160 Zeichen {current.meta_description.length > 160 ? "— zu lang für Google" : ""}
          </p>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Speichern…" : `${localeInfo.flag} ${localeInfo.label} speichern`}
        </button>
      </div>
    </div>
  );
}
