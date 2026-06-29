// WSP Knowledge Intelligence – Knowledge Extraction Agent
// Extrahiert strukturiertes Wissen aus Market Listings gemäß WSP-Knowledge-Intelligence Skill.
// Drei Schritte: (1) regelbasierte Vorverarbeitung, (2) AI-Extraktion, (3) Nachverarbeitung.

import type { MarketListing, MarketReferencePrice } from "@prisma/client";
import { getPrismaClient } from "../lib/prisma";

// ─── Typen ────────────────────────────────────────────────────────────────────

export type KnowledgeSource =
  | "title"
  | "description"
  | "keyword"
  | "price"
  | "shipping"
  | "reference_price"
  | "knowledge_base"
  | "admin_correction"
  | "inferred";

export interface KnowledgeExtractionField<T> {
  value: T | null;
  confidence: number;
  source: KnowledgeSource | null;
}

export interface MarketKnowledgeResult {
  brand: KnowledgeExtractionField<string>;
  model: KnowledgeExtractionField<string>;
  productSeries: KnowledgeExtractionField<string>;
  category: KnowledgeExtractionField<string>;
  subcategory: KnowledgeExtractionField<string>;
  productType: KnowledgeExtractionField<string>;
  wattage: KnowledgeExtractionField<number>;
  capacityWh: KnowledgeExtractionField<number>;
  voltage: KnowledgeExtractionField<number>;
  technology: KnowledgeExtractionField<string>;
  condition: KnowledgeExtractionField<string>;
  shippingCost: KnowledgeExtractionField<number>;
  shippingIncluded: KnowledgeExtractionField<boolean>;
  priceQuality: KnowledgeExtractionField<string>;
  seoMainKeyword: KnowledgeExtractionField<string>;
  seoSecondaryKeywords: string[];
  seoIntent: KnowledgeExtractionField<string>;
  dataCompletenessScore: number;
  dataCompletenessClass: "complete" | "good" | "partial" | "incomplete";
  warnings: string[];
  notes: string;
}

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

// ─── Default-Ergebnis ─────────────────────────────────────────────────────────

function emptyField<T>(): KnowledgeExtractionField<T> {
  return { value: null, confidence: 0, source: null };
}

function defaultResult(): MarketKnowledgeResult {
  return {
    brand:               emptyField(),
    model:               emptyField(),
    productSeries:       emptyField(),
    category:            { value: "unknown", confidence: 0, source: null },
    subcategory:         emptyField(),
    productType:         emptyField(),
    wattage:             emptyField(),
    capacityWh:          emptyField(),
    voltage:             emptyField(),
    technology:          emptyField(),
    condition:           { value: "unknown", confidence: 0, source: null },
    shippingCost:        emptyField(),
    shippingIncluded:    emptyField(),
    priceQuality:        { value: "unknown", confidence: 0, source: null },
    seoMainKeyword:      emptyField(),
    seoSecondaryKeywords: [],
    seoIntent:           { value: "unknown", confidence: 0, source: null },
    dataCompletenessScore: 0,
    dataCompletenessClass: "incomplete",
    warnings: [],
    notes: "",
  };
}

// ─── Schritt 1: Regelbasierte Vorverarbeitung ─────────────────────────────────

// Normalisierung bekannter Markenvarianten gemäß WSP-Knowledge-Intelligence Skill.
const BRAND_NORMALIZATIONS: Array<[RegExp, string]> = [
  [/\beco[\s-]?flow\b/i,     "EcoFlow"],
  [/\bbyd\s+battery\b/i,     "BYD"],
  [/\bvictron\s+energy\b/i,  "Victron"],
  [/\bsungrow\b/i,           "Sungrow"],
  [/\bpylontech\b/i,         "Pylontech"],
  [/\bgrowatt\b/i,           "Growatt"],
  [/\bhoymiles\b/i,          "Hoymiles"],
  [/\bzendure\b/i,           "Zendure"],
  [/\bmarstek\b/i,           "Marstek"],
  [/\banker\b/i,             "Anker"],
  [/\bskywind\b/i,           "SkyWind"],
];

