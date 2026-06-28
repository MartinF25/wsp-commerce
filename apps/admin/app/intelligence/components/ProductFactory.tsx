import type { IntelligenceOverview } from "@/lib/api";

const STEPS = [
  { key: "rawListings", label: "Raw Listings", href: "/market" },
  { key: "enriched", label: "Angereichert", href: "/market" },
  { key: "analyzed", label: "Bewertet", href: "/market" },
  { key: "opportunities", label: "Opportunities", href: "/market/opportunities" },
  { key: "drafts", label: "Entwürfe", href: "/products" },
  { key: "readyForReview", label: "Review", href: "/market/opportunities" },
  { key: "online", label: "Online", href: "/products" },
] as const;

function stepColor(index: number, total: number, value: number) {
  if (value === 0) return { bg: "#f1f5f9", text: "#94a3b8", border: "#e2e8f0" };
  if (index === total - 1) return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
  if (index >= total - 2) return { bg: "#fef9c3", text: "#854d0e", border: "#fde68a" };
  return { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" };
}

export function ProductFactory({ data }: { data: IntelligenceOverview["factory"] }) {
  const steps = STEPS.map((s) => ({ ...s, value: data[s.key] }));

  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <span className="intel-card-icon">🏭</span>
        <span className="intel-card-title">Product Factory</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>
          Pipeline: Listing → Produkt
        </span>
      </div>

      <div style={{ display: "flex", gap: 0, alignItems: "stretch", overflowX: "auto" }}>
        {steps.map((step, i) => {
          const colors = stepColor(i, steps.length, step.value);
          const isLast = i === steps.length - 1;
          return (
            <div key={step.key} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 90 }}>
              <a
                href={step.href}
                style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "12px 8px", background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, gap: 4 }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: colors.text,
                    lineHeight: 1,
                  }}
                >
                  {step.value}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: colors.text,
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {step.label}
                </div>
              </a>
              {!isLast && (
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: 16,
                    padding: "0 4px",
                    flexShrink: 0,
                  }}
                >
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
