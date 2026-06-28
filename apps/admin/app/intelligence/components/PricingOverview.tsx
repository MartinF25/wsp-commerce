import type { IntelligenceOverview } from "@/lib/api";

function fmt(cents: number) {
  if (cents === 0) return "–";
  return `${Math.round(cents / 100).toLocaleString("de-DE")} €`;
}

export function PricingOverview({ data }: { data: IntelligenceOverview["pricing"] }) {
  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <span className="intel-card-icon">💰</span>
        <span className="intel-card-title">Pricing Intelligence</span>
      </div>
      <div className="kpi-grid" style={{ marginBottom: 0 }}>
        <div className="kpi-card" style={{ flex: 1 }}>
          <div className="kpi-label">Ø Marge</div>
          <div className="kpi-value" style={{ color: data.avgMarginPercent >= 30 ? "#166534" : "#92400e" }}>
            {data.avgMarginPercent > 0 ? `${data.avgMarginPercent}%` : "–"}
          </div>
          <div className="kpi-sub">auf kalkulierte VK</div>
        </div>
        <div className="kpi-card" style={{ flex: 1 }}>
          <div className="kpi-label">Hohe Marge</div>
          <div className="kpi-value" style={{ color: data.highMarginListings > 0 ? "#166534" : "#64748b" }}>
            {data.highMarginListings}
          </div>
          <div className="kpi-sub">DB ≥ 50 EUR</div>
        </div>
        <div className="kpi-card" style={{ flex: 1 }}>
          <div className="kpi-label">Deckungsbeitrag</div>
          <div className="kpi-value" style={{ color: "#2563eb", fontSize: 18 }}>
            {fmt(data.estimatedGrossProfit)}
          </div>
          <div className="kpi-sub">geschätzt gesamt</div>
        </div>
        <div className="kpi-card" style={{ flex: 1 }}>
          <div className="kpi-label">Preisänderungen</div>
          <div className="kpi-value" style={{ color: data.priceChanges > 0 ? "#9a3412" : "#64748b" }}>
            {data.priceChanges}
          </div>
          <div className="kpi-sub">Listings betroffen</div>
        </div>
      </div>
    </div>
  );
}