function tryNormalizeBrand(text: string): string | null {
  for (const [pattern, normalized] of BRAND_NORMALIZATIONS) {
    if (pattern.test(text)) return normalized;
  }
  return null;
}

export function parseShippingField(
  shipping: string | null
): { cost: number | null; included: boolean | null } {
  if (!shipping || shipping.trim() === "") return { cost: null, included: null };

  const lower = shipping.toLowerCase();

  if (/nur\s+abholung|kein\s+versand|keine\s+lieferung/i.test(lower)) {
    return { cost: 0, included: false };
  }

  if (/versand\s*(inklusive|inbegriffen|kostenlos|frei|gratis)/i.test(lower)) {
    return { cost: 0, included: true };
  }

  // "Versand: 15,00 €" oder "Versand: 9.99 EUR"
  const priceMatch = lower.match(/versand[^0-9]*(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur)/i);
  if (priceMatch) {
    const num = parseFloat(priceMatch[1].replace(",", "."));
    if (Number.isFinite(num) && num >= 0) {
      return { cost: Math.round(num * 100), included: false };
    }
  }

  if (/versand\s+(m.glich|angeboten|auf\s+anfrage)/i.test(lower)) {
    return { cost: null, included: true };
  }

  return { cost: null, included: null };
}

export function calculatePriceQuality(
  priceCents: number | null,
  refs: MarketReferencePrice[]
): string {
  if (!priceCents || priceCents <= 0 || refs.length === 0) return "unknown";

  // Günstigsten EK-Referenzpreis suchen
  const ekRefs = refs.filter((r) => r.ek_eur != null && r.ek_eur > 0);
  if (ekRefs.length === 0) return "unknown";

  const minEkCents = Math.min(...ekRefs.map((r) => (r.ek_eur ?? 0) * 100));
  if (minEkCents <= 0) return "unknown";

  const ratio = priceCents / minEkCents;

  if (ratio < 0.60) return "very_good";
  if (ratio < 0.80) return "good";
  if (ratio <= 1.00) return "fair";
  return "overpriced";
}

// Kategorie-Ableitung aus Keyword (Confidence: 0.85)
function inferCategoryFromKeyword(keyword: string): KnowledgeExtractionField<string> {
  const kw = keyword.toLowerCase().trim();
  const valid = ["solarzaun", "solarspeicher", "solaranlage", "wechselrichter", "skywind"];
  if (valid.includes(kw)) {
    return { value: kw, confidence: 0.85, source: "keyword" };
  }
  return { value: "unknown", confidence: 0, source: null };
}

// ─── Schritt 2: AI-Extraktion ─────────────────────────────────────────────────

