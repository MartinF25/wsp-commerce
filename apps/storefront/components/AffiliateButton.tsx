"use client";

import { usePathname } from "next/navigation";

type Props = {
  productId: string;
  affiliateUrl: string;
  buttonLabel: string;
  disclosureText: string;
  locale: string;
};

/**
 * CTA-Button für Affiliate-Produkte.
 *
 * - Öffnet den Affiliate-Link in einem neuen Tab.
 * - Sendet ein anonymes Tracking-Event via sendBeacon (fire-and-forget).
 * - rel="sponsored nofollow noopener noreferrer" gemäß Amazon-ToS und SEO-Anforderungen.
 * - Blockiert niemals die Navigation: try/catch um sendBeacon.
 */
export function AffiliateButton({
  productId,
  affiliateUrl,
  buttonLabel,
  disclosureText,
  locale,
}: Props) {
  const pathname = usePathname();

  const handleClick = () => {
    try {
      const payload = JSON.stringify({
        productId,
        referrerPath: pathname,
        locale,
      });
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/affiliate/track", blob);
    } catch {
      // fail silently
    }
  };

  return (
    <div className="mb-6">
      <a
        href={affiliateUrl}
        rel="sponsored nofollow noopener noreferrer"
        target="_blank"
        onClick={handleClick}
        className="inline-flex items-center justify-center gap-2 w-full bg-[#FF9900] hover:bg-[#e88c00] text-white font-semibold text-base px-6 py-3.5 rounded-xl transition-colors duration-150"
      >
        {buttonLabel}
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
      <p className="text-xs text-brand-muted mt-2 leading-relaxed">
        {disclosureText}
      </p>
    </div>
  );
}
