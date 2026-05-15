import { Hono } from "hono";
import { LocaleSchema } from "@wsp/contracts";
import { BundleService } from "../../services/bundleService";
import { toBundle } from "../../mappers/bundle";
import { CatalogError } from "../../types";
import { getPrismaClient } from "../../lib/prisma";

/**
 * Bundle-Routen – öffentliche Catalog-API
 *
 * Endpunkte (relativ zu /api/catalog/bundles):
 *   GET /  ?product_id=<uuid>&locale=<locale>   → Bundles für ein Produkt
 *   GET /  ?category_id=<uuid>&locale=<locale>  → Bundles für eine Kategorie
 *   GET /:id ?locale=<locale>                   → Einzelnes Bundle per ID
 */
export const bundleRoutes = new Hono();

// ─── GET /bundles ─────────────────────────────────────────────────────────────

bundleRoutes.get("/", async (c) => {
  const rawLocale = c.req.query("locale");
  const { data: locale = "de" } = LocaleSchema.safeParse(rawLocale);

  const productId = c.req.query("product_id");
  const categoryId = c.req.query("category_id");

  if (!productId && !categoryId) {
    throw new CatalogError(
      "INVALID_QUERY",
      422,
      "product_id oder category_id muss angegeben werden."
    );
  }

  let bundles;

  if (productId) {
    // Kategorie-ID des Produkts nachladen für Category-Bundles
    const prisma = getPrismaClient();
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { category_id: true },
    });

    if (!product) {
      return c.json({ data: [] });
    }

    bundles = await BundleService.getBundlesForProduct(productId, product.category_id);
  } else {
    bundles = await BundleService.getBundlesForCategory(categoryId!);
  }

  const result = bundles
    .map((b) => toBundle(b, locale))
    .filter((b): b is NonNullable<typeof b> => b !== null);

  return c.json({ data: result });
});

// ─── GET /bundles/:id ─────────────────────────────────────────────────────────

bundleRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const { data: locale = "de" } = LocaleSchema.safeParse(c.req.query("locale"));

  const bundle = await BundleService.getBundleById(id);

  if (!bundle || bundle.status !== "active") {
    throw new CatalogError("BUNDLE_NOT_FOUND", 404, `Bundle nicht gefunden: ${id}`);
  }

  const result = toBundle(bundle, locale);
  if (!result) {
    throw new CatalogError("BUNDLE_NOT_FOUND", 404, `Bundle nicht verfügbar: ${id}`);
  }

  return c.json({ data: result });
});
