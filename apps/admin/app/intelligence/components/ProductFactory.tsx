import type { IntelligenceOverview } from "@/lib/api";
import { QuickActions } from "./QuickActions";

const STEPS = [
  { key: "rawListings", label: "Importiert", href: "/market" },
  { key: "enriched", label: "Angereichert", href: "/market?filter=enriched" },
  { key: "analyzed", label: "Bewertet", href: "/market" },
  { key: "opportunities", label: "Opportunities", href: "/market/opportunities" },
  { key: "drafts", label: "Entwürfe", href: "/products" },
  { key: "readyForReview", label: "Review", href: "/market/opportunities" },
  { key: "online", label: "Online", href: "/products" },
] as const;

function stepColor(index: number, total: number, value: number) {
  if (value === 0) return { bg: "#f8fafc", text: "#94a3b8", border: "#e2e8f0" };
  if (index === total - 1) return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
  if (index >= total - 2) return { bg: "#fef9c3", text: "#854d0e", border: "#fde68a" };
  return { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" };
}

function pipelineLabel(
  rawListings: number,
  enriched: number,
  analyzed: number,
  opportunities: number,
  drafts: number,
  online: number
): string {
  if (online > 0) return `${online} Produkte aktiv`;
  if (drafts > 0) return "Entwürfe bereit zur Freigabe";
  if (opportunities > 0) return "Opportunities bereit zur Prüfung";
  if (analyzed > 0) return "Analysiert – Daily Report ausstehend";
  if (enriched > 0) return "Angereichert – Daily Report starten";
  if (rawListings > 0) return "Listings importiert – Anreicherung ausstehend";
  return "Keine Listings vorhanden";
}

export function ProductFactory({ data }: { data: IntelligenceOverview["factory"] }) {
  const steps = STEPS.map((s) => ({ ...s, value: data[s.key] }));
  const statusLabel = pipelineLabel(
    data.rawListings,
    data.enriched,
    data.analyzed,
    data.opportunities,
    data.drafts,
    data.online
  );

  return (
    <div className="intel-card">
      <div className="intel-card-header">
        <span className="intel-card-icon">🏭</span>
        <span className="intel-card-title">Product Factory</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>{statusLabel}</span>
      </div>

      <div style={{ display: "flex", gap: 0, alignItems: "stretch", overflowX: "auto" }}>
        {steps.map((step, i) => {
          const colors = stepColor(i, steps.length, step.value);
          const isLast = i === steps.length - 1;
          return (
            <div key={step.key} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 80 }}>
              <a
                href={step.href}
                style={{
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  padding: "10px 6px",
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 800, color: colors.text, lineHeight: 1 }}>
                  {step.value}
                </div>
                <div
                  style={{
                    fontSize: 10,
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
                <div style={{ color: "#cbd5e1", fontSize: 14, padding: "0 3px", flexShrink: 0 }}>
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>

      <QuickActions
        rawListings={data.rawListings}
        enriched={data.enriched}
        analyzed={data.analyzed}
        opportunities={data.opportunities}
        drafts={data.drafts}
      />
    </div>
  );
}
