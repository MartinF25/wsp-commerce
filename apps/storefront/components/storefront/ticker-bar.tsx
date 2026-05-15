"use client";

import type { TickerMessage, LiveTickerType } from "@wsp/contracts";

const BG: Record<LiveTickerType, string> = {
  info: "bg-brand-text",
  offer: "bg-brand-accent",
  availability: "bg-blue-600",
  blog: "bg-gray-700",
  product: "bg-brand-text",
  warning: "bg-orange-600",
};

const LABEL: Record<LiveTickerType, string> = {
  info: "INFO",
  offer: "ANGEBOT",
  availability: "VERFÜGBAR",
  blog: "RATGEBER",
  product: "PRODUKT",
  warning: "ACHTUNG",
};

interface TickerBarClientProps {
  messages: TickerMessage[];
  fallbackText: string;
}

export function TickerBarClient({ messages, fallbackText }: TickerBarClientProps) {
  const bg = messages.length > 0 ? (BG[messages[0].type] ?? BG.info) : BG.info;
  const label = messages.length > 0 ? (LABEL[messages[0].type] ?? "INFO") : null;

  const items: Array<{ text: string; href: string | null }> =
    messages.length > 0
      ? messages.map((m) => ({ text: m.text, href: m.link_href }))
      : [{ text: fallbackText, href: null }];

  // Duration: roughly 80px/s scroll speed
  const totalChars = items.reduce((sum, i) => sum + i.text.length, 0);
  const estimatedPx = totalChars * 7 + items.length * 96;
  const duration = Math.max(18, estimatedPx / 80);

  const track = (
    <>
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center">
          {item.href ? (
            <a
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="hover:underline"
            >
              {item.text}
            </a>
          ) : (
            <span>{item.text}</span>
          )}
          <span className="mx-10 opacity-30 text-sm" aria-hidden>✦</span>
        </span>
      ))}
    </>
  );

  return (
    <>
      <style>{`
        @keyframes wsp-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .wsp-ticker-track {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          animation: wsp-ticker ${duration}s linear infinite;
          will-change: transform;
        }
      `}</style>

      <div
        className={`${bg} text-white text-xs min-h-[32px] flex items-stretch overflow-hidden`}
        role="marquee"
        aria-label="Live Ticker"
      >
        {/* Festes Label links */}
        {label && (
          <div className="flex-shrink-0 flex items-center px-3 font-bold tracking-widest text-[10px] bg-white/15 border-r border-white/20 z-10">
            {label}
          </div>
        )}

        {/* Scrollender Bereich */}
        <div className="flex-1 overflow-hidden flex items-center py-1.5">
          <div className="wsp-ticker-track">
            {track}
            {/* Dupliziert für nahtlosen Loop */}
            {track}
          </div>
        </div>
      </div>
    </>
  );
}
