"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReportResult {
  draftsCreated: number;
  topOpportunities: Array<{ title: string }>;
  errors: string[];
  totalAnalyzed: number;
}

export function RunReportButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    if (!confirm("Tagesbericht jetzt starten? Der Agent wählt Chancen aus und erstellt Produktentwürfe.")) return;
    setError(null);
    setResult(null);
    setIsPending(true);
    try {
      const res = await fetch("/api/admin/market/opportunities/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 25, createDrafts: true, sendMail: false }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message ?? `Fehler (HTTP ${res.status})`);
      setResult(body?.data as ReportResult);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        onClick={handleRun}
        disabled={isPending}
        className="btn btn-primary btn-sm"
        style={{ background: "#166534", borderColor: "#166534" }}
      >
        {isPending ? "Agent läuft..." : "Tagesbericht starten"}
      </button>
      {result && (
        <span className="listing-meta">
          {result.topOpportunities.length} Chancen · {result.draftsCreated} Entwürfe · {result.totalAnalyzed} analysiert
          {result.errors.length > 0 ? ` · ${result.errors.length} Fehler` : ""}
        </span>
      )}
      {error && <span style={{ fontSize: 12, color: "#991b1b" }}>{error}</span>}
    </div>
  );
}
