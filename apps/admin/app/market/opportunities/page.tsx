import Link from "next/link";
import { api } from "@/lib/api";
import type { MarketOpportunity } from "@/lib/api";
import { OpportunityActions } from "./OpportunityActions";
import { RunReportButton } from "./RunReportButton";
import { BatchImageButton } from "./BatchImageButton";

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

function oppScoreBadge(score: number | null | undefined) {
  if (score == null) return <span style={{ color: "#94a3b8" }}>–</span>;
  const bg = score >= 75 ? "#dcfce7" : score >= 55 ? "#fef3c7" : "#fee2e2";
  const color = score >= 75 ? "#166534" : score >= 55 ? "#92400e" : "#991b1b";
  return (
    <span style={{ background: bg, color, borderRadius: 999, padding: "2px 8px", fontSize: 12, fontWeight: 700, display: "inline-block" }}>
      {score}
    </span>
  );
}

function knowledgeBadge(score: number | null | undefined) {
  if (score == null) return <span style={{ color: "#94a3b8", fontSize: 11 }}>–</span>;
  const color = score >= 70 ? "#166534" : score >= 40 ? "#92400e" : "#94a3b8";
  return (
    <span style={{ color, fontSize: 11, fontWeight: 600 }} title={`Knowledge Score: ${score}/100`}>
      K:{score}
    </span>
  );
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

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function ageDays(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function ageBadge(listedAt: string | null | undefined, scrapedAt: string | null | undefined) {
  const days = ageDays(listedAt ?? scrapedAt);
  if (days === null) return <span style={{ color: "#94a3b8", fontSize: 11 }}>–</span>;
  const color = days <= 3 ? "#166534" : days <= 14 ? "#92400e" : "#991b1b";
  const bg = days <= 3 ? "#dcfce7" : days <= 14 ? "#fef3c7" : "#fee2e2";
  const label = days === 0 ? "heute" : days === 1 ? "1 Tag" : `${days} Tage`;
  return (
    <span style={{ background: bg, color, borderRadius: 999, padding: "2px 7px", fontSize: 11, fontWeight: 600, display: "inline-block", whiteSpace: "nowrap" }}>
      {label}
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

  // Sortierung nach opportunityScore (höchster zuerst)
  opportunities = [...opportunities].sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0));

  const totalGrossProfit = opportunities.reduce((sum, op) => sum + (op.estimatedGrossProfit ?? 0), 0);
  const topOppScore = opportunities.length > 0 ? Math.max(...opportunities.map((op) => op.opportunityScore ?? 0)) : 0;
  const avgKnowledge = opportunities.length > 0
    ? Math.round(opportunities.reduce((sum, op) => sum + (op.dataCompletenessScore ?? 0), 0) / opportunities.length)
    : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tageschancen</h1>
          <div className="page-subtitle">
            Sortiert nach Opportunity Score (Deal 50% · Knowledge 30% · Pricing 20%)
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/market/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
          <Link href="/market" className="btn btn-secondary btn-sm">Listings</Link>
          <BatchImageButton />
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
          <div className="kpi-label">Bester Opp-Score</div>
          <div className="kpi-value" style={{ color: "#166534" }}>{topOppScore > 0 ? topOppScore : "–"}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Ø Knowledge</div>
          <div className="kpi-value">{avgKnowledge > 0 ? `${avgKnowledge}%` : "–"}</div>
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
                <th style={{ width: 56 }}>Bild</th>
                <th>Titel</th>
                <th>Kategorie</th>
                <th style={{ textAlign: "right" }}>Alter</th>
                <th style={{ textAlign: "right" }}>Opp-Score</th>
                <th style={{ textAlign: "right" }}>Deal</th>
                <th style={{ textAlign: "right" }}>Risiko</th>
                <th style={{ textAlign: "right" }}>EK</th>
                <th style={{ textAlign: "right" }}>VK (+40%)</th>
                <th style={{ textAlign: "right" }}>Marge</th>
                <th style={{ textAlign: "center", width: 60 }}>Quelle</th>
                <th style={{ textAlign: "right", width: 230 }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((op) => (
                <tr key={op.id}>
                  <td style={{ padding: "6px 8px" }}>
                    {op.productImageUrl ? (
                      <img
                        src={op.productImageUrl}
                        alt={op.title}
                        style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0", display: "block" }}
                      />
                    ) : op.image_url ? (
                      <img
                        src={op.image_url}
                        alt={op.title}
                        style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0", display: "block", opacity: 0.5 }}
                        title="Originalanzeige (kein KI-Bild)"
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 6, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 19.5h15A2.25 2.25 0 0021.75 17.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="listing-title">{op.title}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                      {op.location && <span className="listing-meta">{op.location}</span>}
                      {knowledgeBadge(op.dataCompletenessScore)}
                      {op.brand && <span style={{ fontSize: 11, color: "#64748b" }}>{op.brand}{op.model ? ` ${op.model}` : ""}</span>}
                    </div>
                    {op.aiComment && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, maxWidth: 360 }}>
                        {op.aiComment}
                      </div>
                    )}
                  </td>
                  <td>{catBadge(op.productCategory)}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      {ageBadge(op.listed_at, op.scraped_at)}
                      {op.listed_at && (
                        <span style={{ fontSize: 10, color: "#94a3b8" }} title="Inserat-Datum (Kleinanzeigen)">
                          {fmtDate(op.listed_at)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {oppScoreBadge(op.opportunityScore)}
                  </td>
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
                  <td style={{ textAlign: "center" }}>
                    {op.listing_url ? (
                      <a
                        href={op.listing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Originalanzeige öffnen"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "#f1f5f9",
                          color: "#2563eb",
                          border: "1px solid #e2e8f0",
                          textDecoration: "none",
                        }}
                      >
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        KA
                      </a>
                    ) : <span style={{ color: "#94a3b8" }}>–</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <OpportunityActions
                      listingId={op.id}
                      productDraftId={op.productDraftId}
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
