import type { MarketListing } from "@prisma/client";
import { inferProductCategory, type MarketProductCategory } from "../utils/marketCategoryUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductDraftFaqItem {
  question: string;
  answer: string;
}

export interface LocaleTranslation {
  name: string;
  shortDescription: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  technicalData: string[];
  faq: ProductDraftFaqItem[];
  availabilityNote: string;
}

export interface MarketProductDraftResult {
  slug: string;
  category: string;
  tags: string[];
  priceSuggestion: number;
  translations: {
    de: LocaleTranslation;
    en: LocaleTranslation;
    es: LocaleTranslation;
  };
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function deriveCategorySlug(category: MarketProductCategory): string {
  switch (category) {
    case "solarzaun":    return "solarzaun";
    case "skywind":     return "skywind";
    case "solaranlage": return "kombiloesungen";
    default:            return "solar-zubehoer";
  }
}

function safeJsonParse(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((i) => (typeof i === "string" ? i.trim() : "")).filter((i) => i.length > 0).slice(0, 12);
}

function toFaqArray(value: unknown): ProductDraftFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const q = typeof (item as { question?: unknown }).question === "string" ? (item as { question: string }).question.trim() : "";
      const a = typeof (item as { answer?: unknown }).answer === "string" ? (item as { answer: string }).answer.trim() : "";
      return q && a ? { question: q, answer: a } : null;
    })
    .filter((i): i is ProductDraftFaqItem => i !== null)
    .slice(0, 5);
}

function derivePriceSuggestion(listing: MarketListing): number {
  if (!listing.price_cents || listing.price_negotiable) return 0;
  const margin = typeof listing.estimatedMargin === "number" ? Math.max(listing.estimatedMargin, 0) : 0;
  const minMargin = Math.max(Math.round(listing.price_cents * 0.15), 15000);
  const raw = listing.price_cents + Math.max(margin, minMargin);
  return Math.round(raw / 5000) * 5000;
}

// ─── Locale-Content Extraktion ────────────────────────────────────────────────

