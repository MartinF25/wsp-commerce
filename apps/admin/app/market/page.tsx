import Link from "next/link";
import { api } from "@/lib/api";
import type { MarketListing, MarketListingStats } from "@/lib/api";
import { ListingCard } from "./ListingCard";
import { CleanupButton } from "./CleanupButton";
import { BatchCheckButton } from "./BatchCheckButton";
import { BatchEnrichButton } from "./BatchEnrichButton";

export const dynamic = "force-dynamic";

const KEYWORDS: Array<{ key: string; label: string }> = [
  { key: "solarspeicher", label: "Solarspeicher" },
  { key: "solarzaun", label: "Solarzaun" },
  { key: "solaranlage", label: "Solaranlage" },
  { key: "skywind", label: "SkyWind" },
];

const VIEW_FILTERS: Array<{ key: ViewFilter; label: string }> = [
  { key: "all",          label: "Alle" },
  { key: "unanalyzed",   label: "Ohne Analyse" },
  { key: "not_enriched", label: "Nicht angereichert" },
  { key: "incomplete",   label: "Unvollständig" },
  { key: "top",          label: "Top Deals" },
  { key: "review",       label: "Review" },
  { key: "ignored",      label: "Ignoriert" },
];

type ViewFilter = "all" | "unanalyzed" | "not_enriched" | "incomplete" | "top" | "review" | "ignored";

function fmt(cents: number | null) {
  if (cents === null) return "-";
  return `${Math.round(cents / 100).toLocaleString("de-DE")} EUR`;
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function filterListings(listings: MarketListing[], view: ViewFilter): MarketListing[] {
  switch (view) {
    case "unanalyzed":
      return listings.filter((listing) => !listing.analyzedAt);
    case "not_enriched":
      return listings.filter((listing) => !listing.enrichedAt);
    case "incomplete":
      return listings.filter((listing) => {
        const score = listing.dataCompletenessScore as number | null | undefined;
        return score == null || score < 50;
      });
    case "top":
      return listings.filter((listing) => (listing.dealScore ?? -1) >= 80);
    case "review":
      return listings.filter((listing) => listing.recommendation === "REVIEW");
    case "ignored":
      return listings.filter((listing) => listing.recommendation === "IGNORE");
    case "all":
    default:
      return listings;
  }
}

function buildMarketHref(keyword: string, view: ViewFilter): string {
  return `/market?keyword=${encodeURIComponent(keyword)}&view=${encodeURIComponent(view)}`;
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: { keyword?: string; view?: string };
}) {
  const activeKeyword = KEYWORDS.find((k) => k.key === searchParams.keyword)?.key ?? KEYWORDS[0].key;
  const activeLabel = KEYWORDS.find((k) => k.key === activeKeyword)?.label ?? KEYWORDS[0].label;
  const activeView = VIEW_FILTERS.find((filter) => filter.key === searchParams.view)?.key ?? "all";

  let listings: MarketListing[] = [];
  let stats: MarketListingStats | null = null;
  let error: string | null = null;

  try {
    const result = await api.marketListings.list({ keyword: activeKeyword, limit: 200 });
    listings = result.data;
    stats = result.stats;
  } catch (e) {
    error = (e as Error).message;
  }

  const filteredListings = filterListings(listings, activeView);
  const viewCounts: Record<ViewFilter, number> = {
    all:          listings.length,
    unanalyzed:   filterListings(listings, "unanalyzed").length,
    not_enriched: filterListings(listings, "not_enriched").length,
    incomplete:   filterListings(listings, "incomplete").length,
    top:          filterListings(listings, "top").length,
    review:       filterListings(listings, "review").length,
    ignored:      filterListings(listings, "ignored").length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Marktbeobachtung</h1>
          <div className="page-subtitle">Kleinanzeigen via n8n mit Deal-Analyse fuer den Adminbereich</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <BatchEnrichButton keyword={activeKeyword} />
          <BatchCheckButton keyword={activeKeyword} />
          <CleanupButton />
        </div>
      </div>

      <div className="tabs">
        {KEYWORDS.map(({ key, label }) => (
          <Link
            key={key}
            href={buildMarketHref(key, activeView)}
            className={`tab-btn${activeKeyword === key ? " active" : ""}`}
          >
            {label}
            {activeKeyword === key && stats && <span className="tab-badge">{stats.total}</span>}
          </Link>
        ))}
      </div>

      <div className="tabs" style={{ marginTop: 12, marginBottom: 20 }}>
        {VIEW_FILTERS.map(({ key, label }) => (
          <Link
            key={key}
            href={buildMarketHref(activeKeyword, key)}
            className={`tab-btn${activeView === key ? " active" : ""}`}
          >
            {label}
            <span className="tab-badge">{viewCounts[key]}</span>
          </Link>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="kpi-grid">
          <KpiCard label="Gesamt" value={String(stats.total)} />
          <KpiCard label="Durchschnitt" value={fmt(stats.avg_price_cents)} sub="Mittelwert" />
          <KpiCard label="Minimum" value={fmt(stats.min_price_cents)} />
          <KpiCard label="Maximum" value={fmt(stats.max_price_cents)} />
          <KpiCard label="Neu heute" value={String(stats.new_today)} />
          <KpiCard label="Mit Preis" value={String(stats.with_price)} sub={`von ${stats.total}`} />
        </div>
      )}

      {filteredListings.length === 0 && !error ? (
        <div className="empty empty-dashed">
          <div>Keine Angebote fuer "{activeLabel}" im Filter "{VIEW_FILTERS.find((item) => item.key === activeView)?.label}".</div>
          <div className="empty-sub">
            Bestehende Listings bleiben erhalten. Du kannst einzelne Anzeigen direkt in der Liste analysieren.
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-toolbar">
            <span className="table-toolbar-meta">{filteredListings.length} Angebote · Quelle: Kleinanzeigen</span>
            {stats?.avg_price_cents && (
              <span className="table-toolbar-legend">
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: "#4ade80" }} />
                  Guenstig (&lt;80% Durchschnitt)
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: "#fb923c" }} />
                  Teuer (&gt;120% Durchschnitt)
                </span>
              </span>
            )}
          </div>
          <table>
            <thead>
              <tr>
                <th style={{ width: 56 }}></th>
                <th>Titel und Analyse</th>
                <th style={{ textAlign: "right" }}>Preis</th>
                <th style={{ textAlign: "right" }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  avgPriceCents={stats?.avg_price_cents ?? null}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
