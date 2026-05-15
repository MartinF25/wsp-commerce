"use client";

import { useState, useCallback } from "react";
import type { Bundle, BundleItem } from "@wsp/types";
import { BundleItemRow } from "./BundleItemRow";
import { formatCartCurrency } from "@/lib/cart";
import { useCart } from "@/contexts/CartContext";

interface BundleCardProps {
  bundle: Bundle;
  locale?: string;
}

interface SelectedState {
  [itemId: string]: {
    selected: boolean;
    variantId: string | null;
  };
}

export function BundleCard({ bundle, locale = "de" }: BundleCardProps) {
  const { addToCart } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  // Initialzustand: alle Pflichtprodukte ausgewählt, erste Variante vorausgewählt
  const [selected, setSelected] = useState<SelectedState>(() => {
    const state: SelectedState = {};
    for (const item of bundle.items) {
      const firstVariant = item.product.variants?.[0];
      state[item.id] = {
        selected: item.is_required,
        variantId: firstVariant?.id ?? null,
      };
    }
    return state;
  });

  const handleToggle = useCallback((itemId: string, value: boolean) => {
    setSelected((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], selected: value },
    }));
    setError(null);
    setAdded(false);
  }, []);

  const handleVariantChange = useCallback((itemId: string, variantId: string) => {
    setSelected((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], variantId },
    }));
    setError(null);
  }, []);

  const selectedItems = bundle.items.filter((item) => selected[item.id]?.selected);

  // Validierung: Pflichtprodukte müssen ausgewählt sein, Variante muss gewählt sein
  function validate(): string | null {
    for (const item of selectedItems) {
      const state = selected[item.id];
      const variants = item.product.variants ?? [];
      if (variants.length > 1 && !state.variantId) {
        return `Bitte wählen Sie eine Variante für „${item.product.name}".`;
      }
      if (item.is_required && item.product.availabilityStatus === "out_of_stock") {
        return `„${item.product.name}" ist leider nicht verfügbar.`;
      }
    }
    const requiredItems = bundle.items.filter((i) => i.is_required);
    const missingRequired = requiredItems.filter((i) => !selected[i.id]?.selected);
    if (missingRequired.length > 0) {
      return `Pflichtprodukt(e) fehlen: ${missingRequired.map((i) => i.product.name).join(", ")}`;
    }
    if (selectedItems.length === 0) {
      return "Bitte wählen Sie mindestens ein Produkt aus.";
    }
    return null;
  }

  const handleAddToCart = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    for (const item of selectedItems) {
      const state = selected[item.id];
      const variants = item.product.variants ?? [];
      const variant = variants.find((v) => v.id === state.variantId) ?? variants[0];
      if (!variant || variant.price_cents === null) continue;

      const effectivePriceCents = computeEffectivePrice(
        variant.price_cents,
        bundle.priceInfo?.hasDiscount ? item.discount_percent : null,
        bundle.priceInfo?.hasDiscount ? item.discount_cents : null,
        bundle
      );

      for (let q = 0; q < item.quantity; q++) {
        addToCart({
          productId: item.product.id,
          variantId: variant.id,
          productSlug: item.product.slug,
          productName: item.product.name,
          variantName: variant.name || variant.sku,
          imageUrl: item.product.coverImageUrl,
          quantity: 1,
          unitPriceCents: variant.price_cents,
          effectivePriceCents,
          currency: variant.currency,
          bundleId: bundle.id,
          bundleTitle: bundle.title,
        });
      }
    }

    setAdded(true);
    setError(null);
    setTimeout(() => setAdded(false), 3000);
  };

  // Preis-Berechnung für ausgewählte Items
  const originalCents = selectedItems.reduce((sum, item) => {
    const state = selected[item.id];
    const variant = (item.product.variants ?? []).find((v) => v.id === state.variantId) ?? (item.product.variants ?? [])[0];
    return sum + (variant?.price_cents ?? 0) * item.quantity;
  }, 0);

  const discountedCents = selectedItems.reduce((sum, item) => {
    const state = selected[item.id];
    const variant = (item.product.variants ?? []).find((v) => v.id === state.variantId) ?? (item.product.variants ?? [])[0];
    const base = (variant?.price_cents ?? 0) * item.quantity;
    const effective = computeEffectivePrice(variant?.price_cents ?? 0, item.discount_percent, item.discount_cents, bundle);
    return sum + effective * item.quantity;
  }, 0);

  const savingsCents = Math.max(0, originalCents - discountedCents);
  const currency = bundle.items[0]?.product.variants?.[0]?.currency ?? "EUR";
  const formatLocale = locale === "de" ? "de-DE" : locale;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Bundle-Header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-start gap-3">
        {bundle.image_url && (
          <img
            src={bundle.image_url}
            alt={bundle.title}
            className="w-10 h-10 rounded-lg object-contain flex-shrink-0 bg-gray-50"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-brand-dark text-base">{bundle.title}</h3>
          {bundle.description && (
            <p className="text-sm text-brand-muted mt-0.5 line-clamp-2">{bundle.description}</p>
          )}
        </div>

        {/* Ersparnis-Badge */}
        {bundle.priceInfo?.hasDiscount && bundle.priceInfo.savingsPercent > 0 && (
          <div className="flex-shrink-0 bg-brand-green/10 border border-brand-green/20 rounded-xl px-3 py-1.5 text-center">
            <p className="text-xs text-brand-green font-medium">Spare</p>
            <p className="text-lg font-bold text-brand-green leading-none">
              {bundle.priceInfo.savingsPercent}%
            </p>
          </div>
        )}
      </div>

      {/* Bundle-Items */}
      <div className="px-4 py-4 space-y-2">
        {bundle.items.map((item) => (
          <BundleItemRow
            key={item.id}
            item={item}
            isSelected={selected[item.id]?.selected ?? false}
            selectedVariantId={selected[item.id]?.variantId ?? null}
            onToggle={(val) => handleToggle(item.id, val)}
            onVariantChange={(vid) => handleVariantChange(item.id, vid)}
            currency={currency}
            locale={locale}
          />
        ))}
      </div>

      {/* Preis & CTA */}
      <div className="px-5 py-4 border-t border-gray-50 space-y-3">
        {selectedItems.length > 0 && (
          <div className="flex items-end justify-between">
            <div>
              {savingsCents > 0 && (
                <p className="text-xs text-brand-muted">
                  Statt{" "}
                  <span className="line-through">
                    {formatCartCurrency(originalCents, currency, formatLocale)}
                  </span>
                </p>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-brand-dark">
                  {formatCartCurrency(discountedCents, currency, formatLocale)}
                </span>
                {savingsCents > 0 && (
                  <span className="text-sm text-brand-green font-medium">
                    (Sie sparen {formatCartCurrency(savingsCents, currency, formatLocale)})
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-muted mt-0.5">zzgl. MwSt. und Versand</p>
            </div>

            {bundle.priceInfo?.isTimeLimitedDiscount && bundle.priceInfo.discountEndsAt && (
              <div className="text-right text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                <span>⏱ Zeitlich begrenzt</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
            {error}
          </p>
        )}

        <button
          onClick={handleAddToCart}
          disabled={selectedItems.length === 0 || added}
          aria-label={`Bundle „${bundle.title}" in den Warenkorb legen`}
          className={`w-full rounded-xl py-3 px-5 text-sm font-semibold transition-all ${
            added
              ? "bg-green-100 text-brand-green border border-brand-green/30"
              : selectedItems.length === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-brand-green text-white hover:bg-green-600 active:scale-[0.99]"
          }`}
        >
          {added ? (
            <span className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Bundle hinzugefügt!
            </span>
          ) : selectedItems.length === 0 ? (
            "Produkte auswählen"
          ) : (
            `Bundle in den Warenkorb (${selectedItems.length} Produkt${selectedItems.length > 1 ? "e" : ""})`
          )}
        </button>
      </div>
    </div>
  );
}

function computeEffectivePrice(
  basePriceCents: number,
  discountPercent: number | null,
  discountCents: number | null,
  bundle: Bundle
): number {
  // Per-Item-Rabatt hat Vorrang
  if (bundle.discount_type === "per_item") {
    if (discountPercent !== null && discountPercent > 0) {
      return Math.max(0, Math.round(basePriceCents * (1 - discountPercent / 100)));
    }
    if (discountCents !== null && discountCents > 0) {
      return Math.max(0, basePriceCents - discountCents);
    }
  }

  // Prozentualer Bundle-Rabatt
  if (bundle.discount_type === "percentage" && bundle.discount_percent !== null) {
    return Math.max(0, Math.round(basePriceCents * (1 - bundle.discount_percent / 100)));
  }

  // Fester Bundle-Rabatt (anteilig pro Item – vereinfachte Näherung)
  if (bundle.discount_type === "fixed" && bundle.discount_cents !== null && bundle.priceInfo) {
    const ratio = bundle.priceInfo.originalTotalCents > 0
      ? basePriceCents / bundle.priceInfo.originalTotalCents
      : 0;
    const itemDiscount = Math.round(bundle.discount_cents * ratio);
    return Math.max(0, basePriceCents - itemDiscount);
  }

  return basePriceCents;
}
