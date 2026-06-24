import Link from "next/link";
import { api } from "@/lib/api";
import type { MarketOpportunity } from "@/lib/api";
import { OpportunityActions } from "./OpportunityActions";
import { RunReportButton } from "./RunReportButton";

export const dynamic = "force-dynamic";

function fmt(cents: number | null | undefined) {
  if (cents == null) return "–";
  return `${Math.round(cents / 100).toLocaleString("de-DE")} EUR`;
}

function scoreStyle(score: number | null | undefined) {
  if (typeof score !== "number") return { color: "#94a3b8" };
  if (score >= 80) return { color: "#166534", fontWeight: 700 };
  if (score >= 60) return { color: "#92400e", fontWeight: 700 };
  return { color: "#991b1b", fontWeight: 700 };
}

function catBadge(cat: string | null | undefined) {
  if (!cat) return null;
  const colors: Record<string, { bg: string; color: string }> = {
    solarspeicher: { bg: "#dbeafe", color: "#1d4ed8" },
    solarzaun: { bg: "#dcfce7", color: "#166534" },
    solaranlage: { bg: "#fef9c3", color: "#854d0e" },
    skywind: { bg: "#ede9fe", color: "#5b21b6" },
  };
  const style = colors[cat] ?? { bg: "#f1f5f9", color: "#374151" };
  return (
    <span style={{ ...style, display: "inline-flex", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
      {cat}
    </span>
  );
}

function riskBadge(risk: string | null | undefined) {
  if (!risk) return null;
  const colors: Record<string, { bg: string; color: string }> = {
    LOW: { bg: "#dcfce7", color: "#166534" },
    MEDIUM: { bg: "#fef3c7", color: "#92400e" },
    HIGH: { bg: "#fee2e2", color: "#991b1b" },
  };
  const style = colors[risk] ?? { bg: "#e5e7eb", color: "#374151" };
  return (
    <span style={{ ...style, display: "inline-flex", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
      {risk}
    </span>
  );
}

export default async function OpportunitiesPage() {
  let opportunities: MarketOpportunity[] = [];
  let fetchError: string | null = null;

  try {
    const result = await api.marketOpportunities.getPrepared();
    opportunities = result.data;
  } catch (e) {
    fetchError = (e as Error).message;
  }

  const totalGrossProfit = opportunities.reduce((sum, op) => sum + (op.estimatedGrossProfit ?? 0), 0);
  const topScore = opportunities.length > 0 ? Math.max(...opportunities.map((op) => op.dealScore ?? 0)) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tageschancen</h1>
          <div className="page-subtitle">
            Vom Agent ausgewählte Listings · Score ≥ 75 · Kategorien: Solarspeicher, Solarzaun, Solaranlage
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/market/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
          <Link href="/market" className="btn btn-secondary btn-sm">Listings</Link>
          <RunReportButton />
        </div>
      </div>

      {fetchError && <div className="alert alert-error">{fetchError}</div>}

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Chancen</div>
          <div className="kpi-value">{opportunities.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Gesamtmarge (brutto)</div>
          <div className="kpi-value" style={{ color: "#166534" }}>{fmt(totalGrossProfit)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Bester Score</div>
          <div className="kpi-value" style={{ color: "#166534" }}>{topScore > 0 ? topScore : "–"}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Aufschlag</div>
          <div className="kpi-value">40 %</div>
        </div>
      </div>

      {opportunities.length === 0 && !fetchError ? (
        <div className="empty empty-dashed" style={{ padding: "40px 32px" }}>
          <div style={{ marginBottom: 8 }}>Noch keine Tageschancen vorbereitet.</div>
          <div className="empty-sub">
            Klicke auf „Tagesbericht starten" – der Agent wählt automatisch Listings aus, berechnet EK/VK und erstellt Produktentwürfe.
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-toolbar">
            <span className="table-toolbar-meta">
              {opportunities.length} Chancen · Alle als Produktentwurf im Status draft
            </span>
            <span className="table-toolbar-legend">
              <span className="legend-item">
                <span className="legend-dot" style={{ background: "#166534" }} />Freigeben = Produkt auf active setzen
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: "#991b1b" }} />Ablehnen = wird beim nächsten Report übersprungen
              </span>
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Titel</th>
                <th>Kategorie</th>
                <th style={{ textAlign: "right" }}>Score</th>
                <th style={{ textAlign: "right" }}>Risiko</th>
                <th style={{ textAlign: "right" }}>EK</th>
                <th style={{ textAlign: "right" }}>VK (+40%)</th>
                <th style={{ textAlign: "right" }}>Marge</th>
                <th style={{ textAlign: "right", width: 260 }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((op) => (
                <tr key={op.id}>
                  <td>
                    <div className="listing-title">{op.title}</div>
                    {op.location && <div className="listing-meta">{op.location}</div>}
                    {op.aiComment && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, maxWidth: 360 }}>
                        {op.aiComment}
                      </div>
                    )}
                    {op.listing_url && (
                      <a
                        href={op.listing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, color: "#2563eb" }}
                      >
                        Kleinanzeige →
                      </a>
                    )}
                  </td>
                  <td>{catBadge(op.productCategory)}</td>
                  <td style={{ textAlign: "right", ...scoreStyle(op.dealScore) }}>
                    {op.dealScore ?? "–"}
                  </td>
                  <td style={{ textAlign: "right" }}>{riskBadge(op.riskLevel)}</td>
                  <td style={{ textAlign: "right", fontSize: 13 }}>{fmt(op.purchasePrice)}</td>
                  <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600 }}>
                    {fmt(op.suggestedSellingPrice)}
                  </td>
                  <td style={{ textAlign: "right", fontSize: 13, color: "#166534", fontWeight: 600 }}>
                    +{fmt(op.estimatedGrossProfit)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <OpportunityActions
                      listingId={op.id}
                      productDraftId={op.productDraftId!}
                      title={op.title}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 20, padding: "12px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#64748b" }}>
        <strong>n8n Aufruf (täglich 12:00):</strong>{" "}
        <code className="code-inline">POST /api/admin/market-opportunities/daily-report</code>{" "}
        mit Header <code className="code-inline">X-Admin-Key</code> und Body{" "}
        <code className="code-inline">{`{"limit":25,"createDrafts":true,"sendMail":true}`}</code>
      </div>
    </div>
  );
}
