/**
 * Typed client für die Commerce Admin API.
 * Läuft ausschließlich server-side (Server Components / Route Handlers).
 */

const BASE_URL = (process.env.COMMERCE_API_URL ?? "http://localhost:3000").trim().replace(/\/$/, "");
const ADMIN_KEY = (process.env.ADMIN_API_KEY ?? "").trim();

// ─── Typen ────────────────────────────────────────────────────────────────────

export type Locale = "de" | "en" | "es";

// ─── Widerruf-Typen ────────────────────────────────────────────────────────

export type CancellationStatus =
  | "widerruf_beantragt"
  | "widerruf_in_pruefung"
  | "widerruf_akzeptiert"
  | "widerruf_abgelehnt";

export type CancellationMode = "always_submit" | "plausibility_check" | "auto_reject";

export interface CancellationRequest {
  id: string;
  order_reference: string;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  message: string | null;
  status: CancellationStatus;
  deadline_check_result: string | null;
  excluded_items_detected: boolean;
  locale: string;
  admin_notes: string | null;
  customer_email_sent_at: string | null;
  admin_email_sent_at: string | null;
  rejection_email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  logs?: CancellationLog[];
}

export interface CancellationLog {
  id: string;
  request_id: string;
  event: string;
  details: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface CancellationSettings {
  id: string;
  is_active: boolean;
  deadline_days: number;
  delivery_buffer_days: number;
  mode: CancellationMode;
  admin_email: string;
  show_footer_link: boolean;
  show_account_link: boolean;
  privacy_page_url: string | null;
  cancellation_policy_url: string | null;
  noindex: boolean;
  meta_title_de: string | null;
  meta_title_en: string | null;
  meta_title_es: string | null;
  meta_description_de: string | null;
  meta_description_en: string | null;
  meta_description_es: string | null;
}

export interface CancellationExcludedProduct {
  id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  reason: string | null;
  created_at: string;
}

export interface CancellationExcludedCategory {
  id: string;
  category_id: string;
  category_slug: string;
  category_name: string;
  reason: string | null;
  created_at: string;
}

export type ProductType = "direct_purchase" | "configurable" | "inquiry_only" | "affiliate_external";
export type ProductStatus = "draft" | "active" | "archived";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  parent_id: string | null;
  productCount?: number;
}

export interface CategoryTranslation {
  id: string;
  category_id: string;
  locale: Locale;
  name: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
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
  affiliate_provider: string | null;
  affiliate_url: string | null;
  affiliate_asin: string | null;
  affiliate_button_label: string | null;
  affiliate_disclosure: string | null;
  affiliate_enabled: boolean;
  translations: Translation[];
  variants: Variant[];
  images: ProductImage[];
  documents: ProductDocument[];
  created_at: string;
  updated_at: string;
}

export interface AffiliateStats {
  productId: string;
  totalClicks: number;
  clicksLast7Days: number;
  clicksLast30Days: number;
  lastClickedAt: string | null;
}

export type AffiliateHealthStatus = "ok" | "invalid_url" | "missing" | "timeout" | "blocked" | "error";

export interface AffiliateProductStats {
  productId: string;
  slug: string;
  title: string;
  status: ProductStatus;
  affiliateProvider: string | null;
  affiliateUrl: string | null;
  affiliateHealthStatus: AffiliateHealthStatus | null;
  affiliateHealthMessage: string | null;
  affiliateLastCheckedAt: string | null;
  totalClicks: number;
  clicksLast7Days: number;
  clicksLast30Days: number;
  lastClickedAt: string | null;
}

export interface AffiliateStatsOverview {
  summary: {
    totalClicks: number;
    totalLast7Days: number;
    totalLast30Days: number;
  };
  bySource: Record<string, number>;
  byLocale: Record<string, number>;
  byDevice: Record<string, number>;
  products: AffiliateProductStats[];
}

// ─── Ticker-Typen ────────────────────────────────────────────────────────────

export type LiveTickerStatus = "draft" | "active" | "archived";
export type LiveTickerType = "info" | "offer" | "availability" | "blog" | "product" | "warning";
export type LiveTickerScope = "global" | "product" | "category" | "solution";

export interface TickerTranslation {
  locale: Locale;
  text: string;
  link_label: string | null;
}

export interface TickerMessage {
  id: string;
  status: LiveTickerStatus;
  type: LiveTickerType;
  scope: LiveTickerScope;
  product_id: string | null;
  category_id: string | null;
  solution_slug: string | null;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  link_href: string | null;
  icon: string | null;
  translations: TickerTranslation[];
  created_at: string;
  updated_at: string;
}

