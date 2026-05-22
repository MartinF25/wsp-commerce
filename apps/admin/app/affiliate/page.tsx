import { api } from "@/lib/api";
import type { AffiliateHealthStatus, AffiliateProductStats } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString("de-DE");
}

function fmtDate(d: string | null) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SourceBreakdown({ data }: { data: Record<string, number> }) {
  const LABELS: Record<string, string> = {
    product_detail: "Produktdetail",
    product_card: "Produktkarte",
    solution_page: "Lösungsseite",
    blog: "Blog",
    unknown: "Unbekannt",
  };
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <span className="empty">Noch keine Daten</span>;
  return (
    <table style={{ width: "auto", minWidth: 280 }}>
      <tbody>
        {entries.map(([key, count]) => (
          <tr key={key}>
            <td style={{ paddingRight: 24 }}>{LABELS[key] ?? key}</td>
            <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(count)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LocaleBreakdown({ data }: { data: Record<string, number> }) {
  const LABELS: Record<string, string> = { de: "Deutsch", en: "English", es: "Español", unknown: "Unbekannt" };
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <span className="empty">Noch keine Daten</span>;
  return (
    <table style={{ width: "auto", minWidth: 220 }}>
      <tbody>
        {entries.map(([key, count]) => (
          <tr key={key}>
            <td style={{ paddingRight: 24 }}>{LABELS[key] ?? key}</td>
            <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(count)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DeviceBreakdown({ data }: { data: Record<string, number> }) {
  const LABELS: Record<string, string> = { mobile: "Mobil", desktop: "Desktop", tablet: "Tablet", unknown: "Unbekannt" };
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <span className="empty">Noch keine Daten</span>;
  return (
    <table style={{ width: "auto", minWidth: 200 }}>
      <tbody>
        {entries.map(([key, count]) => (
          <tr key={key}>
            <td style={{ paddingRight: 24 }}>{LABELS[key] ?? key}</td>
            <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(count)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const HEALTH_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ok:          { label: "ok",          color: "#166534", bg: "#dcfce7" },
  blocked:     { label: "blocked",     color: "#92400e", bg: "#fef3c7" },
  timeout:     { label: "timeout",     color: "#9a3412", bg: "#ffedd5" },
  error:       { label: "error",       color: "#991b1b", bg: "#fee2e2" },
  missing:     { label: "fehlt",       color: "#991b1b", bg: "#fee2e2" },
  invalid_url: { label: "ungültige URL", color: "#991b1b", bg: "#fee2e2" },
};

function HealthBadge({ status, checkedAt }: { status: AffiliateHealthStatus | null; checkedAt: string | null }) {
  if (!status) {
    return <span style={{ fontSize: 11, color: "#94a3b8" }}>–</span>;
  }
  const cfg = HEALTH_CONFIG[status] ?? { label: status, color: "#374151", bg: "#f3f4f6" };
  return (
    <span
      title={checkedAt ? `Zuletzt geprüft: ${fmtDate(checkedAt)}` : "Noch nicht geprüft"}
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 9999,
        color: cfg.color,
        background: cfg.bg,
      }}
    >
      {cfg.label}
    </span>
  );
}

function ProductTable({ products }: { products: AffiliateProductStats[] }) {
  if (products.length === 0) {
    return <div className="empty">Keine Affiliate-Produkte gefunden.</div>;
  }
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Anbieter</th>
            <th>Status</th>
            <th>Health</th>
            <th style={{ textAlign: "right" }}>7 Tage</th>
            <th style={{ textAlign: "right" }}>30 Tage</th>
            <th style={{ textAlign: "right" }}>Gesamt</th>
            <th>Letzter Klick</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.productId}>
              <td>
                <div style={{ fontWeight: 500 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.slug}</div>
              </td>
              <td>
                <span className="badge badge-type">{p.affiliateProvider ?? "–"}</span>
              </td>
              <td>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </td>
              <td>
                <HealthBadge status={p.affiliateHealthStatus} checkedAt={p.affiliateLastCheckedAt} />
              </td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(p.clicksLast7Days)}</td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(p.clicksLast30Days)}</td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(p.totalClicks)}</td>
              <td style={{ fontSize: 12, color: "#94a3b8" }}>{fmtDate(p.lastClickedAt)}</td>
              <td>
                <div className="actions-row">
                  {p.affiliateUrl && (
                    <a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">Link ↗</a>
                  )}
                  <Link href={`/products/${p.productId}`} className="btn btn-secondary btn-sm">Bearbeiten</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AffiliateStatsPage() {
  let data: Awaited<ReturnType<typeof api.affiliate.getStats>> | null = null;
  let error: string | null = null;

  try {
    data = await api.affiliate.getStats();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Affiliate-Statistiken</h1>
          <div className="page-subtitle">Anonyme Klickzählung – kein Personenbezug</div>
        </div>
        {data && (
          <a
            href="/api/affiliate-stats-export"
            className="btn btn-secondary"
          >
            CSV Export
          </a>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <>
          {/* KPI-Kacheln */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Klicks gesamt</div>
              <div className="kpi-value">{fmt(data.summary.totalClicks)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Klicks 7 Tage</div>
              <div className="kpi-value">{fmt(data.summary.totalLast7Days)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Klicks 30 Tage</div>
              <div className="kpi-value">{fmt(data.summary.totalLast30Days)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Produkte</div>
              <div className="kpi-value">{data.products.length}</div>
            </div>
          </div>

          {/* Aufschlüsselung */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
              <div className="section-title" style={{ marginTop: 0 }}>Nach Quelle</div>
              <SourceBreakdown data={data.bySource} />
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
              <div className="section-title" style={{ marginTop: 0 }}>Nach Sprache</div>
              <LocaleBreakdown data={data.byLocale} />
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
              <div className="section-title" style={{ marginTop: 0 }}>Nach Gerät</div>
              <DeviceBreakdown data={data.byDevice} />
            </div>
          </div>

          {/* Produkt-Tabelle – absteigend nach Gesamt-Klicks */}
          <div className="section-title">Alle Affiliate-Produkte</div>
          <ProductTable products={[...data.products].sort((a, b) => b.totalClicks - a.totalClicks)} />
        </>
      )}

      {!data && !error && (
        <div className="empty">Keine Daten verfügbar.</div>
      )}
    </>
  );
}
