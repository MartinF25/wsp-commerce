const MODULES = [
  { label: "Market Scout", status: "done" },
  { label: "Knowledge Extraction", status: "done" },
  { label: "Deal Score", status: "done" },
  { label: "Opportunity Manager", status: "done" },
  { label: "Product Builder", status: "active" },
  { label: "SEO Manager", status: "active" },
  { label: "Lifecycle Manager", status: "next" },
  { label: "Learning Intelligence", status: "later" },
  { label: "Growth Engine", status: "later" },
  { label: "Affiliate Engine", status: "rfc" },
] as const;

type Status = (typeof MODULES)[number]["status"];

const STATUS_CONFIG: Record<
  Status,
  { icon: string; color: string; label: string }
> = {
  done: { icon: "✓", color: "#166534", label: "Fertig" },
  active: { icon: "◐", color: "#1d4ed8", label: "Aktiv" },
  next: { icon: "→", color: "#92400e", label: "Nächste" },
  later: { icon: "○", color: "#94a3b8", label: "Geplant" },
  rfc: { icon: "?", color: "#7c3aed", label: "RFC" },
};

export function FrameworkRoadmap() {
  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <span className="intel-card-icon">🗺️</span>
        <span className="intel-card-title">Framework Roadmap</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {MODULES.map((m) => {
          const cfg = STATUS_CONFIG[m.status];
          return (
            <div
              key={m.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 10px",
                borderRadius: 6,
                background: m.status === "active" ? "#eff6ff" : "transparent",
                border: m.status === "active" ? "1px solid #bfdbfe" : "1px solid transparent",
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background:
                    m.status === "done"
                      ? "#dcfce7"
                      : m.status === "active"
                      ? "#dbeafe"
                      : "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  color: cfg.color,
                  flexShrink: 0,
                }}
              >
                {cfg.icon}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: m.status === "active" ? 700 : 400,
                  color: m.status === "done" ? "#111" : m.status === "active" ? "#1d4ed8" : "#94a3b8",
                  flex: 1,
                }}
              >
                {m.label}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: cfg.color,
                  background:
                    m.status === "done"
                      ? "#dcfce7"
                      : m.status === "active"
                      ? "#dbeafe"
                      : m.status === "rfc"
                      ? "#ede9fe"
                      : "#f1f5f9",
                  borderRadius: 999,
                  padding: "1px 7px",
                }}
              >
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
