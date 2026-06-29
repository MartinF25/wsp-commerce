"use client";

import { useState } from "react";

interface EnrichBatchResult {
  processed: number;
  succeeded: number;
  failed: number;
  avgDataCompletenessScore: number;
  distribution: Record<string, number>;
}

export function BatchEnrichButton({ keyword }: { keyword: string }) {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<EnrichBatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBatchEnrich() {
    if (!confirm(`Bis zu 50 Listings (${keyword}) automatisch anreichern? Dieser Vorgang nutzt KI und kann ca. 30–60 Sekunden dauern.`)) return;
    setResult(null);
    setError(null);
    setIsPending(true);
    try {
      const res = await fetch("/api/admin/market/enrich-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50, onlyMissing: true, keyword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { error?: { message?: string } })?.error?.message ?? `Batch fehlgeschlagen (HTTP ${res.status})`);
      }
      setResult((body as { data?: EnrichBatchResult }).data ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={handleBatchEnrich} disabled={isPending} className="btn btn-secondary btn-sm">
        {isPending ? "Reichere an..." : "Batch anreichern"}
      </button>
      {result && (
        <span className="listing-meta">
          {result.succeeded}/{result.processed} angereichert
          {result.avgDataCompletenessScore > 0 ? ` · Ø ${result.avgDataCompletenessScore}% vollständig` : ""}
          {result.failed > 0 ? ` · ${result.failed} Fehler` : ""}
        </span>
      )}
      {error && <span style={{ fontSize: 12, color: "#991b1b" }}>{error}</span>}
    </div>
  );
}
