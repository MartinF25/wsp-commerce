import { api } from "@/lib/api";
import type { MarketListing, MarketListingStats } from "@/lib/api";

export const dynamic = "force-dynamic";

function formatPrice(cents: number | null, negotiable: boolean): string {
  if (cents === null) return negotiable ? "VB" : "–";
  const euros = (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `${euros} €${negotiable ? " VB" : ""}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default async function MarketPage() {
  let listings: MarketListing[] = [];
  let stats: MarketListingStats | null = null;
  let error: string | null = null;

  try {
    const result = await api.marketListings.list({ keyword: "skywind", limit: 200 });
    listings = result.data;
    stats = result.stats;
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Marktbeobachtung – SkyWind</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kleinanzeigen-Angebote · täglich via n8n importiert
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          Fehler beim Laden: {error}
        </div>
      )}

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <KpiCard
            label="Angebote gesamt"
            value={String(stats.total)}
          />
          <KpiCard
            label="Ø Preis"
            value={stats.avg_price_cents != null ? `${Math.round(stats.avg_price_cents / 100).toLocaleString("de-DE")} €` : "–"}
            sub="Mittelwert"
          />
          <KpiCard
            label="Günstigstes"
            value={stats.min_price_cents != null ? `${Math.round(stats.min_price_cents / 100).toLocaleString("de-DE")} €` : "–"}
          />
          <KpiCard
            label="Teuerstes"
            value={stats.max_price_cents != null ? `${Math.round(stats.max_price_cents / 100).toLocaleString("de-DE")} €` : "–"}
          />
          <KpiCard
            label="Neu heute"
            value={String(stats.new_today)}
          />
          <KpiCard
            label="Mit Preis"
            value={String(stats.with_price)}
            sub={`von ${stats.total}`}
          />
        </div>
      )}

      {/* Listings Tabelle */}
      {listings.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-2">Noch keine Listings importiert.</p>
          <p className="text-xs text-gray-400">
            n8n Workflow ausführen und{" "}
            <code className="bg-gray-100 px-1 rounded">POST /api/admin/market-listings/bulk</code>{" "}
            aufrufen.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-16">Bild</th>
                <th className="px-4 py-3 text-left">Titel</th>
                <th className="px-4 py-3 text-left">Preis</th>
                <th className="px-4 py-3 text-left">Ort</th>
                <th className="px-4 py-3 text-left">PLZ</th>
                <th className="px-4 py-3 text-left">Datum</th>
                <th className="px-4 py-3 text-left">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    {listing.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.image_url}
                        alt={listing.title}
                        className="h-10 w-10 object-cover rounded-lg border border-gray-100"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                        –
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-medium text-gray-900 truncate">{listing.title}</div>
                    {listing.description && (
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 truncate max-w-[280px]">
                        {listing.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        listing.price_cents !== null ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {formatPrice(listing.price_cents, listing.price_negotiable)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {listing.location ?? "–"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 tabular-nums">
                    {listing.plz ?? "–"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(listing.listed_at)}
                  </td>
                  <td className="px-4 py-3">
                    {listing.listing_url ? (
                      <a
                        href={listing.listing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        Anzeige →
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {listings.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400 bg-gray-50/30">
              {listings.length} Einträge · Quelle: Kleinanzeigen
            </div>
          )}
        </div>
      )}
    </div>
  );
}
