import type { IntelligenceRecommendation } from "@/lib/api";

const LEVEL_COLORS = {
  high: { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", dot: "#ef4444", label: "Dringend" },
  medium: { bg: "#fef3c7", border: "#fde68a", text: "#92400e", dot: "#f59e0b", label: "Heute" },
  low: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", dot: "#22c55e", label: "Offen" },
};

export function Recommendations({ items }: { items: IntelligenceRecommendation[] }) {
  if (items.length === 0) {
    return (
      <div className="intel-card">
        <div className="intel-card-header">
          <span className="intel-card-icon">🤖</span>
          <span className="intel-card-title">Empfehlungen</span>
        </div>
        <div
          style={{
            padding: "20px",
            border: "1px dashed #e2e8f0",
            borderRadius: 8,
            textAlign: "center",
            fontSize: 13,
            color: "#94a3b8",
          }}
        >
          Keine offenen Empfehlungen – alles in Ordnung.
        </div>
      </div>
    );
  }

  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <span className="intel-card-icon">🤖</span>
        <span className="intel-card-title">Empfehlungen</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: 999,
            padding: "2px 8px",
            fontWeight: 700,
          }}
        >
          {items.length} offen
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => {
          const c = LEVEL_COLORS[item.level];
          return (
            <div
              key={i}
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: c.dot,
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
                  {item.message}
                </div>
                <a
                  href={item.href}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#2563eb",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {item.actionLabel} →
                </a>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: c.text,
                  background: "rgba(255,255,255,0.6)",
                  borderRadius: 999,
                  padding: "2px 6px",
                  flexShrink: 0,
                }}
              >
                {c.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
