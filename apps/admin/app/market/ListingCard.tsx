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

function priceClass(cents: number | null, avg: number | null): string {
  if (!cents || !avg) return "bg-gray-100 text-gray-600";
  const ratio = cents / avg;
  if (ratio < 0.8) return "bg-green-100 text-green-700";
  if (ratio > 1.2) return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-600";
}

export function ListingCard({ listing, avgPriceCents }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [productType, setProductType] = useState("inquiry_only");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
        {/* Thumbnail */}
        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
          {listing.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
              {listing.title}
            </h3>
            <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-lg ${priceClass(listing.price_cents, avgPriceCents)}`}>
              {formatPrice(listing.price_cents, listing.price_negotiable)}
            </span>
          </div>

          {listing.description && (
            <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
              {listing.description}
            </p>
          )}

          <div className="mt-auto">
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
              {listing.location && (
                <span className="truncate">
                  {listing.location}{listing.plz ? ` · ${listing.plz}` : ""}
                </span>
              )}
              <span className="ml-auto shrink-0">{formatDate(listing.listed_at)}</span>
            </div>

            <div className="flex gap-2">
              {listing.listing_url && (
                <a
                  href={listing.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Anzeige →
                </a>
              )}
              <button
                onClick={() => setModalOpen(true)}
                className="flex-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
              >
                + Produkt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Als Produkt anlegen</h2>
            <p className="text-sm text-gray-500 mb-1 line-clamp-1">{listing.title}</p>
            {listing.price_cents !== null && (
              <p className="text-xs text-gray-400 mb-5">
                {formatPrice(listing.price_cents, listing.price_negotiable)} · Texte in DE/EN/ES vorausgefüllt
              </p>
            )}

            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Produkttyp
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 mb-6"
            >
              <option value="inquiry_only">Nur Anfrage</option>
              <option value="direct_purchase">Direktkauf</option>
              <option value="configurable">Konfigurierbar</option>
            </select>

            {error && (
              <p className="text-xs text-red-600 mb-4 rounded-lg bg-red-50 p-3">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setModalOpen(false); setError(null); }}
                disabled={isPending}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
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
