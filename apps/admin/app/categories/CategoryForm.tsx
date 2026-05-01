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
