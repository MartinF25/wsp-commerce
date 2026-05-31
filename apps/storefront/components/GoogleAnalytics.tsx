"use client";

import Script from "next/script";
import { GoogleAnalyticsTracker } from "@/components/GoogleAnalyticsTracker";

type Props = {
  gaId: string;
};

declare global {
  interface Window {
    __gaScriptLoaded?: boolean;
    __gaScriptFailed?: boolean;
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics({ gaId }: Props) {
  return (
    <>
      <Script
        id="ga-bootstrap"
        strategy="afterInteractive"
      >{`
        window.__gaScriptLoaded = false;
        window.__gaScriptFailed = false;
        window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `}</Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
        onLoad={() => {
          window.__gaScriptLoaded = true;
          window.__gaScriptFailed = false;
        }}
        onError={() => {
          window.__gaScriptLoaded = false;
          window.__gaScriptFailed = true;
        }}
      />
      <GoogleAnalyticsTracker gaId={gaId} />
    </>
  );
}
