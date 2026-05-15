import { Hono } from "hono";
import {
  BundleCreateInputSchema,
  BundleUpdateInputSchema,
  BundleItemInputSchema,
  BundleItemUpdateInputSchema,
  BundleStatusUpdateSchema,
} from "@wsp/contracts";
import { BundleService } from "../../services/bundleService";
import { toBundleAdmin } from "../../mappers/bundle";
import { CatalogError } from "../../types";

/**
 * Admin-Bundle-Routen – geschützte Verwaltungs-API
 *
 * Endpunkte (relativ zu /api/admin/bundles):
 *   GET    /                             → alle Bundles (alle Status)
 *   POST   /                             → Bundle anlegen
 *   GET    /:id                          → Bundle-Detail
 *   PUT    /:id                          → Bundle aktualisieren
 *   DELETE /:id                          → Bundle löschen
 *   PATCH  /:id/status                   → Status setzen
 *   POST   /:id/items                    → Produkt zum Bundle hinzufügen
 *   PATCH  /:id/items/:itemId            → Bundle-Item aktualisieren
 *   DELETE /:id/items/:itemId            → Bundle-Item entfernen
 *   POST   /:id/products/:productId      → Bundle einem Produkt zuweisen
 *   DELETE /:id/products/:productId      → Produkt-Zuweisung entfernen
 *   POST   /:id/categories/:categoryId   → Bundle einer Kategorie zuweisen
 *   DELETE /:id/categories/:categoryId   → Kategorie-Zuweisung entfernen
 */
export const adminBundleRoutes = new Hono();

function toDate(s: string | null | undefined): Date | null | undefined {
  if (s === null) return null;
  if (s === undefined) return undefined;
  return new Date(s);
}

// ─── GET / ────────────────────────────────────────────────────────────────────

adminBundleRoutes.get("/", async (c) => {
  const locale = c.req.query("locale") ?? "de";
  const bundles = await BundleService.listAllBundles();
  return c.json({ data: bundles.map((b) => toBundleAdmin(b, locale)) });
});

// ─── POST / ───────────────────────────────────────────────────────────────────

adminBundleRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) throw new CatalogError("INVALID_BODY", 422, "Kein oder ungültiger JSON-Body.");

  const parsed = BundleCreateInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_INPUT",
      422,
      `Validierungsfehler: ${parsed.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const { translations, ...rest } = parsed.data;

  const bundle = await BundleService.createBundle({
    ...rest,
    valid_from: toDate(rest.valid_from),
    valid_until: toDate(rest.valid_until),
    valid_from_discount: toDate(rest.valid_from_discount),
    valid_until_discount: toDate(rest.valid_until_discount),
    translations: translations.map((t) => ({
      ...t,
      description: t.description ?? null,
      tab_name: t.tab_name ?? null,
    })),
  });

  const locale = c.req.query("locale") ?? "de";
  return c.json({ data: toBundleAdmin(bundle, locale) }, 201);
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────

adminBundleRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const locale = c.req.query("locale") ?? "de";

  const bundle = await BundleService.requireBundleById(id);
  return c.json({ data: toBundleAdmin(bundle, locale) });
});

// ─── PUT /:id ─────────────────────────────────────────────────────────────────

adminBundleRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  await BundleService.requireBundleById(id);

  const body = await c.req.json().catch(() => null);
  if (!body) throw new CatalogError("INVALID_BODY", 422, "Kein oder ungültiger JSON-Body.");

  const parsed = BundleUpdateInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_INPUT",
      422,
      `Validierungsfehler: ${parsed.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const { translations, ...rest } = parsed.data;

  const bundle = await BundleService.updateBundle(id, {
    ...rest,
    valid_from: toDate(rest.valid_from),
    valid_until: toDate(rest.valid_until),
    valid_from_discount: toDate(rest.valid_from_discount),
    valid_until_discount: toDate(rest.valid_until_discount),
    translations: translations?.map((t) => ({
      ...t,
      description: t.description ?? null,
      tab_name: t.tab_name ?? null,
    })),
  });

  const locale = c.req.query("locale") ?? "de";
  return c.json({ data: toBundleAdmin(bundle, locale) });
});

// ─── PATCH /:id/status ────────────────────────────────────────────────────────

adminBundleRoutes.patch("/:id/status", async (c) => {
  const id = c.req.param("id");
  await BundleService.requireBundleById(id);

  const body = await c.req.json().catch(() => null);
  const parsed = BundleStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError("INVALID_INPUT", 422, "Ungültiger Status-Wert.");
  }

  await BundleService.updateBundleStatus(id, parsed.data.status);
  return c.json({ success: true });
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

adminBundleRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await BundleService.requireBundleById(id);
  await BundleService.deleteBundle(id);
  return c.json({ success: true });
});

// ─── Bundle Items ─────────────────────────────────────────────────────────────

adminBundleRoutes.post("/:id/items", async (c) => {
  const bundleId = c.req.param("id");
  await BundleService.requireBundleById(bundleId);

  const body = await c.req.json().catch(() => null);
  const parsed = BundleItemInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_INPUT",
      422,
      `Validierungsfehler: ${parsed.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  await BundleService.addBundleItem(bundleId, parsed.data);
  return c.json({ success: true }, 201);
});

adminBundleRoutes.patch("/:id/items/:itemId", async (c) => {
  const itemId = c.req.param("itemId");

  const body = await c.req.json().catch(() => null);
  const parsed = BundleItemUpdateInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_INPUT",
      422,
      `Validierungsfehler: ${parsed.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  await BundleService.updateBundleItem(itemId, parsed.data);
  return c.json({ success: true });
});

adminBundleRoutes.delete("/:id/items/:itemId", async (c) => {
  const itemId = c.req.param("itemId");
  await BundleService.removeBundleItem(itemId);
  return c.json({ success: true });
});

// ─── Bundle Assignments – Produkte ───────────────────────────────────────────

adminBundleRoutes.post("/:id/products/:productId", async (c) => {
  const bundleId = c.req.param("id");
  const productId = c.req.param("productId");
  await BundleService.requireBundleById(bundleId);
  await BundleService.assignToProduct(bundleId, productId);
  return c.json({ success: true }, 201);
});

adminBundleRoutes.delete("/:id/products/:productId", async (c) => {
  const bundleId = c.req.param("id");
  const productId = c.req.param("productId");
  await BundleService.unassignFromProduct(bundleId, productId);
  return c.json({ success: true });
});

// ─── Bundle Assignments – Kategorien ─────────────────────────────────────────

adminBundleRoutes.post("/:id/categories/:categoryId", async (c) => {
  const bundleId = c.req.param("id");
  const categoryId = c.req.param("categoryId");
  await BundleService.requireBundleById(bundleId);
  await BundleService.assignToCategory(bundleId, categoryId);
  return c.json({ success: true }, 201);
});

adminBundleRoutes.delete("/:id/categories/:categoryId", async (c) => {
  const bundleId = c.req.param("id");
  const categoryId = c.req.param("categoryId");
  await BundleService.unassignFromCategory(bundleId, categoryId);
  return c.json({ success: true });
});
