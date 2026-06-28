const SPRINT = {
  name: "Revenue Sprint 1",
  subtitle: "First Products Online",
  progress: 65,
  mission:
    "Die ersten echten Listings automatisch zu SEO-optimierten Produktentwürfen verarbeiten.",
  dod: [
    { label: "Market Scout liefert echte Listings", done: true },
    { label: "Knowledge Extraction läuft", done: true },
    { label: "Deal Score läuft", done: true },
    { label: "Opportunities entstehen", done: true },
    { label: "Produktentwürfe entstehen", done: true },
    { label: "Produkte können freigegeben werden", done: false },
  ],
};

export function SprintStatus() {
  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <span className="intel-card-icon">⚡</span>
        <span className="intel-card-title">Sprint Status</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 700,
            background: "#2563eb",
            color: "#fff",
            borderRadius: 999,
            padding: "2px 10px",
          }}
        >
          Aktiv
        </span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>
          {SPRINT.name}
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>{SPRINT.subtitle}</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#64748b",
            marginBottom: 4,
          }}
        >
          <span>Fortschritt</span>
          <span style={{ fontWeight: 700, color: "#2563eb" }}>
            {SPRINT.progress}%
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: "#e2e8f0",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${SPRINT.progress}%`,
              background: "#2563eb",
              borderRadius: 999,
            }}
          />
        </div>
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#475569",
          borderLeft: "3px solid #e2e8f0",
          paddingLeft: 10,
          marginBottom: 14,
          fontStyle: "italic",
        }}
      >
        {SPRINT.mission}
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        Definition of Done
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {SPRINT.dod.map((item) => (
          <div
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
                background: item.done ? "#dcfce7" : "#f1f5f9",
                color: item.done ? "#166534" : "#94a3b8",
                border: item.done ? "none" : "1px solid #e2e8f0",
              }}
            >
              {item.done ? "✓" : "○"}
            </span>
            <span style={{ color: item.done ? "#111" : "#64748b" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
