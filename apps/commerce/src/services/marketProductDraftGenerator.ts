import type { MarketListing } from "@prisma/client";
import { inferProductCategory, type MarketProductCategory } from "../utils/marketCategoryUtils";

export interface ProductDraftFaqItem {
  question: string;
  answer: string;
}

export interface MarketProductDraftResult {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  tags: string[];
  technicalData: string[];
  faq: ProductDraftFaqItem[];
  priceSuggestion: number;
  availabilityNote: string;
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}


function deriveCategorySlug(category: MarketProductCategory): string {
  switch (category) {
    case "solarzaun":
      return "solarzaun";
    case "skywind":
      return "skywind";
    case "solaranlage":
      return "kombiloesungen";
    case "solarspeicher":
      return "solar-zubehoer";
    case "wechselrichter":
      return "solar-zubehoer";
    case "laderegler":
      return "solar-zubehoer";
    case "optimizer":
      return "solar-zubehoer";
    case "halterung":
      return "solar-zubehoer";
    case "unknown":
    default:
      return "solar-zubehoer";
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, 12);
}

function toFaqArray(value: unknown): ProductDraftFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const question = typeof (item as { question?: unknown }).question === "string"
        ? (item as { question: string }).question.trim()
        : "";
      const answer = typeof (item as { answer?: unknown }).answer === "string"
        ? (item as { answer: string }).answer.trim()
        : "";
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is ProductDraftFaqItem => item !== null)
    .slice(0, 6);
}

