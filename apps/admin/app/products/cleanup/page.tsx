"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  variantCount: number;
  totalStock: number;
}

const DAYS = 10;

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function CleanupPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-proxy/products");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const all: Product[] = json.data ?? [];
      const old = all.filter(
        (p) => p.status === "active" && daysSince(p.created_at) >= DAYS
      );
      setProducts(old);
      setSelected(new Set(old.map((p) => p.id)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleAll() {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function markAsSold() {
    setProcessing(true);
    setConfirming(false);
    const ok: string[] = [];
    const fail: string[] = [];

    for (const id of selected) {
      try {
        const res = await fetch(`/api/admin-proxy/products/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ availability_status: "discontinued" }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        ok.push(id);
      } catch {
        fail.push(id);
      }
    }

    setDone(ok);
    setFailed(fail);
    setProcessing(false);
    setProducts((prev) => prev.filter((p) => !ok.includes(p.id)));
    setSelected(new Set());
  }

  const selectedCount = selected.size;
  const allSelected = selectedCount === products.length && products.length > 0;

  return (
    <>
      <div className="page-header">
        <h1>
          Artikel bereinigen
          {products.length > 0 && (
            <span style={{
              marginLeft: 12, fontSize: 13, fontWeight: 500,
              color: "#92400e", background: "#fef3c7",
              borderRadius: 999, padding: "2px 10px",
            }}>
              {products.length} betroffen
            </span>
          )}
        </h1>
        <Link href="/products" className="btn btn-secondary">← Zurück</Link>
      </div>

      <div style={{
        background: "#f0f9ff", border: "1px solid #bae6fd",
        borderRadius: 8, padding: "12px 16px", marginBottom: 20,
        fontSize: 14, color: "#0369a1",
      }}>
        Zeigt alle <strong>Online-Artikel</strong>, die seit mindestens <strong>{DAYS} Tagen</strong> eingestellt sind.
        Markierte Artikel werden auf <strong>Verkauft / Nicht mehr verfügbar</strong> gesetzt — sie bleiben im System, sind aber nicht mehr buchbar.
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {done.length > 0 && (
        <div className="alert" style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
          ✓ {done.length} Artikel erfolgreich als verkauft markiert.
          {failed.length > 0 && ` ${failed.length} fehlgeschlagen.`}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Laden…</div>
      ) : products.length === 0 && done.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
          Keine Artikel älter als {DAYS} Tage gefunden. ✓
        </div>
      ) : products.length > 0 ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              Alle auswählen ({products.length})
            </label>

            {confirming ? (
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "#b45309" }}>
                  {selectedCount} Artikel als verkauft markieren?
                </span>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={processing}
                  onClick={markAsSold}
                >
                  {processing ? "Wird verarbeitet…" : "Ja, markieren"}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setConfirming(false)}
                >
                  Abbrechen
                </button>
              </span>
            ) : (
              <button
                className="btn btn-danger"
                disabled={selectedCount === 0}
                onClick={() => setConfirming(true)}
              >
                {selectedCount > 0
                  ? `${selectedCount} Artikel als verkauft markieren`
                  : "Keine ausgewählt"}
              </button>
            )}
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Name</th>
                  <th>Eingestellt am</th>
                  <th>Alter</th>
                  <th>Varianten</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const age = daysSince(p.created_at);
                  const isSelected = selected.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      style={{ background: isSelected ? "#fefce8" : undefined, cursor: "pointer" }}
                      onClick={() => toggle(p.id)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(p.id)}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>{p.slug}</div>
                      </td>
                      <td style={{ fontSize: 13, color: "#6b7280" }}>
                        {new Date(p.created_at).toLocaleDateString("de-DE")}
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 600,
                          color: age >= 30 ? "#dc2626" : age >= 14 ? "#d97706" : "#4b5563",
                        }}>
                          {age} Tage
                        </span>
                      </td>
                      <td>{p.variantCount}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/products/${p.id}`}
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Öffnen
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </>
  );
}
