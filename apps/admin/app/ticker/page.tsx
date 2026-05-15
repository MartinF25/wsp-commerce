import Link from "next/link";
import { api } from "@/lib/api";
import type { LiveTickerStatus, LiveTickerType, LiveTickerScope } from "@/lib/api";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<LiveTickerStatus, string> = {
  draft: "Entwurf",
  active: "Aktiv",
  archived: "Archiviert",
};

const STATUS_COLORS: Record<LiveTickerStatus, string> = {
  draft: "badge badge-draft",
  active: "badge badge-active",
  archived: "badge badge-archived",
};

const TYPE_LABELS: Record<LiveTickerType, string> = {
  info: "Hinweis",
  offer: "Angebot",
  availability: "Verfügbarkeit",
  blog: "Ratgeber",
  product: "Produkt",
  warning: "Achtung",
};

const SCOPE_LABELS: Record<LiveTickerScope, string> = {
  global: "Alle Seiten",
  product: "Produkt",
  category: "Kategorie",
  solution: "Lösungsseite",
};

export default async function TickerPage() {
  let messages: Awaited<ReturnType<typeof api.ticker.list>> = [];
  let error: string | null = null;

  try {
    messages = await api.ticker.list();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <>
      <div className="page-header">
        <h1>Live-Ticker</h1>
        <Link href="/ticker/new" className="btn btn-primary">+ Neue Nachricht</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Text (DE)</th>
              <th>Typ</th>
              <th>Scope</th>
              <th>Zeitraum</th>
              <th>Priorität</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#64748b" }}>
                  Keine Ticker-Nachrichten vorhanden.
                </td>
              </tr>
            )}
            {messages.map((msg) => {
              const deTrans = msg.translations.find((t) => t.locale === "de");
              const text = deTrans?.text ?? "—";
              const truncated = text.length > 60 ? text.slice(0, 60) + "…" : text;
              const from = msg.starts_at
                ? new Date(msg.starts_at).toLocaleDateString("de-DE")
                : "sofort";
              const until = msg.ends_at
                ? new Date(msg.ends_at).toLocaleDateString("de-DE")
                : "∞";

              return (
                <tr key={msg.id}>
                  <td title={text} style={{ maxWidth: 280 }}>{truncated}</td>
                  <td>{TYPE_LABELS[msg.type] ?? msg.type}</td>
                  <td>{SCOPE_LABELS[msg.scope] ?? msg.scope}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{from} – {until}</td>
                  <td style={{ textAlign: "center" }}>{msg.priority}</td>
                  <td>
                    <span className={STATUS_COLORS[msg.status]}>
                      {STATUS_LABELS[msg.status]}
                    </span>
                  </td>
                  <td>
                    <Link href={`/ticker/${msg.id}/edit`} className="btn btn-sm btn-secondary">
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
