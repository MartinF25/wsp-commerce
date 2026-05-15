/**
 * Fetcher-Layer für Bundle-Daten aus der Commerce API.
 */

import type { Bundle } from "@wsp/types";
import { env } from "./env";

type ApiDetailResponse<T> = { data: T };

/**
 * Lädt alle aktiven Bundles für ein Produkt (per Produkt-ID).
 * Schließt Category-Bundles automatisch ein (serverseitig).
 * Gibt leeres Array zurück bei Fehler (resilient – Bundles sind non-critical).
 */
export async function fetchBundlesForProduct(
  productId: string,
  locale = "de"
): Promise<Bundle[]> {
  try {
    const url = `${env.COMMERCE_API_URL}/api/catalog/bundles?product_id=${encodeURIComponent(productId)}&locale=${locale}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const body = (await res.json()) as ApiDetailResponse<Bundle[]>;
    return body.data;
  } catch {
    return [];
  }
}

/**
 * Lädt alle aktiven Bundles für eine Kategorie (per Kategorie-ID).
 */
export async function fetchBundlesForCategory(
  categoryId: string,
  locale = "de"
): Promise<Bundle[]> {
  try {
    const url = `${env.COMMERCE_API_URL}/api/catalog/bundles?category_id=${encodeURIComponent(categoryId)}&locale=${locale}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const body = (await res.json()) as ApiDetailResponse<Bundle[]>;
    return body.data;
  } catch {
    return [];
  }
}
