import { api } from "@/lib/api";
import type { AffiliateHealthStatus, AffiliateProductStats } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString("de-DE");
}

function fmtDate(d: string | null) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const HEALTH_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ok:          { label: "ok",            color: "#166534", bg: "#dcfce7" },
  blocked:     { label: "blocked",       color: "#92400e", bg: "#fef3c7" },
  timeout:     { label: "timeout",       color: "#9a3412", bg: "#ffedd5" },
  error:       { label: "error",         color: "#991b1b", bg: "#fee2e2" },
  missing:     { label: "URL fehlt",     color: "#991b1b", bg: "#fee2e2" },
  invalid_url: { label: "ungültige URL", color: "#991b1b", bg: "#fee2e2" },
};

function HealthBadge({
  status,
  message,
}: {
  status: AffiliateHealthStatus | null;
  message: string | null;
}) {
  if (!status) return <span style={{ color: "#94a3b8", fontSize: 12 }}>–</span>;
  const cfg = HEALTH_CONFIG[status] ?? { label: status, color: "#374151", bg: "#f3f4f6" };
  return (
    <span
      title={message ?? undefined}
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 9999,
        color: cfg.color,
        background: cfg.bg,
        cursor: message ? "help" : undefined,
      }}
    >
      {cfg.label}
    </span>
  );
}

function HealthSummary({ products }: { products: AffiliateProductStats[] }) {
  const counts: Record<string, number> = {};
  for (const p of products) {
    const k = p.affiliateHealthStatus ?? "unchecked";
    counts[k] = (counts[k] ?? 0) + 1;
  }
  const total = products.length;
  const unchecked = counts.unchecked ?? 0;
  const ok = counts.ok ?? 0;
  const blocked = counts.blocked ?? 0;
  const problems = total - ok - blocked - unchecked;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
      <div className="kpi-card">
        <div className="kpi-label">Produkte gesamt</div>
        <div className="kpi-value">{total}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Link ok / blocked</div>
        <div className="kpi-value" style={{ color: "#166534" }}>{ok + blocked}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Probleme</div>
        <div className="kpi-value" style={{ color: problems > 0 ? "#991b1b" : "#374151" }}>{problems}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Noch nicht geprüft</div>
        <div className="kpi-value" style={{ color: "#6b7280" }}>{unchecked}</div>
      </div>
    </div>
  );
}

