"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPostDetail, BlogCategorySummary, BlogTag, BlogStatus } from "@/lib/api";

interface Props {
  post?: BlogPostDetail;
  categories: BlogCategorySummary[];
  tags: BlogTag[];
}

type Locale = "de" | "en" | "es";

type TransField = {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
};

const EMPTY: TransField = {
  title: "", excerpt: "", content: "",
  metaTitle: "", metaDescription: "", ogTitle: "", ogDescription: "",
};

function initTrans(post: BlogPostDetail | undefined, locale: Locale): TransField {
  const t = post?.translations.find((x) => x.locale === locale);
  if (!t) return { ...EMPTY };
  return {
    title: t.title,
    excerpt: t.excerpt,
    content: t.content,
    metaTitle: t.metaTitle ?? "",
    metaDescription: t.metaDescription ?? "",
    ogTitle: t.ogTitle ?? "",
    ogDescription: t.ogDescription ?? "",
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] ?? c))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export default function BlogPostForm({ post, categories, tags }: Props) {
  const router = useRouter();
  const isNew = !post;

  const [activeLocale, setActiveLocale] = useState<Locale>("de");
  const [de, setDe] = useState<TransField>(() => initTrans(post, "de"));
  const [en, setEn] = useState<TransField>(() => initTrans(post, "en"));
  const [es, setEs] = useState<TransField>(() => initTrans(post, "es"));

  const [slug, setSlug] = useState(post?.slug ?? "");
  const [status, setStatus] = useState<BlogStatus>(post?.status ?? "draft");
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [authorName, setAuthorName] = useState(post?.authorName ?? "");
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    post?.tags.map((t) => t.id) ?? []
  );
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(post?.coverImageAlt ?? "");
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(
    post?.readingTimeMinutes != null ? String(post.readingTimeMinutes) : ""
  );
  const [publishedAt, setPublishedAt] = useState(toDatetimeLocal(post?.publishedAt ?? null));

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    if (isNew && !slug && de.title) setSlug(slugify(de.title));
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function buildTranslations() {
    const result = [];
    if (de.title.trim()) result.push({ locale: "de", ...de });
    if (en.title.trim()) result.push({ locale: "en", ...en });
    if (es.title.trim()) result.push({ locale: "es", ...es });
    return result;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!de.title.trim()) {
      setError("Titel (DE) ist ein Pflichtfeld.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const body = {
        slug: slug.trim() || slugify(de.title),
        status,
        featured,
        authorName: authorName.trim() || null,
        categoryId: categoryId || null,
        tagIds: selectedTagIds,
        coverImageUrl: coverImageUrl.trim() || null,
        coverImageAlt: coverImageAlt.trim() || null,
        readingTimeMinutes: readingTimeMinutes ? parseInt(readingTimeMinutes, 10) : null,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
        translations: buildTranslations(),
      };

      const res = await fetch(
        isNew ? "/api/admin-proxy/blog/posts" : `/api/admin-proxy/blog/posts/${post!.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);

      router.push("/blog");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post) return;
    if (!confirm(`Beitrag "${post.translations.find(t=>t.locale==="de")?.title ?? post.slug}" wirklich löschen?`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin-proxy/blog/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message ?? `HTTP ${res.status}`);
      }
      router.push("/blog");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  const currentTrans = transMap[activeLocale][0];

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-card" style={{ maxWidth: 960 }}>
        {error && <div className="alert alert-error">{error}</div>}

        {/* ── Basisdaten ── */}
        <div className="section-title">Basisdaten</div>

        <div className="form-row form-row-2">
          <div>
            <label>Slug <span className="opt">(automatisch aus DE-Titel)</span></label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="mein-blogbeitrag"
            />
          </div>
          <div>
            <label>Status <span className="req">*</span></label>
            <select value={status} onChange={(e) => setStatus(e.target.value as BlogStatus)}>
              <option value="draft">Entwurf</option>
              <option value="published">Veröffentlicht</option>
              <option value="archived">Archiviert</option>
            </select>
          </div>
        </div>

        <div className="form-row form-row-3">
          <div>
            <label>Autor <span className="opt">(optional)</span></label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Max Mustermann"
            />
          </div>
          <div>
            <label>Lesezeit <span className="opt">(Minuten)</span></label>
            <input
              type="number"
              min={1}
              max={60}
              value={readingTimeMinutes}
              onChange={(e) => setReadingTimeMinutes(e.target.value)}
              placeholder="5"
            />
          </div>
          <div style={{ paddingTop: 20 }}>
            <label className="checkbox-row">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Empfohlen (Featured)
            </label>
          </div>
        </div>

        <div className="form-row form-row-2">
          <div>
            <label>Kategorie <span className="opt">(optional)</span></label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— keine —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nameDe}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Veröffentlichungsdatum <span className="opt">(optional, sonst automatisch)</span></label>
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
            />
          </div>
        </div>

        {/* ── Cover-Bild ── */}
        <div className="section-title">Cover-Bild</div>
        <div className="form-row form-row-2">
          <div>
            <label>Bild-URL <span className="opt">(optional)</span></label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label>Alt-Text <span className="opt">(optional)</span></label>
            <input
              type="text"
              value={coverImageAlt}
              onChange={(e) => setCoverImageAlt(e.target.value)}
              placeholder="Bildbeschreibung"
            />
          </div>
        </div>

        {/* ── Tags ── */}
        {tags.length > 0 && (
          <>
            <div className="section-title">Tags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              {tags.map((tag) => (
                <label key={tag.id} className="checkbox-row" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </>
        )}

        {/* ── Inhalt (Übersetzungen) ── */}
        <div className="section-title">Inhalt</div>

        <div className="tabs">
          {(["de", "en", "es"] as Locale[]).map((loc) => {
            const [t] = transMap[loc];
            const hasContent = !!t.title.trim();
            return (
              <button
                key={loc}
                type="button"
                className={`tab-btn ${activeLocale === loc ? "active" : ""}`}
                onClick={() => setActiveLocale(loc)}
              >
                {loc.toUpperCase()}
                {loc === "de" ? <span style={{ color: "#ef4444" }}> *</span> : hasContent ? <span style={{ color: "#22c55e" }}> ✓</span> : <span style={{ color: "#9ca3af" }}> –</span>}
              </button>
            );
          })}
        </div>

        <div className="form-row">
          <div>
            <label>
              Titel {activeLocale === "de" && <span className="req">*</span>}
            </label>
            <input
              type="text"
              value={currentTrans.title}
              onChange={(e) => updateField(activeLocale, "title", e.target.value)}
              onBlur={activeLocale === "de" ? handleDeBlur : undefined}
              placeholder={activeLocale === "de" ? "Pflichtfeld" : "optional"}
            />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Zusammenfassung (Excerpt) {activeLocale === "de" && <span className="req">*</span>}</label>
            <textarea
              rows={3}
              value={currentTrans.excerpt}
              onChange={(e) => updateField(activeLocale, "excerpt", e.target.value)}
              placeholder={activeLocale === "de" ? "Kurze Zusammenfassung (Pflicht)" : "optional"}
            />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>
              Inhalt (HTML) {activeLocale === "de" && <span className="req">*</span>}
              <span className="opt"> — wird direkt als HTML gerendert</span>
            </label>
            <textarea
              rows={20}
              value={currentTrans.content}
              onChange={(e) => updateField(activeLocale, "content", e.target.value)}
              placeholder={activeLocale === "de" ? "<p>Inhalt des Beitrags …</p>" : "optional"}
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
          </div>
        </div>

        <div className="section-title" style={{ marginTop: 8 }}>SEO ({activeLocale.toUpperCase()})</div>
        <div className="form-row form-row-2">
          <div>
            <label>Meta-Titel <span className="opt">(optional)</span></label>
            <input
              type="text"
              value={currentTrans.metaTitle}
              onChange={(e) => updateField(activeLocale, "metaTitle", e.target.value)}
            />
          </div>
          <div>
            <label>Meta-Beschreibung <span className="opt">(optional)</span></label>
            <input
              type="text"
              value={currentTrans.metaDescription}
              onChange={(e) => updateField(activeLocale, "metaDescription", e.target.value)}
            />
          </div>
        </div>
        <div className="form-row form-row-2">
          <div>
            <label>OG-Titel <span className="opt">(optional)</span></label>
            <input
              type="text"
              value={currentTrans.ogTitle}
              onChange={(e) => updateField(activeLocale, "ogTitle", e.target.value)}
            />
          </div>
          <div>
            <label>OG-Beschreibung <span className="opt">(optional)</span></label>
            <input
              type="text"
              value={currentTrans.ogDescription}
              onChange={(e) => updateField(activeLocale, "ogDescription", e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Speichern…" : isNew ? "Beitrag erstellen" : "Änderungen speichern"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => router.push("/blog")}>
            Abbrechen
          </button>
          {!isNew && (
            <button
              type="button"
              className="btn btn-danger"
              style={{ marginLeft: "auto" }}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Löschen…" : "Beitrag löschen"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
