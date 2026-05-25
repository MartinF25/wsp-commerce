/**
 * Feature Visual Engine – Hono API Routes
 *
 * Admin-Endpunkte (geschützt via X-Admin-Key in admin.ts):
 *   Definitions:
 *     GET    /api/admin/feature-definitions          → alle Definitionen
 *     POST   /api/admin/feature-definitions          → anlegen
 *     GET    /api/admin/feature-definitions/:id      → Detail
 *     PUT    /api/admin/feature-definitions/:id      → aktualisieren
 *     DELETE /api/admin/feature-definitions/:id      → löschen
 *
 *   Visuals:
 *     GET    /api/admin/feature-visuals              → alle Visuals
 *     POST   /api/admin/feature-visuals              → anlegen
 *     GET    /api/admin/feature-visuals/:id          → Detail
 *     PUT    /api/admin/feature-visuals/:id          → aktualisieren
 *     DELETE /api/admin/feature-visuals/:id          → löschen
 *
 *   Settings:
 *     GET    /api/admin/feature-visual-settings      → Einstellungen laden
 *     PUT    /api/admin/feature-visual-settings      → Einstellungen speichern
 *
 * Öffentliche Endpunkte:
 *     GET    /api/catalog/feature-visuals/resolve    → Features für Produkt auflösen
 */

import { Hono } from "hono";
import {
  CreateFeatureDefinitionSchema,
  UpdateFeatureDefinitionSchema,
  CreateFeatureVisualSchema,
  UpdateFeatureVisualSchema,
  UpdateFeatureVisualSettingsSchema,
} from "@wsp/contracts";
import { FeatureVisualService } from "../../services/feature-visual-service";
import { CatalogError } from "../../types";
import { getPrismaClient } from "../../lib/prisma";

const service = new FeatureVisualService(getPrismaClient());

// ─── Admin: Definitions ───────────────────────────────────────────────────────

export const adminFeatureDefinitionRoutes = new Hono();

adminFeatureDefinitionRoutes.get("/", async (c) => {
  const categoryId = c.req.query("categoryId") ?? undefined;
  const activeOnly = c.req.query("activeOnly") !== "false";
  const defs = await service.listDefinitions({ categoryId, activeOnly });
  return c.json({ data: defs, total: defs.length });
});

adminFeatureDefinitionRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) throw new CatalogError("INVALID_BODY", 422, "Kein oder ungültiger JSON-Body.");

  const parsed = CreateFeatureDefinitionSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError("INVALID_INPUT", 422, parsed.error.issues[0]?.message ?? "Validierungsfehler.");
  }

  // Unique-Slug-Check
  const existing = await service.getDefinitionBySlug(parsed.data.slug);
  if (existing) {
    throw new CatalogError("CONFLICT", 409, `Slug '${parsed.data.slug}' bereits vergeben.`);
  }

  const def = await service.createDefinition(parsed.data);
  return c.json({ data: def }, 201);
});

adminFeatureDefinitionRoutes.get("/:id", async (c) => {
  const def = await service.getDefinitionById(c.req.param("id"));
  if (!def) throw new CatalogError("NOT_FOUND", 404, "Feature-Definition nicht gefunden.");
  return c.json({ data: def });
});

adminFeatureDefinitionRoutes.put("/:id", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) throw new CatalogError("INVALID_BODY", 422, "Kein oder ungültiger JSON-Body.");

  const parsed = UpdateFeatureDefinitionSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError("INVALID_INPUT", 422, parsed.error.issues[0]?.message ?? "Validierungsfehler.");
  }

  const existing = await service.getDefinitionById(c.req.param("id"));
  if (!existing) throw new CatalogError("NOT_FOUND", 404, "Feature-Definition nicht gefunden.");

  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const conflict = await service.getDefinitionBySlug(parsed.data.slug);
    if (conflict) throw new CatalogError("CONFLICT", 409, `Slug '${parsed.data.slug}' bereits vergeben.`);
  }

  const updated = await service.updateDefinition(c.req.param("id"), parsed.data);
  return c.json({ data: updated });
});

adminFeatureDefinitionRoutes.delete("/:id", async (c) => {
  const existing = await service.getDefinitionById(c.req.param("id"));
  if (!existing) throw new CatalogError("NOT_FOUND", 404, "Feature-Definition nicht gefunden.");
  await service.deleteDefinition(c.req.param("id"));
  return c.json({ success: true });
});

// ─── Admin: Visuals ───────────────────────────────────────────────────────────

export const adminFeatureVisualRoutes = new Hono();

adminFeatureVisualRoutes.get("/", async (c) => {
  const definitionId = c.req.query("definitionId") ?? undefined;
  const categoryId = c.req.query("categoryId") ?? undefined;
  const productId = c.req.query("productId") ?? undefined;
  const scope = (c.req.query("scope") as any) ?? undefined;
  const activeOnly = c.req.query("activeOnly") !== "false";
  const limit = Math.min(parseInt(c.req.query("limit") ?? "100"), 200);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const result = await service.listVisuals({ definitionId, categoryId, productId, scope, activeOnly, limit, offset });
  return c.json({ data: result.items, total: result.total });
});

adminFeatureVisualRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) throw new CatalogError("INVALID_BODY", 422, "Kein oder ungültiger JSON-Body.");

  const parsed = CreateFeatureVisualSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError("INVALID_INPUT", 422, parsed.error.issues[0]?.message ?? "Validierungsfehler.");
  }

  if (!parsed.data.image_url && !parsed.data.svg_content) {
    throw new CatalogError("INVALID_INPUT", 422, "Entweder image_url oder svg_content ist erforderlich.");
  }

  const visual = await service.createVisual(parsed.data);
  return c.json({ data: visual }, 201);
});

adminFeatureVisualRoutes.get("/:id", async (c) => {
  const visual = await service.getVisualById(c.req.param("id"));
  if (!visual) throw new CatalogError("NOT_FOUND", 404, "Feature-Visual nicht gefunden.");
  return c.json({ data: visual });
});

adminFeatureVisualRoutes.put("/:id", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) throw new CatalogError("INVALID_BODY", 422, "Kein oder ungültiger JSON-Body.");

  const parsed = UpdateFeatureVisualSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError("INVALID_INPUT", 422, parsed.error.issues[0]?.message ?? "Validierungsfehler.");
  }

  const existing = await service.getVisualById(c.req.param("id"));
  if (!existing) throw new CatalogError("NOT_FOUND", 404, "Feature-Visual nicht gefunden.");

  const updated = await service.updateVisual(c.req.param("id"), parsed.data);
  return c.json({ data: updated });
});

adminFeatureVisualRoutes.delete("/:id", async (c) => {
  const existing = await service.getVisualById(c.req.param("id"));
  if (!existing) throw new CatalogError("NOT_FOUND", 404, "Feature-Visual nicht gefunden.");
  await service.deleteVisual(c.req.param("id"));
  return c.json({ success: true });
});

// ─── Admin: Settings ─────────────────────────────────────────────────────────

export const adminFeatureVisualSettingsRoutes = new Hono();

adminFeatureVisualSettingsRoutes.get("/", async (c) => {
  const settings = await service.getSettings();
  return c.json({ data: settings });
});

adminFeatureVisualSettingsRoutes.put("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) throw new CatalogError("INVALID_BODY", 422, "Kein oder ungültiger JSON-Body.");

  const parsed = UpdateFeatureVisualSettingsSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError("INVALID_INPUT", 422, parsed.error.issues[0]?.message ?? "Validierungsfehler.");
  }

  const settings = await service.updateSettings(parsed.data);
  return c.json({ data: settings });
});

// ─── Public: Resolve ──────────────────────────────────────────────────────────

export const publicFeatureVisualRoutes = new Hono();

/**
 * GET /api/catalog/feature-visuals/resolve
 *
 * Query-Parameter:
 *   features[]  → Feature-Strings (mehrfach angeben, z.B. ?features[]=IP65&features[]=400W)
 *   productId   → UUID des Produkts (optional, für scope=product)
 *   categoryId  → UUID der Kategorie (optional, für scope=category)
 *   locale      → Sprache, Default: de
 */
publicFeatureVisualRoutes.get("/resolve", async (c) => {
  const features = c.req.queries("features[]") ?? c.req.queries("features") ?? [];
  const productId = c.req.query("productId") ?? undefined;
  const categoryId = c.req.query("categoryId") ?? undefined;
  const locale = c.req.query("locale") ?? "de";

  if (features.length === 0) {
    return c.json({ data: [] });
  }

  const resolved = await service.resolveProductFeatures(features, {
    productId,
    categoryId,
    locale,
  });
  return c.json({ data: resolved });
});

/**
 * GET /api/catalog/feature-visuals/settings
 * Öffentliche Einstellungen für den Storefront (nur Render-Config, keine Admin-Daten).
 */
publicFeatureVisualRoutes.get("/settings", async (c) => {
  const settings = await service.getSettings();
  // Return only display-relevant fields to public
  const {
    enable_product_page,
    enable_quick_view,
    enable_miniature,
    enable_faceted_search,
    enable_collection,
    enable_search_results,
    default_display_mode,
    default_icon_size,
    show_labels,
    show_tooltips,
    enable_animations,
    responsive_config,
    product_page_mode,
    product_page_position,
    product_page_columns,
    miniature_mode,
    miniature_max_icons,
    miniature_position,
    facet_show_icons,
    facet_show_labels,
    facet_collapsible,
    font_size,
    font_weight,
  } = settings ?? {};

  return c.json({
    data: {
      enable_product_page,
      enable_quick_view,
      enable_miniature,
      enable_faceted_search,
      enable_collection,
      enable_search_results,
      default_display_mode,
      default_icon_size,
      show_labels,
      show_tooltips,
      enable_animations,
      responsive_config,
      product_page_mode,
      product_page_position,
      product_page_columns,
      miniature_mode,
      miniature_max_icons,
      miniature_position,
      facet_show_icons,
      facet_show_labels,
      facet_collapsible,
      font_size,
      font_weight,
    },
  });
});
