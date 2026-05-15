"use client";

import { useTranslations } from "next-intl";
import type { ProductType, AvailabilityStatus } from "@wsp/contracts";

interface ProductTickerProps {
  productType: ProductType;
  availabilityStatus: AvailabilityStatus;
  isOnSale?: boolean;
  saleEndsAt?: string | null;
  locale?: string;
}

/**
 * Kontextueller Produkt-Hinweis – abgeleitet aus Produktdaten, kein DB-Fetch.
 * Widerspruchsfrei zur CTA, Preis- und Verfügbarkeitsanzeige.
 * Kein Ticker für discontinued-Produkte.
 */
export function ProductTicker({
  productType,
  availabilityStatus,
  isOnSale,
  saleEndsAt,
}: ProductTickerProps) {
  const t = useTranslations("ticker");

  if (availabilityStatus === "discontinued") return null;

  let text: string | null = null;
  let colorClass = "bg-gray-50 border-gray-200 text-gray-700";
  let dotClass = "bg-gray-400";

  if (availabilityStatus === "out_of_stock") {
    text = t("productMessages.outOfStock");
    colorClass = "bg-orange-50 border-orange-200 text-orange-800";
    dotClass = "bg-orange-400";
  } else if (availabilityStatus === "preorder") {
    text = t("productMessages.preorder");
    colorClass = "bg-blue-50 border-blue-200 text-blue-800";
    dotClass = "bg-blue-400";
  } else if (availabilityStatus === "on_request" || productType === "inquiry_only") {
    text = t("productMessages.inquiryOnly");
    colorClass = "bg-gray-50 border-gray-200 text-gray-700";
    dotClass = "bg-gray-400";
  } else if (productType === "configurable") {
    text = t("productMessages.configurableNote");
    colorClass = "bg-gray-50 border-gray-200 text-gray-700";
    dotClass = "bg-gray-400";
  } else if (productType === "affiliate_external") {
    text = t("productMessages.affiliateExternal");
    colorClass = "bg-gray-50 border-gray-200 text-gray-700";
    dotClass = "bg-gray-400";
  } else if (isOnSale && saleEndsAt) {
    const date = new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(saleEndsAt));
    text = t("productMessages.offerActive", { date });
    colorClass = "bg-green-50 border-green-200 text-green-800";
    dotClass = "bg-green-500";
  }

  if (!text) return null;

  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${colorClass}`}>
      <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${dotClass}`} aria-hidden />
      <span>{text}</span>
    </div>
  );
}