export interface TickerInput {
  type: LiveTickerType;
  scope: LiveTickerScope;
  product_id?: string | null;
  category_id?: string | null;
  solution_slug?: string | null;
  priority?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  link_href?: string | null;
  icon?: string | null;
  translations: TickerTranslation[];
}

// ─── Bundle-Typen ─────────────────────────────────────────────────────────────

export type BundleStatus = "active" | "inactive";
export type BundleDiscountType = "none" | "percentage" | "fixed" | "per_item";
export type BundleDiscountMode = "all_items" | "min_count" | "any_item";
export type BundleDisplayMode = "card" | "list" | "slider" | "tabs";

export interface BundleTranslation {
  locale: Locale;
  title: string;
  description: string | null;
  tab_name: string | null;
}

export interface BundleItemSummary {
  id: string;
  product: {
    id: string;
    slug: string;
    name: string;
    coverImageUrl: string | null;
  };
  quantity: number;
  is_required: boolean;
  sort_order: number;
  discount_percent: number | null;
  discount_cents: number | null;
}

export interface BundlePriceInfo {
  originalTotalCents: number;
  discountedTotalCents: number;
  savingsCents: number;
  savingsPercent: number;
  currencyCode: string;
  hasDiscount: boolean;
  isTimeLimitedDiscount: boolean;
  discountEndsAt: string | null;
}

export interface BundleSummary {
  id: string;
  status: BundleStatus;
  title: string;
  description: string | null;
  tab_name: string | null;
  image_url: string | null;
  valid_from: string | null;
  valid_until: string | null;
  discount_type: BundleDiscountType;
  discount_percent: number | null;
  discount_cents: number | null;
  discount_mode: BundleDiscountMode;
  min_items_for_discount: number;
  display_mode: BundleDisplayMode;
  tab_group: string | null;
  sort_order: number;
  items: BundleItemSummary[];
  priceInfo: BundlePriceInfo | null;
  translations?: BundleTranslation[];
}

export interface BundleInput {
  status?: BundleStatus;
  sort_order?: number;
  image_url?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  discount_type?: BundleDiscountType;
  discount_percent?: number | null;
  discount_cents?: number | null;
  discount_mode?: BundleDiscountMode;
  min_items_for_discount?: number;
  valid_from_discount?: string | null;
  valid_until_discount?: string | null;
  display_mode?: BundleDisplayMode;
  tab_group?: string | null;
  translations: BundleTranslation[];
}

export interface BundleItemInput {
  product_id: string;
  quantity?: number;
  is_required?: boolean;
  sort_order?: number;
  discount_percent?: number | null;
  discount_cents?: number | null;
}

// ─── Sticker-Typen ────────────────────────────────────────────────────────────

export type StickerStatus = "active" | "inactive";
export type StickerType = "image" | "text" | "css_badge" | "tooltip" | "combined";
export type StickerPosition = "top_left" | "top_right" | "bottom_left" | "bottom_right" | "center" | "custom";
export type StickerRuleType = "all_products" | "category" | "price_range" | "availability" | "new_arrival";

export interface StickerTranslation {
  id?: string;
  locale: Locale;
  text: string | null;
  tooltip: string | null;
  tooltip_link_label: string | null;
  tooltip_link_url: string | null;
  link_url: string | null;
}

export interface StickerMatrixEntry {
  product_id: string;
  product_name: string;
  product_slug: string;
  stickers: {
    id: string;
    name: string;
    type: string;
    source: string;
    text_color: string | null;
    bg_color: string | null;
    border_radius: string | null;
    text: string | null;
  }[];
}

export interface StickerProductOverride {
  id: string;
  sticker_id: string;
  product_id: string;
  enabled: boolean;
  excluded: boolean;
  product: { id: string; slug: string; name: string };
}

export interface StickerRule {
  id: string;
  rule_type: StickerRuleType;
  category_id: string | null;
  price_min_cents: number | null;
  price_max_cents: number | null;
  availability_status: string | null;
  new_arrival_days: number | null;
}

