"use client";

import { useEffect, useRef, useState } from "react";
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
  const [debugState, setDebugState] = useState("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;

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

    let cancelled = false;

    const sendEvents = () => {
      if (cancelled || typeof window.gtag !== "function") return false;
      if (lastTrackedUrl.current === pagePath) return true;

      lastTrackedUrl.current = pagePath;
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

      if (debugMode) {
        setDebugState(`sent:${pagePath}`);
      }

      return true;
    };

    if (debugMode) {
      setDebugState(typeof window.gtag === "function" ? "ready" : "waiting_for_gtag");
    }

    if (sendEvents()) {
      return;
    }

    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      if (sendEvents()) {
        window.clearInterval(interval);
        return;
      }

      if (attempts >= 40) {
        window.clearInterval(interval);
        if (debugMode) {
          setDebugState("gtag_not_available");
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [gaId, pathname, searchParams]);

  const showDebugOverlay =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.localStorage.getItem("ga_debug") === "1");

  if (!showDebugOverlay) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] rounded-lg border border-emerald-300 bg-white/95 px-3 py-2 text-xs text-emerald-900 shadow-lg">
      GA Debug: {debugState}
    </div>
  );
}
