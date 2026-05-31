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
    const debugParam = searchParams.get("ga_debug");

    if (debugParam === "1") {
      window.localStorage.setItem("ga_debug", "1");
    } else if (debugParam === "0") {
      window.localStorage.removeItem("ga_debug");
    }

    if (lastTrackedUrl.current === pagePath) return;
    lastTrackedUrl.current = pagePath;

    const debugMode =
      window.location.hostname === "localhost" ||
      window.localStorage.getItem("ga_debug") === "1";

    window.gtag("config", gaId, {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
      debug_mode: debugMode,
    });
  }, [gaId, pathname, searchParams]);

  return null;
}