function extractLocaleTranslation(
  parsed: Record<string, unknown>,
  locale: "de" | "en" | "es",
  fallbackName: string,
): LocaleTranslation {
  const block = (parsed[locale] ?? {}) as Record<string, unknown>;

  const name =
    typeof block.name === "string" && block.name.trim()
      ? block.name.trim().slice(0, 180)
      : fallbackName.slice(0, 180);

  const shortDescription =
    typeof block.shortDescription === "string" && block.shortDescription.trim()
      ? block.shortDescription.trim().slice(0, 500)
      : locale === "de" ? "Produktentwurf auf Basis eines geprüften Marktangebots."
        : locale === "en" ? "Product draft based on a verified market offer."
        : "Borrador de producto basado en una oferta de mercado verificada.";

  const baseDesc =
    typeof block.description === "string" && block.description.trim()
      ? block.description.trim()
      : shortDescription;

  const technicalData = toStringArray(block.technicalData);
  const faq = toFaqArray(block.faq);

  const faqText = faq.length > 0
    ? `\n\n**${locale === "de" ? "Häufige Fragen" : locale === "en" ? "Frequently Asked Questions" : "Preguntas Frecuentes"}**\n${faq.map((f) => `**${f.question}**\n${f.answer}`).join("\n\n")}`
    : "";
  const techText = technicalData.length > 0
    ? `\n\n**${locale === "de" ? "Technische Daten" : locale === "en" ? "Technical Specifications" : "Especificaciones Técnicas"}**\n${technicalData.map((t) => `- ${t}`).join("\n")}`
    : "";

  const description = `${baseDesc}${techText}${faqText}`.trim();

  const metaTitle =
    typeof block.metaTitle === "string" && block.metaTitle.trim()
      ? block.metaTitle.trim().slice(0, 70)
      : `${name.slice(0, 55)} | WSP`;

  const metaDescription =
    typeof block.metaDescription === "string" && block.metaDescription.trim()
      ? block.metaDescription.trim().slice(0, 170)
      : shortDescription.slice(0, 170);

  const availabilityNote =
    typeof block.availabilityNote === "string" && block.availabilityNote.trim()
      ? block.availabilityNote.trim().slice(0, 300)
      : locale === "de" ? "Verfügbarkeit und Zustand werden vor Angebotsbestätigung geprüft."
        : locale === "en" ? "Availability and condition will be verified before order confirmation."
        : "La disponibilidad y condición serán verificadas antes de la confirmación del pedido.";

  return { name, shortDescription, description, metaTitle, metaDescription, technicalData, faq, availabilityNote };
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(listing: MarketListing, priceSuggestion: number, category: MarketProductCategory): string {
  const payload = {
    title: listing.title,
    description: listing.description ?? null,
    keyword: listing.keyword,
    brand: listing.brand ?? null,
    model: listing.model ?? null,
    productSeries: listing.productSeries ?? null,
    location: listing.location ?? null,
    priceCents: listing.price_cents,
    priceRaw: listing.price_raw ?? null,
    dealScore: listing.dealScore ?? null,
    aiComment: listing.aiComment ?? null,
    inferredCategory: category,
    priceSuggestion,
  };

  const categoryInstructions: Record<string, string> = {
    wechselrichter: "Wechselrichter: Hersteller, Modell, Nennleistung (kW), Topologie (String/Hybrid/Mikro), MPP-Tracker, max. Eingangsspannung (V), Wirkungsgrad (%), Schutzklasse (IP), Abmessungen, Gewicht, Garantie. technicalData mind. 8 Einträge. Nutze dein Trainingswissen für bekannte Modelle.",
    solarspeicher: "Solarspeicher: Kapazität (kWh brutto/netto), Zellchemie (LiFePO4/NMC), max. Lade-/Entladeleistung (kW), Rundeneffizienz (%), Kompatibilität, Schutzklasse, Gewicht, Garantie. technicalData mind. 8 Einträge.",
    laderegler: "Laderegler: MPPT oder PWM, Ladestrom (A), max. PV-Leistung (W), Systemspannung (V), kompatible Batterietypen, Schutzklasse. technicalData mind. 6 Einträge.",
    optimizer: "Optimizer: Hersteller, Eingangsleistung (W), max. Eingangsspannung, Ausgangsleistung, kompatible Wechselrichter, Wirkungsgrad. technicalData mind. 6 Einträge.",
    halterung: "Halterung: Modulgröße/-gewicht, Dachtyp, Material (Alu/Edelstahl), max. Windlast, Montageart. technicalData mind. 5 Einträge.",
    solaranlage: "Solaranlage: Nennleistung (kWp), Modulanzahl, Wechselrichter-Typ, Speicher-Option, Jahresertrag-Schätzung, Fläche. technicalData mind. 6 Einträge.",
    solarzaun: "Solarzaun: Modulleistung (Wp), Modulgröße, Zaun-Länge/-Höhe, Rahmentyp, Einspeisung oder Eigenverbrauch. technicalData mind. 5 Einträge.",
    skywind: "Windkraftanlage: Nennleistung (W/kW), Rotordurchmesser, Anlaufwindgeschwindigkeit, Nennwindgeschwindigkeit, Netzanschluss (V/Hz). technicalData mind. 5 Einträge.",
  };

  const catInstruction = categoryInstructions[category] ?? "Alle relevanten technischen Daten. technicalData mind. 5 Einträge.";

  return [
    "Erstelle einen trilingualen Produktentwurf (DE, EN, ES) für einen Solar-Webshop.",
    "Basis sind die unten angegebenen Listing-Daten.",
    "",
    "WICHTIG – Ausgabeformat: Antworte NUR mit validem JSON (kein Markdown). Exakt diese Struktur:",
    JSON.stringify({
      slug: "url-safe-slug-aus-deutschem-namen",
      category: "kategorie-slug",
      tags: ["tag1", "tag2"],
      priceSuggestion: 0,
      de: { name: "", shortDescription: "", description: "", metaTitle: "", metaDescription: "", technicalData: [], faq: [{ question: "", answer: "" }], availabilityNote: "" },
      en: { name: "", shortDescription: "", description: "", metaTitle: "", metaDescription: "", technicalData: [], faq: [{ question: "", answer: "" }], availabilityNote: "" },
      es: { name: "", shortDescription: "", description: "", metaTitle: "", metaDescription: "", technicalData: [], faq: [{ question: "", answer: "" }], availabilityNote: "" },
    }),
    "",
    "REGELN:",
    `- ${catInstruction}`,
    "- Nutze dein Trainingswissen! Wenn Hersteller und Modell erkennbar sind, ergänze bekannte technische Daten. Geschätzte Werte mit '(typ.)' kennzeichnen.",
    "- description: strukturierter Text, Nutzen zuerst, dann Technik, dann Einsatzbereich.",
    "- shortDescription: 1-2 Sätze, SEO-stark.",
    "- metaTitle: max 60 Zeichen, Hauptkeyword zuerst.",
    "- metaDescription: 140-155 Zeichen, Nutzen + Handlungsaufforderung.",
    "- faq: min. 3 praxisnahe Kundenfragen (Kompatibilität, Installation, Förderung, Garantie).",
    "- EN: vollständige englische Übersetzung, nicht nur wörtlich – SEO-optimiert für englischen Markt.",
    "- ES: vollständige spanische Übersetzung – SEO-optimiert für spanischsprachigen Markt.",
    "- technicalData: in allen 3 Sprachen übersetzen (Einheiten gleich, Bezeichnungen übersetzen).",
    "- Keine Garantieversprechen übernehmen. Keine falschen Lagerbestände.",
    "- availabilityNote: kurzer Hinweis zur Verfügbarkeit, je Sprache passend formuliert.",
    "- Kein 'WSP' oder 'Kleinanzeigen' in Texten erwähnen.",
    "",
    `Listing-Daten: ${JSON.stringify(payload)}`,
  ].join("\n");
}

// ─── Hauptfunktion ────────────────────────────────────────────────────────────

export async function generateMarketProductDraft(listing: MarketListing): Promise<MarketProductDraftResult> {
  const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY ist nicht gesetzt.");

  const model = (process.env.OPENAI_MODEL ?? "gpt-4.1-mini").trim();
  const inferredCategory = inferProductCategory(listing);
  const derivedPriceSuggestion = derivePriceSuggestion(listing);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "Du erzeugst trilinguale Produktentwürfe (DE, EN, ES) für einen deutschen Solar-Webshop. Antworte NUR mit validem JSON.",
        },
        { role: "user", content: buildPrompt(listing, derivedPriceSuggestion, inferredCategory) },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Produktentwurf konnte nicht generiert werden (HTTP ${response.status})${details ? `: ${details}` : ""}`);
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const rawContent = payload.choices?.[0]?.message?.content?.trim();
  if (!rawContent) throw new Error("KI-Entwurf lieferte keine Daten.");

  const parsed = safeJsonParse(rawContent);

  // Slug und Meta aus DE-Block ableiten
  const deName = typeof (parsed.de as Record<string, unknown>)?.name === "string"
    ? ((parsed.de as Record<string, unknown>).name as string).trim()
    : listing.title.trim();

  const slug = slugify(
    typeof parsed.slug === "string" && parsed.slug.trim()
      ? parsed.slug.trim()
      : deName,
  );

  const tags = toStringArray(parsed.tags).slice(0, 8);

  const priceSuggestion = listing.price_cents && !listing.price_negotiable
    ? clamp(derivedPriceSuggestion, 0, 500_000_000)
    : 0;

  return {
    slug,
    category: deriveCategorySlug(inferredCategory),
    tags,
    priceSuggestion,
    translations: {
      de: extractLocaleTranslation(parsed, "de", deName),
      en: extractLocaleTranslation(parsed, "en", deName),
      es: extractLocaleTranslation(parsed, "es", deName),
    },
  };
}
