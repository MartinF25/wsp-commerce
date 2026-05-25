/**
 * Feature Visual Engine – Storefront Data Layer
 *
 * Fetcher-Funktionen für den Feature-Visual-Stack.
 * Server-only (Next.js App Router Server Components).
 *
 * Caching-Strategie:
 * - Settings: revalidate 300 s (ändern sich selten)
 * - Resolved features: no-store (produktabhängig, kurze TTL im Service)
 *
 * Alle Funktionen sind fail-safe: bei API-Fehler wird null/[] zurückgegeben,
 * damit die Produktseite ohne Feature-Visuals weiter rendert.
 */

import type {
  FeatureWithVisual,
  FeatureVisualSettings,
  ResolvedFeatureVisual,
} from "@wsp/contracts";
import { env } from "./env";

const API_BASE = env.COMMERCE_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiResponse<T> = { data: T };

// ─── Settings ────────────────────────────────────────────────────────────────

let _settingsCache: FeatureVisualSettings | null = null;
let _settingsCacheTs = 0;
const SETTINGS_TTL = 300_000; // 5 min

/**
 * Lädt die globalen Feature-Visual-Einstellungen vom Commerce Service.
 * Gecacht für 5 Minuten – für SSR-Performance.
 */
export async function fetchFeatureVisualSettings(): Promise<FeatureVisualSettings | null> {
  const now = Date.now();
  if (_settingsCache && now - _settingsCacheTs < SETTINGS_TTL) {
    return _settingsCache;
  }

  try {
    const res = await fetch(`${API_BASE}/api/catalog/feature-visuals/settings`, {
      next: { revalidate: 300 },
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) return _settingsCache; // Fallback auf alten Cache

    const json = (await res.json()) as ApiResponse<FeatureVisualSettings>;
    _settingsCache = json.data;
    _settingsCacheTs = now;
    return _settingsCache;
  } catch (err) {
    console.warn("[feature-visuals] Settings fetch failed:", err);
    return _settingsCache;
  }
}

// ─── Product Feature Resolution ───────────────────────────────────────────────

/**
 * Löst Feature-Strings eines Produkts gegen vorhandene Visuals auf.
 * Gibt die angereicherten Feature-Objekte zurück (raw + visual).
 *
 * @param featureStrings - Array von Feature-Strings aus ProductTranslation.features
 * @param options.productId - UUID des Produkts (für product-scope Visuals)
 * @param options.categoryId - UUID der Kategorie (für category-scope Visuals)
 * @param options.locale - Anzeigesprache
 */
export async function resolveProductFeatures(
  featureStrings: string[] | unknown,
  options: {
    productId?: string;
    categoryId?: string;
    locale: string;
  },
): Promise<FeatureWithVisual[]> {
  // Normalize: features may be null/undefined or not a string array yet
  const features = Array.isArray(featureStrings)
    ? featureStrings.filter((f): f is string => typeof f === "string")
    : [];

  if (features.length === 0) return [];

  try {
    const params = new URLSearchParams();
    features.forEach((f) => params.append("features[]", f));
    if (options.productId) params.set("productId", options.productId);
    if (options.categoryId) params.set("categoryId", options.categoryId);
    params.set("locale", options.locale);

    const res = await fetch(
      `${API_BASE}/api/catalog/feature-visuals/resolve?${params.toString()}`,
      {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!res.ok) {
      // Return features without visuals as fallback
      return features.map((raw) => {
        const colonIdx = raw.indexOf(":");
        const key = colonIdx > 0 ? raw.slice(0, colonIdx).trim() : null;
        const value = colonIdx > 0 ? raw.slice(colonIdx + 1).trim() : raw.trim();
        return { raw, key, value, visual: null };
      });
    }

    const json = (await res.json()) as ApiResponse<FeatureWithVisual[]>;
    return json.data;
  } catch (err) {
    console.warn("[feature-visuals] Resolve fetch failed:", err);
    // Graceful degradation: return features without visuals
    return features.map((raw) => {
      const colonIdx = raw.indexOf(":");
      const key = colonIdx > 0 ? raw.slice(0, colonIdx).trim() : null;
      const value = colonIdx > 0 ? raw.slice(colonIdx + 1).trim() : raw.trim();
      return { raw, key, value, visual: null };
    });
  }
}

/**
 * Lädt kompakte Visuals für Produktkarten (miniature mode).
 * Gibt maximal `maxIcons` Visuals zurück.
 */
export async function resolveMiniatureVisuals(
  featureStrings: string[] | unknown,
  options: {
    productId?: string;
    categoryId?: string;
    locale: string;
    maxIcons?: number;
  },
): Promise<ResolvedFeatureVisual[]> {
  const features = await resolveProductFeatures(featureStrings, options);
  const max = options.maxIcons ?? 4;
  return features
    .filter((f) => f.visual !== null)
    .slice(0, max)
    .map((f) => f.visual!);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Prüft ob Feature-Visuals für eine bestimmte Seite aktiviert sind.
 * Fail-safe: gibt true zurück wenn Settings nicht geladen werden konnten.
 */
export function isFeatureVisualsEnabled(
  settings: FeatureVisualSettings | null,
  location: "product_page" | "quick_view" | "miniature" | "faceted_search" | "collection" | "search_results",
): boolean {
  if (!settings) return true; // Fail open: show visuals by default

  const map: Record<typeof location, keyof FeatureVisualSettings> = {
    product_page:    "enable_product_page",
    quick_view:      "enable_quick_view",
    miniature:       "enable_miniature",
    faceted_search:  "enable_faceted_search",
    collection:      "enable_collection",
    search_results:  "enable_search_results",
  };

  return settings[map[location]] as boolean ?? true;
}