export interface StickerAdmin {
  id: string;
  name: string;
  status: StickerStatus;
  priority: number;
  sort_order: number;
  type: StickerType;
  image_url: string | null;
  text_color: string | null;
  bg_color: string | null;
  border_color: string | null;
  font_size: string | null;
  font_bold: boolean;
  font_italic: boolean;
  border_radius: string | null;
  padding: string | null;
  opacity: number | null;
  css_class: string | null;
  custom_css: string | null;
  link_url: string | null;
  position: StickerPosition;
  position_x: number | null;
  position_y: number | null;
  size_config: Record<string, string>;
  valid_from: string | null;
  valid_until: string | null;
  store_id: string | null;
  customer_groups: string[] | null;
  max_per_product: number;
  allow_override: boolean;
  created_at: string;
  updated_at: string;
  translations: StickerTranslation[];
  rules: StickerRule[];
  override_count: number;
}

export interface StickerInput {
  name: string;
  status?: StickerStatus;
  priority?: number;
  sort_order?: number;
  type?: StickerType;
  image_url?: string | null;
  text_color?: string | null;
  bg_color?: string | null;
  border_color?: string | null;
  font_size?: string | null;
  font_bold?: boolean;
  font_italic?: boolean;
  border_radius?: string | null;
  padding?: string | null;
  opacity?: number | null;
  css_class?: string | null;
  custom_css?: string | null;
  link_url?: string | null;
  position?: StickerPosition;
  position_x?: number | null;
  position_y?: number | null;
  size_config?: Record<string, string>;
  valid_from?: string | null;
  valid_until?: string | null;
  store_id?: string | null;
  customer_groups?: string[] | null;
  max_per_product?: number;
  allow_override?: boolean;
  translations: Array<{
    locale: Locale;
    text?: string | null;
    tooltip?: string | null;
    tooltip_link_label?: string | null;
    tooltip_link_url?: string | null;
    link_url?: string | null;
  }>;
  rules?: Array<{
    rule_type: StickerRuleType;
    category_id?: string | null;
    price_min_cents?: number | null;
    price_max_cents?: number | null;
    availability_status?: string | null;
    new_arrival_days?: number | null;
  }>;
}

// ─── Blog-Typen ───────────────────────────────────────────────────────────────

export type BlogStatus = "draft" | "published" | "archived";

export interface BlogTag {
  id: string;
  slug: string;
  name: string;
  postCount?: number;
}

export interface BlogPostTranslation {
  locale: Locale;
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  updatedAt: string;
}

