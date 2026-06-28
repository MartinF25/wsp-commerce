import type { IntelligenceOverview } from "@/lib/api";

function fmt(cents: number) {
  if (cents === 0) return "–";
  return `${Math.round(cents / 100).toLocaleString("de-DE")} €`;
}

type CardVariant = "neutral" | "blue" | "green" | "yellow" | "red";

const VARIANT_STYLES: Record<CardVariant, { border: string; bg: string; numColor: string; dot: string }> = {
  neutral: { border: "#e2e8f0", bg: "#fff",      numColor: "#111827", dot: "#94a3b8" },
  blue:    { border: "#93c5fd", bg: "#eff6ff",   numColor: "#1d4ed8", dot: "#3b82f6" },
  green:   { border: "#86efac", bg: "#f0fdf4",   numColor: "#166534", dot: "#22c55e" },
  yellow:  { border: "#fde68a", bg: "#fefce8",   numColor: "#854d0e", dot: "#f59e0b" },
  red:     { border: "#fca5a5", bg: "#fff1f2",   numColor: "#991b1b", dot: "#ef4444" },
};

function KpiCard({
  icon,
  label,
  value,
  sub,
  variant = "neutral",
  href,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  variant?: CardVariant;
  href?: string;
}) {
  const s = VARIANT_STYLES[variant];
  const card = (
    <div
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        transition: "box-shadow 0.15s",
        cursor: href ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            lineHeight: 1.2,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: s.numColor, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: -2 }}>{sub}</div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: "none" }}>
        {card}
      </a>
    );
  }
  return card;
}

export function BusinessOverview({ data }: { data: IntelligenceOverview["business"] }) {
  const opportunityVariant: CardVariant = data.topOpportunities > 0 ? "green" : "neutral";
  const draftVariant: CardVariant = data.productDrafts > 0 ? "yellow" : "neutral";
  const activeVariant: CardVariant = data.activeProducts > 0 ? "green" : "neutral";
  const priceVariant: CardVariant = data.priceChanges > 0 ? "yellow" : "neutral";
  const offlineVariant: CardVariant = data.offlineListings > 0 ? "red" : "neutral";

  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <span className="intel-card-icon">📊</span>
        <span className="intel-card-title">Revenue Summary</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
        }}
      >
        <KpiCard
          icon="📋"
          label="Listings gesamt"
          value={data.totalListings}
          sub="in der Datenbank"
          variant="neutral"
        />
        <KpiCard
          icon="🆕"
          label="Neu heute"
          value={data.newListingsToday}
          sub="heute importiert"
          variant={data.newListingsToday > 0 ? "blue" : "neutral"}
        />
        <KpiCard
          icon="⭐"
          label="Top Opportunities"
          value={data.topOpportunities}
          sub={data.topOpportunities > 0 ? "bereit zur Freigabe" : "noch keine"}
          variant={opportunityVariant}
          href="/market/opportunities"
        />
        <KpiCard
          icon="✅"
          label="Aktive Produkte"
          value={data.activeProducts}
          sub={data.activeProducts > 0 ? "live im Shop" : "noch keine"}
          variant={activeVariant}
          href="/products"
        />
        <KpiCard
          icon="📝"
          label="Produktentwürfe"
          value={data.productDrafts}
          sub={data.productDrafts > 0 ? "warten auf Freigabe" : "keine offen"}
          variant={draftVariant}
          href="/products"
        />
        <KpiCard
          icon="💰"
          label="Deckungsbeitrag"
          value={fmt(data.estimatedGrossProfit)}
          sub="geschätzt (angereicherte Listings)"
          variant={data.estimatedGrossProfit > 0 ? "blue" : "neutral"}
        />
        <KpiCard
          icon="📉"
          label="Preisänderungen"
          value={data.priceChanges}
          sub={data.priceChanges > 0 ? "Listings neu bewerten" : "keine"}
          variant={priceVariant}
          href="/market/dashboard"
        />
        <KpiCard
          icon="🔴"
          label="Offline Listings"
          value={data.offlineListings}
          sub={data.offlineListings > 0 ? "nicht mehr erreichbar" : "alle erreichbar"}
          variant={offlineVariant}
          href="/market/dashboard"
        />
      </div>
    </div>
  );
}
