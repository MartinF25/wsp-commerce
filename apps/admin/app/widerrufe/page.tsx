import Link from "next/link";
import { api } from "@/lib/api";
import type { CancellationStatus } from "@/lib/api";

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

export default async function WiderrufListePage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; offset?: string };
}) {
  const q      = searchParams.q?.trim()   || undefined;
  const status = searchParams.status      || undefined;
  const offset = Number(searchParams.offset ?? 0);
  const limit  = 50;

  let result: Awaited<ReturnType<typeof api.cancellations.list>> | null = null;
  let error: string | null = null;

  try {
    result = await api.cancellations.list({ q, status, limit, offset });
  } catch (e) {
    error = (e as Error).message;
  }

  const requests = result?.data ?? [];
  const total    = result?.meta.total ?? 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Widerrufsanfragen</h1>
          <p className="page-subtitle">{total} Einträge insgesamt</p>
        </div>
        <Link href="/settings/widerruf" className="btn btn-secondary">Einstellungen</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Suche + Filter */}
      <form method="GET" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Bestellnr., E-Mail, Name …"
          style={{ flex: "1 1 220px", minWidth: 0, padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, background: "#fff" }}
        >
          <option value="">Alle Status</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-secondary">Suchen</button>
        {(q || status) && (
          <Link href="/widerrufe" className="btn btn-secondary">Zurücksetzen</Link>
        )}
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Bestellnummer</th>
              <th>Kunde</th>
              <th>E-Mail</th>
              <th>Status</th>
              <th>Eingegangen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={6} className="empty">Keine Widerrufsanfragen gefunden.</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: 12 }}>{r.order_reference}</span>
                  </td>
                  <td>{r.customer_first_name} {r.customer_last_name}</td>
                  <td style={{ fontSize: 12 }}>{r.customer_email}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>
                    {new Date(r.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                    })}
                  </td>
                  <td>
                    <Link href={`/widerrufe/${r.id}`} className="btn btn-secondary btn-sm">
                      Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginierung */}
      {total > limit && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center", fontSize: 13 }}>
          {offset > 0 && (
            <Link
              href={`/widerrufe?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), offset: String(Math.max(0, offset - limit)) })}`}
              className="btn btn-secondary btn-sm"
            >
              ← Zurück
            </Link>
          )}
          <span style={{ color: "#6b7280" }}>
            {offset + 1}–{Math.min(offset + limit, total)} von {total}
          </span>
          {offset + limit < total && (
            <Link
              href={`/widerrufe?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), offset: String(offset + limit) })}`}
              className="btn btn-secondary btn-sm"
            >
              Weiter →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
