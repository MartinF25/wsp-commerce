import type {
  ProductSummary,
  ProductDetail,
  CategorySummary,
  CategoryDetail,
  CategoryTreeNode,
  PriceDisplay,
} from "@wsp/contracts";
import { isDirectlyPurchasable, isConfigurable, calculatePriceDisplay } from "../utils/productUtils";
import { resolveTranslation, resolveVariantTranslation } from "../utils/localeUtils";
import type { ProductWithVariants, CategoryWithProducts } from "../types";

function toRecordOrNull(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

// ─── Produkt-Mapper ───────────────────────────────────────────────────────────

/**
 * Wandelt eine vollständig geladene Prisma-Produktentität in den öffentlichen
 * ProductSummary-Contract um (für Listenansichten, Kacheln, Suchergebnisse).
 *
 * locale steuert welche Übersetzung geliefert wird; fehlt eine EN/ES-Übersetzung,
 * greift automatisch die DE-Version (resolveTranslation Fallback).
 *
 * Niemals rohe Prisma-Objekte nach außen geben – immer durch diesen Mapper.
 */
export function toProductSummary(product: ProductWithVariants, locale = "de"): ProductSummary {
  const activeVariants = product.variants.filter((v) => v.is_active);
  const priceDisplay: PriceDisplay = calculatePriceDisplay({ ...product, variants: activeVariants });
  const coverImage = product.images?.[0] ?? null;
  const t = resolveTranslation(product.translations, locale);

  return {
    id: product.id,
    slug: product.slug,
    name: t?.name ?? "",
    short_description: t?.short_description ?? null,
    product_type: product.product_type,
    purchasable:
      isDirectlyPurchasable(product.product_type) ||
      isConfigurable(product.product_type),
    category: product.category
      ? { slug: product.category.slug, name: product.category.name }
      : null,
    priceDisplay,
    coverImageUrl: coverImage?.url ?? null,
    coverImageAlt: coverImage?.alt ?? null,
  };
}

/**
 * Wandelt eine vollständig geladene Prisma-Produktentität in den öffentlichen
 * ProductDetail-Contract um (für Detailseiten).
 *
 * product_type + purchasable steuern, ob Storefront Warenkorb oder Lead-Formular zeigt:
 *   purchasable=true  → Variantenauswahl + "Jetzt kaufen"
 *   purchasable=false → "Beratung anfragen" (inquiry_only)
 */
export function toProductDetail(product: ProductWithVariants, locale = "de"): ProductDetail {
  const activeVariants = product.variants.filter((v) => v.is_active);
  const priceDisplay: PriceDisplay = calculatePriceDisplay({ ...product, variants: activeVariants });
  const t = resolveTranslation(product.translations, locale);

  return {
    id: product.id,
    slug: product.slug,
    name: t?.name ?? "",
    short_description: t?.short_description ?? null,
    description: t?.description ?? null,
    delivery_note: t?.delivery_note ?? null,
    features: toStringArray(t?.features),
    meta_title: t?.meta_title ?? null,
    meta_description: t?.meta_description ?? null,
    mounting_note: t?.mounting_note ?? null,
    project_note: t?.project_note ?? null,
    product_type: product.product_type,
    purchasable:
      isDirectlyPurchasable(product.product_type) ||
      isConfigurable(product.product_type),
    category: product.category
      ? {
          id: product.category.id,
          slug: product.category.slug,
          name: product.category.name,
        }
      : null,
    variants: activeVariants.map((v) => {
      const vt = resolveVariantTranslation(v.translations, locale);
      return {
        id: v.id,
        sku: v.sku,
        name: vt?.name ?? "",
        price_cents: v.price_cents ?? null,
        currency: v.currency,
        stock_quantity: v.stock_quantity,
        attributes: v.attributes as Record<string, unknown>,
        weight_kg: v.weight_kg ?? null,
        dimensions: toRecordOrNull(v.dimensions),
      };
    }),
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? null,
      sort_order: img.sort_order,
    })),
    documents: product.documents
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((doc) => ({
        id: doc.id,
        name: doc.name,
        url: doc.url,
        type: doc.type,
        sort_order: doc.sort_order,
      })),
    priceDisplay,
  };
}

// ─── Kategorie-Mapper ─────────────────────────────────────────────────────────

/**
 * Wandelt eine Kategorie-Entität in den kompakten CategorySummary-Contract um.
 * productCount muss vom Aufrufer übergeben werden (voraggregiert, kein N+1).
 */
export function toCategorySummary(
  category: { id: string; slug: string; name: string; parent_id: string | null },
  productCount: number
): CategorySummary {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    parent_id: category.parent_id ?? null,
    productCount,
  };
}

/**
 * Wandelt eine vollständig geladene Kategorie-Entität in den CategoryDetail-Contract um.
 * products müssen als ProductWithVariants[] geladen sein (Varianten + Bilder + Translations).
 * children werden als CategorySummary ohne Tiefe abgebildet (nicht rekursiv).
 */
export function toCategoryDetail(category: CategoryWithProducts, locale = "de"): CategoryDetail {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    parent_id: category.parent_id ?? null,
    products: category.products.map((p) => toProductSummary(p, locale)),
    children: category.children.map((child) =>
      toCategorySummary(child, child.products?.length ?? 0)
    ),
  };
}

/**
 * Wandelt einen Hierarchieknoten (aus buildCategoryHierarchy) in einen
 * CategoryTreeNode-Contract um (für Sitemap, Admin-Navigation).
 * Rekursiv – spiegelt die Tiefe des Originalbaums.
 */
export function toCategoryTreeNode(
  category: CategoryWithProducts
): CategoryTreeNode {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    parent_id: category.parent_id ?? null,
    productCount: category.products?.length ?? 0,
    children: category.children.map(toCategoryTreeNode),
  };
}
