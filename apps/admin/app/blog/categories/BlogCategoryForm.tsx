"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogCategoryDetail } from "@/lib/api";

interface Props {
  category?: BlogCategoryDetail;
}

type Locale = "de" | "en" | "es";

type TransField = { name: string; description: string };

const EMPTY: TransField = { name: "", description: "" };

function init(cat: BlogCategoryDetail | undefined, locale: Locale): TransField {
  const t = cat?.translations.find((x) => x.locale === locale);
  return t ? { name: t.name, description: t.description ?? "" } : { ...EMPTY };
}

export default function BlogCategoryForm({ category }: Props) {
  const router = useRouter();
  const isNew = !category;

  const [activeLocale, setActiveLocale] = useState<Locale>("de");
  const [de, setDe] = useState<TransField>(() => init(category, "de"));
  const [en, setEn] = useState<TransField>(() => init(category, "en"));
  const [es, setEs] = useState<TransField>(() => init(category, "es"));

  const [slug, setSlug] = useState(category?.slug ?? "");
  const [sortOrder, setSortOrder] = useState(category?.sort_order != null ? String(category.sort_order) : "0");
  const [isActive, setIsActive] = useState(category?.is_active ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transMap: Record<Locale, [TransField, (v: TransField) => void]> = {
    de: [de, setDe],
    en: [en, setEn],
    es: [es, setEs],
  };

  function updateField(locale: Locale, key: keyof TransField, value: string) {
    const [state, setState] = transMap[locale];
    setState({ ...state, [key]: value });
  }

  function handleDeBlur() {
    if (isNew && !slug && de.name)
      setSlug(de.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  }

  function buildTranslations() {
    const result = [];
    if (de.name.trim()) result.push({ locale: "de", name: de.name, description: de.description || null });
    if (en.name.trim()) result.push({ locale: "en", name: en.name, description: en.description || null });
    if (es.name.trim()) result.push({ locale: "es", name: es.name, description: es.description || null });
    return result;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!de.name.trim()) { setError("Name (DE) ist ein Pflichtfeld."); return; }
    setSaving(true);
    setError(null);
    try {
      const body = {
        slug: slug.trim() || de.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        sortOrder: parseInt(sortOrder, 10) || 0,
        isActive,
        translations: buildTranslations(),
      };
      const res = await fetch(
        isNew ? "/api/admin-proxy/blog/categories" : `/api/admin-proxy/blog/categories/${category!.id}`,
        { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
      router.push("/blog/categories");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const current = transMap[activeLocale][0];

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-card">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-row form-row-3">
          <div>
            <label>Slug <span className="opt">(aus DE-Name)</span></label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="blog-kategorie" />
          </div>
          <div>
            <label>Reihenfolge</label>
            <input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
          <div style={{ paddingTop: 20 }}>
            <label className="checkbox-row">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Aktiv
            </label>
          </div>
        </div>

        <div className="section-title">Übersetzungen</div>

        <div className="tabs">
          {(["de", "en", "es"] as Locale[]).map((loc) => {
            const [t] = transMap[loc];
            return (
              <button
                key={loc}
                type="button"
                className={`tab-btn ${activeLocale === loc ? "active" : ""}`}
                onClick={() => setActiveLocale(loc)}
              >
                {loc.toUpperCase()}
                {loc === "de" ? <span style={{ color: "#ef4444" }}> *</span>
                  : t.name.trim() ? <span style={{ color: "#22c55e" }}> ✓</span>
                  : <span style={{ color: "#9ca3af" }}> –</span>}
              </button>
            );
          })}
        </div>

        <div className="form-row">
          <div>
            <label>Name {activeLocale === "de" && <span className="req">*</span>}</label>
            <input
              type="text"
              value={current.name}
              onChange={(e) => updateField(activeLocale, "name", e.target.value)}
              onBlur={activeLocale === "de" ? handleDeBlur : undefined}
              placeholder={activeLocale === "de" ? "Pflichtfeld" : "optional"}
            />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label>Beschreibung <span className="opt">(optional)</span></label>
            <textarea
              rows={3}
              value={current.description}
              onChange={(e) => updateField(activeLocale, "description", e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Speichern…" : isNew ? "Kategorie erstellen" : "Änderungen speichern"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => router.push("/blog/categories")}>
            Abbrechen
          </button>
        </div>
      </div>
    </form>
  );
}
