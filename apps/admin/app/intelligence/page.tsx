import { api } from "@/lib/api";
import { BusinessOverview } from "./components/BusinessOverview";
import { ProductFactory } from "./components/ProductFactory";
import { Recommendations } from "./components/Recommendations";
import { KnowledgeOverview } from "./components/KnowledgeOverview";
import { PricingOverview } from "./components/PricingOverview";
import { LifecycleOverview } from "./components/LifecycleOverview";
import { SprintStatus } from "./components/SprintStatus";
import { FrameworkRoadmap } from "./components/FrameworkRoadmap";
import type { IntelligenceOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="alert alert-error" style={{ marginBottom: 24 }}>
      Daten konnten nicht geladen werden: {message}
    </div>
  );
}

export default async function IntelligencePage() {
  let data: IntelligenceOverview | null = null;
  let error: string | null = null;

  try {
    data = await api.intelligence.getOverview();
  } catch (e) {
    error = (e as Error).message;
  }

  const now = new Date().toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: INTEL_CSS }} />

      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>
            Revenue Engine
          </h1>
          <div className="page-subtitle">
            Täglicher Überblick über Listings, Opportunities, Produktentwürfe und Umsatzpotenzial.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{now}</span>
          <a href="/market/dashboard" className="btn btn-secondary btn-sm">
            Markt →
          </a>
          <a href="/market/opportunities" className="btn btn-primary btn-sm">
            Opportunities →
          </a>
        </div>
      </div>

      {error && <ErrorCard message={error} />}

      {data && (
        <>
          {/* Row 1: Business Summary (full width) */}
          <BusinessOverview data={data.business} />

          {/* Row 2: Product Factory (full width) */}
          <ProductFactory data={data.factory} />

          {/* Row 3: Recommendations (full width) */}
          <Recommendations items={data.recommendations} />

          {/* Row 4: Knowledge + Pricing */}
          <div className="intel-grid-2">
            <KnowledgeOverview data={data.knowledge} />
            <PricingOverview data={data.pricing} />
          </div>

          {/* Row 5: Lifecycle + Sprint + Roadmap */}
          <div className="intel-grid-3">
            <LifecycleOverview data={data.lifecycle} />
            <SprintStatus />
            <FrameworkRoadmap />
          </div>
        </>
      )}
    </div>
  );
}

const INTEL_CSS = `
.intel-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px 20px;
  margin-bottom: 16px;
}
.intel-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.intel-card-icon {
  font-size: 16px;
  line-height: 1;
}
.intel-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.intel-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 0;
}
.intel-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-top: 0;
}
@media (max-width: 900px) {
  .intel-grid-2 { grid-template-columns: 1fr; }
  .intel-grid-3 { grid-template-columns: 1fr; }
}
`;