function buildExtractionPrompt(listing: MarketListing): string {
  const payload = {
    title:       listing.title,
    description: listing.description ?? null,
    keyword:     listing.keyword,
    priceRaw:    listing.price_raw ?? null,
    priceCents:  listing.price_cents ?? null,
    shipping:    listing.shipping ?? null,
    location:    listing.location ?? null,
  };

  return [
    "Du bist ein Knowledge-Extraction-Agent fuer Kleinanzeigen-Listings im Bereich Solar, Speicher und Windkraft.",
    "Extrahiere strukturierte Produktdaten aus dem folgenden Listing.",
    "",
    "Wichtige Regeln (WSP Knowledge Intelligence):",
    "- Erfinde keine Werte. Wenn du dir nicht sicher bist, setze value: null.",
    "- Gib fuer jedes Feld confidence (0.00-1.00) und source an.",
    "- 0.00-0.39 = unsicher | 0.40-0.69 = mittel | 0.70-0.89 = gut | 0.90-1.00 = sehr sicher",
    "- Erlaubte sources: title, description, keyword, price, shipping, inferred",
    "- Normalisiere Markennamen: 'Eco Flow' → 'EcoFlow', 'BYD Battery' → 'BYD', 'Victron Energy' → 'Victron'",
    "- Zustand-Mapping: neu/unbenutzt/originalverpackt → new | neuwertig/kaum benutzt → like_new | gebraucht → used | defekt/Bastler → defective | unbekannt → unknown",
    "- Erlaubte Kategorien: solarspeicher, solarzaun, solaranlage, wechselrichter, skywind, unknown",
    "- Erlaubte Unterkategorien: speicher-lifepo4, speicher-hochvolt, speicher-niedervolt, hybridwechselrichter, mikrowechselrichter, zaunmodul, pv-komplettset, balkonkraftwerk-speicher, laderegler, kleinwindanlage",
    "- Wenn Ah und Spannung bekannt: capacityWh = Ah * V",
    "",
    "Antworte ausschliesslich mit validem JSON ohne Erklaerungen:",
    JSON.stringify({
      brand:               { value: null, confidence: 0, source: null },
      model:               { value: null, confidence: 0, source: null },
      productSeries:       { value: null, confidence: 0, source: null },
      category:            { value: "unknown", confidence: 0, source: null },
      subcategory:         { value: null, confidence: 0, source: null },
      productType:         { value: null, confidence: 0, source: null },
      wattage:             { value: null, confidence: 0, source: null },
      capacityWh:          { value: null, confidence: 0, source: null },
      voltage:             { value: null, confidence: 0, source: null },
      technology:          { value: null, confidence: 0, source: null },
      condition:           { value: "unknown", confidence: 0, source: null },
      seoMainKeyword:      { value: null, confidence: 0, source: null },
      seoSecondaryKeywords: [],
      seoIntent:           { value: "unknown", confidence: 0, source: null },
    }),
    "",
    `Listing: ${JSON.stringify(payload)}`,
  ].join("\n");
}

