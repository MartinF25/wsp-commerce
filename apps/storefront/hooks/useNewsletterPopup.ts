"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

const LS_DISMISSED_KEY = "newsletter_dismissed_at";
const LS_SUBSCRIBED_KEY = "newsletter_status";
const DISMISS_COOLDOWN_DAYS = 30;
const TRIGGER_DELAY_MS = 12_000;
const TRIGGER_SCROLL_PCT = 45;
const EXCLUDED_SEGMENTS = ["/kontakt"];

export function useNewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(LS_DISMISSED_KEY, new Date().toISOString());
    } catch {}
    setIsOpen(false);
  }, []);

  const markSubscribed = useCallback(() => {
    try {
      localStorage.setItem(LS_SUBSCRIBED_KEY, "subscribed");
    } catch {}
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (EXCLUDED_SEGMENTS.some((seg) => pathname?.includes(seg))) return;

    try {
      if (localStorage.getItem(LS_SUBSCRIBED_KEY) === "subscribed") return;

      const dismissedAt = localStorage.getItem(LS_DISMISSED_KEY);
      if (dismissedAt) {
        const elapsedDays =
          (Date.now() - new Date(dismissedAt).getTime()) /
          (1000 * 60 * 60 * 24);
        if (elapsedDays < DISMISS_COOLDOWN_DAYS) return;
      }
    } catch {
      return;
    }

    let triggered = false;
    const trigger = () => {
      if (!triggered) {
        triggered = true;
        setIsOpen(true);
      }
    };

    const timer = setTimeout(trigger, TRIGGER_DELAY_MS);

    const handleScroll = () => {
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0 && (window.scrollY / total) * 100 >= TRIGGER_SCROLL_PCT) {
        trigger();
        window.removeEventListener("scroll", handleScroll);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  return { isOpen, dismiss, markSubscribed };
}
