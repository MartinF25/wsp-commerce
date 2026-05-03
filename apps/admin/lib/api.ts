/**
 * Typed client für die Commerce Admin API.
 * Läuft ausschließlich server-side (Server Components / Route Handlers).
 */

const BASE_URL = (process.env.COMMERCE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ADMIN_KEY = process.env.ADMIN_API_KEY ?? "";

// ─── Typen ────────────────────────────────────────────────────────────────────

export type Locale = "de" | "en" | "es";

export type ProductType = "direct_purchase" | "configurable" | "inquiry_only";
export type ProductStatus = "draft" | "active" | "archived";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  parent_id: string | null;
  productCount?: number;
}

export interface Translation {
  id: string;
  product_id: string;
  locale: Locale;
  name: string;
  short_description: string | null;
  description: string | null;
  delivery_note: string | null;
  features: unknown[];
  meta_title: string | null;
  meta_description: string | null;
  mounting_note: string | null;
  project_note: string | null;
}

export interface VariantTranslation {
  id: string;
  variant_id: string;
  locale: Locale;
  name: string;
}

export interface Variant {
  id: string;
  product_id: string;
  sku: string;
  is_active: boolean;
  price_cents: number | null;
  sale_price_cents: number | null;
  currency: string;
  stock_quantity: number;
  attributes: Record<string, unknown>;
  weight_kg: number | null;
  dimensions: Record<string, unknown> | null;
  translations: VariantTranslation[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

export interface ProductDocument {
  id: string;
  product_id: string;
  name: string;
  url: string;
  type: string;
  sort_order: number;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  status: ProductStatus;
  product_type: ProductType;
  category: { id: string; slug: string; name: string } | null;
  variantCount: number;
  created_at: string;
  updated_at: string;
}

export interface ProductDetail {
  id: string;
  slug: string;
  product_type: ProductType;
  status: ProductStatus;
  category_id: string | null;
  category: Category | null;
  paypal_url: string | null;
  stripe_url: string | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  sale_label: string | null;
  show_countdown: boolean;
  translations: Translation[];
  variants: Variant[];
  images: ProductImage[];
  documents: ProductDocument[];
  created_at: string;
  updated_at: string;
}

// ─── HTTP-Helfer ──────────────────────────────────────────────────────────────

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/admin${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_KEY,
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json();

  if (!res.ok) {
    const msg = json?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json.data as T;
}

// ─── Kategorien ───────────────────────────────────────────────────────────────

export const api = {
  categories: {
    list: () => request<Category[]>("/categories"),
    get: (id: string) => request<Category>(`/categories/${id}`),
    create: (data: Omit<Category, "id" | "productCount">) =>
      request<Category>("/categories", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Omit<Category, "id" | "productCount">>) =>
      request<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/categories/${id}`, { method: "DELETE" }),
    setVisibility: (id: string, is_active: boolean) =>
      request<Category>(`/categories/${id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ is_active }),
      }),
  },

  products: {
    list: () => request<ProductSummary[]>("/products"),
    get: (id: string) => request<ProductDetail>(`/products/${id}`),
    create: (data: {
      slug?: string;
      product_type?: ProductType;
      status?: ProductStatus;
      category_id?: string | null;
      translations: Partial<Record<Locale, Partial<Translation>>>;
    }) => request<ProductDetail>("/products", { method: "POST", body: JSON.stringify(data) }),
    update: (
      id: string,
      data: {
        slug?: string;
        product_type?: ProductType;
        status?: ProductStatus;
        category_id?: string | null;
        paypal_url?: string | null;
        stripe_url?: string | null;
        sale_starts_at?: string | null;
        sale_ends_at?: string | null;
        sale_label?: string | null;
        show_countdown?: boolean;
        translations?: Partial<Record<Locale, Partial<Translation>>>;
      }
    ) => request<ProductDetail>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/products/${id}`, { method: "DELETE" }),
    setStatus: (id: string, status: ProductStatus) =>
      request<{ id: string; status: ProductStatus }>(`/products/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  images: {
    list: (productId: string) => request<ProductImage[]>(`/products/${productId}/images`),
    create: (productId: string, data: { url: string; alt?: string; sort_order?: number }) =>
      request<ProductImage>(`/products/${productId}/images`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (imgId: string, data: { url?: string; alt?: string; sort_order?: number }) =>
      request<ProductImage>(`/images/${imgId}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (imgId: string) => request<void>(`/images/${imgId}`, { method: "DELETE" }),
  },

  variants: {
    list: (productId: string) => request<Variant[]>(`/products/${productId}/variants`),
    create: (productId: string, data: Partial<Omit<Variant, "id" | "product_id" | "translations">>) =>
      request<Variant>(`/products/${productId}/variants`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      varId: string,
      data: Partial<Omit<Variant, "id" | "product_id">> & {
        translations?: Partial<Record<Locale, { name: string }>>;
      }
    ) => request<Variant>(`/variants/${varId}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (varId: string) => request<void>(`/variants/${varId}`, { method: "DELETE" }),
  },

  documents: {
    list: (productId: string) => request<ProductDocument[]>(`/products/${productId}/documents`),
    create: (productId: string, data: { name: string; url: string; type?: string; sort_order?: number }) =>
      request<ProductDocument>(`/products/${productId}/documents`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (docId: string, data: Partial<Omit<ProductDocument, "id" | "product_id">>) =>
      request<ProductDocument>(`/documents/${docId}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (docId: string) => request<void>(`/documents/${docId}`, { method: "DELETE" }),
  },
};
