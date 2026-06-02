"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const PAYPAL_URL = "https://py.pl/1ZTYiy";
const BASE_PRICE = 49.99;
const ADDON_PRICE = 9.99;
const MAX_CHARS = 200;

type CardOption = "standard" | "handwritten";
type TemplateId = "A" | "B" | "C" | "custom";

const TEMPLATES: { id: Exclude<TemplateId, "custom">; label: string; text: string }[] = [
  {
    id: "A",
    label: "Romantisch",
    text: "Ein Jahr mit dir. Ich würde dich jeden Tag wieder wählen.",
  },
  {
    id: "B",
    label: "Kurz & stark",
    text: "Du bist mein Zuhause.",
  },
  {
    id: "C",
    label: "Dankbar & warm",
    text: "Danke, dass du da bist. Heute, morgen, immer.",
  },
];

function track(event: string, props?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof (window as unknown as Record<string, unknown>).gtag === "function") {
    (window as unknown as { gtag: (cmd: string, ev: string, p: Record<string, unknown>) => void }).gtag(
      "event",
      event,
      props ?? {}
    );
  }
}

function fmt(eur: number) {
  return eur.toFixed(2).replace(".", ",");
}

export function PersonalizationSection() {
  const [cardOption, setCardOption] = useState<CardOption>("standard");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [customText, setCustomText] = useState("");
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [date, setDate] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [showOrderBox, setShowOrderBox] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);

  const isHandwritten = cardOption === "handwritten";
  const totalPrice = isHandwritten ? BASE_PRICE + ADDON_PRICE : BASE_PRICE;

  const messageText =
    selectedTemplate === "custom"
      ? customText
      : TEMPLATES.find((t) => t.id === selectedTemplate)?.text ?? "";

  const isValid = !isHandwritten || (messageText.trim().length > 0 && messageText.length <= MAX_CHARS);

  const orderSummaryLines = [
    "Anniversary Gift Box – Bestellung",
    "",
    `Produkt: Anniversary Gift Box`,
    `Karte: ${isHandwritten ? `Handschriftliche Grußkarte (+${fmt(ADDON_PRICE)} EUR)` : "Standard Karte (inkl.)"}`,
    isHandwritten && messageText ? `Nachricht: "${messageText}"` : null,
    senderName ? `Von: ${senderName}` : null,
    recipientName ? `An: ${recipientName}` : null,
    date ? `Datum: ${date}` : null,
    "",
    `Gesamtbetrag: ${fmt(totalPrice)} EUR`,
  ].filter(Boolean) as string[];
  const orderSummaryText = orderSummaryLines.join("\n");

  /* Show sticky CTA once user scrolls into section */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setStickyVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleCardToggle = useCallback(
    (option: CardOption) => {
      setCardOption(option);
      setShowOrderBox(false);
      if (option === "handwritten") {
        track("personalization_toggle_on");
      } else {
        track("personalization_toggle_off");
        setSelectedTemplate(null);
      }
    },
    []
  );

  const handleTemplateSelect = useCallback((id: TemplateId) => {
    setSelectedTemplate(id);
    setShowOrderBox(false);
    track("template_selected", { template_id: id });
  }, []);

  const handleCopySummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(orderSummaryText);
    } catch {
      summaryRef.current?.select();
    }
    setCopyStatus("copied");
    track("copy_summary_clicked");
    setTimeout(() => setCopyStatus("idle"), 2500);
  }, [orderSummaryText]);

  const handleBuyNow = useCallback(() => {
    if (isHandwritten && !isValid) return;
    track("buy_now_clicked", {
      card_option: cardOption,
      template: selectedTemplate ?? "none",
      total_price: totalPrice,
    });
    setShowOrderBox(true);
    setTimeout(() => {
      document.getElementById("order-summary-box")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  }, [isHandwritten, isValid, cardOption, selectedTemplate, totalPrice]);

  /* ── Radio button component ──────────────────────────────────── */
  function RadioDot({ active }: { active: boolean }) {
    return (
      <span
        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors duration-150 ${
          active ? "border-brand-accent" : "border-gray-300"
        }`}
      >
        {active && <span className="w-2 h-2 rounded-full bg-brand-accent" />}
      </span>
    );
  }

  return (
    <>
      <section
        ref={sectionRef}
        id="personalisieren"
        className="py-16 sm:py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Header ──────────────────────────────────────────── */}
          <div className="max-w-xl mb-10">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">
              Personalisieren
            </p>
            <h2 className="font-display text-3xl font-bold text-brand-text mb-3">
              Personalisieren in 30 Sekunden
            </h2>
            <p className="text-brand-muted text-base leading-relaxed">
              Du wählst den Text. Wir schreiben die Karte per Hand und legen sie in die Schublade.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
            {/* ── Left: Steps ─────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-8">

              {/* Step 1 */}
              <div>
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-3">
                  Schritt 1 — Kartenoption wählen
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      {
                        id: "standard" as CardOption,
                        title: "Standard Karte",
                        sub: "Im Lieferumfang enthalten",
                        price: "0,00 EUR",
                        priceClass: "text-brand-text",
                      },
                      {
                        id: "handwritten" as CardOption,
                        title: "Handschriftliche Karte",
                        sub: "Premium · per Hand geschrieben",
                        price: "+9,99 EUR",
                        priceClass: "text-brand-accent",
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleCardToggle(opt.id)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                        cardOption === opt.id
                          ? "border-brand-accent bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <RadioDot active={cardOption === opt.id} />
                      <div>
                        <p className="font-semibold text-sm text-brand-text">{opt.title}</p>
                        <p className="text-xs text-brand-muted mt-0.5">{opt.sub}</p>
                        <p className={`text-sm font-bold mt-2 ${opt.priceClass}`}>{opt.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2 – only when handwritten */}
              {isHandwritten && (
                <div>
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-3">
                    Schritt 2 — Nachricht wählen
                  </p>
                  <div className="space-y-2.5">
                    {TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleTemplateSelect(tpl.id)}
                        className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                          selectedTemplate === tpl.id
                            ? "border-brand-accent bg-green-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <RadioDot active={selectedTemplate === tpl.id} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-1">
                            {tpl.label}
                          </p>
                          <p className="text-sm text-brand-text italic leading-relaxed">
                            &ldquo;{tpl.text}&rdquo;
                          </p>
                        </div>
                      </button>
                    ))}

                    {/* Custom text */}
                    <button
                      type="button"
                      onClick={() => handleTemplateSelect("custom")}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                        selectedTemplate === "custom"
                          ? "border-brand-accent bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <RadioDot active={selectedTemplate === "custom"} />
                      <div>
                        <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-0.5">
                          Eigener Text
                        </p>
                        <p className="text-sm text-brand-muted">Schreib deine eigene Nachricht</p>
                      </div>
                    </button>

                    {selectedTemplate === "custom" && (
                      <div>
                        <textarea
                          value={customText}
                          onChange={(e) => {
                            if (e.target.value.length <= MAX_CHARS) setCustomText(e.target.value);
                          }}
                          placeholder="Deine persönliche Nachricht..."
                          rows={4}
                          className="w-full border border-gray-200 rounded-xl p-4 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent resize-none"
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-brand-muted">Max. 200 Zeichen</span>
                          <span
                            className={`text-xs font-medium transition-colors duration-150 ${
                              customText.length > MAX_CHARS * 0.9 ? "text-orange-500" : "text-brand-muted"
                            }`}
                          >
                            {customText.length}/{MAX_CHARS}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3 – optional fields */}
              {isHandwritten && selectedTemplate && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowOptional((v) => !v)}
                    className="flex items-center gap-2 text-xs font-semibold text-brand-muted uppercase tracking-widest hover:text-brand-text transition-colors duration-150"
                  >
                    <span>Schritt 3 — Optionale Angaben</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${showOptional ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showOptional && (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-brand-muted mb-1">
                            Absender (optional)
                          </label>
                          <input
                            type="text"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            placeholder="z. B. Max"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-brand-muted mb-1">
                            Empfänger (optional)
                          </label>
                          <input
                            type="text"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            placeholder="z. B. Lisa"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-brand-muted mb-1">
                          Datum (optional)
                        </label>
                        <input
                          type="text"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          placeholder="z. B. 15. Juni 2026"
                          className="w-full sm:w-1/2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Trust line */}
              <div className="flex flex-wrap items-center gap-5 text-xs text-brand-muted pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1.5">
                  <span className="font-bold text-brand-accent">✓</span>
                  DHL Versand inklusive
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="font-bold text-brand-accent">✓</span>
                  Lieferung in 2 Werktagen (DE)
                </span>
              </div>

              {/* Price summary + CTA */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-brand-muted mb-0.5">Gesamtbetrag</p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display text-3xl font-bold text-brand-text">
                        {fmt(totalPrice)} EUR
                      </span>
                      {isHandwritten && (
                        <span className="text-xs text-brand-muted">
                          (49,99 + 9,99 EUR)
                        </span>
                      )}
                    </div>
                  </div>
                  {isHandwritten && (
                    <span className="inline-block text-xs font-semibold text-white bg-brand-accent px-2.5 py-1 rounded-full flex-shrink-0">
                      Upgrade aktiv
                    </span>
                  )}
                </div>

                {isHandwritten && !isValid && (
                  <p className="text-xs text-orange-600 mb-3">
                    Bitte wähle eine Nachricht aus (Schritt 2).
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isHandwritten && !isValid}
                  className="w-full bg-brand-accent text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-green-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Jetzt bestellen · {fmt(totalPrice)} EUR
                </button>
              </div>

              {/* Order summary / PayPal note box */}
              {showOrderBox && (
                <div id="order-summary-box" className="border-2 border-brand-accent rounded-2xl p-5 bg-green-50">
                  <p className="font-display font-bold text-brand-text mb-1">Fast fertig!</p>
                  <p className="text-sm text-brand-muted mb-4">
                    Kopiere die Notiz und füge sie bei PayPal als Bestellnotiz ein.
                  </p>
                  <textarea
                    ref={summaryRef}
                    readOnly
                    value={orderSummaryText}
                    rows={orderSummaryLines.length + 1}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-brand-text bg-white font-mono resize-none mb-3 leading-relaxed"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className={`flex-1 flex items-center justify-center gap-2 border font-semibold py-2.5 px-4 rounded-xl transition-all duration-150 text-sm ${
                        copyStatus === "copied"
                          ? "border-brand-accent bg-green-50 text-brand-accent"
                          : "border-gray-300 bg-white text-brand-text hover:bg-gray-50"
                      }`}
                    >
                      {copyStatus === "copied" ? "✓ Kopiert!" : "Notiz kopieren"}
                    </button>
                    <a
                      href={PAYPAL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-[#003087] text-white font-semibold py-2.5 px-4 rounded-xl hover:bg-[#002069] transition-colors duration-150 text-sm"
                    >
                      Weiter zu PayPal →
                    </a>
                  </div>
                  <p className="text-xs text-brand-muted mt-3 text-center">
                    Bitte diese Notiz in PayPal einfügen
                  </p>
                </div>
              )}
            </div>

            {/* ── Right: Preview ───────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24 space-y-4">
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest">
                  Vorschau
                </p>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  {/* Card mockup area */}
                  <div className="bg-[#1C1C1E] p-8 flex items-center justify-center min-h-[220px]">
                    <div
                      className={`w-full max-w-xs bg-white rounded-xl shadow-lg p-6 text-center transition-all duration-300 ${
                        isHandwritten && messageText ? "opacity-100 scale-100" : "opacity-30 scale-95"
                      }`}
                    >
                      {isHandwritten && messageText ? (
                        <>
                          {(recipientName || senderName) && (
                            <p className="text-xs text-gray-400 mb-3">
                              {recipientName ? `Für ${recipientName}` : ""}
                              {recipientName && senderName ? " · " : ""}
                              {senderName ? `Von ${senderName}` : ""}
                            </p>
                          )}
                          <p className="text-gray-800 text-sm leading-relaxed italic font-display">
                            &ldquo;{messageText}&rdquo;
                          </p>
                          {date && (
                            <p className="text-xs text-gray-400 mt-3">{date}</p>
                          )}
                          <div className="mt-4 border-t border-gray-100 pt-3">
                            <p className="text-xs text-gray-400">Handschriftlich · per Hand</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          {isHandwritten ? "Wähle eine Nachricht →" : "Standard Karte · Gedruckt"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-brand-muted">
                        {isHandwritten ? "Handschriftliche Karte" : "Standard Karte"}
                      </span>
                      <span
                        className={`text-xs font-semibold transition-colors duration-150 ${
                          isHandwritten ? "text-brand-accent" : "text-brand-muted"
                        }`}
                      >
                        {isHandwritten ? "+9,99 EUR" : "inkl."}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Micro-copy box */}
                <div className="bg-green-50 border border-brand-accent/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-brand-text mb-1">
                    Sicherster Move: After Dessert Surprise
                  </p>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Die Karte liegt in der Schublade. Einfach öffnen lassen, wenn der Moment stimmt.
                  </p>
                </div>

                {/* Total price callout */}
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-brand-muted">Gesamt</p>
                      <p className="font-display font-bold text-brand-text text-xl">
                        {fmt(totalPrice)} EUR
                      </p>
                    </div>
                    <div className="text-right">
                      {isHandwritten ? (
                        <>
                          <p className="text-xs text-brand-muted">49,99 + 9,99 EUR</p>
                          <p className="text-xs font-semibold text-brand-accent">Upgrade aktiv</p>
                        </>
                      ) : (
                        <p className="text-xs text-brand-muted">Standardkarte inkl.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile sticky CTA ─────────────────────────────────────────── */}
      {stickyVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div>
              <p className="text-xs text-brand-muted leading-none mb-0.5">Gesamt</p>
              <p className="font-display font-bold text-brand-text text-lg leading-tight">
                {fmt(totalPrice)} EUR
                {isHandwritten && (
                  <span className="text-xs font-normal text-brand-muted ml-1">(+9,99)</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isHandwritten && !isValid}
              className="flex-1 bg-brand-accent text-white font-semibold py-3 px-4 rounded-xl hover:bg-green-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-center"
            >
              Jetzt bestellen
            </button>
          </div>
        </div>
      )}
    </>
  );
}
