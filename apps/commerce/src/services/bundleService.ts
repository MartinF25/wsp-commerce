import { getPrismaClient } from "../lib/prisma";
import type { BundleWithItems } from "../types";
import { CatalogError } from "../types";

const BUNDLE_INCLUDE = {
  translations: true,
  items: {
    include: {
      product: {
        include: {
          translations: true,
          variants: { include: { translations: true } },
          images: { orderBy: { sort_order: "asc" as const } },
          documents: { orderBy: { sort_order: "asc" as const } },
          category: true,
        },
      },
    },
    orderBy: { sort_order: "asc" as const },
  },
} as const;

/**
 * BundleService
 *
 * Kapselt alle Bundle-bezogenen Datenbankabfragen.
 * Gibt immer BundleWithItems zurück – nie rohe Prisma-Objekte.
 */
export class BundleService {
  /**
   * Alle aktiven Bundles, die einem bestimmten Produkt zugewiesen sind.
   * Schließt auch Bundles ein, die der Kategorie des Produkts zugewiesen sind.
   * Filtert automatisch abgelaufene Bundles (valid_until).
   */
  static async getBundlesForProduct(
    productId: string,
    categoryId?: string | null
  ): Promise<BundleWithItems[]> {
    const prisma = getPrismaClient();
    const now = new Date();

    const bundles = await prisma.bundle.findMany({
      where: {
        status: "active",
        AND: [
          { OR: [{ valid_from: null }, { valid_from: { lte: now } }] },
          { OR: [{ valid_until: null }, { valid_until: { gte: now } }] },
        ],
        OR: [
          { product_assignments: { some: { product_id: productId } } },
          ...(categoryId
            ? [{ category_assignments: { some: { category_id: categoryId } } }]
            : []),
        ],
      },
      include: BUNDLE_INCLUDE,
      orderBy: { sort_order: "asc" },
    });

    return bundles as unknown as BundleWithItems[];
  }

  /**
   * Alle aktiven Bundles einer Kategorie.
   */
  static async getBundlesForCategory(categoryId: string): Promise<BundleWithItems[]> {
    const prisma = getPrismaClient();
    const now = new Date();

    const bundles = await prisma.bundle.findMany({
      where: {
        status: "active",
        AND: [
          { OR: [{ valid_from: null }, { valid_from: { lte: now } }] },
          { OR: [{ valid_until: null }, { valid_until: { gte: now } }] },
        ],
        category_assignments: { some: { category_id: categoryId } },
      },
      include: BUNDLE_INCLUDE,
      orderBy: { sort_order: "asc" },
    });

    return bundles as unknown as BundleWithItems[];
  }

  /**
   * Admin: Alle Bundles (alle Status, keine Zeitfilter).
   */
  static async listAllBundles(): Promise<BundleWithItems[]> {
    const prisma = getPrismaClient();

    const bundles = await prisma.bundle.findMany({
      include: BUNDLE_INCLUDE,
      orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
    });

    return bundles as unknown as BundleWithItems[];
  }

  /**
   * Admin: Ein Bundle per ID (alle Status).
   */
  static async getBundleById(id: string): Promise<BundleWithItems | null> {
    const prisma = getPrismaClient();

    const bundle = await prisma.bundle.findUnique({
      where: { id },
      include: {
        ...BUNDLE_INCLUDE,
        product_assignments: { include: { product: true } },
        category_assignments: { include: { category: true } },
      },
    });

    return bundle as unknown as BundleWithItems | null;
  }

  /**
   * Admin: Bundle per ID oder 404-Fehler.
   */
  static async requireBundleById(id: string): Promise<BundleWithItems> {
    const bundle = await BundleService.getBundleById(id);
    if (!bundle) {
      throw new CatalogError("BUNDLE_NOT_FOUND", 404, `Bundle nicht gefunden: ${id}`);
    }
    return bundle;
  }

