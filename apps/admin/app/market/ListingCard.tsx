"use client";

import { useState, useTransition } from "react";
import type { MarketListing } from "@/lib/api";
import { createProductFromListing } from "./actions";

interface Props {
  listing: MarketListing;
  avgPriceCents: number | null;
}

function formatPrice(cents: number | null, negotiable: boolean): string {
  if (cents === null) return negotiable ? "VB" : "–";
  const euros = (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `${euros} €${negotiable ? " VB" : ""}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function priceBadge(cents: number | null, avg: number | null) {
  if (!cents) return { cls: "text-gray-400", label: "–" };
  const label = formatPrice(cents, false);
  if (!avg) return { cls: "text-gray-700 font-semibold", label };
  const ratio = cents / avg;
  if (ratio < 0.8) return { cls: "text-green-700 font-semibold", label };
  if (ratio > 1.2) return { cls: "text-orange-600 font-semibold", label };
  return { cls: "text-gray-700 font-semibold", label };
}

export function ListingCard({ listing, avgPriceCents }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [productType, setProductType] = useState("inquiry_only");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const badge = priceBadge(listing.price_cents, avgPriceCents);
  const negotiableLabel = listing.price_negotiable && listing.price_cents
    ? " VB" : listing.price_negotiable ? "VB" : "";

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      try {
        await createProductFromListing(listing, productType);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/80 transition-colors group">
        {/* Thumbnail */}
        <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
          {listing.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Title + Meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate leading-snug">
            {listing.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
            {listing.location && (
              <span className="truncate max-w-[180px]">
                {listing.location}{listing.plz ? ` · ${listing.plz}` : ""}
              </span>
            )}
            <span className="shrink-0">{formatDate(listing.listed_at)}</span>
          </p>
        </div>

        {/* Price */}
        <div className="shrink-0 text-right min-w-[80px]">
          <span className={`text-sm ${badge.cls}`}>
            {badge.label}{negotiableLabel}
          </span>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {listing.listing_url && (
            <a
              href={listing.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-white transition-colors whitespace-nowrap"
            >
              Anzeige →
            </a>
          )}
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            + Produkt
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setModalOpen(false); setError(null); } }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-5">
              {listing.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listing.image_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100" />
              )}
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{listing.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{badge.label}{negotiableLabel} · DE/EN/ES vorausgefüllt</p>
              </div>
            </div>

            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Produkttyp
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 mb-5"
            >
              <option value="inquiry_only">Nur Anfrage</option>
              <option value="direct_purchase">Direktkauf</option>
              <option value="configurable">Konfigurierbar</option>
            </select>

            {error && (
              <p className="text-xs text-red-600 mb-4 rounded-xl bg-red-50 p-3 border border-red-100">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setModalOpen(false); setError(null); }}
                disabled={isPending}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-40"
              >
                {isPending ? "Wird angelegt…" : "Anlegen & Bearbeiten"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
