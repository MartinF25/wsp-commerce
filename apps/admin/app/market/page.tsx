import { api } from "@/lib/api";
import type { MarketListing, MarketListingStats } from "@/lib/api";
import { ListingCard } from "./ListingCard";

export const dynamic = "force-dynamic";

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
          <KpiCard label="Angebote gesamt" value={String(stats.total)} />
          <KpiCard
            label="Ø Preis"
            value={stats.avg_price_cents != null
              ? `${Math.round(stats.avg_price_cents / 100).toLocaleString("de-DE")} €`
              : "–"}
            sub="Mittelwert"
          />
          <KpiCard
            label="Günstigstes"
            value={stats.min_price_cents != null
              ? `${Math.round(stats.min_price_cents / 100).toLocaleString("de-DE")} €`
              : "–"}
          />
          <KpiCard
            label="Teuerstes"
            value={stats.max_price_cents != null
              ? `${Math.round(stats.max_price_cents / 100).toLocaleString("de-DE")} €`
              : "–"}
          />
          <KpiCard label="Neu heute" value={String(stats.new_today)} />
          <KpiCard label="Mit Preis" value={String(stats.with_price)} sub={`von ${stats.total}`} />
        </div>
      )}

      {/* Legende */}
      {stats?.avg_price_cents && (
        <div className="flex items-center gap-4 mb-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-green-200" />
            unter Ø-Preis (&lt;80%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-200" />
            über Ø-Preis (&gt;120%)
          </span>
        </div>
      )}

      {/* Card Grid */}
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                avgPriceCents={stats?.avg_price_cents ?? null}
              />
            ))}
          </div>
          {listings.length > 0 && (
            <p className="mt-6 text-xs text-gray-400 text-center">
              {listings.length} Einträge · Quelle: Kleinanzeigen
            </p>
          )}
        </>
      )}
    </div>
  );
}
