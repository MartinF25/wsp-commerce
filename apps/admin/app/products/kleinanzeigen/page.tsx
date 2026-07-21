"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface KAProduct {
  id: string;
  slug: string;
  name: string;
  kleinanzeigenUrl: string | null;
  availabilityStatus: string;
  condition: string;
  priceCents: number | null;
  createdAt: string;
  lastCheckedAt: string | null;
  healthMessage: string | null;
}

const AVAILABILITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  in_stock:     { label: "Aktiv",      color: "#166534", bg: "#dcfce7", border: "#86efac" },
  out_of_stock: { label: "Reserviert", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  discontinued: { label: "Verkauft",   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  preorder:     { label: "Vorbestellung", color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd" },
  on_request:   { label: "Auf Anfrage", color: "#4b5563", bg: "#f3f4f6", border: "#d1d5db" },
};

const CONDITION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:      { label: "Neu",       color: "#166534", bg: "#dcfce7" },
  like_new: { label: "Neuwertig", color: "#1d4ed8", bg: "#dbeafe" },
  used:     { label: "Gebraucht", color: "#92400e", bg: "#fef3c7" },
};

const STATUS_ORDER: Record<string, number> = {
  in_stock: 0,
  out_of_stock: 1,
  preorder: 2,
  on_request: 3,
  discontinued: 4,
};

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Noch nie";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `vor ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  return `vor ${days}d`;
}

function formatPrice(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(cents / 100);
}

export default function KleinanzeigenPage() {
  const [products, setProducts] = useState<KAProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-proxy/products/kleinanzeigen-links");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const sorted = (json.data ?? []).sort(
        (a: KAProduct, b: KAProduct) =>
          (STATUS_ORDER[a.availabilityStatus] ?? 99) - (STATUS_ORDER[b.availabilityStatus] ?? 99)
      );
      setProducts(sorted);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, availability_status: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin-proxy/products/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability_status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProducts((prev) =>
        prev.map((p) => p.id === id ? { ...p, availabilityStatus: availability_status } : p)
          .sort((a, b) => (STATUS_ORDER[a.availabilityStatus] ?? 99) - (STATUS_ORDER[b.availabilityStatus] ?? 99))
      );
    } catch (e) {
      alert("Fehler: " + (e as Error).message);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = filterStatus === "all" ? products : products.filter((p) => p.availabilityStatus === filterStatus);

  const countActive    = products.filter((p) => p.availabilityStatus === "in_stock").length;
  const countReserved  = products.filter((p) => p.availabilityStatus === "out_of_stock").length;
  const countSold      = products.filter((p) => p.availabilityStatus === "discontinued").length;

  return (
    <>
      <div className="page-header">
        <h1>
          Kleinanzeigen
          <span style={{
            marginLeft: 10, fontSize: 13, fontWeight: 500,
            color: "#6b21a8", background: "#f3e8ff",
            borderRadius: 999, padding: "2px 10px",
          }}>
            {products.length} Inserate
          </span>
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            {loading ? "Lädt…" : "↻ Aktualisieren"}
          </button>
          <Link href="/products" className="btn btn-secondary">← Produkte</Link>
        </div>
      </div>

      <div style={{
        background: "#faf5ff", border: "1px solid #e9d5ff",
        borderRadius: 8, padding: "10px 16px", marginBottom: 20,
        fontSize: 13, color: "#6b21a8",
      }}>
        Alle Produkte mit einem Kleinanzeigen-Link. Der n8n-Agent prüft den Status 2× täglich automatisch.
      </div>

      {/* KPI-Zeile */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card" style={{ borderTop: "3px solid #22c55e" }}>
          <div className="kpi-label">Aktiv</div>
          <div className="kpi-value" style={{ color: "#166534" }}>{countActive}</div>
        </div>
        <div className="kpi-card" style={{ borderTop: "3px solid #f97316" }}>
          <div className="kpi-label">Reserviert</div>
          <div className="kpi-value" style={{ color: "#c2410c" }}>{countReserved}</div>
        </div>
        <div className="kpi-card" style={{ borderTop: "3px solid #ef4444" }}>
          <div className="kpi-label">Verkauft</div>
          <div className="kpi-value" style={{ color: "#991b1b" }}>{countSold}</div>
        </div>
        <div className="kpi-card" style={{ borderTop: "3px solid #94a3b8" }}>
          <div className="kpi-label">Gesamt</div>
          <div className="kpi-value">{products.length}</div>
        </div>
      </div>

      {/* Filter-Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {([
          ["all", "Alle", products.length],
          ["in_stock", "Aktiv", countActive],
          ["out_of_stock", "Reserviert", countReserved],
          ["discontinued", "Verkauft", countSold],
        ] as [string, string, number][]).map(([key, label, count]) => (
          <button
            key={key}
            className={`tab-btn ${filterStatus === key ? "active" : ""}`}
            onClick={() => setFilterStatus(key)}
          >
            {label} <span className="tab-badge">{count}</span>
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Lade Inserate…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
          Keine Inserate in dieser Kategorie.
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Zustand</th>
                <th>Status</th>
                <th>Preis</th>
                <th>Alter</th>
                <th>Zuletzt geprüft</th>
                <th>Anzeige</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const avail = AVAILABILITY_CONFIG[p.availabilityStatus] ?? { label: p.availabilityStatus, color: "#4b5563", bg: "#f3f4f6", border: "#d1d5db" };
                const cond  = CONDITION_CONFIG[p.condition]             ?? { label: p.condition,           color: "#4b5563", bg: "#f3f4f6" };
                const age   = daysSince(p.createdAt);
                const isBusy = updating === p.id;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        <Link href={`/products/${p.id}`}>{p.name}</Link>
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>{p.slug}</div>
                      {p.healthMessage && (
                        <div style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>⚠ {p.healthMessage}</div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px",
                        borderRadius: 999, background: cond.bg, color: cond.color,
                        whiteSpace: "nowrap",
                      }}>
                        {cond.label}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px",
                        borderRadius: 999, background: avail.bg,
                        color: avail.color, border: `1px solid ${avail.border}`,
                        whiteSpace: "nowrap",
                      }}>
                        {avail.label}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: "#111", whiteSpace: "nowrap" }}>
                      {formatPrice(p.priceCents)}
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: age >= 30 ? "#dc2626" : age >= 14 ? "#d97706" : "#4b5563",
                      }}>
                        {age}d
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                      {relativeTime(p.lastCheckedAt)}
                    </td>
                    <td>
                      {p.kleinanzeigenUrl ? (
                        <a
                          href={p.kleinanzeigenUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          ↗ KA
                        </a>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        {p.availabilityStatus !== "out_of_stock" && p.availabilityStatus !== "discontinued" && (
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled={isBusy}
                            onClick={() => setStatus(p.id, "out_of_stock")}
                            title="Als Reserviert markieren"
                          >
                            Reserviert
                          </button>
                        )}
                        {p.availabilityStatus !== "discontinued" && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={isBusy}
                            onClick={() => setStatus(p.id, "discontinued")}
                            title="Als Verkauft markieren"
                          >
                            Verkauft
                          </button>
                        )}
                        {p.availabilityStatus !== "in_stock" && (
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled={isBusy}
                            onClick={() => setStatus(p.id, "in_stock")}
                            title="Wieder auf Aktiv setzen"
                          >
                            Aktiv
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
