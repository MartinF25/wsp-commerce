"use client";

import { useState, useEffect } from "react";
import type { BlogTag } from "@/lib/api";

export default function BlogTagsPage() {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadTags() {
    try {
      const res = await fetch("/api/admin-proxy/blog/tags");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
      setTags(json.data ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTags(); }, []);

  function handleNameChange(value: string) {
    setNewName(value);
    if (!newSlug) {
      setNewSlug(
        value.toLowerCase()
          .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] ?? c))
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newSlug.trim() || !newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-proxy/blog/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: newSlug.trim(), name: newName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
      setNewSlug("");
      setNewName("");
      await loadTags();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tag: BlogTag) {
    if (!confirm(`Tag "${tag.name}" wirklich löschen?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin-proxy/blog/tags/${tag.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message ?? `HTTP ${res.status}`);
      }
      await loadTags();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Blog-Tags</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Neuen Tag anlegen ── */}
      <div className="form-card" style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Neuen Tag anlegen</div>
        <form onSubmit={handleCreate}>
          <div className="form-row form-row-2">
            <div>
              <label>Name <span className="req">*</span></label>
              <input
                type="text"
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Solarenergie"
              />
            </div>
            <div>
              <label>Slug <span className="req">*</span></label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="solarenergie"
              />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 12, paddingTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={saving || !newName.trim() || !newSlug.trim()}>
              {saving ? "Speichern…" : "Tag erstellen"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Tag-Liste ── */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Beiträge</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="empty">Laden…</td></tr>
            ) : tags.length === 0 ? (
              <tr><td colSpan={4} className="empty">Noch keine Tags vorhanden.</td></tr>
            ) : (
              tags.map((tag) => (
                <tr key={tag.id}>
                  <td style={{ fontWeight: 500 }}>{tag.name}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{tag.slug}</td>
                  <td style={{ color: "#64748b" }}>{tag.postCount ?? 0}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(tag)}
                      disabled={(tag.postCount ?? 0) > 0}
                      title={(tag.postCount ?? 0) > 0 ? "Tag wird noch verwendet" : "Tag löschen"}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
