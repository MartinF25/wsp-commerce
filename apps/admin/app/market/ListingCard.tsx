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

function priceColor(cents: number | null, avg: number | null): string {
  if (!cents || !avg) return "#374151";
  const ratio = cents / avg;
  if (ratio < 0.8) return "#166534";
  if (ratio > 1.2) return "#9a3412";
  return "#374151";
}

export function ListingCard({ listing, avgPriceCents }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [productType, setProductType] = useState("inquiry_only");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const priceDisplay = formatPrice(listing.price_cents, listing.price_negotiable);
  const color = priceColor(listing.price_cents, avgPriceCents);

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
      <tr>
        <td style={{ width: 56 }}>
          {listing.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.image_url}
              alt=""
              className="listing-img"
            />
          ) : (
            <div className="listing-img-placeholder">
              <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </td>
        <td>
          <div className="listing-title">{listing.title}</div>
          <div className="listing-meta">
            {listing.location && <span>{listing.location}{listing.plz ? ` · ${listing.plz}` : ""} · </span>}
            <span>{formatDate(listing.listed_at)}</span>
          </div>
        </td>
        <td style={{ textAlign: "right", width: 120, fontWeight: 600, color }}>
          {priceDisplay}
        </td>
        <td style={{ width: 160, textAlign: "right" }}>
          <div className="actions-row" style={{ justifyContent: "flex-end" }}>
            {listing.listing_url && (
              <a
                href={listing.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                Anzeige →
              </a>
            )}
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              + Produkt
            </button>
          </div>
        </td>
      </tr>

      {modalOpen && (
        <tr>
          <td colSpan={4} style={{ padding: 0, border: "none" }}>
            {/* Modal overlay rendered via portal-like approach using position:fixed */}
          </td>
        </tr>
      )}

      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) { setModalOpen(false); setError(null); } }}
        >
          <div className="modal-content">
            <div className="modal-img-row">
              {listing.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listing.image_url} alt="" className="modal-img" />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, lineHeight: 1.4 }}>{listing.title}</div>
                <div className="listing-meta">{priceDisplay} · DE/EN/ES vorausgefüllt</div>
              </div>
            </div>

            <label className="modal-label">Produkttyp</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="modal-select"
            >
              <option value="inquiry_only">Nur Anfrage</option>
              <option value="direct_purchase">Direktkauf</option>
              <option value="configurable">Konfigurierbar</option>
            </select>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>
            )}

            <div className="modal-actions">
              <button
                onClick={() => { setModalOpen(false); setError(null); }}
                disabled={isPending}
                className="btn btn-secondary modal-btn-flex"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="btn btn-primary modal-btn-flex"
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
