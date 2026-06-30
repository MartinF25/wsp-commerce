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
  "wechselrichter",
  "laderegler",
  "optimizer",
  "halterung",
  "unknown",
];

export function inferProductCategory(
  listing: { keyword: string; title: string; description?: string | null }
): MarketProductCategory {
  const haystack = `${listing.keyword} ${listing.title} ${listing.description ?? ""}`.toLowerCase();

  if (haystack.includes("wechselrichter") || haystack.includes("inverter") || haystack.includes("hoymiles") || haystack.includes("deye") || haystack.includes("growatt") || haystack.includes("mikrowechselrichter")) {
    return "wechselrichter";
  }
  if (haystack.includes("laderegler") || haystack.includes("mppt") || haystack.includes("pwm") || haystack.includes("charge controller")) {
    return "laderegler";
  }
  if (haystack.includes("optimizer") || haystack.includes("optimierer") || haystack.includes("leistungsoptimierer") || haystack.includes("solaredge optimizer") || haystack.includes("tigo")) {
    return "optimizer";
  }
  if (haystack.includes("halterung") || haystack.includes("montage") || haystack.includes("befestigung") || haystack.includes("aufständerung") || haystack.includes("gestell") || haystack.includes("solarmodul halter")) {
    return "halterung";
  }
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
