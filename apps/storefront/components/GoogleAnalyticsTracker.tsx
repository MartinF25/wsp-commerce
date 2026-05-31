"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Props = {
  gaId: string;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalyticsTracker({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;

    const search = searchParams.toString();
    const pagePath = search ? `${pathname}?${search}` : pathname;

    if (lastTrackedUrl.current === pagePath) return;
    lastTrackedUrl.current = pagePath;

    window.gtag("config", gaId, {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [gaId, pathname, searchParams]);

  return null;
}
