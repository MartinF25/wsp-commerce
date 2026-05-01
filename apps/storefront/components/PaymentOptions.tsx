"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Props = {
  paypalUrl: string | null;
  stripeUrl: string | null;
};

function PayPalLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.217a.78.78 0 0 1 .771-.645h6.923c2.356 0 4.03.535 4.972 1.59.905 1.016 1.18 2.47.82 4.33-.013.073-.028.146-.044.22-.63 3.23-2.772 4.87-6.37 4.87h-1.61a.78.78 0 0 0-.77.658l-.61 3.869-.174 1.1-.012.088-.738.04z" opacity=".7"/>
      <path d="M20.31 8.41c-.7 3.57-3.1 5.37-7.17 5.37h-1.82l-1.1 6.97H7.08l.74-4.69.61-3.87a.78.78 0 0 1 .77-.658h1.61c3.6 0 5.74-1.64 6.37-4.87.016-.074.03-.147.044-.22.54.38.93.87 1.08 1.97z"/>
    </svg>
  );
}

function StripeLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
    </svg>
  );
}

function BankIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L2 8h20L12 3zM6 10v8M10 10v8M14 10v8M18 10v8M2 18h20M2 21h20" />
    </svg>
  );
}

export function PaymentOptions({ paypalUrl, stripeUrl }: Props) {
  const t = useTranslations("product");
  const [showBank, setShowBank] = useState(false);

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-1">
        {t("payment_options")}
      </p>

      {paypalUrl ? (
        <a
          href={paypalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full bg-[#003087] text-white font-semibold py-3 px-5 rounded-lg shadow-sm hover:bg-[#002069] transition-colors duration-150"
        >
          <PayPalLogo />
          <span className="flex-1 text-center text-sm">{t("paypal_pay")}</span>
        </a>
      ) : (
        <div className="flex items-center gap-3 w-full bg-gray-100 text-brand-muted font-semibold py-3 px-5 rounded-lg cursor-not-allowed opacity-60">
          <PayPalLogo />
          <span className="flex-1 text-center text-sm">{t("paypal_not_configured")}</span>
        </div>
      )}

      {stripeUrl ? (
        <a
          href={stripeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full bg-[#635bff] text-white font-semibold py-3 px-5 rounded-lg shadow-sm hover:bg-[#4f46e5] transition-colors duration-150"
        >
          <StripeLogo />
          <span className="flex-1 text-center text-sm">{t("stripe_pay")}</span>
        </a>
      ) : (
        <div className="flex items-center gap-3 w-full bg-gray-100 text-brand-muted font-semibold py-3 px-5 rounded-lg cursor-not-allowed opacity-60">
          <StripeLogo />
          <span className="flex-1 text-center text-sm">{t("stripe_not_configured")}</span>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowBank((v) => !v)}
          className="flex items-center gap-3 w-full border border-gray-300 text-gray-800 font-semibold py-3 px-5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-150 bg-white"
        >
          <BankIcon />
          <span className="flex-1 text-center text-sm">{t("bank_transfer")}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={`w-4 h-4 transition-transform duration-200 ${showBank ? "rotate-180" : ""}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showBank && (
          <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">{t("bank_request")}</p>
            <p className="text-sm text-blue-700 leading-relaxed mb-4">{t("bank_info_detail")}</p>
            <Link
              href="/kontakt"
              className="inline-block bg-brand-accent text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-150"
            >
              {t("bank_cta")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
