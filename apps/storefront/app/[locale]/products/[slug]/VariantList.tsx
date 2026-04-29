import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Variant, PriceDisplay, ProductType } from "@wsp/types";

type Props = {
  variants: Variant[];
  productType: ProductType;
  productPriceDisplay: PriceDisplay;
  locale: string;
};

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export async function VariantList({ variants, productType, productPriceDisplay, locale }: Props) {
  const t = await getTranslations({ locale, namespace: "product" });

  const primary = variants[0] ?? null;

  const displayPrice =
    primary !== null && primary.price_cents !== null
      ? formatPrice(primary.price_cents, primary.currency)
      : productPriceDisplay.displayText;

  const priceHint = (() => {
    switch (productType) {
      case "direct_purchase": return t("price_hint_direct");
      case "configurable":    return t("price_hint_configurable");
      case "inquiry_only":    return t("price_hint_inquiry");
    }
  })();

  return (
    <div>
      <div className="mb-4 pb-4 border-b border-gray-100">
        <p className="text-3xl font-bold text-brand-text">{displayPrice}</p>
        <p className="text-xs text-brand-muted mt-1">{priceHint}</p>
      </div>

      {primary?.sku && (
        <p className="text-xs text-brand-muted mb-4">
          {t("sku_prefix")} {primary.sku}
        </p>
      )}

      {variants.length > 1 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-brand-text mb-3">
            {t("variants_overview")}
          </p>
          <div className="flex flex-col gap-2">
            {variants.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium text-brand-text">{v.name}</span>
                  {v.sku && (
                    <span className="ml-2 text-xs text-brand-muted">{v.sku}</span>
                  )}
                </div>
                {v.price_cents !== null && (
                  <span className="text-sm font-semibold shrink-0 ml-3 text-brand-text">
                    {formatPrice(v.price_cents, v.currency)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <CtaButtons productType={productType} t={t} />
      </div>
    </div>
  );
}

const primaryStyle = {
  background: "linear-gradient(to bottom, #FFE082, #FFD014)",
  border: "1px solid #F0A500",
} as const;

const secondaryStyle = {
  background: "linear-gradient(to bottom, #FFB74D, #FFA000)",
  border: "1px solid #E65100",
} as const;

const btnCls =
  "w-full text-center font-semibold py-3 px-6 rounded-lg text-gray-900 text-sm shadow-sm transition-colors duration-150";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CtaButtons({ productType, t }: { productType: ProductType; t: any }) {
  switch (productType) {
    case "direct_purchase":
      return (
        <div className="flex flex-col gap-2.5">
          <Link href="/kontakt" className={btnCls} style={primaryStyle}>
            {t("request_advice")}
          </Link>
          <Link href="/kontakt" className={btnCls} style={secondaryStyle}>
            {t("callback")}
          </Link>
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
        </div>
      );
  }
}