function HealthTable({ products }: { products: AffiliateProductStats[] }) {
  const sorted = [...products].sort((a, b) => {
    const order: Record<string, number> = {
      error: 0, missing: 1, invalid_url: 2, timeout: 3, blocked: 4, ok: 5,
    };
    const oa = order[a.affiliateHealthStatus ?? ""] ?? 6;
    const ob = order[b.affiliateHealthStatus ?? ""] ?? 6;
    return oa - ob;
  });

  if (sorted.length === 0) {
    return <div className="empty">Keine Affiliate-Produkte gefunden.</div>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Status</th>
            <th>Health</th>
            <th>Meldung</th>
            <th>Zuletzt geprüft</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.productId}>
              <td>
                <div style={{ fontWeight: 500 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.slug}</div>
              </td>
              <td>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </td>
              <td>
                <HealthBadge status={p.affiliateHealthStatus} message={null} />
              </td>
              <td style={{ fontSize: 12, color: "#64748b", maxWidth: 260 }}>
                {p.affiliateHealthMessage ?? "–"}
              </td>
              <td style={{ fontSize: 12, color: "#94a3b8" }}>
                {fmtDate(p.affiliateLastCheckedAt)}
              </td>
              <td>
                <div className="actions-row">
                  {p.affiliateUrl && (
                    <a
                      href={p.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      Link ↗
                    </a>
                  )}
                  <Link href={`/products/${p.productId}`} className="btn btn-secondary btn-sm">
                    Bearbeiten
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ImportPage() {
  let products: AffiliateProductStats[] = [];
  let error: string | null = null;

  try {
    const overview = await api.affiliate.getStats();
    products = overview?.products ?? [];
  } catch (e) {
    error = (e as Error).message;
  }

  const lastChecked = products
    .map((p) => p.affiliateLastCheckedAt)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Affiliate-Import & Health</h1>
          <div className="page-subtitle">
            Import via CLI oder n8n · Health-Check via n8n Cron
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ── CLI-Anleitung ───────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div className="section-title" style={{ marginTop: 0 }}>CSV-Import (CLI)</div>
        <p style={{ color: "#475569", marginBottom: 12, fontSize: 14 }}>
          Importiere Affiliate-Produkte aus einer CSV-Datei. Vorlage:{" "}
          <code style={{ fontSize: 12 }}>apps/commerce/imports/affiliate-products.example.csv</code>
        </p>
        <div
          style={{
            background: "#0f172a",
            color: "#e2e8f0",
            borderRadius: 6,
            padding: "12px 16px",
            fontFamily: "monospace",
            fontSize: 13,
            lineHeight: 1.8,
          }}
        >
          <div style={{ color: "#94a3b8" }}># Dry-Run (nur Validierung, keine DB-Schreibvorgänge)</div>
          <div>pnpm --filter commerce import:affiliate --file ./imports/affiliate-products.csv --dry-run</div>
          <div style={{ marginTop: 8, color: "#94a3b8" }}># Commit (importiert nach erfolgreicher Validierung)</div>
          <div>pnpm --filter commerce import:affiliate --file ./imports/affiliate-products.csv --commit</div>
          <div style={{ marginTop: 8, color: "#94a3b8" }}># JSON-Output für n8n</div>
          <div>pnpm --filter commerce import:affiliate --file ./imports/affiliate-products.csv --dry-run --format json</div>
        </div>
      </div>

      {/* ── n8n-Hinweis ─────────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div className="section-title" style={{ marginTop: 0 }}>n8n Import-Workflow</div>
        <p style={{ color: "#475569", fontSize: 14, marginBottom: 8 }}>
          Der automatische Import läuft täglich um <strong>06:00 Uhr</strong> via n8n.
          Quelle ist das Google Sheet „Affiliate Produkte". Endpoint:
        </p>
        <code style={{ fontSize: 12, display: "block", background: "#f8fafc", padding: "8px 12px", borderRadius: 4 }}>
          POST /api/admin/import/affiliate-products {"{"} mode: dry_run | commit {"}"}
        </code>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>
          Docs:{" "}
          <code style={{ fontSize: 11 }}>docs/n8n-affiliate-import.md</code>{" "}
          ·{" "}
          <code style={{ fontSize: 11 }}>docs/n8n-affiliate-health-check.md</code>
        </p>
      </div>

      {/* ── Health-Check-Status ─────────────────────────────────────────────── */}
      <div className="section-title">
        Affiliate Health-Status
        {lastChecked && (
          <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8", marginLeft: 12 }}>
            Letzter Check: {fmtDate(lastChecked)}
          </span>
        )}
      </div>

      {!error && <HealthSummary products={products} />}
      {!error && <HealthTable products={products} />}

      {/* ── Legende ─────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 24, padding: 16, background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#475569" }}>
        <strong>Health-Status Bedeutung:</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", marginTop: 8 }}>
          {Object.entries(HEALTH_CONFIG).map(([key, cfg]) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ padding: "1px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg }}>
                {cfg.label}
              </span>
              <span>
                {key === "ok" && "Link erreichbar"}
                {key === "blocked" && "HTTP 403/405 – normal bei Amazon"}
                {key === "timeout" && "Link prüfen (>5s Timeout)"}
                {key === "error" && "HTTP-Fehler – Link prüfen"}
                {key === "missing" && "affiliate_url fehlt"}
                {key === "invalid_url" && "Kein HTTPS oder ungültig"}
              </span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
