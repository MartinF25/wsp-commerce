import { Hono } from "hono";
import { ProductQuerySchema, LocaleSchema } from "@wsp/contracts";
import { ProductService } from "../../services/productService";
import { toProductSummary, toProductDetail } from "../../mappers/catalog";
import { CatalogError } from "../../types";

/**
 * Produkt-Routen – öffentliche Katalog-API
 *
 * Alle Endpunkte filtern standardmäßig auf status=active.
 * Rohe Prisma-Objekte werden niemals direkt zurückgegeben –
 * Ausgabe läuft immer durch die Mapper (toProductSummary / toProductDetail).
 *
 * product_type steuert die Ausgabe:
 *   direct_purchase / configurable → purchasable=true, Preise sichtbar
 *   inquiry_only                   → purchasable=false, Preis ggf. als Richtpreis
 */
export const productRoutes = new Hono();

// ─── GET /products ────────────────────────────────────────────────────────────

/**
 * Liefert eine paginierte, sortierbare Liste aktiver Produkte.
 *
 * Query-Parameter (alle optional):
 *   type        – "direct_purchase" | "configurable" | "inquiry_only"
 *   category    – Kategorie-Slug
 *   purchasable – "true" | "false" (Domain-Filter; überschreibt type)
 *   sortBy      – Sortierung (Default: "newest")
 *                   newest     → neueste zuerst (created_at DESC)
 *                   oldest     → älteste zuerst (created_at ASC)
 *                   name_asc   → alphabetisch A → Z
 *                   name_desc  → alphabetisch Z → A
 *                   price_asc  → günstigste zuerst (min. Variantenpreis)
 *                   price_desc → teuerste zuerst
 *   limit       – 1–100, Default: 20
 *   offset      – ≥ 0, Default: 0
 *
 * Response:
 *   { data: ProductSummary[], meta: { total, limit, offset, sortBy } }
 */
productRoutes.get("/", async (c) => {
  const raw = c.req.query();
  const parsed = ProductQuerySchema.safeParse(raw);

  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_QUERY",
      422,
      `Ungültige Query-Parameter: ${parsed.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const { locale, ...queryParams } = parsed.data;
  const filter = {
    ...queryParams,
    // Öffentliche API zeigt ausschließlich aktive Produkte.
    // Admin-Routen (späterer Task) übergeben status explizit.
    status: "active" as const,
  };

  const [products, total] = await Promise.all([
    ProductService.listProducts(filter),
    ProductService.countProducts(filter),
  ]);

  return c.json({
    data: products.map((p) => toProductSummary(p, locale)),
    meta: {
      total,
      limit: filter.limit,
      offset: filter.offset,
      sortBy: filter.sortBy,
    },
  });
});

// ─── GET /products/:slug ──────────────────────────────────────────────────────

/**
 * Liefert ein einzelnes aktives Produkt per Slug (Detailansicht).
 *
 * Response enthält zusätzlich zu ProductSummary:
 *   - description
 *   - alle Varianten (inkl. price_cents, attributes)
 *   - alle Bilder
 *
 * product_type + purchasable in der Response ermöglichen dem Storefront zu entscheiden:
 *   purchasable=true  → Variantenauswahl + Warenkorb (direct_purchase | configurable)
 *   purchasable=false → "Beratung anfragen"-Button (inquiry_only)
 *
 * Gibt 404 zurück wenn Produkt nicht existiert oder nicht aktiv ist.
 */
productRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const { data: locale = "de" } = LocaleSchema.safeParse(c.req.query("locale"));

  const product = await ProductService.getProductBySlug(slug);

  if (!product || product.status !== "active") {
    throw new CatalogError(
      "PRODUCT_NOT_FOUND",
      404,
      `Produkt nicht gefunden: ${slug}`
    );
  }

  return c.json({
    data: toProductDetail(product, locale),
  });
});
