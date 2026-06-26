import type { MarketListing, MarketReferencePrice } from "@prisma/client";
import { getPrismaClient } from "../lib/prisma";

type DealRecommendation = "IMPORT" | "REVIEW" | "IGNORE";
type DealRiskLevel = "LOW" | "MEDIUM" | "HIGH";
type MarketProductCategory =
  | "solarzaun"
  | "solarspeicher"
  | "solaranlage"
  | "skywind"
  | "unknown";

export interface MarketDealAnalysisResult {
  dealScore: number;
  recommendation: DealRecommendation;
  riskLevel: DealRiskLevel;
  productCategory: MarketProductCategory;
  estimatedMargin: number;
  seoPotential: number;
  aiComment: string;
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

function toInt(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return fallback;
}

function inferRecommendation(score: number): DealRecommendation {
  if (score >= 80) return "IMPORT";
  if (score >= 60) return "REVIEW";
  return "IGNORE";
}

function inferRiskLevel(score: number): DealRiskLevel {
  if (score >= 80) return "LOW";
  if (score >= 60) return "MEDIUM";
  return "HIGH";
}

function inferProductCategory(listing: Pick<MarketListing, "keyword" | "title" | "description">): MarketProductCategory {
  const haystack = `${listing.keyword} ${listing.title} ${listing.description ?? ""}`.toLowerCase();

  if (haystack.includes("solarspeicher") || haystack.includes("speicher") || haystack.includes("akku")) {
    return "solarspeicher";
  }
  if (haystack.includes("solarzaun") || haystack.includes("zaun")) {
    return "solarzaun";
  }
  if (haystack.includes("solaranlage") || haystack.includes("pv") || haystack.includes("photovoltaik")) {
    return "solaranlage";
  }
  if (haystack.includes("skywind") || haystack.includes("windrad") || haystack.includes("kleinwind")) {
    return "skywind";
  }
  return "unknown";
}

function normalizeCategory(value: unknown, fallback: MarketProductCategory): MarketProductCategory {
  const valid: MarketProductCategory[] = ["solarzaun", "solarspeicher", "solaranlage", "skywind", "unknown"];
  return typeof value === "string" && valid.includes(value as MarketProductCategory)
    ? (value as MarketProductCategory)
    : fallback;
}

function normalizeRecommendation(value: unknown, score: number): DealRecommendation {
  const valid: DealRecommendation[] = ["IMPORT", "REVIEW", "IGNORE"];
  return typeof value === "string" && valid.includes(value as DealRecommendation)
    ? (value as DealRecommendation)
    : inferRecommendation(score);
}

function normalizeRiskLevel(value: unknown, score: number): DealRiskLevel {
  const valid: DealRiskLevel[] = ["LOW", "MEDIUM", "HIGH"];
  return typeof value === "string" && valid.includes(value as DealRiskLevel)
    ? (value as DealRiskLevel)
    : inferRiskLevel(score);
}

function safeJsonParse(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function buildReferenceContext(refs: MarketReferencePrice[]): string {
  if (refs.length === 0) return "";
  const lines = refs.map((r) => {
    const ek = r.ek_eur != null ? ` | EK ca. ${r.ek_eur} EUR` : "";
    const notes = r.notes ? ` (${r.notes})` : "";
    return `  - ${r.productName}: VK neu ca. ${r.vk_eur} EUR${ek}${notes}`;
  });
  return [
    "Marktpreise (Neupreis als Referenz fuer Preisbewertung):",
    ...lines,
    "Score-Hilfe basierend auf Rabatt zum VK-Neupreis:",
    "  65%+ Rabatt → Preisattraktivitaet 28-30 | 40-65% → 18-27 | unter 40% → 0-17",
  ].join("\n");
}

function buildPrompt(listing: MarketListing, refs: MarketReferencePrice[] = []): string {
  const payload = {
    id: listing.id,
    keyword: listing.keyword,
    title: listing.title,
    description: listing.description ?? null,
    priceCents: listing.price_cents,
    priceRaw: listing.price_raw ?? null,
    location: listing.location ?? null,
    shipping: listing.shipping ?? null,
    imageUrl: listing.image_url ?? null,
  };

  const referenceContext = buildReferenceContext(refs);

  return [
    "Du bewertest Kleinanzeigen-Angebote fuer einen WSP-Commerce Webshop.",
    "Alle Kategorien werden gleich behandelt – bewerте objektiv nach Preis, Zustand und Potenzial.",
    referenceContext || "",
    "Bewertungsschema (Punkte addieren):",
    "- Preisattraktivitaet (Rabatt zum Marktpreis): 0-30",
    "- Markenwert / Hersteller: 0-20",
    "- Zustand / Vollstaendigkeit: 0-15",
    "- Wiederverkaufspotenzial: 0-15",
    "- SEO-Potenzial: 0-10",
    "- Risiko Abzug (fehlende Infos, defekt, VB ohne Preis): 0-10",
    "Empfehlung:",
    "- 80-100 = IMPORT",
    "- 60-79 = REVIEW",
    "- 0-59 = IGNORE",
    "Wenn keine Beschreibung vorhanden ist, arbeite mit Titel, Preis und Kategorie.",
    "Gib ausschliesslich valides JSON mit genau diesen Feldern zurueck:",
    '{"dealScore":0,"recommendation":"IMPORT","riskLevel":"LOW","productCategory":"solarspeicher","estimatedMargin":0,"seoPotential":0,"aiComment":"Kurze Begruendung auf Deutsch"}',
    `Angebot: ${JSON.stringify(payload)}`,
  ].filter(Boolean).join("\n");
}

export async function analyzeMarketListingDeal(listing: MarketListing): Promise<MarketDealAnalysisResult> {
  const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt.");
  }

  const prisma = getPrismaClient();
  const refs = await prisma.marketReferencePrice.findMany({
    where: { keyword: listing.keyword.toLowerCase().trim() },
    orderBy: { vk_eur: "asc" },
  });

  const model = (process.env.OPENAI_MODEL ?? "gpt-4.1-mini").trim();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
          content: "Du bist ein Deal-Score-Agent fuer Gebrauchtangebote. Antworte nur mit validem JSON.",
        },
        {
          role: "user",
          content: buildPrompt(listing, refs),
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`KI-Analyse fehlgeschlagen (HTTP ${response.status})${details ? `: ${details}` : ""}`);
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const rawContent = payload.choices?.[0]?.message?.content?.trim();

  if (!rawContent) {
    throw new Error("KI-Analyse lieferte keine Daten.");
  }

  const parsed = safeJsonParse(rawContent);
  const inferredCategory = inferProductCategory(listing);
  const dealScore = clamp(toInt(parsed.dealScore, 0), 0, 100);
  const seoPotential = clamp(toInt(parsed.seoPotential, 0), 0, 10);
  const estimatedMargin = Math.max(0, toInt(parsed.estimatedMargin, 0));
  const recommendation = normalizeRecommendation(parsed.recommendation, dealScore);
  const riskLevel = normalizeRiskLevel(parsed.riskLevel, dealScore);
  const productCategory = normalizeCategory(parsed.productCategory, inferredCategory);
  const aiComment =
    typeof parsed.aiComment === "string" && parsed.aiComment.trim().length > 0
      ? parsed.aiComment.trim().slice(0, 1000)
      : "Automatische Analyse ohne ausreichende Begruendung.";

  return {
    dealScore,
    recommendation,
    riskLevel,
    productCategory,
    estimatedMargin,
    seoPotential,
    aiComment,
  };
}
