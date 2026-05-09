"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/api";

interface Props {
  category?: Category;
  parentOptions: { id: string; name: string }[];
}

export default function CategoryForm({ category, parentOptions }: Props) {
  const router = useRouter();
  const isNew = !category;

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? "");
  const [metaTitle, setMetaTitle] = useState(category?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(category?.meta_description ?? "");
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [parentId, setParentId] = useState(category?.parent_id ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = {
        name,
        slug: slug.trim() || undefined,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        is_active: isActive,
        parent_id: parentId || null,
      };

      const res = await fetch(
        isNew ? "/api/admin-proxy/categories" : `/api/admin-proxy/categories/${category!.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);

      router.push("/categories");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!category) return;
    if (!confirm(`Kategorie "${category.name}" wirklich löschen?`)) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin-proxy/categories/${category.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);
      }
      router.push("/categories");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-card">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-row form-row-2">
          <div>
            <label>Name <span className="req">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Kategorienname"
            />
          </div>
          <div>
            <label>Slug <span className="opt">(automatisch aus Name)</span></label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="wird-generiert"
            />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Beschreibung <span className="opt">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung der Kategorie"
            />
          </div>
        </div>

        <div className="form-row form-row-2">
          <div>
            <label>Elternkategorie <span className="opt">(optional)</span></label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">— keine —</option>
              {parentOptions
                .filter((p) => p.id !== category?.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
          </div>
          <div style={{ paddingTop: 20 }}>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Aktiv (in der Storefront sichtbar)
            </label>
          </div>
        </div>

        <hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
        <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bild</h3>

        <div className="form-row">
          <div>
            <label>Kategorie-Bild URL <span className="opt">(optional)</span></label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              Eigenes Bild für diese Kategorie. Leer lassen → automatisch erstes Produktbild.
            </p>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Vorschau"
                style={{ marginTop: 8, maxHeight: 120, borderRadius: 8, objectFit: "cover", border: "1px solid #e5e7eb" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>
        </div>

        <hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
        <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>SEO</h3>

        <div className="form-row">
          <div>
            <label>Meta-Titel <span className="opt">(optional, max. 60 Zeichen)</span></label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder={name ? `${name} – Solarzaun & SkyWind` : "SEO-Titel der Kategorieseite"}
              maxLength={120}
            />
            <p style={{ fontSize: 12, color: metaTitle.length > 60 ? "#ef4444" : "#9ca3af", marginTop: 4 }}>
              {metaTitle.length}/60 Zeichen {metaTitle.length > 60 ? "— zu lang für Google" : ""}
            </p>
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Meta-Beschreibung <span className="opt">(optional, max. 160 Zeichen)</span></label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder={name ? `Alle ${name}-Produkte im Überblick.` : "Kurze Beschreibung für Suchmaschinen"}
              maxLength={320}
              rows={3}
            />
            <p style={{ fontSize: 12, color: metaDescription.length > 160 ? "#ef4444" : "#9ca3af", marginTop: 4 }}>
              {metaDescription.length}/160 Zeichen {metaDescription.length > 160 ? "— zu lang für Google" : ""}
            </p>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Speichern…" : isNew ? "Kategorie anlegen" : "Änderungen speichern"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => router.push("/categories")}>
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
              {deleting ? "Löschen…" : "Kategorie löschen"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
