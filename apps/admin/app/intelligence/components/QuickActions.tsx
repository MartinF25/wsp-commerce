"use client";

import { useState } from "react";

interface ApiButtonProps {
  label: string;
  apiPath: string;
  body?: Record<string, unknown>;
  variant?: "primary" | "secondary";
}

function ApiButton({ label, apiPath, body, variant = "secondary" }: ApiButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleClick() {
    if (!confirm(`${label} jetzt starten?`)) return;
    setState("loading");
    setMessage("");
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json as { error?: { message?: string } })?.error?.message ??
            `Fehler (HTTP ${res.status})`
        );
      }
      const data = (json as { data?: Record<string, unknown> })?.data ?? json as Record<string, unknown>;
      let msg = "Fertig";
      if (typeof data.succeeded === "number") msg = `${data.succeeded} angereichert`;
      else if (Array.isArray(data.topOpportunities)) msg = `${(data.topOpportunities as unknown[]).length} Opportunities`;
      else if (typeof data.created === "number") msg = `${data.created} erstellt`;
      setMessage(msg);
      setState("success");
    } catch (e) {
      setMessage((e as Error).message);
      setState("error");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className={variant === "primary" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
        style={state === "loading" ? { opacity: 0.7 } : undefined}
      >
        {state === "loading" ? "Läuft..." : label}
      </button>
      {state === "success" && (
        <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>✓ {message}</span>
      )}
      {state === "error" && (
        <span style={{ fontSize: 12, color: "#991b1b" }}>{message}</span>
      )}
    </div>
  );
}

export function QuickActions({
  rawListings,
  enriched,
  analyzed,
  opportunities,
  drafts,
}: {
  rawListings: number;
  enriched: number;
  analyzed: number;
  opportunities: number;
  drafts: number;
}) {
  const notEnriched  = rawListings - enriched;
  const notAnalyzed  = enriched - analyzed;
  const needsEnrich  = notEnriched > 0;
  const needsAnalyze = notAnalyzed > 0 && enriched > 0;
  const needsReport  = analyzed > 0;

  if (!needsEnrich && !needsAnalyze && !needsReport && opportunities === 0 && drafts === 0) return null;

  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 14,
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          flexShrink: 0,
        }}
      >
        Schnellaktionen
      </span>
      {needsEnrich && (
        <ApiButton
          label={`${notEnriched} anreichern`}
          apiPath="/api/admin/market/enrich-batch"
          body={{ limit: 200, onlyMissing: true }}
          variant="primary"
        />
      )}
      {needsAnalyze && (
        <ApiButton
          label={`${notAnalyzed} Deal Score berechnen`}
          apiPath="/api/admin/market/analyze-batch"
          body={{ limit: 50 }}
          variant="primary"
        />
      )}
      {needsReport && (
        <ApiButton
          label="Daily Report starten"
          apiPath="/api/admin/market/opportunities/daily-report"
          body={{ limit: 25, createDrafts: true }}
        />
      )}
      {opportunities > 0 && (
        <a href="/market/opportunities" className="btn btn-secondary btn-sm">
          {opportunities} Opportunities prüfen →
        </a>
      )}
      {drafts > 0 && (
        <a href="/products" className="btn btn-secondary btn-sm">
          {drafts} Entwürfe freigeben →
        </a>
      )}
    </div>
  );
}
