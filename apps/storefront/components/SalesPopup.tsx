"use client";

/**
 * SalesPopup – Social-Proof-Benachrichtigung.
 *
 * Zeigt rotierende Kauf-/Anfragemeldungen in der unteren linken Ecke.
 * Erscheint nach 4 Sekunden, bleibt 5 Sekunden sichtbar, wechselt alle 8 Sekunden.
 * Kann vom Nutzer geschlossen werden.
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type SaleEvent = {
  name: string;
  location: string;
  product: string;
  action: "gekauft" | "angefragt" | "Projekt angefragt";
  detail?: string;
  minutesAgo: number;
  image: string;
  alt: string;
};

const EVENTS: SaleEvent[] = [
  {
    name: "Thomas K.",
    location: "München",
    product: "Solarzaun Standard",
    action: "gekauft",
    minutesAgo: 12,
    image: "/images/solarzaun-house.png",
    alt: "Solarzaun",
  },
  {
    name: "Sandra M.",
    location: "Stuttgart",
    product: "SkyWind Kleinwindanlage",
    action: "Projekt angefragt",
    detail: "Privatgrundstück · 3 kW",
    minutesAgo: 27,
    image: "/images/skywind-hero.png",
    alt: "SkyWind",
  },
  {
    name: "Markus B.",
    location: "Hamburg",
    product: "Solar + Wind Kombilösung",
    action: "Projekt angefragt",
    detail: "Hofanlage · Solar + Wind",
    minutesAgo: 5,
    image: "/images/skywind-rooftop.png",
    alt: "Kombilösung",
  },
  {
    name: "Julia R.",
    location: "Frankfurt",
    product: "Solarzaun Gewerbe",
    action: "Projekt angefragt",
    detail: "Gewerbegrundstück · 40 m",
    minutesAgo: 41,
    image: "/images/solarzaun-house.png",
    alt: "Solarzaun Gewerbe",
  },
  {
    name: "Andreas W.",
    location: "Nürnberg",
    product: "SkyWind Pro",
    action: "gekauft",
    minutesAgo: 18,
    image: "/images/skywind-rooftop.png",
    alt: "SkyWind Pro",
  },
  {
    name: "Petra L.",
    location: "Freiburg",
    product: "Solarzaun Privatgarten",
    action: "Projekt angefragt",
    detail: "Wohnhaus · 25 m Zaunlänge",
    minutesAgo: 9,
    image: "/images/solarzaun-house.png",
    alt: "Solarzaun",
  },
  {
    name: "Klaus H.",
    location: "Augsburg",
    product: "SkyWind 1 kW",
    action: "Projekt angefragt",
    detail: "Landwirtschaft · Hofbetrieb",
    minutesAgo: 33,
    image: "/images/skywind-hero.png",
    alt: "SkyWind",
  },
];

export function SalesPopup() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const showNext = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % EVENTS.length);
      setVisible(true);
    }, 400);
  }, []);

  useEffect(() => {
    if (dismissed) return;

    // Erstes Erscheinen nach 4 Sekunden
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    return () => clearTimeout(initialTimer);
  }, [dismissed]);

  useEffect(() => {
    if (dismissed || !visible) return;

    // Nach 5 Sekunden ausblenden, nach weiteren 3 Sekunden nächste anzeigen
    const hideTimer = setTimeout(() => {
      setVisible(false);
      const nextTimer = setTimeout(showNext, 3000);
      return () => clearTimeout(nextTimer);
    }, 5000);

    return () => clearTimeout(hideTimer);
  }, [visible, dismissed, currentIndex, showNext]);

  if (dismissed) return null;

  const event = EVENTS[currentIndex];

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 transition-all duration-400 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className={`bg-white rounded-2xl shadow-xl border p-3 flex items-center gap-3 max-w-[290px] ${
        event.action === "Projekt angefragt" ? "border-blue-100" : "border-gray-100"
      }`}>
        {/* Produktbild */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
          <Image
            src={event.image}
            alt={event.alt}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {event.action === "Projekt angefragt" ? (
              <span className="inline-block text-[9px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full leading-none">
                Projektanfrage
              </span>
            ) : (
              <span className="inline-block text-[9px] font-bold uppercase tracking-wide text-brand-accent bg-green-50 px-1.5 py-0.5 rounded-full leading-none">
                {event.action === "gekauft" ? "Kauf" : "Anfrage"}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-brand-text truncate">
            {event.name} aus {event.location}
          </p>
          <p className="text-xs text-brand-muted truncate">
            <span className="text-brand-text font-medium">{event.product}</span>
          </p>
          {event.detail && (
            <p className="text-[10px] text-brand-muted truncate">{event.detail}</p>
          )}
          <p className={`text-[10px] mt-0.5 ${event.action === "Projekt angefragt" ? "text-blue-500" : "text-brand-accent"}`}>
            vor {event.minutesAgo} Minuten
          </p>
        </div>

        {/* Schließen */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors duration-150 -mt-8 -mr-1"
          aria-label="Schließen"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Puls-Punkt – grün für Kauf, blau für Projektanfrage */}
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          event.action === "Projekt angefragt" ? "bg-blue-500" : "bg-brand-accent"
        }`} />
        <span className={`relative inline-flex rounded-full h-3 w-3 ${
          event.action === "Projekt angefragt" ? "bg-blue-500" : "bg-brand-accent"
        }`} />
      </span>
    </div>
  );
}