function safeJsonParse(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function toKnowledgeField<T>(
  raw: unknown,
  validator?: (v: unknown) => v is T
): KnowledgeExtractionField<T> {
  if (!raw || typeof raw !== "object") return emptyField<T>();
  const obj = raw as Record<string, unknown>;

  const value = obj.value;
  const confidence = typeof obj.confidence === "number"
    ? Math.min(1, Math.max(0, obj.confidence))
    : 0;
  const source = typeof obj.source === "string" ? obj.source as KnowledgeSource : null;

  const valid = validator ? validator(value) : value !== null && value !== undefined;
  if (!valid || value === null || value === undefined) {
    return { value: null, confidence: 0, source: null };
  }

  return { value: value as T, confidence, source };
}

function toStringField(raw: unknown): KnowledgeExtractionField<string> {
  return toKnowledgeField<string>(raw, (v): v is string => typeof v === "string" && v.trim().length > 0);
}

function toNumberField(raw: unknown): KnowledgeExtractionField<number> {
  return toKnowledgeField<number>(raw, (v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);
}

async function callOpenAI(prompt: string): Promise<Record<string, unknown>> {
  const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY nicht gesetzt.");

  const model = (process.env.OPENAI_MODEL ?? "gpt-4.1-mini").trim();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Du bist ein Knowledge-Extraction-Agent. Antworte ausschliesslich mit validem JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Knowledge Extraction AI-Call fehlgeschlagen (HTTP ${res.status})${details ? `: ${details}` : ""}`);
  }

  const payload = (await res.json()) as OpenAIChatResponse;
  const rawContent = payload.choices?.[0]?.message?.content?.trim();
  if (!rawContent) throw new Error("Knowledge Extraction AI-Call lieferte keine Daten.");

  return safeJsonParse(rawContent);
}

// ─── Schritt 3: Nachverarbeitung ──────────────────────────────────────────────

// Gewichtung gemäß WSP-Knowledge-Intelligence Skill
const COMPLETENESS_WEIGHTS: Array<{ check: (r: MarketKnowledgeResult, l: MarketListing) => boolean; weight: number }> = [
  { check: (r) => Boolean(r.category.value && r.category.value !== "unknown"), weight: 15 },
  { check: (r) => Boolean(r.brand.value),                                       weight: 15 },
  { check: (r) => Boolean(r.condition.value && r.condition.value !== "unknown"), weight: 10 },
  { check: (_r, l) => Boolean(l.price_cents && l.price_cents > 0),              weight: 10 },
  { check: (r) => Boolean(r.wattage.value || r.capacityWh.value),               weight: 10 },
  { check: (r) => Boolean(r.technology.value),                                  weight: 8  },
  { check: (r) => Boolean(r.model.value),                                       weight: 8  },
  { check: (_r, l) => Boolean(l.image_url),                                     weight: 7  },
  { check: (r) => Boolean(r.seoMainKeyword.value),                              weight: 7  },
  { check: (r) => r.shippingIncluded.value !== null,                            weight: 5  },
  { check: (_r, l) => Boolean(l.description && l.description.length >= 50),     weight: 5  },
];

export function calculateDataCompletenessScore(
  result: MarketKnowledgeResult,
  listing: MarketListing
): number {
  return COMPLETENESS_WEIGHTS.reduce(
    (sum, { check, weight }) => sum + (check(result, listing) ? weight : 0),
    0
  );
}

function scoreToClass(score: number): MarketKnowledgeResult["dataCompletenessClass"] {
  if (score >= 90) return "complete";
  if (score >= 70) return "good";
  if (score >= 50) return "partial";
  return "incomplete";
}

function averageConfidence(result: MarketKnowledgeResult): number {
  const fields: KnowledgeExtractionField<unknown>[] = [
    result.brand, result.model, result.productSeries, result.category,
    result.subcategory, result.productType, result.wattage, result.capacityWh,
    result.voltage, result.technology, result.condition,
    result.seoMainKeyword, result.seoIntent,
  ];
  const filled = fields.filter((f) => f.value !== null && f.confidence > 0);
  if (filled.length === 0) return 0;
  return filled.reduce((sum, f) => sum + f.confidence, 0) / filled.length;
}

function mergeWithPreprocessed(
  ai: Record<string, unknown>,
  preprocessed: Partial<MarketKnowledgeResult>,
  refs: MarketReferencePrice[],
  listing: MarketListing
): MarketKnowledgeResult {
  const result = defaultResult();

  // --- Marke: KI-Ergebnis + regelbasierte Normalisierung ---
  const rawBrand = toStringField(ai.brand);
  if (rawBrand.value) {
    const normalized = tryNormalizeBrand(rawBrand.value);
    result.brand = normalized
      ? { value: normalized, confidence: Math.min(1, rawBrand.confidence + 0.05), source: rawBrand.source }
      : rawBrand;
  }

  result.model        = toStringField(ai.model);
  result.productSeries = toStringField(ai.productSeries);
  result.subcategory  = toStringField(ai.subcategory);
  result.productType  = toStringField(ai.productType);
  result.wattage      = toNumberField(ai.wattage);
  result.technology   = toStringField(ai.technology);
  result.voltage      = toNumberField(ai.voltage);

  // Kapazität: wenn AI keinen Wh-Wert liefert, aber Ah × V berechenbar
  const aiCapacity = toNumberField(ai.capacityWh);
  if (aiCapacity.value) {
    result.capacityWh = aiCapacity;
  } else {
    const voltVal   = toNumberField(ai.voltage);
    const ahRaw = ai as Record<string, unknown>;
    const ahField = toNumberField(ahRaw.capacityAh);
    if (ahField.value && voltVal.value) {
      const wh = Math.round(ahField.value * voltVal.value);
      result.capacityWh = { value: wh, confidence: 0.75, source: "inferred" };
    }
  }

  // Zustand
  result.condition = toStringField(ai.condition);
  if (!result.condition.value || result.condition.value === "unknown") {
    result.condition = { value: "unknown", confidence: 0, source: null };
  }

  // Kategorie: KI-Ergebnis hat Vorrang vor keyword-Ableitung wenn confidence > 0.5
  const aiCategory = toStringField(ai.category);
  const kwCategory = preprocessed.category ?? inferCategoryFromKeyword(listing.keyword);
  if (aiCategory.value && aiCategory.value !== "unknown" && aiCategory.confidence > 0.5) {
    result.category = aiCategory;
  } else {
    result.category = kwCategory;
  }

  // SEO
  result.seoMainKeyword      = toStringField(ai.seoMainKeyword);
  result.seoIntent           = toStringField(ai.seoIntent);
  result.seoSecondaryKeywords = Array.isArray(ai.seoSecondaryKeywords)
    ? (ai.seoSecondaryKeywords as unknown[]).filter((s): s is string => typeof s === "string")
    : [];

  // Versand aus Vorverarbeitung
  if (preprocessed.shippingCost !== undefined) result.shippingCost = preprocessed.shippingCost!;
  if (preprocessed.shippingIncluded !== undefined) result.shippingIncluded = preprocessed.shippingIncluded!;

  // Preisqualität aus Vorverarbeitung
  if (preprocessed.priceQuality !== undefined) result.priceQuality = preprocessed.priceQuality!;

  // Data Completeness
  const score = calculateDataCompletenessScore(result, listing);
  result.dataCompletenessScore = score;
  result.dataCompletenessClass = scoreToClass(score);

  return result;
}

// ─── Hauptfunktion ────────────────────────────────────────────────────────────

export async function extractListingKnowledge(listing: MarketListing): Promise<MarketKnowledgeResult> {
  const prisma = getPrismaClient();

  // Referenzpreise laden für Preisqualität
  const refs = await prisma.marketReferencePrice.findMany({
    where: { keyword: listing.keyword.toLowerCase().trim() },
    orderBy: { vk_eur: "asc" },
  });

  // Schritt 1: Regelbasierte Vorverarbeitung
  const { cost, included } = parseShippingField(listing.shipping ?? null);
  const priceQualityValue = calculatePriceQuality(listing.price_cents ?? null, refs);

  const preprocessed: Partial<MarketKnowledgeResult> = {
    category: inferCategoryFromKeyword(listing.keyword),
    shippingCost: {
      value: cost,
      confidence: cost !== null ? 0.85 : 0,
      source: cost !== null ? "shipping" : null,
    },
    shippingIncluded: {
      value: included,
      confidence: included !== null ? 0.85 : 0,
      source: included !== null ? "shipping" : null,
    },
    priceQuality: {
      value: priceQualityValue,
      confidence: priceQualityValue !== "unknown" ? 0.80 : 0,
      source: priceQualityValue !== "unknown" ? "reference_price" : null,
    },
  };

  // Schritt 2: AI-Extraktion
  const prompt = buildExtractionPrompt(listing);
  let aiResult: Record<string, unknown> = {};
  const warnings: string[] = [];

  try {
    aiResult = await callOpenAI(prompt);
  } catch (err) {
    warnings.push(`AI-Extraktion fehlgeschlagen: ${(err as Error).message}`);
  }

  // Schritt 3: Nachverarbeitung
  const result = mergeWithPreprocessed(aiResult, preprocessed, refs, listing);
  result.warnings = warnings;
  result.notes = warnings.length > 0 ? "Teilweise nur regelbasierte Extraktion." : "";

  // Durchschnittliche Confidence berechnen
  const avgConf = averageConfidence(result);

  return { ...result, notes: result.notes, _avgConfidence: avgConf } as MarketKnowledgeResult & { _avgConfidence: number };
}

// Hilfsfunktion für die Route: extrahiert Kernfelder aus Metadata für direkte Spalten
export function extractCoreFields(result: MarketKnowledgeResult): {
  brand: string | null;
  model: string | null;
  productSeries: string | null;
  productType: string | null;
  subcategory: string | null;
  dataCompletenessScore: number;
  enrichmentConfidence: number;
} {
  return {
    brand:                result.brand.value,
    model:                result.model.value,
    productSeries:        result.productSeries.value,
    productType:          result.productType.value,
    subcategory:          result.subcategory.value,
    dataCompletenessScore: result.dataCompletenessScore,
    enrichmentConfidence: Math.round(averageConfidence(result) * 100) / 100,
  };
}
