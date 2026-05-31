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
    __gaScriptLoaded?: boolean;
    __gaScriptFailed?: boolean;
  }
}

export function GoogleAnalyticsTracker({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const debugParam = searchParams.get("ga_debug");
  const lastTrackedUrl = useRef<string | null>(null);
  const debugPingSent = useRef(false);
  const hasInitialized = useRef(false);
  const [debugState, setDebugState] = useState("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pagePath = search ? `${pathname}?${search}` : pathname;

    if (debugParam === "1") {
      window.localStorage.setItem("ga_debug", "1");
    } else if (debugParam === "0") {
      window.localStorage.removeItem("ga_debug");
    }

    const debugMode =
      window.location.hostname === "localhost" ||
      window.localStorage.getItem("ga_debug") === "1";

    const getStatus = () => {
      if (window.__gaScriptFailed) return "script_error";
      if (!window.__gaScriptLoaded) return "waiting_for_script";
      if (typeof window.gtag !== "function") return "waiting_for_gtag";
      return "ready";
    };

    if (debugMode) setDebugState(getStatus());

    let cancelled = false;

    const emitRouteTracking = () => {
      if (cancelled || !window.__gaScriptLoaded || typeof window.gtag !== "function") {
        return false;
      }

      if (!hasInitialized.current) {
        hasInitialized.current = true;
        lastTrackedUrl.current = pagePath;

        if (debugMode) {
          window.gtag("config", gaId, {
            page_path: pagePath,
            page_location: window.location.href,
            page_title: document.title,
            debug_mode: true,
          });
        }

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
      }

      if (lastTrackedUrl.current === pagePath) {
        if (debugMode) {
          setDebugState(`ready:${pagePath}`);
        }
        return true;
      }

      lastTrackedUrl.current = pagePath;
      window.gtag("event", "page_view", {
        send_to: gaId,
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
        debug_mode: debugMode,
      });

      if (debugMode) {
        setDebugState(`sent:${pagePath}`);
      }

      return true;
    };

    if (emitRouteTracking()) {
      return;
    }

    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      if (cancelled || !window.__gaScriptLoaded || typeof window.gtag !== "function") {
        if (attempts >= 40) {
          window.clearInterval(interval);
          if (debugMode) {
            setDebugState(getStatus());
          }
        }
        return;
      }

      if (emitRouteTracking()) {
        window.clearInterval(interval);
        return;
      }

      if (attempts >= 40) {
        window.clearInterval(interval);
        if (debugMode) {
          setDebugState(`ready:${pagePath}`);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [debugParam, gaId, pathname, search]);

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
