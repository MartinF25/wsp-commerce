"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface ImageEntry {
  id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  product_id: string;
  product: { id: string; slug: string; name: string };
}

export default function MediaPage() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin-proxy/images")
      .then((r) => r.json())
      .then((j) => { setImages(j.data ?? []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(imgId: string) {
    setConfirmId(null);
    setDeletingId(imgId);
    try {
      const res = await fetch(`/api/admin-proxy/images/${imgId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message ?? `HTTP ${res.status}`);
      }
      setImages((prev) => prev.filter((i) => i.id !== imgId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const productCount = new Set(images.map((e) => e.product_id)).size;

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Medienübersicht</h1>
        <Link href="/" style={{ fontSize: 13, color: "#6b7280" }}>← Zurück</Link>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#9ca3af" }}>Lädt…</div>
      ) : images.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#9ca3af" }}>
          Noch keine Bilder vorhanden.
        </div>
      ) : (
        <>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
            {images.length} Bild{images.length !== 1 ? "er" : ""} in{" "}
            {productCount} Produkt{productCount !== 1 ? "en" : ""}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {images.map((image) => (
              <div key={image.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                <div style={{ aspectRatio: "4/3", background: "#f9fafb", overflow: "hidden" }}>
                  <img
                    src={image.url}
                    alt={image.alt ?? image.product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <Link
                    href={`/products/${image.product.id}`}
                    style={{ fontSize: 12, fontWeight: 600, color: "#374151", textDecoration: "none" }}
                  >
                    {image.product.name}
                  </Link>
                  {image.alt && (
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {image.alt}
                    </p>
                  )}
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 10, color: "#6b7280", display: "block", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {image.url}
                  </a>
                  {confirmId === image.id ? (
                    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(image.id)}
                        disabled={deletingId === image.id}
                        style={{ flex: 1, padding: "5px 0", background: "#ef4444", color: "#fff", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Ja, löschen
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        style={{ flex: 1, padding: "5px 0", background: "#e2e8f0", color: "#334155", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(image.id)}
                      disabled={deletingId === image.id}
                      style={{
                        marginTop: 8,
                        width: "100%",
                        padding: "5px 0",
                        background: deletingId === image.id ? "#fca5a5" : "#fee2e2",
                        color: "#991b1b",
                        border: "1px solid #fca5a5",
                        borderRadius: 5,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: deletingId === image.id ? "not-allowed" : "pointer",
                      }}
                    >
                      {deletingId === image.id ? "Wird gelöscht…" : "Entfernen"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

