import { z } from "zod";
import { ProductSummarySchema } from "./product";

// ─── CategorySummary – Navigation / Kacheln ───────────────────────────────────

/**
 * Kompakte Kategorie-Darstellung für Navigation, Breadcrumbs und Filterlisten.
 * productCount ist voraggregiert – kein Nachladen nötig.
 */
export const CategorySummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  parent_id: z.string().uuid().nullable(),
  productCount: z.number().int().nonnegative(),
});
export type CategorySummary = z.infer<typeof CategorySummarySchema>;

// ─── CategoryDetail – Kategorieseite ─────────────────────────────────────────

/**
 * Vollständige Kategorie-Darstellung für Kategorieseiten.
 *
 * - products: fertig gemappte ProductSummary-Objekte (kein Prisma-Leak)
 * - children: nur CategorySummary (nicht rekursiv – vermeidet riesige Antworten)
 */
export const CategoryDetailSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  parent_id: z.string().uuid().nullable(),
  products: z.array(ProductSummarySchema),
  children: z.array(CategorySummarySchema),
});
export type CategoryDetail = z.infer<typeof CategoryDetailSchema>;

// ─── Kategorie-Hierarchieknoten ───────────────────────────────────────────────

/**
 * Rekursiver Knoten für die vollständige Kategoriebaumdarstellung.
 * Wird von buildCategoryHierarchy verwendet (Admin / Sitemap).
 * Lazy definiert mit z.lazy() um Zirkelreferenz zu vermeiden.
 */
export type CategoryTreeNode = CategorySummary & {
  children: CategoryTreeNode[];
};

export const CategoryTreeNodeSchema: z.ZodType<CategoryTreeNode> = z.lazy(() =>
  CategorySummarySchema.extend({
    children: z.array(CategoryTreeNodeSchema),
  })
);
