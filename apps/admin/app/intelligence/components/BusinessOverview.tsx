import type { IntelligenceOverview } from "@/lib/api";

function fmt(cents: number) {
  if (cents === 0) return "–";
  return `${Math.round(cents / 100).toLocaleString("de-DE")} €`;
}

function KpiCard({
  label,
  value,
  sub,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  href?: string;
}) {
  const inner = (
    <div className="kpi-card" style={{ flex: 1, minWidth: 110 }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
  if (href) {
    return <a href={href} style={{ textDecoration: "none", flex: 1, minWidth: 110 }}>{inner}</a>;
  }
  return inner;
}

export function BusinessOverview({ data }: { data: IntelligenceOverview["business"] }) {
  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <span className="intel-card-icon">📊</span>
        <span className="intel-card-title">Revenue Summary</span>
      </div>
      <div className="kpi-grid" style={{ marginBottom: 0 }}>
        <KpiCard label="Listings gesamt" value={data.totalListings} />
        <KpiCard label="Neu heute" value={data.newListingsToday} accent="#2563eb" />
        <KpiCard
          label="Top Opportunities"
          value={data.topOpportunities}
          accent={data.topOpportunities > 0 ? "#166534" : undefined}
          href="/market/opportunities"
        />
        <KpiCard
          label="Produktentwürfe"
          value={data.productDrafts}
          accent={data.productDrafts > 0 ? "#854d0e" : undefined}
          href="/products"
        />
        <KpiCard
          label="Aktive Produkte"
          value={data.activeProducts}
          accent="#166534"
          href="/products"
        />
        <KpiCard
          label="Deckungsbeitrag"
          value={fmt(data.estimatedGrossProfit)}
          sub="geschätzt"
          accent="#2563eb"
        />
        <KpiCard
          label="Preisänderungen"
          value={data.priceChanges}
          accent={data.priceChanges > 0 ? "#9a3412" : undefined}
          href="/market/dashboard"
        />
        <KpiCard
          label="Offline Listings"
          value={data.offlineListings}
          accent={data.offlineListings > 0 ? "#991b1b" : undefined}
          href="/market/dashboard"
        />
      </div>
    </div>
  );
}
