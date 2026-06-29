// Gemeinsame Kategorie-Logik für alle Market-Agents.
// Vorher dupliziert in marketDealAnalyzer.ts und marketProductDraftGenerator.ts.
// MarketProductCategory entspricht dem Prisma Enum – keine eigenen Werte hinzufügen.

import type { MarketProductCategory } from "@prisma/client";

export type { MarketProductCategory };

const VALID_CATEGORIES: MarketProductCategory[] = [
  "solarzaun",
  "solarspeicher",
  "solaranlage",
  "skywind",
  "unknown",
];

export function inferProductCategory(
  listing: { keyword: string; title: string; description?: string | null }
): MarketProductCategory {
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

export function normalizeCategory(
  value: unknown,
  fallback: MarketProductCategory
): MarketProductCategory {
  return typeof value === "string" && VALID_CATEGORIES.includes(value as MarketProductCategory)
    ? (value as MarketProductCategory)
    : fallback;
}
