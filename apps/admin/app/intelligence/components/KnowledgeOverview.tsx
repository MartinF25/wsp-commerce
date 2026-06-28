import type { IntelligenceOverview } from "@/lib/api";

export function KnowledgeOverview({ data }: { data: IntelligenceOverview["knowledge"] }) {
  const total = data.knownBrands + data.unknownBrands;
  const knownPct = total > 0 ? Math.round((data.knownBrands / total) * 100) : 0;

  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <span className="intel-card-icon">🧠</span>
        <span className="intel-card-title">Knowledge Intelligence</span>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="kpi-card" style={{ flex: 1 }}>
          <div className="kpi-label">Data Completeness</div>
          <div className="kpi-value" style={{ color: data.avgDataCompletenessScore >= 70 ? "#166534" : data.avgDataCompletenessScore >= 50 ? "#92400e" : "#991b1b" }}>
            {data.avgDataCompletenessScore}%
          </div>
          <div className="kpi-sub">Durchschnitt</div>
        </div>
        <div className="kpi-card" style={{ flex: 1 }}>
          <div className="kpi-label">Confidence</div>
          <div className="kpi-value" style={{ color: data.avgEnrichmentConfidence >= 70 ? "#166534" : "#92400e" }}>
            {data.avgEnrichmentConfidence}%
          </div>
          <div className="kpi-sub">Ø Enrichment</div>
        </div>
        <div className="kpi-card" style={{ flex: 1 }}>
          <div className="kpi-label">Marken erkannt</div>
          <div className="kpi-value" style={{ color: "#166534" }}>{data.knownBrands}</div>
          <div className="kpi-sub">{knownPct}% der Listings</div>
        </div>
        <div className="kpi-card" style={{ flex: 1 }}>
          <div className="kpi-label">Marke unbekannt</div>
          <div className="kpi-value" style={{ color: data.unknownBrands > 10 ? "#991b1b" : "#64748b" }}>
            {data.unknownBrands}
          </div>
          <div className="kpi-sub">Listings ohne Marke</div>
        </div>
      </div>

      {data.topBrands.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Top Marken
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.topBrands.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", minWidth: 120 }}>
                  {b.brand ?? "–"}
                </span>
                <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, (b.count / (data.topBrands[0]?.count ?? 1)) * 100)}%`,
                      background: "#3b82f6",
                      borderRadius: 999,
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: "#64748b", minWidth: 28, textAlign: "right" }}>
                  {b.count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
