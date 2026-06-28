"use client";

import { useState } from "react";
import type { IntelligenceRecommendation } from "@/lib/api";

const LEVEL_COLORS = {
  high: { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", dot: "#ef4444", label: "Dringend" },
  medium: { bg: "#fef3c7", border: "#fde68a", text: "#92400e", dot: "#f59e0b", label: "Heute" },
  low: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", dot: "#22c55e", label: "Offen" },
};

function InlineActionButton({
  apiPath,
  apiBody,
  label,
}: {
  apiPath: string;
  apiBody?: Record<string, unknown>;
  label: string;
}) {
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
        body: apiBody ? JSON.stringify(apiBody) : undefined,
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 8 }}>
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className="btn btn-primary btn-sm"
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
    </span>
  );
}

export function Recommendations({ items }: { items: IntelligenceRecommendation[] }) {
  if (items.length === 0) {
    return (
      <div className="intel-card">
        <div className="intel-card-header">
          <span className="intel-card-icon">✅</span>
          <span className="intel-card-title">Empfehlungen</span>
        </div>
        <div
          style={{
            padding: "20px",
            border: "1px dashed #e2e8f0",
            borderRadius: 8,
            textAlign: "center",
            fontSize: 13,
            color: "#94a3b8",
          }}
        >
          Keine offenen Empfehlungen – alles in Ordnung.
        </div>
      </div>
    );
  }

  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <span className="intel-card-icon">🤖</span>
        <span className="intel-card-title">Empfehlungen</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: 999,
            padding: "2px 8px",
            fontWeight: 700,
          }}
        >
          {items.length} offen
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => {
          const c = LEVEL_COLORS[item.level];
          return (
            <div
              key={i}
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: c.dot,
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
                  {item.message}
                </div>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                  {item.apiPath && item.apiLabel && (
                    <InlineActionButton
                      apiPath={item.apiPath}
                      apiBody={item.apiBody}
                      label={item.apiLabel}
                    />
                  )}
                  <a
                    href={item.href}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#2563eb",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {item.actionLabel} →
                  </a>
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: c.text,
                  background: "rgba(255,255,255,0.6)",
                  borderRadius: 999,
                  padding: "2px 6px",
                  flexShrink: 0,
                }}
              >
                {c.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
