"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Variant, PriceDisplay, ProductType } from "@wsp/types";

type Props = {
  variants: Variant[];
  productType: ProductType;
  productPriceDisplay: PriceDisplay;
};

function formatPrice(cents: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function VariantSelector({ variants, productType, productPriceDisplay }: Props) {
  const t = useTranslations("product");
  const locale = useLocale();
  const [selectedId, setSelectedId] = useState<string>(variants[0]?.id ?? "");

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0] ?? null;

  const displayPrice =
    selected !== null && selected.price_cents !== null
      ? formatPrice(selected.price_cents, selected.currency, locale)
      : productPriceDisplay.displayText;

  const priceHint = (() => {
    switch (productType) {
      case "direct_purchase":  return t("price_hint_direct");
      case "configurable":     return t("price_hint_configurable");
      case "inquiry_only":     return t("price_hint_inquiry");
    }
  })();

  return (
    <div>
      {/* Preiszeile */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <p className="text-3xl font-bold text-brand-text">{displayPrice}</p>
        <p className="text-xs text-brand-muted mt-1">{priceHint}</p>
      </div>

      {/* Variantenauswahl – nur bei mehr als einer Variante */}
      {variants.length > 1 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-brand-text mb-3">
            {t("variant_select_label")}
          </p>
          <div className="flex flex-col gap-2">
            {variants.map((v) => {
              const active = v.id === selectedId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  aria-pressed={active}
                  className={[
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-left w-full transition-colors duration-150",
                    active
                      ? "border-brand-accent bg-brand-accent/5"
                      : "border-gray-200 hover:border-brand-accent",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <span
                      className={`text-sm font-medium ${
                        active ? "text-brand-accent" : "text-brand-text"
                      }`}
                    >
                      {v.name}
                    </span>
                    {v.sku && (
                      <span className="ml-2 text-xs text-brand-muted">{v.sku}</span>
                    )}
                  </div>
                  {v.price_cents !== null && (
                    <span
                      className={`text-sm font-semibold shrink-0 ml-3 ${
                        active ? "text-brand-accent" : "text-brand-text"
                      }`}
                    >
                      {formatPrice(v.price_cents, v.currency, locale)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Art.-Nr. der gewählten Variante */}
      {selected?.sku && (
        <p className="text-xs text-brand-muted mb-6">
          {t("sku_prefix")} {selected.sku}
        </p>
      )}

      {/* CTA */}
      <div className="mb-8">
        <VariantCta productType={productType} selected={selected} />
      </div>
    </div>
  );
}

// ─── CTA-Buttons je nach Produkttyp ──────────────────────────────────────────

const btnCls =
  "w-full text-center font-semibold py-3 px-6 rounded-lg text-gray-900 text-sm shadow-sm transition-colors duration-150";

const primaryStyle = {
  background: "linear-gradient(to bottom, #FFE082, #FFD014)",
  border: "1px solid #F0A500",
} as const;

const secondaryStyle = {
  background: "linear-gradient(to bottom, #FFB74D, #FFA000)",
  border: "1px solid #E65100",
} as const;

function VariantCta({
  productType,
  selected,
}: {
  productType: ProductType;
  selected: Variant | null;
}) {
  const t = useTranslations("product");

  const variantHint = selected?.name ? (
    <p className="text-xs text-brand-muted text-center mt-1.5">
      {t("variant_chosen_label")}{" "}
      <span className="font-medium text-brand-text">{selected.name}</span>
    </p>
  ) : null;

  switch (productType) {
    case "direct_purchase":
      return (
        <div className="flex flex-col gap-2.5">
          {/* Warenkorb-Platzhalter – Cart noch nicht implementiert */}
          <div
            aria-disabled="true"
            className="flex items-center justify-between gap-3 w-full bg-gray-100 text-brand-muted font-semibold py-3 px-6 rounded-lg cursor-not-allowed select-none opacity-70"
          >
            <span className="flex-1 text-center text-sm">{t("add_to_cart")}</span>
            <span className="text-xs bg-white/60 text-brand-muted font-medium px-2 py-0.5 rounded-full border border-gray-200">
              {t("coming_soon")}
            </span>
          </div>
          <Link href="/kontakt" className={btnCls} style={secondaryStyle}>
            {t("callback")}
          </Link>
          {variantHint}
        </div>
      );

    case "configurable":
      return (
        <div className="flex flex-col gap-2.5">
          <Link href="/kontakt" className={btnCls} style={primaryStyle}>
            {t("configure")}
          </Link>
          <Link href="/kontakt" className={btnCls} style={secondaryStyle}>
            {t("callback")}
          </Link>
          {variantHint}
        </div>
      );

    case "inquiry_only":
      return (
        <div className="flex flex-col gap-2.5">
          <Link href="/kontakt" className={btnCls} style={primaryStyle}>
            {t("offer")}
          </Link>
          <Link href="/kontakt" className={btnCls} style={secondaryStyle}>
            {t("callback")}
          </Link>
          {variantHint}
        </div>
      );
  }
}