  /**
   * Admin: Neues Bundle anlegen.
   */
  static async createBundle(data: {
    status?: string;
    sort_order?: number;
    image_url?: string | null;
    valid_from?: Date | null;
    valid_until?: Date | null;
    store_id?: string | null;
    discount_type?: string;
    discount_percent?: number | null;
    discount_cents?: number | null;
    discount_mode?: string;
    min_items_for_discount?: number;
    valid_from_discount?: Date | null;
    valid_until_discount?: Date | null;
    display_mode?: string;
    tab_group?: string | null;
    translations: Array<{
      locale: string;
      title: string;
      description?: string | null;
      tab_name?: string | null;
    }>;
  }): Promise<BundleWithItems> {
    const prisma = getPrismaClient();

    const { translations, ...bundleData } = data;

    const bundle = await prisma.bundle.create({
      data: {
        ...bundleData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: (bundleData.status ?? "inactive") as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discount_type: (bundleData.discount_type ?? "none") as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discount_mode: (bundleData.discount_mode ?? "all_items") as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        display_mode: (bundleData.display_mode ?? "card") as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discount_percent: bundleData.discount_percent != null ? bundleData.discount_percent as any : null,
        translations: {
          create: translations.map((t) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            locale: t.locale as any,
            title: t.title,
            description: t.description ?? null,
            tab_name: t.tab_name ?? null,
          })),
        },
      },
      include: BUNDLE_INCLUDE,
    });

    return bundle as unknown as BundleWithItems;
  }

  /**
   * Admin: Bundle aktualisieren.
   */
  static async updateBundle(
    id: string,
    data: Partial<Parameters<typeof BundleService.createBundle>[0]>
  ): Promise<BundleWithItems> {
    const prisma = getPrismaClient();

    const { translations, ...bundleData } = data;

    await prisma.bundle.update({
      where: { id },
      data: {
        ...bundleData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: bundleData.status as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discount_type: bundleData.discount_type as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discount_mode: bundleData.discount_mode as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        display_mode: bundleData.display_mode as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discount_percent: bundleData.discount_percent != null ? bundleData.discount_percent as any : undefined,
      },
    });

    // Übersetzungen upserten
    if (translations && translations.length > 0) {
      for (const t of translations) {
        await prisma.bundleTranslation.upsert({
          where: { bundle_id_locale: { bundle_id: id, locale: t.locale as "de" | "en" | "es" } },
          create: {
            bundle_id: id,
            locale: t.locale as "de" | "en" | "es",
            title: t.title,
            description: t.description ?? null,
            tab_name: t.tab_name ?? null,
          },
          update: {
            title: t.title,
            description: t.description ?? null,
            tab_name: t.tab_name ?? null,
          },
        });
      }
    }

    return BundleService.requireBundleById(id);
  }

  /**
   * Admin: Bundle-Status setzen.
   */
  static async updateBundleStatus(id: string, status: "active" | "inactive"): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.bundle.update({ where: { id }, data: { status } });
  }

  /**
   * Admin: Bundle löschen (Cascade löscht Items und Assignments).
   */
  static async deleteBundle(id: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.bundle.delete({ where: { id } });
  }

  // ─── Bundle Items ────────────────────────────────────────────────────────────

  static async addBundleItem(bundleId: string, data: {
    product_id: string;
    quantity?: number;
    is_required?: boolean;
    sort_order?: number;
    discount_percent?: number | null;
    discount_cents?: number | null;
  }): Promise<void> {
    const prisma = getPrismaClient();

    // Prüfen ob Produkt bereits im Bundle
    const existing = await prisma.bundleItem.findUnique({
      where: { bundle_id_product_id: { bundle_id: bundleId, product_id: data.product_id } },
    });
    if (existing) {
      throw new CatalogError("BUNDLE_ITEM_DUPLICATE", 409, "Produkt ist bereits im Bundle.");
    }

    await prisma.bundleItem.create({
      data: {
        bundle_id: bundleId,
        product_id: data.product_id,
        quantity: data.quantity ?? 1,
        is_required: data.is_required ?? true,
        sort_order: data.sort_order ?? 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discount_percent: data.discount_percent != null ? data.discount_percent as any : null,
        discount_cents: data.discount_cents ?? null,
      },
    });
  }

  static async updateBundleItem(itemId: string, data: {
    quantity?: number;
    is_required?: boolean;
    sort_order?: number;
    discount_percent?: number | null;
    discount_cents?: number | null;
  }): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.bundleItem.update({
      where: { id: itemId },
      data: {
        ...data,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discount_percent: data.discount_percent != null ? data.discount_percent as any : undefined,
      },
    });
  }

  static async removeBundleItem(itemId: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.bundleItem.delete({ where: { id: itemId } });
  }

  // ─── Bundle Assignments ───────────────────────────────────────────────────────

  static async assignToProduct(bundleId: string, productId: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.bundleProductAssignment.upsert({
      where: { bundle_id_product_id: { bundle_id: bundleId, product_id: productId } },
      create: { bundle_id: bundleId, product_id: productId },
      update: {},
    });
  }

  static async unassignFromProduct(bundleId: string, productId: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.bundleProductAssignment.delete({
      where: { bundle_id_product_id: { bundle_id: bundleId, product_id: productId } },
    });
  }

  static async assignToCategory(bundleId: string, categoryId: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.bundleCategoryAssignment.upsert({
      where: { bundle_id_category_id: { bundle_id: bundleId, category_id: categoryId } },
      create: { bundle_id: bundleId, category_id: categoryId },
      update: {},
    });
  }

  static async unassignFromCategory(bundleId: string, categoryId: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.bundleCategoryAssignment.delete({
      where: { bundle_id_category_id: { bundle_id: bundleId, category_id: categoryId } },
    });
  }
}