function safeJsonParse(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function derivePriceSuggestion(listing: MarketListing): number {
  if (!listing.price_cents || listing.price_negotiable) return 0;

  const estimatedMargin = typeof listing.estimatedMargin === "number" ? Math.max(listing.estimatedMargin, 0) : 0;
  const minimumMargin = Math.max(Math.round(listing.price_cents * 0.15), 15000);
  const raw = listing.price_cents + Math.max(estimatedMargin, minimumMargin);

  return Math.round(raw / 5000) * 5000;
}

function buildPrompt(listing: MarketListing, priceSuggestion: number, category: MarketProductCategory): string {
  const payload = {
    title: listing.title,
    description: listing.description ?? null,
    keyword: listing.keyword,
    brand: listing.brand ?? null,
    model: listing.model ?? null,
    location: listing.location ?? null,
    priceCents: listing.price_cents,
    priceRaw: listing.price_raw ?? null,
    dealScore: listing.dealScore ?? null,
    aiComment: listing.aiComment ?? null,
    inferredCategory: category,
    priceSuggestion,
  };

  const categoryInstructions: Record<string, string> = {
    wechselrichter: [
      "Wechselrichter: Hersteller, Modell, Nennleistung (kW), Topologie (String/Hybrid/Mikro), MPP-Tracker-Anzahl, max. Eingangsspannung (V), max. Eingangsstrom (A), Wirkungsgrad (%), Schutzklasse (IP), Abmessungen, Gewicht, Garantie.",
      "PFLICHT: technicalData MUSS mindestens 8 Eintraege haben. Nutze dein Trainingswissen ueber bekannte Modelle (z.B. GoodWe GW10K-ET: 2 MPP-Tracker, max. 1000V, 97.6% Wirkungsgrad, IP65, etc.).",
    ].join(" "),
    solarspeicher: [
      "Solarspeicher: Kapazitaet (kWh brutto/netto), Zellchemie (LiFePO4/NMC), max. Lade-/Entladeleistung (kW), Rundeneffizienz (%), kompatible Wechselrichter, Schutzklasse, Gewicht, Garantie (Jahre/Zyklen).",
      "PFLICHT: technicalData MUSS mindestens 8 Eintraege haben.",
    ].join(" "),
    laderegler: "Laderegler: MPPT oder PWM, Ladestrom (A), max. PV-Leistung (W), Systemspannung (V), kompatible Batterietypen, Schutzklasse. technicalData MUSS mindestens 6 Eintraege haben.",
    optimizer: "Optimizer: Hersteller, Eingangsleistung (W), max. Eingangsspannung, Ausgangsleistung, kompatible Wechselrichter-Serie, Wirkungsgrad. technicalData MUSS mindestens 6 Eintraege haben.",
    halterung: "Halterung: Modulgroesse/-gewicht, Dachtyp (Flachdach/Schraegedach/Boden/Fassade), Material (Alu/Edelstahl), max. Windlast, Montageart. technicalData MUSS mindestens 5 Eintraege haben.",
    solaranlage: "Solaranlage: Nennleistung (kWp), Modulanzahl, Wechselrichter-Typ, Speicher-Option, Jahresertrag-Schaetzung, Flaeche. technicalData MUSS mindestens 6 Eintraege haben.",
    solarzaun: "Solarzaun: Modulleistung (Wp), Modulgroesse, Zaun-Laenge/-Hoehe, Rahmentyp, Einspeisung oder Eigenverbrauch. technicalData MUSS mindestens 5 Eintraege haben.",
    skywind: "Windkraftanlage: Nennleistung (W/kW), Rotordurchmesser, Anlaufwindgeschwindigkeit, Nennwindgeschwindigkeit, Netzanschluss (V/Hz). technicalData MUSS mindestens 5 Eintraege haben.",
  };

  const catInstruction = categoryInstructions[category] ?? "Gib alle relevanten technischen Daten an. technicalData MUSS mindestens 5 Eintraege haben.";

  return [
    "Du erstellst einen Produktentwurf fuer den WSP Adminbereich auf Basis eines Marktangebots.",
    "Sprache: Deutsch. SEO-optimiert. Kein Copy & Paste aus Kleinanzeigen.",
    "WICHTIG: Nutze dein Trainingswissen! Wenn Hersteller und Modell erkennbar sind (z.B. GoodWe GW10K-ET, Fronius Symo, SMA Sunny Tripower), ergaenze bekannte technische Daten aus deinem Wissen. Kennzeichne geschaetzte Werte mit '(typ.)' am Ende.",
    "Rechtlich vorsichtig formulieren. Keine Garantieversprechen uebernehmen. Keine falschen Lagerbestaende.",
    catInstruction,
    "description: Gut strukturierter Text mit Absaetzen. Nutzen zuerst, dann technischer Kontext, dann Einsatzbereich. KEIN Hinweis auf Verfuegbarkeit im description-Feld – der steht separat.",
    "shortDescription: 1-2 Saetze, SEO-stark, mit Hauptkeyword und Nutzen.",
    "metaTitle: Max 60 Zeichen, Hauptkeyword zuerst, keine Wiederholung von WSP.",
    "metaDescription: 140-155 Zeichen, Nutzen + Handlungsaufforderung.",
    "faq: Mindestens 3 praxisnahe Fragen aus Kundenperspektive (Kompatibilitaet, Installation, Foerderung, Garantie).",
    "Wenn Preis fehlt oder verhandelbar: priceSuggestion=0, availabilityNote auf Anfrage verweisen.",
    "Gib ausschliesslich valides JSON zurueck mit genau diesen Feldern:",
    '{"name":"","slug":"","shortDescription":"","description":"","metaTitle":"","metaDescription":"","category":"","tags":[],"technicalData":[],"faq":[],"priceSuggestion":0,"availabilityNote":""}',
    `Eingabedaten: ${JSON.stringify(payload)}`,
  ].join("\n");
}

export async function generateMarketProductDraft(listing: MarketListing): Promise<MarketProductDraftResult> {
  const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt.");
  }

  const model = (process.env.OPENAI_MODEL ?? "gpt-4.1-mini").trim();
  const inferredCategory = inferProductCategory(listing);
  const derivedPriceSuggestion = derivePriceSuggestion(listing);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "Du erzeugst Produktentwuerfe fuer einen deutschen Solar-Webshop und antwortest nur mit validem JSON.",
        },
        {
          role: "user",
          content: buildPrompt(listing, derivedPriceSuggestion, inferredCategory),
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Produktentwurf konnte nicht generiert werden (HTTP ${response.status})${details ? `: ${details}` : ""}`);
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const rawContent = payload.choices?.[0]?.message?.content?.trim();
  if (!rawContent) {
    throw new Error("KI-Entwurf lieferte keine Daten.");
  }

  const parsed = safeJsonParse(rawContent);

  const name =
    typeof parsed.name === "string" && parsed.name.trim().length > 0
      ? parsed.name.trim().slice(0, 180)
      : listing.title.trim().slice(0, 180);

  const slugCandidate =
    typeof parsed.slug === "string" && parsed.slug.trim().length > 0
      ? parsed.slug.trim()
      : slugify(name);

  const shortDescription =
    typeof parsed.shortDescription === "string" && parsed.shortDescription.trim().length > 0
      ? parsed.shortDescription.trim().slice(0, 500)
      : "Projektbezogener Produktentwurf auf Basis eines geprueften Marktangebots.";

  const baseDescription =
    typeof parsed.description === "string" && parsed.description.trim().length > 0
      ? parsed.description.trim()
      : "Produktentwurf fuer die interne Weiterbearbeitung im WSP Adminbereich.";

  const technicalData = toStringArray(parsed.technicalData);
  const faq = toFaqArray(parsed.faq);
  const tags = toStringArray(parsed.tags).slice(0, 8);

  const faqText = faq.length > 0
    ? `\n\n**Häufige Fragen**\n${faq.map((item) => `**${item.question}**\n${item.answer}`).join("\n\n")}`
    : "";
  const technicalDataText = technicalData.length > 0
    ? `\n\n**Technische Daten**\n${technicalData.map((item) => `- ${item}`).join("\n")}`
    : "";

  const description = `${baseDescription}${technicalDataText}${faqText}`.trim();

  const metaTitle =
    typeof parsed.metaTitle === "string" && parsed.metaTitle.trim().length > 0
      ? parsed.metaTitle.trim().slice(0, 70)
      : `${name.slice(0, 55)} | WSP Produktentwurf`;

  const metaDescription =
    typeof parsed.metaDescription === "string" && parsed.metaDescription.trim().length > 0
      ? parsed.metaDescription.trim().slice(0, 170)
      : `${shortDescription.slice(0, 150)} Verfuegbarkeit und Zustand werden vor Angebotsbestaetigung geprueft.`.slice(0, 170);

  const availabilityNote =
    typeof parsed.availabilityNote === "string" && parsed.availabilityNote.trim().length > 0
      ? parsed.availabilityNote.trim().slice(0, 300)
      : "Verfuegbarkeit und Zustand werden vor Angebotsbestaetigung geprueft.";

  return {
    name,
    slug: slugify(slugCandidate || name),
    shortDescription,
    description,
    metaTitle,
    metaDescription,
    category: deriveCategorySlug(inferredCategory),
    tags,
    technicalData,
    faq,
    priceSuggestion: listing.price_cents && !listing.price_negotiable ? clamp(derivedPriceSuggestion, 0, 500000000) : 0,
    availabilityNote,
  };
}
