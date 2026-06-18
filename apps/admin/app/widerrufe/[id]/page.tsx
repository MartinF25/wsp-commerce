import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import type { CancellationStatus } from "@/lib/api";
import { WiderrufActions } from "./WiderrufActions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<CancellationStatus, string> = {
  widerruf_beantragt:    "Beantragt",
  widerruf_in_pruefung:  "In Prüfung",
  widerruf_akzeptiert:   "Akzeptiert",
  widerruf_abgelehnt:    "Abgelehnt",
};

const STATUS_BADGE: Record<CancellationStatus, string> = {
  widerruf_beantragt:    "badge-draft",
  widerruf_in_pruefung:  "badge-type",
  widerruf_akzeptiert:   "badge-active",
  widerruf_abgelehnt:    "badge-inactive",
};

const LOG_LABELS: Record<string, string> = {
  request_created:      "Anfrage eingegangen",
  status_changed:       "Status geändert",
  notes_updated:        "Notizen aktualisiert",
  customer_email_sent:  "Kunden-E-Mail gesendet",
  admin_email_sent:     "Admin-E-Mail gesendet",
  customer_email_resent:"Kunden-E-Mail erneut gesendet",
  rejection_email_sent: "Ablehnungs-E-Mail gesendet",
};

export default async function WiderrufDetailPage({ params }: { params: { id: string } }) {
  let request: Awaited<ReturnType<typeof api.cancellations.get>> | null = null;

  try {
    request = await api.cancellations.get(params.id);
  } catch {
    notFound();
  }

  if (!request) notFound();

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("de-DE", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : "—";

  return (
    <>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Link href="/widerrufe" style={{ fontSize: 12, color: "#64748b" }}>← Alle Anfragen</Link>
          </div>
          <h1 style={{ fontSize: 18 }}>Widerruf: {request.order_reference}</h1>
          <p className="page-subtitle">ID: {request.id}</p>
        </div>
        <span className={`badge ${STATUS_BADGE[request.status]}`} style={{ fontSize: 13, padding: "4px 12px" }}>
          {STATUS_LABELS[request.status]}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

        {/* Linke Spalte: Anfrage-Details + Logs */}
        <div>

          {/* Kundendaten */}
          <div className="form-card" style={{ marginBottom: 20 }}>
            <div className="section-title">Kundendaten</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                <tr>
                  <td style={{ padding: "6px 0", color: "#6b7280", width: 160 }}>Name</td>
                  <td style={{ padding: "6px 0" }}>{request.customer_first_name} {request.customer_last_name}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#6b7280" }}>E-Mail</td>
                  <td style={{ padding: "6px 0" }}>
                    <a href={`mailto:${request.customer_email}`} style={{ color: "#2563eb" }}>
                      {request.customer_email}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#6b7280" }}>Bestellnummer</td>
                  <td style={{ padding: "6px 0", fontFamily: "monospace" }}>{request.order_reference}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#6b7280" }}>Sprache</td>
                  <td style={{ padding: "6px 0" }}>{request.locale.toUpperCase()}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#6b7280" }}>Eingegangen</td>
                  <td style={{ padding: "6px 0" }}>{fmtDate(request.created_at)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#6b7280" }}>Kunden-E-Mail</td>
                  <td style={{ padding: "6px 0", color: request.customer_email_sent_at ? "#166534" : "#9ca3af" }}>
                    {request.customer_email_sent_at ? `Gesendet: ${fmtDate(request.customer_email_sent_at)}` : "Nicht gesendet"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Nachricht */}
          {request.message && (
            <div className="form-card" style={{ marginBottom: 20 }}>
              <div className="section-title">Nachricht des Kunden</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", background: "#f9fafb", padding: 12, borderRadius: 6, margin: 0 }}>
                {request.message}
              </p>
            </div>
          )}

          {/* Log-Historie */}
          <div className="form-card">
            <div className="section-title">Verlauf</div>
            {(!request.logs || request.logs.length === 0) ? (
              <p className="empty">Keine Einträge.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {request.logs.map((log, i) => (
                  <div key={log.id} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: i < (request.logs?.length ?? 0) - 1 ? "1px solid #f1f5f9" : "none", marginBottom: i < (request.logs?.length ?? 0) - 1 ? 12 : 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {LOG_LABELS[log.event] ?? log.event}
                      </div>
                      {log.details && (
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{log.details}</div>
                      )}
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                        {fmtDate(log.created_at)}{log.performed_by ? ` · ${log.performed_by}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rechte Spalte: Aktionen */}
        <WiderrufActions request={request} />
      </div>
    </>
  );
}