export interface BlogPostSummary {
  id: string;
  slug: string;
  status: BlogStatus;
  featured: boolean;
  coverImageUrl: string | null;
  publishedAt: string | null;
  readingTimeMinutes: number | null;
  authorName: string | null;
  category: { id: string; slug: string } | null;
  tags: { slug: string; name: string }[];
  titleDe: string;
  availableLocales: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostDetail {
  id: string;
  slug: string;
  status: BlogStatus;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  publishedAt: string | null;
  readingTimeMinutes: number | null;
  featured: boolean;
  categoryId: string | null;
  authorName: string | null;
  category: { id: string; slug: string } | null;
  tags: { id: string; slug: string; name: string }[];
  translations: BlogPostTranslation[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategoryTranslation {
  id: string;
  category_id: string;
  locale: string;
  name: string;
  description: string | null;
}

export interface BlogCategorySummary {
  id: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  nameDe: string;
  postCount: number;
  availableLocales: string[];
}

export interface BlogCategoryDetail {
  id: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  translations: BlogCategoryTranslation[];
}

// ─── Market Listings ─────────────────────────────────────────────────────────

export interface MarketListing {
  id: string;
  ad_id: string;
  source: string;
  keyword: string;
  title: string;
  price_raw: string | null;
  price_cents: number | null;
  price_negotiable: boolean;
  description: string | null;
  location: string | null;
  plz: string | null;
  listing_url: string | null;
  image_url: string | null;
  shipping: string | null;
  listed_at: string | null;
  scraped_at: string;
  created_at: string;
}

export interface MarketListingStats {
  total: number;
  avg_price_cents: number | null;
  min_price_cents: number | null;
  max_price_cents: number | null;
  new_today: number;
  with_price: number;
}

// ─── Feature Visual Engine Types ─────────────────────────────────────────────

export type FeatureMatchType = "exact" | "contains" | "starts" | "ends" | "regex";
export type FeatureVisualScope = "global" | "category" | "product";
export type FeatureDisplayMode =
  | "icon_value" | "icon_name_value" | "grouped" | "compact"
  | "tooltip_only" | "grid" | "horizontal" | "vertical";

export interface LocalizedText {
  de?: string;
  en?: string;
  es?: string;
}

export interface FeatureDefinition {
  id: string;
  slug: string;
  names: LocalizedText;
  descriptions: LocalizedText | null;
  match_pattern: string | null;
  match_type: FeatureMatchType;
  category_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureVisual {
  id: string;
  feature_definition_id: string | null;
  feature_value: string | null;
  scope: FeatureVisualScope;
  category_id: string | null;
  product_id: string | null;
  image_url: string | null;
  svg_content: string | null;
  image_width: number | null;
  image_height: number | null;
  alt_texts: LocalizedText | null;
  labels: LocalizedText | null;
  tooltips: LocalizedText | null;
  link_url: string | null;
  link_target: string | null;
  link_rel: string | null;
  color_primary: string | null;
  color_secondary: string | null;
  css_class: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureVisualSettings {
  id: "singleton";
  enable_product_page: boolean;
  enable_quick_view: boolean;
  enable_miniature: boolean;
  enable_faceted_search: boolean;
  enable_collection: boolean;
  enable_search_results: boolean;
  default_display_mode: FeatureDisplayMode;
  default_icon_size: string;
  show_labels: boolean;
  show_tooltips: boolean;
  enable_animations: boolean;
  responsive_config: Record<string, unknown> | null;
  product_page_mode: FeatureDisplayMode;
  product_page_position: string;
  product_page_columns: number;
  miniature_mode: FeatureDisplayMode;
  miniature_max_icons: number;
  miniature_position: string;
  facet_show_icons: boolean;
  facet_show_labels: boolean;
  facet_collapsible: boolean;
  facet_lazy_render: boolean;
  font_size: string;
  font_weight: string;
  track_interactions: boolean;
  enable_ab_testing: boolean;
  updated_at: string;
}

// ─── HTTP-Helfer ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request<T>(path: string, init: RequestInit = {}, raw?: boolean): Promise<T> {
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

  return (raw ? json : json.data) as T;
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
    getTranslations: (id: string) =>
      request<CategoryTranslation[]>(`/categories/${id}/translations`),
    saveTranslation: (
      id: string,
      locale: Locale,
      data: { name: string; description?: string | null; meta_title?: string | null; meta_description?: string | null }
    ) =>
      request<CategoryTranslation>(`/categories/${id}/translations/${locale}`, {
        method: "PUT",
        body: JSON.stringify(data),
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
        affiliate_provider?: string | null;
        affiliate_url?: string | null;
        affiliate_asin?: string | null;
        affiliate_button_label?: string | null;
        affiliate_disclosure?: string | null;
        affiliate_enabled?: boolean;
        translations?: Partial<Record<Locale, Partial<Translation>>>;
      }
    ) => request<ProductDetail>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/products/${id}`, { method: "DELETE" }),
    getAffiliateStats: (id: string) => request<AffiliateStats>(`/products/${id}/affiliate-stats`),
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

  blog: {
    posts: {
      list: (params?: { status?: BlogStatus; limit?: number; offset?: number }) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const q = qs.toString();
        return request<BlogPostSummary[]>(`/blog/posts${q ? `?${q}` : ""}`);
      },
      get: (id: string) => request<BlogPostDetail>(`/blog/posts/${id}`),
      create: (data: unknown) =>
        request<BlogPostDetail>("/blog/posts", { method: "POST", body: JSON.stringify(data) }),
      update: (id: string, data: unknown) =>
        request<BlogPostDetail>(`/blog/posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: string) => request<void>(`/blog/posts/${id}`, { method: "DELETE" }),
      setStatus: (id: string, status: BlogStatus) =>
        request<{ id: string; status: BlogStatus; publishedAt: string | null }>(`/blog/posts/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
    },
    categories: {
      list: () => request<BlogCategorySummary[]>("/blog/categories"),
      get: (id: string) => request<BlogCategoryDetail>(`/blog/categories/${id}`),
      create: (data: unknown) =>
        request<BlogCategoryDetail>("/blog/categories", { method: "POST", body: JSON.stringify(data) }),
      update: (id: string, data: unknown) =>
        request<BlogCategoryDetail>(`/blog/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    },
    tags: {
      list: () => request<BlogTag[]>("/blog/tags"),
      create: (data: { slug: string; name: string }) =>
        request<BlogTag>("/blog/tags", { method: "POST", body: JSON.stringify(data) }),
      delete: (id: string) => request<void>(`/blog/tags/${id}`, { method: "DELETE" }),
    },
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

  bundles: {
    list: () => request<BundleSummary[]>("/bundles"),
    get: (id: string) => request<BundleSummary>(`/bundles/${id}`),
    create: (data: BundleInput) =>
      request<BundleSummary>("/bundles", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<BundleInput>) =>
      request<BundleSummary>(`/bundles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/bundles/${id}`, { method: "DELETE" }),
    setStatus: (id: string, status: BundleStatus) =>
      request<{ success: boolean }>(`/bundles/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    addItem: (bundleId: string, data: BundleItemInput) =>
      request<{ success: boolean }>(`/bundles/${bundleId}/items`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateItem: (bundleId: string, itemId: string, data: Partial<BundleItemInput>) =>
      request<{ success: boolean }>(`/bundles/${bundleId}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    removeItem: (bundleId: string, itemId: string) =>
      request<void>(`/bundles/${bundleId}/items/${itemId}`, { method: "DELETE" }),
    assignToProduct: (bundleId: string, productId: string) =>
      request<void>(`/bundles/${bundleId}/products/${productId}`, { method: "POST" }),
    unassignFromProduct: (bundleId: string, productId: string) =>
      request<void>(`/bundles/${bundleId}/products/${productId}`, { method: "DELETE" }),
    assignToCategory: (bundleId: string, categoryId: string) =>
      request<void>(`/bundles/${bundleId}/categories/${categoryId}`, { method: "POST" }),
    unassignFromCategory: (bundleId: string, categoryId: string) =>
      request<void>(`/bundles/${bundleId}/categories/${categoryId}`, { method: "DELETE" }),
  },

  stickers: {
    list: () => request<StickerAdmin[]>("/stickers"),
    get: (id: string) => request<StickerAdmin>(`/stickers/${id}`),
    getOverrides: (id: string) => request<StickerProductOverride[]>(`/stickers/${id}/overrides`),
    getProductMatrix: () => request<StickerMatrixEntry[]>("/stickers/product-matrix"),
    create: (data: StickerInput) =>
      request<StickerAdmin>("/stickers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<StickerInput>) =>
      request<StickerAdmin>(`/stickers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/stickers/${id}`, { method: "DELETE" }),
    setStatus: (id: string, status: StickerStatus) =>
      request<{ success: boolean }>(`/stickers/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    upsertOverride: (stickerId: string, data: { product_id: string; enabled: boolean; excluded: boolean }) =>
      request<{ success: boolean }>(`/stickers/${stickerId}/overrides`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    removeOverride: (stickerId: string, productId: string) =>
      request<{ success: boolean }>(`/stickers/${stickerId}/overrides/${productId}`, { method: "DELETE" }),
  },

  ticker: {
    list: () => request<TickerMessage[]>("/ticker"),
    get: (id: string) => request<TickerMessage>(`/ticker/${id}`),
    create: (data: TickerInput) =>
      request<TickerMessage>("/ticker", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: TickerInput) =>
      request<TickerMessage>(`/ticker/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    setStatus: (id: string, status: LiveTickerStatus) =>
      request<{ id: string; status: LiveTickerStatus }>(`/ticker/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    delete: (id: string) => request<void>(`/ticker/${id}`, { method: "DELETE" }),
  },

  affiliate: {
    getStats: () => request<AffiliateStatsOverview>("/affiliate/stats"),
  },

  marketListings: {
    list: async (params?: { source?: string; keyword?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.source) qs.set("source", params.source);
      if (params?.keyword) qs.set("keyword", params.keyword);
      if (params?.limit != null) qs.set("limit", String(params.limit));
      const q = qs.toString();
      const res = await fetch(`${BASE_URL}/api/admin/market-listings${q ? `?${q}` : ""}`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      return json as { data: MarketListing[]; stats: MarketListingStats };
    },
  },

  featureDefinitions: {
    list: (params?: { categoryId?: string; activeOnly?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.categoryId) qs.set("categoryId", params.categoryId);
      if (params?.activeOnly !== undefined) qs.set("activeOnly", String(params.activeOnly));
      return request<FeatureDefinition[]>(
        `/feature-definitions${qs.toString() ? `?${qs}` : ""}`,
      );
    },
    get: (id: string) => request<FeatureDefinition>(`/feature-definitions/${id}`),
    create: (data: Omit<FeatureDefinition, "id" | "created_at" | "updated_at">) =>
      request<FeatureDefinition>("/feature-definitions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<FeatureDefinition, "id" | "created_at" | "updated_at">>) =>
      request<FeatureDefinition>(`/feature-definitions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ success: boolean }>(`/feature-definitions/${id}`, { method: "DELETE" }),
  },

  featureVisuals: {
    list: (params?: {
      definitionId?: string;
      categoryId?: string;
      productId?: string;
      scope?: string;
      activeOnly?: boolean;
      limit?: number;
      offset?: number;
    }) => {
      const qs = new URLSearchParams();
      if (params?.definitionId) qs.set("definitionId", params.definitionId);
      if (params?.categoryId) qs.set("categoryId", params.categoryId);
      if (params?.productId) qs.set("productId", params.productId);
      if (params?.scope) qs.set("scope", params.scope);
      if (params?.activeOnly !== undefined) qs.set("activeOnly", String(params.activeOnly));
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.offset) qs.set("offset", String(params.offset));
      return request<{ data: FeatureVisual[]; total: number }>(
        `/feature-visuals${qs.toString() ? `?${qs}` : ""}`,
        undefined,
        true,
      );
    },
    get: (id: string) => request<FeatureVisual>(`/feature-visuals/${id}`),
    create: (data: Omit<FeatureVisual, "id" | "created_at" | "updated_at">) =>
      request<FeatureVisual>("/feature-visuals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<FeatureVisual, "id" | "created_at" | "updated_at">>) =>
      request<FeatureVisual>(`/feature-visuals/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ success: boolean }>(`/feature-visuals/${id}`, { method: "DELETE" }),
  },

  featureVisualSettings: {
    get: () => request<FeatureVisualSettings>("/feature-visual-settings"),
    update: (data: Partial<FeatureVisualSettings>) =>
      request<FeatureVisualSettings>("/feature-visual-settings", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // ─── Widerruf / Cancellations ─────────────────────────────────────────────

  cancellations: {
    list: (params?: { q?: string; status?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams();
      if (params?.q)      qs.set("q",      params.q);
      if (params?.status) qs.set("status", params.status);
      if (params?.limit)  qs.set("limit",  String(params.limit));
      if (params?.offset) qs.set("offset", String(params.offset));
      return request<{ data: CancellationRequest[]; meta: { total: number; limit: number; offset: number } }>(
        `/cancellations${qs.toString() ? `?${qs}` : ""}`,
        undefined, true,
      );
    },
    get:         (id: string) => request<CancellationRequest>(`/cancellations/${id}`),
    setStatus:   (id: string, status: string) =>
      request<{ id: string; status: string; updated_at: string }>(`/cancellations/${id}/status`, {
        method: "PATCH", body: JSON.stringify({ status }),
      }),
    setNotes:    (id: string, admin_notes: string | null) =>
      request<{ id: string; admin_notes: string | null }>(`/cancellations/${id}/notes`, {
        method: "PATCH", body: JSON.stringify({ admin_notes }),
      }),
    resendEmail: (id: string) =>
      request<{ sent: boolean }>(`/cancellations/${id}/resend-email`, { method: "POST" }),
    logs:        (id: string) => request<CancellationLog[]>(`/cancellations/${id}/logs`),
  },

  cancellationSettings: {
    get: () => request<CancellationSettings>("/settings/cancellation"),
    update: (data: Partial<CancellationSettings>) =>
      request<CancellationSettings>("/settings/cancellation", {
        method: "PUT", body: JSON.stringify(data),
      }),
    excludedProducts: {
      list: () => request<CancellationExcludedProduct[]>("/settings/cancellation/excluded-products"),
      add:  (data: { product_id: string; product_slug: string; product_name: string; reason?: string }) =>
        request<CancellationExcludedProduct>("/settings/cancellation/excluded-products", {
          method: "POST", body: JSON.stringify(data),
        }),
      remove: (id: string) =>
        request<null>(`/settings/cancellation/excluded-products/${id}`, { method: "DELETE" }),
    },
    excludedCategories: {
      list: () => request<CancellationExcludedCategory[]>("/settings/cancellation/excluded-categories"),
      add:  (data: { category_id: string; category_slug: string; category_name: string; reason?: string }) =>
        request<CancellationExcludedCategory>("/settings/cancellation/excluded-categories", {
          method: "POST", body: JSON.stringify(data),
        }),
      remove: (id: string) =>
        request<null>(`/settings/cancellation/excluded-categories/${id}`, { method: "DELETE" }),
    },
  },
};
