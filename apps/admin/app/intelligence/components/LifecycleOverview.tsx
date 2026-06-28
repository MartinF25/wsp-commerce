import type { IntelligenceOverview } from "@/lib/api";

function fmtDate(iso: string | null) {
  if (!iso) return "–";
  const d = new Date(iso);
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LifecycleOverview({ data }: { data: IntelligenceOverview["lifecycle"] }) {
  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <span className="intel-card-icon">🔄</span>
        <span className="intel-card-title">Lifecycle</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>
          Letzter Check: {fmtDate(data.lastCheckAt)}
        </span>
      </div>
      <div className="kpi-grid" style={{ marginBottom: 0 }}>
        <div className="kpi-card" style={{ flex: 1 }}>
          <div className="kpi-label">Online</div>
          <div className="kpi-value" style={{ color: "#166534" }}>{data.online}</div>
          <div className="kpi-sub">Listings erreichbar</div>
        </div>
        <div className="kpi-card" style={{ flex: 1 }}>
          <div className="kpi-label">Offline</div>
          <div className="kpi-value" style={{ color: data.offline > 0 ? "#991b1b" : "#64748b" }}>
            {data.offline}
          </div>
          <div className="kpi-sub">nicht erreichbar</div>
        </div>
        <div className="kpi-card" style={{ flex: 1 }}>
          <div className="kpi-label">Unbekannt</div>
          <div className="kpi-value" style={{ color: "#64748b" }}>{data.unknown}</div>
          <div className="kpi-sub">nicht geprüft</div>
        </div>
        <div className="kpi-card" style={{ flex: 1 }}>
          <div className="kpi-label">Preis geändert</div>
          <div className="kpi-value" style={{ color: data.priceChanged > 0 ? "#9a3412" : "#64748b" }}>
            {data.priceChanged}
          </div>
          <div className="kpi-sub">seit letztem Check</div>
        </div>
      </div>
    </div>
  );
}
