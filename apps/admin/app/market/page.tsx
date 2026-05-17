import { api } from "@/lib/api";
import type { MarketListing, MarketListingStats } from "@/lib/api";
import { ListingCard } from "./ListingCard";

export const dynamic = "force-dynamic";

function fmt(cents: number | null) {
  if (cents === null) return "–";
  return `${Math.round(cents / 100).toLocaleString("de-DE")} €`;
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>}
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
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Marktbeobachtung</h1>
        <p className="text-sm text-gray-400 mt-1">SkyWind · Kleinanzeigen · täglich via n8n</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <KpiCard label="Gesamt" value={String(stats.total)} />
          <KpiCard label="Ø Preis" value={fmt(stats.avg_price_cents)} sub="Mittelwert" />
          <KpiCard label="Minimum" value={fmt(stats.min_price_cents)} />
          <KpiCard label="Maximum" value={fmt(stats.max_price_cents)} />
          <KpiCard label="Neu heute" value={String(stats.new_today)} />
          <KpiCard label="Mit Preis" value={String(stats.with_price)} sub={`von ${stats.total}`} />
        </div>
      )}

      {/* Listings */}
      {listings.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400">Noch keine Listings importiert.</p>
          <p className="text-xs text-gray-300 mt-1">
            n8n Workflow ausführen → <code className="bg-gray-100 px-1 rounded">POST /api/admin/market-listings/bulk</code>
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          {/* Legende + Anzahl */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              {listings.length} Angebote · Quelle: Kleinanzeigen
            </p>
            {stats?.avg_price_cents && (
              <div className="flex items-center gap-4 text-[11px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  Günstig (&lt;80% Ø)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  Teuer (&gt;120% Ø)
                </span>
              </div>
            )}
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                avgPriceCents={stats?.avg_price_cents ?? null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
