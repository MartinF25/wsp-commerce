"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MarketReferencePrice } from "@/lib/api";

const KEYWORDS = ["solarspeicher", "solarzaun", "solaranlage", "skywind"];

interface EditState {
  id: string;
  keyword: string;
  productName: string;
  ek_eur: string;
  vk_eur: string;
  notes: string;
}

function fmtEur(v: number | null) {
  if (v == null) return "–";
  return `${v.toLocaleString("de-DE")} EUR`;
}

export function ReferencePriceManager({ initial }: { initial: MarketReferencePrice[] }) {
  const router = useRouter();
  const [prices, setPrices] = useState<MarketReferencePrice[]>(initial);
  const [editId, setEditId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [newRow, setNewRow] = useState({ keyword: KEYWORDS[0], productName: "", ek_eur: "", vk_eur: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!newRow.productName.trim() || !newRow.vk_eur) {
      setError("Produktname und VK sind Pflicht.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/market/reference-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: newRow.keyword,
          productName: newRow.productName.trim(),
          ek_eur: newRow.ek_eur ? Number(newRow.ek_eur) : null,
          vk_eur: Number(newRow.vk_eur),
          notes: newRow.notes.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      setPrices((prev) => [...prev, body.data]);
      setNewRow({ keyword: KEYWORDS[0], productName: "", ek_eur: "", vk_eur: "", notes: "" });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p: MarketReferencePrice) {
    setEditId(p.id);
    setEditState({
      id: p.id,
      keyword: p.keyword,
      productName: p.productName,
      ek_eur: p.ek_eur != null ? String(p.ek_eur) : "",
      vk_eur: String(p.vk_eur),
      notes: p.notes ?? "",
    });
  }

  async function handleSaveEdit() {
    if (!editState) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/market/reference-prices/${editState.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: editState.keyword,
          productName: editState.productName.trim(),
          ek_eur: editState.ek_eur ? Number(editState.ek_eur) : null,
          vk_eur: Number(editState.vk_eur),
          notes: editState.notes.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      setPrices((prev) => prev.map((p) => (p.id === editState.id ? body.data : p)));
      setEditId(null);
      setEditState(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/market/reference-prices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      }
      setPrices((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  const byKeyword = KEYWORDS.reduce<Record<string, MarketReferencePrice[]>>((acc, kw) => {
    acc[kw] = prices.filter((p) => p.keyword === kw);
    return acc;
  }, {});

  return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Neue Zeile hinzufügen */}
      <div className="form-card" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Neuen Referenzpreis hinzufügen
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 120px 120px 2fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <label>Keyword</label>
            <select value={newRow.keyword} onChange={(e) => setNewRow((s) => ({ ...s, keyword: e.target.value }))}>
              {KEYWORDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label>Produktname <span className="req">*</span></label>
            <input
              type="text"
              placeholder="z.B. LG Resu 6.5"
              value={newRow.productName}
              onChange={(e) => setNewRow((s) => ({ ...s, productName: e.target.value }))}
            />
          </div>
          <div>
            <label>EK (EUR) <span className="opt">opt.</span></label>
            <input
              type="number"
              placeholder="200"
              value={newRow.ek_eur}
              onChange={(e) => setNewRow((s) => ({ ...s, ek_eur: e.target.value }))}
            />
          </div>
          <div>
            <label>VK neu (EUR) <span className="req">*</span></label>
            <input
              type="number"
              placeholder="800"
              value={newRow.vk_eur}
              onChange={(e) => setNewRow((s) => ({ ...s, vk_eur: e.target.value }))}
            />
          </div>
          <div>
            <label>Notizen</label>
            <input
              type="text"
              placeholder="z.B. Neupreis Amazon"
              value={newRow.notes}
              onChange={(e) => setNewRow((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>
          <div>
            <label>&nbsp;</label>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              {saving ? "Speichert..." : "+ Hinzufügen"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabelle nach Keyword gruppiert */}
      {KEYWORDS.map((kw) => (
        <div key={kw} style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            {kw} <span style={{ fontWeight: 400, color: "#94a3b8" }}>({byKeyword[kw].length} Einträge)</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Produktname</th>
                  <th style={{ textAlign: "right" }}>EK (EUR)</th>
                  <th style={{ textAlign: "right" }}>VK neu (EUR)</th>
                  <th style={{ textAlign: "right" }}>Marge</th>
                  <th>Notizen</th>
                  <th style={{ width: 140, textAlign: "right" }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {byKeyword[kw].length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "16px" }}>
                      Keine Referenzpreise für {kw}
                    </td>
                  </tr>
                ) : byKeyword[kw].map((p) =>
                  editId === p.id && editState ? (
                    <tr key={p.id}>
                      <td>
                        <input
                          type="text"
                          value={editState.productName}
                          onChange={(e) => setEditState((s) => s && ({ ...s, productName: e.target.value }))}
                          style={{ width: "100%" }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editState.ek_eur}
                          onChange={(e) => setEditState((s) => s && ({ ...s, ek_eur: e.target.value }))}
                          style={{ width: 90, textAlign: "right" }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editState.vk_eur}
                          onChange={(e) => setEditState((s) => s && ({ ...s, vk_eur: e.target.value }))}
                          style={{ width: 90, textAlign: "right" }}
                        />
                      </td>
                      <td style={{ textAlign: "right", color: "#94a3b8", fontSize: 12 }}>–</td>
                      <td>
                        <input
                          type="text"
                          value={editState.notes}
                          onChange={(e) => setEditState((s) => s && ({ ...s, notes: e.target.value }))}
                          style={{ width: "100%" }}
                        />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button onClick={handleSaveEdit} disabled={saving} className="btn btn-primary btn-sm">
                            {saving ? "..." : "Speichern"}
                          </button>
                          <button onClick={() => { setEditId(null); setEditState(null); }} className="btn btn-secondary btn-sm">
                            Abbrechen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.productName}</td>
                      <td style={{ textAlign: "right" }}>{fmtEur(p.ek_eur)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtEur(p.vk_eur)}</td>
                      <td style={{ textAlign: "right", color: p.ek_eur ? "#166534" : "#94a3b8", fontWeight: 600 }}>
                        {p.ek_eur ? `+${(p.vk_eur - p.ek_eur).toLocaleString("de-DE")} EUR` : "–"}
                      </td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>{p.notes ?? "–"}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button onClick={() => startEdit(p)} className="btn btn-secondary btn-sm">Bearbeiten</button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deleting === p.id}
                            className="btn btn-danger btn-sm"
                          >
                            {deleting === p.id ? "..." : "Löschen"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
