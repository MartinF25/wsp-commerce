import Link from "next/link";
import { api } from "@/lib/api";
import type { MarketListing } from "@/lib/api";

export const dynamic = "force-dynamic";

const KEYWORDS = ["skywind", "solarzaun", "solaranlage", "solarspeicher"];

function fmt(cents: number | null) {
  if (cents === null) return "-";
  return `${Math.round(cents / 100).toLocaleString("de-DE")} EUR`;
}

function scoreColor(score: number | null | undefined) {
  if (typeof score !== "number") return "#94a3b8";
  if (score >= 80) return "#166534";
  if (score >= 60) return "#92400e";
  return "#991b1b";
}

function badgeColor(rec: MarketListing["recommendation"]) {
  switch (rec) {
    case "IMPORT": return { background: "#dcfce7", color: "#166534" };
    case "REVIEW": return { background: "#fef3c7", color: "#92400e" };
    case "IGNORE": return { background: "#fee2e2", color: "#991b1b" };
    default: return { background: "#e5e7eb", color: "#374151" };
  }
}

function SectionTable({
  title,
  subtitle,
  listings,
  emptyText,
  accent,
}: {
  title: string;
  subtitle: string;
  listings: MarketListing[];
  emptyText: string;
  accent: string;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{title}</h2>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: accent,
            color: "#fff",
            borderRadius: 999,
            padding: "2px 8px",
          }}
        >
          {listings.length}
        </span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{subtitle}</span>
      </div>

      {listings.length === 0 ? (
        <div
          style={{
            padding: "16px 20px",
            border: "1px dashed #e2e8f0",
            borderRadius: 8,
            fontSize: 13,
            color: "#94a3b8",
          }}
        >
          {emptyText}
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Titel</th>
                <th>Kategorie</th>
                <th style={{ textAlign: "right" }}>Score</th>
                <th style={{ textAlign: "right" }}>Preis</th>
                <th style={{ textAlign: "right" }}>Empfehlung</th>
                <th style={{ textAlign: "right" }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const bc = badgeColor(l.recommendation);
                return (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13, color: "#111" }}>
                        {l.title}
                      </div>
                      {l.location && (
                        <div className="listing-meta">{l.location}</div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>
                      {l.productCategory ?? "–"}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: scoreColor(l.dealScore), fontSize: 13 }}>
                      {typeof l.dealScore === "number" ? l.dealScore : "–"}
                    </td>
                    <td style={{ textAlign: "right", fontSize: 13, color: "#374151" }}>
                      {fmt(l.price_cents)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        style={{
                          ...bc,
                          display: "inline-flex",
                          borderRadius: 999,
                          padding: "2px 8px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {l.recommendation ?? "–"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/market?keyword=${encodeURIComponent(l.keyword)}&view=all`}
                        className="btn btn-secondary btn-sm"
                      >
                        Öffnen →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function MarketDashboardPage() {
  let allListings: MarketListing[] = [];
  let fetchError: string | null = null;

  try {
    const results = await Promise.all(
      KEYWORDS.map((kw) => api.marketListings.list({ keyword: kw, limit: 500 }))
    );
    allListings = results.flatMap((r) => r.data);
  } catch (e) {
    fetchError = (e as Error).message;
  }

  const topDeals = allListings
    .filter((l) => (l.dealScore ?? -1) >= 80 && !l.productDraftId)
    .sort((a, b) => (b.dealScore ?? 0) - (a.dealScore ?? 0))
    .slice(0, 15);

  const offlineWithDraft = allListings
    .filter((l) => l.sourceStatus === "offline" && l.productDraftId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const priceChanged = allListings
    .filter((l) => l.priceChanged === true || l.syncStatus === "price_changed")
    .sort((a, b) => Math.abs(b.priceChangeAmount ?? 0) - Math.abs(a.priceChangeAmount ?? 0));

  const unanalyzed = allListings
    .filter((l) => !l.analyzedAt && l.recommendation == null)
    .sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())
    .slice(0, 20);

  const kpis = [
    { label: "Gesamt", value: allListings.length },
    { label: "Top Deals", value: topDeals.length, accent: "#166534" },
    { label: "Offline + Entwurf", value: offlineWithDraft.length, accent: "#991b1b" },
    { label: "Preisänderung", value: priceChanged.length, accent: "#9a3412" },
    { label: "Unanalysiert", value: unanalyzed.length, accent: "#64748b" },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Markt Dashboard</h1>
          <div className="page-subtitle">Aktionsrelevante Listings über alle Kategorien</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/market" className="btn btn-secondary btn-sm">
            Listings →
          </Link>
        </div>
      </div>

      {fetchError && <div className="alert alert-error">{fetchError}</div>}

      <div className="kpi-grid" style={{ marginBottom: 32 }}>
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={k.accent ? { color: k.accent } : undefined}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <SectionTable
        title="Top Deals"
        subtitle="Score ≥ 80, noch kein Produktentwurf"
        listings={topDeals}
        emptyText="Keine Top Deals gefunden – alle hochwertigen Listings haben bereits einen Produktentwurf."
        accent="#166534"
      />

      <SectionTable
        title="Offline mit Entwurf"
        subtitle="Quelle verschwunden, Produktentwurf vorhanden"
        listings={offlineWithDraft}
        emptyText="Keine Listings mit offline-Quelle und vorhandenem Entwurf."
        accent="#991b1b"
      />

      <SectionTable
        title="Preisänderungen"
        subtitle="Preis hat sich seit letzter Prüfung geändert"
        listings={priceChanged}
        emptyText="Keine Preisänderungen erkannt."
        accent="#9a3412"
      />

      <SectionTable
        title="Unanalysiert"
        subtitle="Noch kein Deal-Score, maximal 20 angezeigt"
        listings={unanalyzed}
        emptyText="Alle Listings wurden bereits analysiert."
        accent="#64748b"
      />
    </div>
  );
}
