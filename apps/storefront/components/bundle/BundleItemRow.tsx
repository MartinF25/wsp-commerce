"use client";

import { useState } from "react";
import type { BundleItem, Variant } from "@wsp/types";
import { formatCartCurrency } from "@/lib/cart";

interface BundleItemRowProps {
  item: BundleItem;
  isSelected: boolean;
  selectedVariantId: string | null;
  onToggle: (selected: boolean) => void;
  onVariantChange: (variantId: string) => void;
  currency?: string;
  locale?: string;
}

export function BundleItemRow({
  item,
  isSelected,
  selectedVariantId,
  onToggle,
  onVariantChange,
  currency = "EUR",
  locale = "de",
}: BundleItemRowProps) {
  const { product } = item;
  const activeVariants = product.variants?.filter((v) => v.stock_quantity > 0 || v.stock_quantity === 0) ?? [];

  const coverImage = product.coverImageUrl;
  const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId) ?? activeVariants[0] ?? null;

  const basePriceCents = selectedVariant?.price_cents ?? null;
  const effectivePriceCents = computeEffectivePrice(basePriceCents, item.discount_percent, item.discount_cents);
  const hasDiscount = effectivePriceCents !== null && basePriceCents !== null && effectivePriceCents < basePriceCents;

  const hasVariants = activeVariants.length > 1;
  const isUnavailable = product.availabilityStatus === "out_of_stock" || product.availabilityStatus === "discontinued";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
        isUnavailable
          ? "border-gray-100 bg-gray-50 opacity-60"
          : isSelected
          ? "border-brand-green/30 bg-green-50/50"
          : "border-gray-100 bg-white hover:border-gray-200"
      }`}
    >
      {/* Checkbox / Pflichtmarkierung */}
      <div className="flex-shrink-0 pt-0.5">
        {item.is_required ? (
          <div
            aria-label="Pflichtprodukt"
            className="w-5 h-5 rounded-md bg-brand-green flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" className="w-3 h-3" aria-hidden="true">
              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <button
            role="checkbox"
            aria-checked={isSelected}
            aria-label={`${product.name} ${isSelected ? "abwählen" : "auswählen"}`}
            onClick={() => !isUnavailable && onToggle(!isSelected)}
            disabled={isUnavailable}
            className={`w-5 h-5 rounded-md border-2 transition-colors flex items-center justify-center ${
              isSelected
                ? "border-brand-green bg-brand-green"
                : "border-gray-300 bg-white hover:border-brand-green"
            } ${isUnavailable ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isSelected && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" className="w-3 h-3" aria-hidden="true">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Produktbild */}
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
        {coverImage ? (
          <img src={coverImage} alt={product.name} className="h-full w-full object-contain" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6 text-gray-300" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-dark line-clamp-2">{product.name}</p>

        {item.quantity > 1 && (
          <p className="text-xs text-brand-muted mt-0.5">Menge: {item.quantity}</p>
        )}

        {isUnavailable && (
          <span className="inline-block mt-1 text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
            Nicht verfügbar
          </span>
        )}

        {!isUnavailable && !item.is_required && !isSelected && (
          <span className="inline-block mt-1 text-xs text-brand-muted">Optional hinzufügen</span>
        )}

        {/* Varianten-Auswahl */}
        {hasVariants && !isUnavailable && (
          <div className="mt-2">
            <select
              value={selectedVariantId ?? activeVariants[0]?.id ?? ""}
              onChange={(e) => onVariantChange(e.target.value)}
              aria-label={`Variante für ${product.name} auswählen`}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
            >
              {activeVariants.map((v) => (
                <option key={v.id} value={v.id} disabled={v.stock_quantity === 0}>
                  {v.name || v.sku}
                  {v.price_cents ? ` – ${formatCartCurrency(v.price_cents, currency, locale === "de" ? "de-DE" : locale)}` : ""}
                  {v.stock_quantity === 0 ? " (vergriffen)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Preis */}
      {basePriceCents !== null && (
        <div className="flex-shrink-0 text-right">
          {hasDiscount && effectivePriceCents !== null && (
            <p className="text-xs text-brand-muted line-through">
              {formatCartCurrency(basePriceCents * item.quantity, currency, locale === "de" ? "de-DE" : locale)}
            </p>
          )}
          <p className={`text-sm font-semibold ${hasDiscount ? "text-brand-green" : "text-brand-dark"}`}>
            {formatCartCurrency((effectivePriceCents ?? basePriceCents) * item.quantity, currency, locale === "de" ? "de-DE" : locale)}
          </p>
          {hasDiscount && item.discount_percent !== null && (
            <span className="text-xs text-brand-green">
              −{item.discount_percent}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function computeEffectivePrice(
  basePriceCents: number | null,
  discountPercent: number | null,
  discountCents: number | null
): number | null {
  if (basePriceCents === null) return null;
  if (discountPercent !== null && discountPercent > 0) {
    return Math.max(0, Math.round(basePriceCents * (1 - discountPercent / 100)));
  }
  if (discountCents !== null && discountCents > 0) {
    return Math.max(0, basePriceCents - discountCents);
  }
  return basePriceCents;
}
