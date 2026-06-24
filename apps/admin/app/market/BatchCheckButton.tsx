"use client";

import { useState } from "react";

interface BatchResult {
  checked: number;
  summary: Record<string, number>;
}

export function BatchCheckButton({ keyword }: { keyword: string }) {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBatchCheck() {
    if (!confirm(`Verfügbarkeit von bis zu 25 Anzeigen (${keyword}) prüfen?`)) return;
    setResult(null);
    setError(null);
    setIsPending(true);
    try {
      const res = await fetch("/api/admin/market/check-availability-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 25, category: keyword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? `Batch fehlgeschlagen (HTTP ${res.status})`);
      }
      setResult(body as BatchResult);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={handleBatchCheck} disabled={isPending} className="btn btn-secondary btn-sm">
        {isPending ? "Pruefe..." : "Batch pruefen"}
      </button>
      {result && (
        <span className="listing-meta">
          {result.checked} geprueft
          {result.summary.ok ? ` · ${result.summary.ok} OK` : ""}
          {result.summary.offline ? ` · ${result.summary.offline} offline` : ""}
          {result.summary.price_changed ? ` · ${result.summary.price_changed} Preis geaendert` : ""}
          {result.summary.blocked ? ` · ${result.summary.blocked} blockiert` : ""}
          {result.summary.error ? ` · ${result.summary.error} Fehler` : ""}
        </span>
      )}
      {error && <span style={{ fontSize: 12, color: "#991b1b" }}>{error}</span>}
    </div>
  );
}
