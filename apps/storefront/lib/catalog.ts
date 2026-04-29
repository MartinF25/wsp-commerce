/**
 * Fetcher-Layer für die Commerce Catalog-API.
 *
 * Alle Funktionen sind typsicher über @wsp/types.
 * Die API liefert { data: T } bzw. { data: T[], meta: {...} } –
 * dieser Layer normalisiert das auf die Contract-Typen aus @wsp/contracts.
 *
 * cache: "no-store" als sicherer SSR-Default (kein stales Caching ohne explizite
 * Revalidierungsstrategie). Kann je Route mit { next: { revalidate: N } } überschrieben werden.
 */

import type {
  CatalogFilter,
  ProductListResult,
  ProductDetail,
  CategorySummary,
  CategoryDetail,
} from "@wsp/types";
import { env } from "./env";

// ─── Interne API-Envelope-Typen ───────────────────────────────────────────────

/** Paginierte Listen-Response der Commerce API */
type ApiListResponse<T> = {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    sortBy: string;
  };
};

/** Detail-Response der Commerce API */
type ApiDetailResponse<T> = {
  data: T;
};

// ─── Query-Builder ────────────────────────────────────────────────────────────

function buildQuery(filter: CatalogFilter & { limit?: number; offset?: number; sortBy?: string }): string {
  const params = new URLSearchParams();

  if (filter.type !== undefined) params.set("type", filter.type);
  if (filter.category !== undefined) params.set("category", filter.category);
  if (filter.purchasable !== undefined) params.set("purchasable", String(filter.purchasable));
  if (filter.limit !== undefined) params.set("limit", String(filter.limit));
  if (filter.offset !== undefined) params.set("offset", String(filter.offset));
  if (filter.sortBy !== undefined) params.set("sortBy", filter.sortBy);

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

/**
 * Paginierte, sortierbare Liste aktiver Produkte.
 *
 * Mappt die API-Envelope { data: ProductSummary[], meta: {...} }
 * auf ProductListResult { items, total, limit, offset }.
 */
export async function fetchProducts(
  filter?: CatalogFilter & { limit?: number; offset?: number; sortBy?: string }
): Promise<ProductListResult> {
  const qs = filter ? buildQuery(filter) : "";
  const url = `${env.COMMERCE_API_URL}/api/catalog/products${qs}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(
      `fetchProducts fehlgeschlagen: ${res.status} ${res.statusText} (${url})`
    );
  }

  const body = (await res.json()) as ApiListResponse<ProductListResult["items"][number]>;

  return {
    items: body.data,
    total: body.meta.total,
    limit: body.meta.limit,
    offset: body.meta.offset,
  };
}

/**
 * Einzelnes aktives Produkt per Slug.
 * Gibt null zurück wenn das Produkt nicht gefunden wird (404).
 * Wirft bei anderen HTTP-Fehlern.
 */
export async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  const url = `${env.COMMERCE_API_URL}/api/catalog/products/${encodeURIComponent(slug)}`;

  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(
      `fetchProduct fehlgeschlagen: ${res.status} ${res.statusText} (${url})`
    );
  }

  const body = (await res.json()) as ApiDetailResponse<ProductDetail>;
  return body.data;
}

/**
 * Alle Kategorien als flache Liste mit voraggregierten Produktzählern.
 * Geeignet für Navigation und Filter-Sidebars.
 */
export async function fetchCategories(): Promise<CategorySummary[]> {
  const url = `${env.COMMERCE_API_URL}/api/catalog/categories`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(
      `fetchCategories fehlgeschlagen: ${res.status} ${res.statusText} (${url})`
    );
  }

  const body = (await res.json()) as ApiDetailResponse<CategorySummary[]>;
  return body.data;
}

/**
 * Einzelne Kategorie per Slug mit allen aktiven Produkten.
 * Gibt null zurück wenn die Kategorie nicht gefunden wird (404).
 * Wirft bei anderen HTTP-Fehlern.
 */
export async function fetchCategory(slug: string): Promise<CategoryDetail | null> {
  const url = `${env.COMMERCE_API_URL}/api/catalog/categories/${encodeURIComponent(slug)}`;

  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(
      `fetchCategory fehlgeschlagen: ${res.status} ${res.statusText} (${url})`
    );
  }

  const body = (await res.json()) as ApiDetailResponse<CategoryDetail>;
  return body.data;
}
