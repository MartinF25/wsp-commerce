import { Hono } from "hono";
import {
  StickerCreateInputSchema,
  StickerUpdateInputSchema,
  StickerStatusUpdateSchema,
  StickerProductOverrideInputSchema,
} from "@wsp/contracts";
import { StickerService } from "../../services/stickerService";
import { toStickerAdmin } from "../../mappers/sticker";
import { CatalogError } from "../../types";

/**
 * Admin-Sticker-Routen – geschützte Verwaltungs-API
 *
 * Alle Routen liegen unter /api/admin/stickers und sind durch
 * den X-Admin-Key Middleware-Guard in admin.ts geschützt.
 *
 * Endpunkte:
 *   GET    /                              → alle Sticker (auch inaktive)
 *   POST   /                              → Sticker anlegen
 *   GET    /:id                           → Sticker-Detail
 *   PUT    /:id                           → Sticker aktualisieren
 *   PATCH  /:id/status                    → Status setzen
 *   DELETE /:id                           → Sticker löschen
 *   POST   /:id/overrides                 → Produkt-Override setzen/aktualisieren
 *   DELETE /:id/overrides/:productId      → Produkt-Override entfernen
 */
export const adminStickerRoutes = new Hono();

function toDate(s: string | null | undefined): Date | null | undefined {
  if (s === null) return null;
  if (s === undefined) return undefined;
  return new Date(s);
}

// ─── GET / ────────────────────────────────────────────────────────────────────

adminStickerRoutes.get("/", async (c) => {
  const stickers = await StickerService.listAllStickers();
  return c.json({ data: stickers.map(toStickerAdmin) });
});

// ─── GET /product-matrix ──────────────────────────────────────────────────────

adminStickerRoutes.get("/product-matrix", async (c) => {
  const matrix = await StickerService.getProductStickerMatrix();
  return c.json({ data: matrix });
});

// ─── POST / ───────────────────────────────────────────────────────────────────

adminStickerRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) throw new CatalogError("INVALID_BODY", 422, "Kein oder ungültiger JSON-Body.");

  const parsed = StickerCreateInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_INPUT",
      422,
      `Validierungsfehler: ${parsed.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const { translations, rules, ...rest } = parsed.data;
  const sticker = await StickerService.createSticker({
    ...rest,
    image_url: rest.image_url ?? null,
    text_color: rest.text_color ?? null,
    bg_color: rest.bg_color ?? null,
    border_color: rest.border_color ?? null,
    font_size: rest.font_size ?? null,
    border_radius: rest.border_radius ?? null,
    padding: rest.padding ?? null,
    opacity: rest.opacity ?? null,
    css_class: rest.css_class ?? null,
    custom_css: rest.custom_css ?? null,
    link_url: rest.link_url ?? null,
    position_x: rest.position_x ?? null,
    position_y: rest.position_y ?? null,
    valid_from: toDate(rest.valid_from),
    valid_until: toDate(rest.valid_until),
    store_id: rest.store_id ?? null,
    customer_groups: rest.customer_groups ?? null,
    translations: translations.map((t) => ({
      locale: t.locale,
      text: t.text ?? null,
      tooltip: t.tooltip ?? null,
      tooltip_link_label: t.tooltip_link_label ?? null,
      tooltip_link_url: t.tooltip_link_url ?? null,
      link_url: t.link_url ?? null,
    })),
    rules: rules.map((r) => ({
      rule_type: r.rule_type,
      category_id: r.category_id ?? null,
      price_min_cents: r.price_min_cents ?? null,
      price_max_cents: r.price_max_cents ?? null,
      availability_status: r.availability_status ?? null,
      new_arrival_days: r.new_arrival_days ?? null,
    })),
  });

  return c.json({ data: toStickerAdmin(sticker) }, 201);
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────

adminStickerRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const sticker = await StickerService.requireStickerById(id);
  return c.json({ data: toStickerAdmin(sticker) });
});

// ─── GET /:id/overrides ───────────────────────────────────────────────────────

adminStickerRoutes.get("/:id/overrides", async (c) => {
  const id = c.req.param("id");
  const overrides = await StickerService.getProductOverrides(id);
  return c.json({
    data: overrides.map((o) => ({
      id: o.id,
      sticker_id: o.sticker_id,
      product_id: o.product_id,
      enabled: o.enabled,
      excluded: o.excluded,
      product: {
        id: o.product.id,
        slug: o.product.slug,
        name: o.product.translations[0]?.name ?? o.product.slug,
      },
    })),
  });
});

// ─── PUT /:id ─────────────────────────────────────────────────────────────────

adminStickerRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  await StickerService.requireStickerById(id);

  const body = await c.req.json().catch(() => null);
  if (!body) throw new CatalogError("INVALID_BODY", 422, "Kein oder ungültiger JSON-Body.");

  const parsed = StickerUpdateInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_INPUT",
      422,
      `Validierungsfehler: ${parsed.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const { translations, rules, ...rest } = parsed.data;
  const sticker = await StickerService.updateSticker(id, {
    ...rest,
    valid_from: toDate(rest.valid_from),
    valid_until: toDate(rest.valid_until),
    translations: translations?.map((t) => ({
      locale: t.locale,
      text: t.text ?? null,
      tooltip: t.tooltip ?? null,
      tooltip_link_label: t.tooltip_link_label ?? null,
      tooltip_link_url: t.tooltip_link_url ?? null,
      link_url: t.link_url ?? null,
    })),
    rules: rules?.map((r) => ({
      rule_type: r.rule_type,
      category_id: r.category_id ?? null,
      price_min_cents: r.price_min_cents ?? null,
      price_max_cents: r.price_max_cents ?? null,
      availability_status: r.availability_status ?? null,
      new_arrival_days: r.new_arrival_days ?? null,
    })),
  });

  return c.json({ data: toStickerAdmin(sticker) });
});

// ─── PATCH /:id/status ────────────────────────────────────────────────────────

adminStickerRoutes.patch("/:id/status", async (c) => {
  const id = c.req.param("id");
  await StickerService.requireStickerById(id);

  const body = await c.req.json().catch(() => null);
  const parsed = StickerStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError("INVALID_INPUT", 422, "Ungültiger Status-Wert.");
  }

  await StickerService.updateStickerStatus(id, parsed.data.status);
  return c.json({ success: true });
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

adminStickerRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await StickerService.requireStickerById(id);
  await StickerService.deleteSticker(id);
  return c.json({ success: true });
});

// ─── Produkt-Overrides ────────────────────────────────────────────────────────

adminStickerRoutes.post("/:id/overrides", async (c) => {
  const stickerId = c.req.param("id");
  await StickerService.requireStickerById(stickerId);

  const body = await c.req.json().catch(() => null);
  const parsed = StickerProductOverrideInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_INPUT",
      422,
      `Validierungsfehler: ${parsed.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  await StickerService.upsertProductOverride(stickerId, parsed.data);
  return c.json({ success: true }, 201);
});

adminStickerRoutes.delete("/:id/overrides/:productId", async (c) => {
  const stickerId = c.req.param("id");
  const productId = c.req.param("productId");
  await StickerService.removeProductOverride(stickerId, productId);
  return c.json({ success: true });
});
