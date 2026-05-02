import { Hono } from "hono";
import { LocaleSchema } from "@wsp/contracts";
import { CategoryService } from "../../services/categoryService";
import { toCategorySummary, toCategoryDetail } from "../../mappers/catalog";
import { CatalogError } from "../../types";

/**
 * Kategorie-Routen – öffentliche Katalog-API
 *
 * Nur aktive Kategorien (is_active=true) sind öffentlich sichtbar.
 * Produkte innerhalb einer Kategorie werden auf status="active" gefiltert;
 * Varianten auf is_active=true. Alles DB-seitig im Service, kein In-Memory-Filter.
 */
export const categoryRoutes = new Hono();

// ─── GET /categories ──────────────────────────────────────────────────────────

/**
 * Liefert alle Kategorien als flache Liste mit aggregierten Produktzählern.
 *
 * Eignet sich für Navigation, Filter-Sidebars und Kategorie-Kacheln.
 * Kein Produkt-Payload – nur Metadaten.
 *
 * Response:
 *   { data: CategorySummary[] }
 */
categoryRoutes.get("/", async (c) => {
  // listAllCategories liefert _count.products – ein einziger DB-Roundtrip.
  const categories = await CategoryService.listAllCategories();

  const summaries = categories.map((cat) => {
    const coverImageUrl = cat.products?.[0]?.images?.[0]?.url ?? null;
    return toCategorySummary(cat, cat._count.products, coverImageUrl);
  });

  return c.json({ data: summaries });
});

// ─── GET /categories/:slug ────────────────────────────────────────────────────

/**
 * Liefert eine Kategorie mit all ihren aktiven Produkten.
 *
 * Die Produkte sind als ProductSummary aufbereitet (priceDisplay, purchasable,
 * coverImageUrl) – der Storefront muss keine weitere Transformation vornehmen.
 *
 * Gibt 404 zurück wenn die Kategorie nicht existiert.
 *
 * Response:
 *   { data: CategoryDetail }
 */
categoryRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const category = await CategoryService.getCategoryWithProducts(slug);

  if (!category) {
    throw new CatalogError(
      "CATEGORY_NOT_FOUND",
      404,
      `Kategorie nicht gefunden: ${slug}`
    );
  }

  const { data: locale = "de" } = LocaleSchema.safeParse(c.req.query("locale"));
  return c.json({ data: toCategoryDetail(category, locale) });
});
