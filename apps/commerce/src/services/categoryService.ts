import { getPrismaClient } from "../lib/prisma";
import type { CategoryWithProducts } from "../types";
import { CatalogError } from "../types";

/**
 * CategoryService
 *
 * Kapselt Kategorieabfragen und Hierarchie-Navigation.
 * buildCategoryHierarchy verwendet eine einzelne DB-Abfrage (kein N+1).
 */
export class CategoryService {
  /**
   * Alle Root-Kategorien (parent_id = null) ohne Produkte.
   * Für Navigation-Menüs geeignet.
   */
  static async listRootCategories() {
    const prisma = getPrismaClient();

    return prisma.category.findMany({
      where: { parent_id: null, is_active: true },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Alle Kategorien als flache Liste mit voraggregiertem Produktzähler.
   *
   * Gibt jede Kategorie mit `_count.products` zurück – ein einziger DB-Roundtrip.
   * Vorher wurden N separate COUNT-Abfragen in der Route ausgeführt (N+1).
   */
  static async listAllCategories() {
    const prisma = getPrismaClient();

    return prisma.category.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: { where: { status: "active" } } } },
        products: {
          where: { status: "active" },
          take: 1,
          orderBy: { created_at: "asc" },
          include: { images: { orderBy: { sort_order: "asc" }, take: 1 } },
        },
      },
    });
  }

  /**
   * Einzelne Kategorie per Slug mit zugehörigen Produkten.
   * Gibt null zurück wenn nicht gefunden.
   */
  static async getCategoryWithProducts(slug: string): Promise<CategoryWithProducts | null> {
    const prisma = getPrismaClient();

    const category = await prisma.category.findUnique({
      where: { slug, is_active: true },
      include: {
        products: {
          where: { status: "active" },
          include: {
            translations: true,
            variants: {
              where: { is_active: true },
              include: { translations: true },
            },
            images: { orderBy: { sort_order: "asc" } },
            documents: { orderBy: { sort_order: "asc" } },
          },
        },
      },
    });

    if (!category) return null;

    return {
      ...category,
      children: [], // Flat-Abfrage: Kinder werden nicht geladen
    } as unknown as CategoryWithProducts;
  }

  /**
   * Einzelne Kategorie per Slug mit Produkten – oder CatalogError(404).
   */
  static async requireCategoryBySlug(slug: string): Promise<CategoryWithProducts> {
    const category = await CategoryService.getCategoryWithProducts(slug);
    if (!category) {
      throw new CatalogError("CATEGORY_NOT_FOUND", 404, `Kategorie nicht gefunden: ${slug}`);
    }
    return category;
  }

  /**
   * Einzelne Kategorie per ID mit Produkten und direkten Kindern.
   */
  static async getCategoryById(id: string): Promise<CategoryWithProducts | null> {
    const prisma = getPrismaClient();

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
        children: true,
      },
    });

    if (!category) return null;

    return category as unknown as CategoryWithProducts;
  }

  /**
   * Vollständige Kategorie-Hierarchie als verschachtelter Baum.
   *
   * Verwendet eine einzelne DB-Abfrage und baut den Baum in-memory (O(n)).
   * Deutlich effizienter als die frühere rekursive N+1-Variante.
   */
  static async buildCategoryHierarchy(): Promise<CategoryWithProducts[]> {
    const prisma = getPrismaClient();

    // Einzige DB-Abfrage: aktive Kategorien + ihre aktiven Produkte
    const all = await prisma.category.findMany({
      where: { is_active: true },
      include: { products: { where: { status: "active" } } },
      orderBy: { name: "asc" },
    });

    // In-memory Baum aufbauen
    const byId = new Map<string, CategoryWithProducts>();
    for (const cat of all) {
      byId.set(cat.id, { ...cat, children: [] } as unknown as CategoryWithProducts);
    }

    const roots: CategoryWithProducts[] = [];
    for (const cat of all) {
      const node = byId.get(cat.id)!;
      if (cat.parent_id) {
        const parent = byId.get(cat.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Zählt Produkte in einer Kategorie.
   */
  static async countProductsInCategory(categorySlug: string): Promise<number> {
    const prisma = getPrismaClient();

    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) return 0;

    return prisma.product.count({
      where: { category_id: category.id, status: "active" },
    });
  }
}
