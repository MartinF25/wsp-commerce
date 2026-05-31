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
  const debugPingSent = useRef(false);

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

    window.gtag("event", "page_view", {
      send_to: gaId,
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
      debug_mode: debugMode,
    });

    if (debugMode && !debugPingSent.current) {
      debugPingSent.current = true;
      window.gtag("event", "debug_ping", {
        send_to: gaId,
        debug_mode: true,
        page_path: pagePath,
      });
    }
  }, [gaId, pathname, searchParams]);

  return null;
}
