"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { TickerMessage, LiveTickerType } from "@wsp/contracts";

// ─── Typ-Farben ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<LiveTickerType, string> = {
  info: "bg-brand-text text-white",
  offer: "bg-brand-accent text-white",
  availability: "bg-blue-600 text-white",
  blog: "bg-gray-700 text-white",
  product: "bg-brand-text text-white",
  warning: "bg-orange-600 text-white",
};

const TYPE_LABEL_KEYS: Record<LiveTickerType, string> = {
  info: "labelInfo",
  offer: "labelOffer",
  availability: "labelAvailability",
  blog: "labelBlog",
  product: "labelProduct",
  warning: "labelWarning",
};

// ─── Statischer Fallback (Server gerendert, kein JS) ─────────────────────────

export function TickerFallback({ text }: { text: string }) {
  return (
    <div className="bg-brand-text text-white text-xs py-2 text-center px-4 min-h-[32px]">
      {text}
    </div>
  );
}

// ─── Rotierender Ticker (Client Component) ────────────────────────────────────

interface TickerBarClientProps {
  messages: TickerMessage[];
  fallbackText: string;
}

export function TickerBarClient({ messages, fallbackText }: TickerBarClientProps) {
  const t = useTranslations("ticker");
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 300);
    }, 6000);

    return () => clearInterval(interval);
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="bg-brand-text text-white text-xs py-2 text-center px-4 min-h-[32px]">
        {fallbackText}
      </div>
    );
  }

  const msg = messages[index];
  const colorClass = TYPE_COLORS[msg.type] ?? TYPE_COLORS.info;
  const labelKey = TYPE_LABEL_KEYS[msg.type] ?? "labelInfo";

  return (
    <div
      className={`${colorClass} text-xs py-2 px-4 min-h-[32px] transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
        <span className="font-semibold uppercase tracking-wide text-[10px] opacity-80">
          {t(labelKey as Parameters<typeof t>[0])}
        </span>
        <span className="hidden sm:inline opacity-60">·</span>
        <span>{msg.text}</span>
        {msg.link_href && (
          <a
            href={msg.link_href}
            className="underline underline-offset-2 hover:no-underline font-medium ml-1 whitespace-nowrap"
            target={msg.link_href.startsWith("http") ? "_blank" : undefined}
            rel={msg.link_href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {msg.link_label ?? t("more")}
            <span className="ml-0.5">→</span>
          </a>
        )}
        {messages.length > 1 && (
          <span className="hidden sm:flex items-center gap-1 ml-2" aria-hidden>
            {messages.map((_, i) => (
              <span
                key={i}
                className={`inline-block rounded-full transition-all duration-300 ${i === index ? "w-2 h-2 bg-white" : "w-1.5 h-1.5 bg-white/40"}`}
              />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
