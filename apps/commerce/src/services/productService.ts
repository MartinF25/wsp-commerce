import { Prisma, ProductType } from "@prisma/client";
import type { SortBy } from "@wsp/contracts";
import { getPrismaClient } from "../lib/prisma";
import type { ListProductsFilter, ProductWithVariants } from "../types";
import { CatalogError } from "../types";

/**
 * Produkttypen, bei denen ein Warenkorb-Checkout möglich ist.
 * inquiry_only fällt bewusst heraus – dort greift das Lead-Formular.
 */
const PURCHASABLE_TYPES: ProductType[] = [
  ProductType.direct_purchase,
  ProductType.configurable,
];

/**
 * ProductService
 *
 * Kapselt alle produktbezogenen Katalogabfragen.
 * Kein REST-Routing, keine Business-Logik außerhalb der Domain-Grenze.
 * Spätere Controller/Routen importieren ausschließlich diesen Service.
 */
export class ProductService {
  /**
   * Listet Produkte mit optionalen Filtern und Sortierung.
   *
   * Filter-Vorrang:
   *   purchasable (bool) → überschreibt type, wenn gesetzt
   *   type               → direkter Enum-Filter
   *
   * Sortierung (sortBy):
   *   newest     → created_at DESC (Standard)
   *   oldest     → created_at ASC
   *   name_asc   → name ASC
   *   name_desc  → name DESC
   *   price_asc  → min(variant.price_cents) ASC  – nulls last
   *   price_desc → min(variant.price_cents) DESC – nulls first
   */
  static async listProducts(
    filter?: ListProductsFilter
  ): Promise<ProductWithVariants[]> {
    const prisma = getPrismaClient();
    const where = ProductService.buildWhereClause(filter);
    const orderBy = ProductService.buildOrderClause(filter?.sortBy);

    return prisma.product.findMany({
      where,
      include: {
        translations: true,
        variants: { include: { translations: true } },
        images: { orderBy: { sort_order: "asc" } },
        documents: { orderBy: { sort_order: "asc" } },
        category: true,
      },
      orderBy,
      take: filter?.limit ?? 100,
      skip: filter?.offset ?? 0,
    }) as Promise<ProductWithVariants[]>;
  }

  /**
   * Gibt ein einzelnes Produkt per Slug zurück (inkl. Varianten, Bilder, Kategorie).
   * Gibt null zurück wenn nicht gefunden (kein throw – Caller entscheidet).
   */
  static async getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
    const prisma = getPrismaClient();

    return prisma.product.findUnique({
      where: { slug },
      include: {
        translations: true,
        variants: { include: { translations: true } },
        images: { orderBy: { sort_order: "asc" } },
        documents: { orderBy: { sort_order: "asc" } },
        category: true,
      },
    }) as Promise<ProductWithVariants | null>;
  }

  /**
   * Gibt ein einzelnes Produkt per ID zurück.
   * Gibt null zurück wenn nicht gefunden.
   */
  static async getProductById(id: string): Promise<ProductWithVariants | null> {
    const prisma = getPrismaClient();

    return prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        variants: { include: { translations: true } },
        images: { orderBy: { sort_order: "asc" } },
        documents: { orderBy: { sort_order: "asc" } },
        category: true,
      },
    }) as Promise<ProductWithVariants | null>;
  }

  /**
   * Gibt ein Produkt per Slug zurück oder wirft CatalogError(404).
   * Für Routen, die einen 404 als Fehler behandeln müssen.
   */
  static async requireProductBySlug(slug: string): Promise<ProductWithVariants> {
    const product = await ProductService.getProductBySlug(slug);
    if (!product) {
      throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${slug}`);
    }
    return product;
  }

  /**
   * Alle Varianten eines Produkts.
   */
  static async getProductVariants(productId: string) {
    const prisma = getPrismaClient();

    return prisma.productVariant.findMany({
      where: { product_id: productId },
      orderBy: { created_at: "asc" },
    });
  }

  /**
   * Einzelne Variante per SKU, inkl. Produkt und Kategorie.
   */
  static async getVariantBySku(sku: string) {
    const prisma = getPrismaClient();

    return prisma.productVariant.findUnique({
      where: { sku },
      include: {
        product: {
          include: { category: true },
        },
      },
    });
  }

  /**
   * Zählt Produkte (mit optionalen Filtern). Nützlich für Pagination.
   * sortBy wird bewusst nicht übergeben – irrelevant für COUNT-Abfragen.
   */
  static async countProducts(
    filter?: Omit<ListProductsFilter, "limit" | "offset" | "sortBy">
  ): Promise<number> {
    const prisma = getPrismaClient();
    const where = ProductService.buildWhereClause(filter);
    return prisma.product.count({ where });
  }

  // ─── Intern ──────────────────────────────────────────────────────────────

  /**
   * Baut das Prisma-Where-Objekt aus dem Filter.
   * Zentralisiert die Logik so dass listProducts + countProducts identisch filtern.
   */
  private static buildWhereClause(
    filter?: Omit<ListProductsFilter, "limit" | "offset" | "sortBy">
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    // purchasable hat Vorrang: überschreibt type-Filter
    if (filter?.purchasable === true) {
      where.product_type = { in: PURCHASABLE_TYPES };
    } else if (filter?.purchasable === false) {
      where.product_type = ProductType.inquiry_only;
    } else if (filter?.type) {
      where.product_type = filter.type;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.category) {
      where.category = { slug: filter.category };
    }

    return where;
  }

  /**
   * Baut die Prisma-orderBy-Klausel aus dem sortBy-Wert.
   *
   * price_asc/desc nutzt Prisma's Relation-Aggregat-Sortierung (_min auf variants).
   * Das erfordert Prisma ≥ 4.2 – gut innerhalb unseres ^5.9.1.
   *
   * Verhalten bei null-Preisen (inquiry_only ohne Richtpreis):
   *   price_asc  → Produkte ohne Preis wandern ans Ende (PostgreSQL: NULLs LAST)
   *   price_desc → Produkte ohne Preis wandern an den Anfang (PostgreSQL: NULLs FIRST)
   * Dieses Verhalten ist beabsichtigt – kaufbare Produkte mit Preis werden bevorzugt.
   */
  private static buildOrderClause(
    sortBy: SortBy = "newest"
  ): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] {
    switch (sortBy) {
      case "newest":
        return { created_at: "desc" };
      case "oldest":
        return { created_at: "asc" };
      case "name_asc":
        // name is now in ProductTranslation; locale-aware sorting requires raw SQL (future task).
        return { created_at: "desc" };
      case "name_desc":
        return { created_at: "desc" };
      case "price_asc":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { variants: { _min: { price_cents: "asc" } } } as any;
      case "price_desc":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { variants: { _min: { price_cents: "desc" } } } as any;
      default: {
        // TypeScript exhaustiveness guard – sollte nie erreicht werden
        const _exhaustive: never = sortBy;
        return { created_at: "desc" };
      }
    }
  }
}
