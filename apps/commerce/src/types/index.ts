import type {
  Product,
  ProductVariant,
  ProductTranslation,
  ProductVariantTranslation,
  ProductImage,
  ProductDocument,
  Category,
  ProductType,
  ProductStatus,
} from "@prisma/client";
import type { SortBy } from "@wsp/contracts";

// Re-export Prisma enums as domain types so consumers don't import @prisma/client directly.
export type { ProductType, ProductStatus };

/** ProductVariant with its locale-specific translations loaded. */
export type VariantWithTranslations = ProductVariant & {
  translations: ProductVariantTranslation[];
};

/**
 * Product with all catalog relations loaded (translations, variants, images, category).
 * translations[] contains one entry per locale that has been entered.
 * DE is always present; EN/ES are optional.
 */
export type ProductWithVariants = Product & {
  translations: ProductTranslation[];
  variants: VariantWithTranslations[];
  images: ProductImage[];
  documents: ProductDocument[];
  category: Category | null;
};

/**
 * Category with products and nested children (for hierarchy rendering).
 * products ist ProductWithVariants[] – Varianten und Bilder sind mitgeladen,
 * damit Mapper priceDisplay und coverImageUrl berechnen können.
 * children werden in-memory aus einer Flat-Query aufgebaut, nicht per Prisma-Relation.
 */
export type CategoryWithProducts = Category & {
  products: ProductWithVariants[];
  children: CategoryWithProducts[];
};

/**
 * Filter for listProducts / countProducts.
 *
 * purchasable maps to the domain concept of "can go in a cart":
 *   true  → product_type IN (direct_purchase, configurable)
 *   false → product_type = inquiry_only
 *   unset → all types
 *
 * sortBy controls Prisma orderBy – defaults to "newest" (created_at DESC).
 * countProducts intentionally omits sortBy (irrelevant for COUNT queries).
 */
export interface ListProductsFilter {
  type?: ProductType;
  category?: string;        // category slug
  status?: ProductStatus;
  purchasable?: boolean;    // domain-level shortcut (overrides type if set)
  sortBy?: SortBy;
  limit?: number;
  offset?: number;
}

/**
 * Price display structure for UI rendering.
 * displayText is the human-readable string (e.g. "ab €1.299,00").
 */
export interface PriceDisplay {
  minCents?: number;
  maxCents?: number;
  currencyCode: string;
  displayText: string;
}

/**
 * Typed error for catalog domain operations.
 * statusCode mirrors HTTP semantics so API layers can forward it.
 */
export class CatalogError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "CatalogError";
  }
}
