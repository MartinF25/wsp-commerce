/**
 * Admin-Routen – geschützte Verwaltungs-API
 *
 * Authentifizierung: X-Admin-Key Header gegen ADMIN_SECRET env-Variable.
 * Fail-closed: Kein ADMIN_SECRET → 503.
 *
 * Endpunkte (relativ zu /api/admin):
 *   GET    /products                    → alle Produkte (alle Status)
 *   POST   /products                    → Produkt anlegen
 *   GET    /products/:id                → Produkt-Detail mit Übersetzungen, Varianten, Bilder
 *   PUT    /products/:id                → Produkt + Übersetzungen aktualisieren
 *   DELETE /products/:id                → Produkt löschen
 *   PATCH  /products/:id/status         → Status setzen
 *   GET    /products/:id/images         → Bilder eines Produkts
 *   POST   /products/:id/images         → Bild hinzufügen
 *   PATCH  /images/:imgId               → Bild aktualisieren
 *   DELETE /images/:imgId               → Bild löschen
 *   GET    /products/:id/variants       → Varianten eines Produkts
 *   POST   /products/:id/variants       → Variante anlegen
 *   PATCH  /variants/:varId             → Variante aktualisieren
 *   DELETE /variants/:varId             → Variante löschen
 *   GET    /products/:id/documents      → Dokumente eines Produkts
 *   POST   /products/:id/documents      → Dokument hinzufügen
 *   PATCH  /documents/:docId            → Dokument aktualisieren
 *   DELETE /documents/:docId            → Dokument löschen
 *   GET    /categories                  → alle Kategorien
 *   POST   /categories                  → Kategorie anlegen
 *   GET    /categories/:id              → Kategorie-Detail
 *   PUT    /categories/:id              → Kategorie aktualisieren
 *   DELETE /categories/:id              → Kategorie löschen
 *   PATCH  /categories/:id/visibility   → Sichtbarkeit umschalten
 *   GET    /ticker                      → alle Ticker-Nachrichten
 *   POST   /ticker                      → Ticker-Nachricht anlegen
 *   GET    /ticker/:id                  → Ticker-Nachricht Detail
 *   PUT    /ticker/:id                  → Ticker-Nachricht aktualisieren
 *   PATCH  /ticker/:id/status           → Status setzen
 *   DELETE /ticker/:id                  → Ticker-Nachricht löschen
 *   GET    /products/:id/affiliate-stats → Klickstatistik eines Produkts
 *   GET    /affiliate/stats              → Aggregierte Klickstatistik aller Affiliate-Produkte
 *   POST   /import/affiliate-products   → Affiliate-Produkte importieren (dry_run | commit)
 *   PATCH  /products/:id/affiliate-health → Health-Status nach n8n-Prüfung setzen
 */

import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { getPrismaClient } from "../../lib/prisma";
import { CatalogError } from "../../types";
import { BlogService } from "../../services/blogService";
import { requireAdminKey } from "../middleware/requireAdminKey";
import {
  BlogPostInputSchema,
  BlogPostStatusInputSchema,
  BlogCategoryInputSchema,
  BlogTagInputSchema,
  TickerInputSchema,
  TickerStatusUpdateSchema,
} from "@wsp/contracts";

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

const VALID_STATUSES = ["draft", "active", "archived"] as const;
type ProductStatusValue = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is ProductStatusValue {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

const VALID_PRODUCT_TYPES = ["direct_purchase", "configurable", "inquiry_only", "affiliate_external"] as const;
type ProductTypeValue = (typeof VALID_PRODUCT_TYPES)[number];

function isValidProductType(value: unknown): value is ProductTypeValue {
  return typeof value === "string" && (VALID_PRODUCT_TYPES as readonly string[]).includes(value);
}

const VALID_LOCALES = ["de", "en", "es"] as const;
type LocaleValue = (typeof VALID_LOCALES)[number];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] ?? c))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const adminRoutes = new Hono();

adminRoutes.use("*", requireAdminKey);


// ═══════════════════════════════════════════════════════════════════════════════
// KATEGORIEN
// ═══════════════════════════════════════════════════════════════════════════════

adminRoutes.get("/categories", async (c) => {
  const prisma = getPrismaClient();

  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      translations: { orderBy: { locale: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  return c.json({
    data: categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description ?? null,
      image_url: cat.image_url ?? null,
      meta_title: cat.meta_title ?? null,
      meta_description: cat.meta_description ?? null,
      is_active: cat.is_active,
      parent_id: cat.parent_id ?? null,
      productCount: cat._count.products,
      translations: cat.translations,
    })),
  });
});

adminRoutes.post("/categories", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const { name, slug, description, image_url, meta_title, meta_description, is_active, parent_id } = body as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim()) {
    throw new CatalogError("INVALID_BODY", 422, "name ist ein Pflichtfeld.");
  }

  const finalSlug = typeof slug === "string" && slug.trim() ? slug.trim() : slugify(name);
  const prisma = getPrismaClient();

  const existing = await prisma.category.findUnique({ where: { slug: finalSlug }, select: { id: true } });
  if (existing) {
    throw new CatalogError("SLUG_CONFLICT", 409, `Slug bereits vergeben: ${finalSlug}`);
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      slug: finalSlug,
      description: typeof description === "string" ? description.trim() || null : null,
      image_url: typeof image_url === "string" ? image_url.trim() || null : null,
      meta_title: typeof meta_title === "string" ? meta_title.trim() || null : null,
      meta_description: typeof meta_description === "string" ? meta_description.trim() || null : null,
      is_active: typeof is_active === "boolean" ? is_active : true,
      parent_id: typeof parent_id === "string" && parent_id ? parent_id : null,
    },
  });

  return c.json({ data: category }, 201);
});

adminRoutes.get("/categories/:id", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) throw new CatalogError("CATEGORY_NOT_FOUND", 404, `Kategorie nicht gefunden: ${id}`);

  return c.json({
    data: {
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description ?? null,
      image_url: category.image_url ?? null,
      meta_title: category.meta_title ?? null,
      meta_description: category.meta_description ?? null,
      is_active: category.is_active,
      parent_id: category.parent_id ?? null,
      productCount: category._count.products,
    },
  });
});

adminRoutes.put("/categories/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = getPrismaClient();

  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!existing) throw new CatalogError("CATEGORY_NOT_FOUND", 404, `Kategorie nicht gefunden: ${id}`);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const { name, slug, description, image_url, meta_title, meta_description, is_active, parent_id } = body as Record<string, unknown>;

  const updateData: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) updateData.name = name.trim();
  if (typeof slug === "string" && slug.trim() && slug.trim() !== existing.slug) {
    const slugConflict = await prisma.category.findUnique({ where: { slug: slug.trim() }, select: { id: true } });
    if (slugConflict) throw new CatalogError("SLUG_CONFLICT", 409, `Slug bereits vergeben: ${slug.trim()}`);
    updateData.slug = slug.trim();
  }
  if (typeof description === "string") updateData.description = description.trim() || null;
  if (image_url === null || typeof image_url === "string") updateData.image_url = typeof image_url === "string" ? image_url.trim() || null : null;
  if (meta_title === null || typeof meta_title === "string") updateData.meta_title = typeof meta_title === "string" ? meta_title.trim() || null : null;
  if (meta_description === null || typeof meta_description === "string") updateData.meta_description = typeof meta_description === "string" ? meta_description.trim() || null : null;
  if (typeof is_active === "boolean") updateData.is_active = is_active;
  if (parent_id === null || (typeof parent_id === "string" && parent_id)) {
    updateData.parent_id = parent_id || null;
  }

  const updated = await prisma.category.update({ where: { id }, data: updateData });

  return c.json({ data: updated });
});

adminRoutes.delete("/categories/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = getPrismaClient();

  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new CatalogError("CATEGORY_NOT_FOUND", 404, `Kategorie nicht gefunden: ${id}`);

  await prisma.category.delete({ where: { id } });
  return new Response(null, { status: 204 });
});

adminRoutes.patch("/categories/:id/visibility", async (c) => {
  const id = c.req.param("id");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const raw = (body as Record<string, unknown>)?.is_active;

  if (typeof raw !== "boolean") {
    throw new CatalogError(
      "INVALID_VISIBILITY",
      422,
      `Ungültiger Wert: is_active muss true oder false sein (Boolean, kein String).`
    );
  }

  const prisma = getPrismaClient();

  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true, is_active: true },
  });

  if (!existing) {
    throw new CatalogError("CATEGORY_NOT_FOUND", 404, `Kategorie nicht gefunden: ${id}`);
  }

  const updated = await prisma.category.update({
    where: { id },
    data: { is_active: raw },
    select: { id: true, slug: true, name: true, is_active: true },
  });

  console.info(
    `[admin] Kategorie-Sichtbarkeit geändert: ${updated.slug} → is_active=${updated.is_active}`
  );

  return c.json({ data: updated });
});

// ─── GET /categories/:id/translations ────────────────────────────────────────

adminRoutes.get("/categories/:id/translations", async (c) => {
  const id = c.req.param("id");
  const prisma = getPrismaClient();

  const category = await prisma.category.findUnique({
    where: { id },
    include: { translations: { orderBy: { locale: "asc" } } },
  });

  if (!category) throw new CatalogError("CATEGORY_NOT_FOUND", 404, `Kategorie nicht gefunden: ${id}`);

  return c.json({ data: category.translations });
});

// ─── PUT /categories/:id/translations/:locale ─────────────────────────────────

adminRoutes.put("/categories/:id/translations/:locale", async (c) => {
  const id = c.req.param("id");
  const locale = c.req.param("locale") as "de" | "en" | "es";

  if (!["de", "en", "es"].includes(locale)) {
    throw new CatalogError("INVALID_LOCALE", 422, `Ungültige Locale: ${locale}. Erlaubt: de, en, es`);
  }

  const prisma = getPrismaClient();
  const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!category) throw new CatalogError("CATEGORY_NOT_FOUND", 404, `Kategorie nicht gefunden: ${id}`);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const { name, description, meta_title, meta_description } = body as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim()) {
    throw new CatalogError("INVALID_BODY", 422, "name ist ein Pflichtfeld.");
  }

  const translation = await prisma.categoryTranslation.upsert({
    where: { category_id_locale: { category_id: id, locale } },
    update: {
      name: name.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      meta_title: typeof meta_title === "string" ? meta_title.trim() || null : null,
      meta_description: typeof meta_description === "string" ? meta_description.trim() || null : null,
    },
    create: {
      category_id: id,
      locale,
      name: name.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      meta_title: typeof meta_title === "string" ? meta_title.trim() || null : null,
      meta_description: typeof meta_description === "string" ? meta_description.trim() || null : null,
    },
  });

  return c.json({ data: translation });
});

// ─── DELETE /categories/:id/translations/:locale ──────────────────────────────

adminRoutes.delete("/categories/:id/translations/:locale", async (c) => {
  const id = c.req.param("id");
  const locale = c.req.param("locale");
  const prisma = getPrismaClient();

  await prisma.categoryTranslation.deleteMany({
    where: { category_id: id, locale: locale as "de" | "en" | "es" },
  });

  return new Response(null, { status: 204 });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUKTE
// ═══════════════════════════════════════════════════════════════════════════════

adminRoutes.get("/products", async (c) => {
  const prisma = getPrismaClient();

  const products = await prisma.product.findMany({
    include: {
      category: true,
      translations: { where: { locale: "de" } },
      _count: { select: { variants: true } },
      variants: { select: { stock_quantity: true } },
    },
    orderBy: { updated_at: "desc" },
  });

  return c.json({
    data: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.translations[0]?.name ?? p.slug,
      status: p.status,
      product_type: p.product_type,
      category: p.category
        ? { id: p.category.id, slug: p.category.slug, name: p.category.name }
        : null,
      variantCount: p._count.variants,
      totalStock: p.variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0),
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
    })),
  });
});

adminRoutes.post("/products", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const b = body as Record<string, unknown>;
  const { slug, product_type, status, category_id, translations, paypal_url, stripe_url } = b;

  // DE-Übersetzung ist Pflicht
  const deTranslation = (translations as Record<LocaleValue, Record<string, unknown>> | undefined)?.de;
  const deName = deTranslation?.name;

  if (typeof deName !== "string" || !deName.trim()) {
    throw new CatalogError("INVALID_BODY", 422, "translations.de.name ist ein Pflichtfeld.");
  }

  const finalSlug =
    typeof slug === "string" && slug.trim() ? slug.trim() : slugify(deName);

  const prisma = getPrismaClient();

  const existing = await prisma.product.findUnique({ where: { slug: finalSlug }, select: { id: true } });
  if (existing) throw new CatalogError("SLUG_CONFLICT", 409, `Slug bereits vergeben: ${finalSlug}`);

  const product = await prisma.product.create({
    data: {
      slug: finalSlug,
      product_type: isValidProductType(product_type) ? product_type : "inquiry_only",
      status: isValidStatus(status) ? status : "draft",
      category_id: typeof category_id === "string" && category_id ? category_id : null,
      paypal_url: typeof paypal_url === "string" ? paypal_url.trim() || null : null,
      stripe_url: typeof stripe_url === "string" ? stripe_url.trim() || null : null,
      translations: {
        create: buildTranslationCreates(translations as Record<string, unknown> | undefined),
      },
    },
    include: {
      translations: true,
      variants: true,
      images: true,
    },
  });

  return c.json({ data: product }, 201);
});

adminRoutes.get("/products/:id", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      translations: { orderBy: { locale: "asc" } },
      variants: {
        include: { translations: { orderBy: { locale: "asc" } } },
        orderBy: { created_at: "asc" },
      },
      images: { orderBy: { sort_order: "asc" } },
      documents: { orderBy: { sort_order: "asc" } },
    },
  });

  if (!product) throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);

  return c.json({ data: product });
});

adminRoutes.put("/products/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = getPrismaClient();

  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!existing) throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const b = body as Record<string, unknown>;
  const { slug, product_type, status, category_id, translations, paypal_url, stripe_url } = b;

  const productData: Record<string, unknown> = {};
  if (typeof slug === "string" && slug.trim() && slug.trim() !== existing.slug) {
    const slugConflict = await prisma.product.findUnique({ where: { slug: slug.trim() }, select: { id: true } });
    if (slugConflict) throw new CatalogError("SLUG_CONFLICT", 409, `Slug bereits vergeben: ${slug.trim()}`);
    productData.slug = slug.trim();
  }
  if (isValidProductType(product_type)) productData.product_type = product_type;
  if (isValidStatus(status)) productData.status = status;
  if (category_id === null || (typeof category_id === "string")) {
    productData.category_id = category_id || null;
  }
  if ("paypal_url" in b) {
    productData.paypal_url = typeof paypal_url === "string" ? paypal_url.trim() || null : null;
  }
  if ("stripe_url" in b) {
    productData.stripe_url = typeof stripe_url === "string" ? stripe_url.trim() || null : null;
  }
  if ("sale_starts_at" in b) {
    productData.sale_starts_at = b.sale_starts_at ? new Date(b.sale_starts_at as string) : null;
  }
  if ("sale_ends_at" in b) {
    productData.sale_ends_at = b.sale_ends_at ? new Date(b.sale_ends_at as string) : null;
  }
  if ("sale_label" in b) {
    productData.sale_label = typeof b.sale_label === "string" ? b.sale_label.trim() || null : null;
  }
  if ("show_countdown" in b) {
    productData.show_countdown = typeof b.show_countdown === "boolean" ? b.show_countdown : false;
  }
  if ("affiliate_provider" in b) {
    productData.affiliate_provider = strOrNull(b.affiliate_provider);
  }
  if ("affiliate_url" in b) {
    productData.affiliate_url = strOrNull(b.affiliate_url);
  }
  if ("affiliate_asin" in b) {
    productData.affiliate_asin = strOrNull(b.affiliate_asin);
  }
  if ("affiliate_button_label" in b) {
    productData.affiliate_button_label = strOrNull(b.affiliate_button_label);
  }
  if ("affiliate_disclosure" in b) {
    productData.affiliate_disclosure = strOrNull(b.affiliate_disclosure);
  }
  if ("affiliate_enabled" in b) {
    productData.affiliate_enabled = typeof b.affiliate_enabled === "boolean" ? b.affiliate_enabled : false;
  }
  if ("availability_status" in b) {
    const validStatuses = ["in_stock", "out_of_stock", "preorder", "discontinued", "on_request"];
    if (typeof b.availability_status === "string" && validStatuses.includes(b.availability_status)) {
      (productData as any).availability_status = b.availability_status;
    }
  }

  // Translations upsert
  if (translations && typeof translations === "object") {
    const trans = translations as Record<string, Record<string, unknown>>;
    for (const locale of VALID_LOCALES) {
      const t = trans[locale];
      if (!t) continue;
      const tName = t.name;
      if (locale === "de" && (typeof tName !== "string" || !tName.trim())) continue;

      await prisma.productTranslation.upsert({
        where: { product_id_locale: { product_id: id, locale } },
        create: {
          product_id: id,
          locale,
          name: typeof tName === "string" ? tName.trim() : "",
          short_description: strOrNull(t.short_description),
          description: strOrNull(t.description),
          delivery_note: strOrNull(t.delivery_note),
          features: Array.isArray(t.features) ? t.features : [],
          meta_title: strOrNull(t.meta_title),
          meta_description: strOrNull(t.meta_description),
          mounting_note: strOrNull(t.mounting_note),
          project_note: strOrNull(t.project_note),
        },
        update: {
          ...(typeof tName === "string" && tName.trim() && { name: tName.trim() }),
          short_description: strOrNull(t.short_description),
          description: strOrNull(t.description),
          delivery_note: strOrNull(t.delivery_note),
          features: Array.isArray(t.features) ? t.features : undefined,
          meta_title: strOrNull(t.meta_title),
          meta_description: strOrNull(t.meta_description),
          mounting_note: strOrNull(t.mounting_note),
          project_note: strOrNull(t.project_note),
        },
      });
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: productData,
    include: {
      category: true,
      translations: { orderBy: { locale: "asc" } },
      variants: {
        include: { translations: { orderBy: { locale: "asc" } } },
        orderBy: { created_at: "asc" },
      },
      images: { orderBy: { sort_order: "asc" } },
      documents: { orderBy: { sort_order: "asc" } },
    },
  });

  return c.json({ data: updated });
});

adminRoutes.delete("/products/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = getPrismaClient();

  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);

  await prisma.product.delete({ where: { id } });
  return new Response(null, { status: 204 });
});

adminRoutes.get("/products/:id/affiliate-stats", async (c) => {
  const id = c.req.param("id");
  const prisma = getPrismaClient();

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, product_type: true },
  });
  if (!product) throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);

  const now = new Date();
  const minus7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const minus30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalClicks, clicksLast7Days, clicksLast30Days, lastClick] = await Promise.all([
    prisma.affiliateClick.count({ where: { product_id: id } }),
    prisma.affiliateClick.count({ where: { product_id: id, clicked_at: { gte: minus7 } } }),
    prisma.affiliateClick.count({ where: { product_id: id, clicked_at: { gte: minus30 } } }),
    prisma.affiliateClick.findFirst({
      where: { product_id: id },
      orderBy: { clicked_at: "desc" },
      select: { clicked_at: true },
    }),
  ]);

  return c.json({
    data: {
      productId: id,
      totalClicks,
      clicksLast7Days,
      clicksLast30Days,
      lastClickedAt: lastClick?.clicked_at ?? null,
    },
  });
});

// ─── GET /affiliate/stats ─────────────────────────────────────────────────────

adminRoutes.get("/affiliate/stats", async (c) => {
  const prisma = getPrismaClient();
  const now = new Date();
  const minus7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const minus30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const products = await prisma.product.findMany({
    where: { product_type: "affiliate_external" },
    select: {
      id: true,
      slug: true,
      status: true,
      affiliate_provider: true,
      affiliate_url: true,
      affiliate_health_status: true,
      affiliate_health_message: true,
      affiliate_last_checked_at: true,
      translations: { where: { locale: "de" }, select: { name: true } },
    },
  });

  const productIds = products.map((p) => p.id);

  // Alle Klick-Aggregate in 7 parallelen Queries statt 4N
  const [allCounts, last7Counts, last30Counts, lastClicks, sourceRows, localeRows, deviceRows] =
    await Promise.all([
      prisma.affiliateClick.groupBy({
        by: ["product_id"],
        where: { product_id: { in: productIds } },
        _count: { id: true },
      }),
      prisma.affiliateClick.groupBy({
        by: ["product_id"],
        where: { product_id: { in: productIds }, clicked_at: { gte: minus7 } },
        _count: { id: true },
      }),
      prisma.affiliateClick.groupBy({
        by: ["product_id"],
        where: { product_id: { in: productIds }, clicked_at: { gte: minus30 } },
        _count: { id: true },
      }),
      prisma.affiliateClick.findMany({
        where: { product_id: { in: productIds } },
        orderBy: { clicked_at: "desc" },
        select: { product_id: true, clicked_at: true },
        distinct: ["product_id"],
      }),
      prisma.affiliateClick.groupBy({ by: ["source"], _count: { id: true } }),
      prisma.affiliateClick.groupBy({ by: ["locale"], _count: { id: true } }),
      prisma.affiliateClick.groupBy({ by: ["device_category"], _count: { id: true } }),
    ]);

  const toProductCountMap = (rows: { product_id: string; _count: { id: number } }[]) =>
    new Map(rows.map((r) => [r.product_id, r._count.id]));

  const totalMap = toProductCountMap(allCounts);
  const last7Map = toProductCountMap(last7Counts);
  const last30Map = toProductCountMap(last30Counts);
  const lastClickMap = new Map(lastClicks.map((r) => [r.product_id, r.clicked_at]));

  function toBreakdown<K extends string>(
    rows: { _count: { id: number } }[],
    getKey: (row: (typeof rows)[number]) => K | null | undefined
  ): Record<string, number> {
    const result: Record<string, number> = {};
    for (const row of rows) result[getKey(row) ?? "unknown"] = row._count.id;
    return result;
  }

  const perProduct = products.map((p) => ({
    productId: p.id,
    slug: p.slug,
    title: p.translations[0]?.name ?? p.slug,
    status: p.status,
    affiliateProvider: p.affiliate_provider,
    affiliateUrl: p.affiliate_url,
    affiliateHealthStatus: p.affiliate_health_status ?? null,
    affiliateHealthMessage: p.affiliate_health_message ?? null,
    affiliateLastCheckedAt: p.affiliate_last_checked_at?.toISOString() ?? null,
    totalClicks: totalMap.get(p.id) ?? 0,
    clicksLast7Days: last7Map.get(p.id) ?? 0,
    clicksLast30Days: last30Map.get(p.id) ?? 0,
    lastClickedAt: lastClickMap.get(p.id) ?? null,
  }));

  const totalClicks = perProduct.reduce((n, p) => n + p.totalClicks, 0);
  const totalLast7 = perProduct.reduce((n, p) => n + p.clicksLast7Days, 0);
  const totalLast30 = perProduct.reduce((n, p) => n + p.clicksLast30Days, 0);

  return c.json({
    data: {
      summary: { totalClicks, totalLast7Days: totalLast7, totalLast30Days: totalLast30 },
      bySource: toBreakdown(sourceRows, (r) => (r as typeof sourceRows[number]).source),
      byLocale: toBreakdown(localeRows, (r) => (r as typeof localeRows[number]).locale),
      byDevice: toBreakdown(deviceRows, (r) => (r as typeof deviceRows[number]).device_category),
      products: perProduct,
    },
  });
});

adminRoutes.patch("/products/:id/status", async (c) => {
  const id = c.req.param("id");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const raw = (body as Record<string, unknown>)?.status;

  if (!isValidStatus(raw)) {
    throw new CatalogError(
      "INVALID_STATUS",
      422,
      `Ungültiger Status: "${raw}". Erlaubt: draft | active | archived.`
    );
  }

  const prisma = getPrismaClient();

  const existing = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      status: true,
      translations: { where: { locale: "de" }, select: { name: true } },
    },
  });

  if (!existing) {
    throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { status: raw },
    select: {
      id: true,
      slug: true,
      status: true,
      updated_at: true,
      translations: { where: { locale: "de" }, select: { name: true } },
    },
  });

  console.info(
    `[admin] Produkt-Status geändert: ${updated.slug} ${existing.status} → ${updated.status}`
  );

  return c.json({
    data: {
      id: updated.id,
      slug: updated.slug,
      name: updated.translations[0]?.name ?? updated.slug,
      status: updated.status,
      updated_at: updated.updated_at.toISOString(),
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BILDER
// ═══════════════════════════════════════════════════════════════════════════════

adminRoutes.get("/products/:id/images", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);

  const images = await prisma.productImage.findMany({
    where: { product_id: id },
    orderBy: { sort_order: "asc" },
  });

  return c.json({ data: images });
});

adminRoutes.post("/products/:id/images", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const { url, alt, sort_order } = body as Record<string, unknown>;

  if (typeof url !== "string" || !url.trim()) {
    throw new CatalogError("INVALID_BODY", 422, "url ist ein Pflichtfeld.");
  }

  const image = await prisma.productImage.create({
    data: {
      product_id: id,
      url: url.trim(),
      alt: typeof alt === "string" ? alt.trim() || "" : "",
      sort_order: typeof sort_order === "number" ? sort_order : 0,
    },
  });

  return c.json({ data: image }, 201);
});

adminRoutes.get("/images", async (c) => {
  const prisma = getPrismaClient();
  const images = await prisma.productImage.findMany({
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          translations: { where: { locale: "de" }, select: { name: true } },
        },
      },
    },
    orderBy: [{ product_id: "asc" }, { sort_order: "asc" }],
  });
  return c.json({
    data: images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      sort_order: img.sort_order,
      product_id: img.product_id,
      product: {
        id: img.product.id,
        slug: img.product.slug,
        name: img.product.translations[0]?.name ?? img.product.slug,
      },
    })),
  });
});

adminRoutes.patch("/images/:imgId", async (c) => {
  const prisma = getPrismaClient();
  const imgId = c.req.param("imgId");

  const existing = await prisma.productImage.findUnique({ where: { id: imgId } });
  if (!existing) throw new CatalogError("IMAGE_NOT_FOUND", 404, `Bild nicht gefunden: ${imgId}`);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const { url, alt, sort_order } = body as Record<string, unknown>;

  const updated = await prisma.productImage.update({
    where: { id: imgId },
    data: {
      ...(typeof url === "string" && url.trim() && { url: url.trim() }),
      ...(typeof alt === "string" && { alt: alt.trim() || null }),
      ...(typeof sort_order === "number" && { sort_order }),
    },
  });

  return c.json({ data: updated });
});

adminRoutes.delete("/images/:imgId", async (c) => {
  const prisma = getPrismaClient();
  const imgId = c.req.param("imgId");

  const existing = await prisma.productImage.findUnique({ where: { id: imgId } });
  if (!existing) throw new CatalogError("IMAGE_NOT_FOUND", 404, `Bild nicht gefunden: ${imgId}`);

  await prisma.productImage.delete({ where: { id: imgId } });
  return new Response(null, { status: 204 });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANTEN
// ═══════════════════════════════════════════════════════════════════════════════

adminRoutes.get("/products/:id/variants", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);

  const variants = await prisma.productVariant.findMany({
    where: { product_id: id },
    include: { translations: { orderBy: { locale: "asc" } } },
    orderBy: { created_at: "asc" },
  });

  return c.json({ data: variants });
});

adminRoutes.post("/products/:id/variants", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const b = body as Record<string, unknown>;

  if (typeof b.sku !== "string" || !b.sku.trim()) {
    throw new CatalogError("INVALID_BODY", 422, "sku ist ein Pflichtfeld.");
  }

  const skuConflict = await prisma.productVariant.findUnique({ where: { sku: b.sku.trim() }, select: { id: true } });
  if (skuConflict) throw new CatalogError("SKU_CONFLICT", 409, `SKU bereits vergeben: ${b.sku.trim()}`);

  const variant = await prisma.productVariant.create({
    data: {
      product_id: id,
      sku: b.sku.trim(),
      is_active: typeof b.is_active === "boolean" ? b.is_active : true,
      price_cents: typeof b.price_cents === "number" ? Math.round(b.price_cents) : null,
      currency: typeof b.currency === "string" && b.currency ? b.currency : "EUR",
      stock_quantity: typeof b.stock_quantity === "number" ? Math.round(b.stock_quantity) : 0,
      attributes: (b.attributes && typeof b.attributes === "object" ? b.attributes : {}) as Prisma.InputJsonValue,
      weight_kg: typeof b.weight_kg === "number" ? b.weight_kg : null,
      dimensions: (b.dimensions && typeof b.dimensions === "object" ? b.dimensions : Prisma.DbNull) as typeof Prisma.DbNull | Prisma.InputJsonValue,
    },
    include: { translations: true },
  });

  return c.json({ data: variant }, 201);
});

adminRoutes.patch("/variants/:varId", async (c) => {
  const prisma = getPrismaClient();
  const varId = c.req.param("varId");

  const existing = await prisma.productVariant.findUnique({ where: { id: varId } });
  if (!existing) throw new CatalogError("VARIANT_NOT_FOUND", 404, `Variante nicht gefunden: ${varId}`);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const b = body as Record<string, unknown>;

  const updateData: Record<string, unknown> = {};
  if (typeof b.sku === "string" && b.sku.trim() && b.sku.trim() !== existing.sku) {
    const skuConflict = await prisma.productVariant.findUnique({ where: { sku: b.sku.trim() }, select: { id: true } });
    if (skuConflict) throw new CatalogError("SKU_CONFLICT", 409, `SKU bereits vergeben: ${b.sku.trim()}`);
    updateData.sku = b.sku.trim();
  }
  if (typeof b.is_active === "boolean") updateData.is_active = b.is_active;
  if (typeof b.price_cents === "number") updateData.price_cents = Math.round(b.price_cents);
  if (b.price_cents === null) updateData.price_cents = null;
  if (typeof b.sale_price_cents === "number") updateData.sale_price_cents = Math.round(b.sale_price_cents);
  if (b.sale_price_cents === null) updateData.sale_price_cents = null;
  if (typeof b.currency === "string" && b.currency) updateData.currency = b.currency;
  if (typeof b.stock_quantity === "number") updateData.stock_quantity = Math.round(b.stock_quantity);
  if (b.attributes && typeof b.attributes === "object") updateData.attributes = b.attributes;
  if (typeof b.weight_kg === "number") updateData.weight_kg = b.weight_kg;
  if (b.weight_kg === null) updateData.weight_kg = null;
  if (b.dimensions && typeof b.dimensions === "object") updateData.dimensions = b.dimensions;
  if (b.dimensions === null) updateData.dimensions = null;

  // Varianten-Übersetzungen
  if (b.translations && typeof b.translations === "object") {
    const trans = b.translations as Record<string, Record<string, unknown>>;
    for (const locale of VALID_LOCALES) {
      const t = trans[locale];
      if (!t || typeof t.name !== "string" || !t.name.trim()) continue;
      await prisma.productVariantTranslation.upsert({
        where: { variant_id_locale: { variant_id: varId, locale } },
        create: { variant_id: varId, locale, name: t.name.trim() },
        update: { name: t.name.trim() },
      });
    }
  }

  const updated = await prisma.productVariant.update({
    where: { id: varId },
    data: updateData,
    include: { translations: { orderBy: { locale: "asc" } } },
  });

  return c.json({ data: updated });
});

adminRoutes.delete("/variants/:varId", async (c) => {
  const prisma = getPrismaClient();
  const varId = c.req.param("varId");

  const existing = await prisma.productVariant.findUnique({ where: { id: varId } });
  if (!existing) throw new CatalogError("VARIANT_NOT_FOUND", 404, `Variante nicht gefunden: ${varId}`);

  await prisma.productVariant.delete({ where: { id: varId } });
  return new Response(null, { status: 204 });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DOKUMENTE
// ═══════════════════════════════════════════════════════════════════════════════

adminRoutes.get("/products/:id/documents", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);

  const docs = await prisma.productDocument.findMany({
    where: { product_id: id },
    orderBy: { sort_order: "asc" },
  });

  return c.json({ data: docs });
});

adminRoutes.post("/products/:id/documents", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const { name, url, type, sort_order } = body as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim()) {
    throw new CatalogError("INVALID_BODY", 422, "name ist ein Pflichtfeld.");
  }
  if (typeof url !== "string" || !url.trim()) {
    throw new CatalogError("INVALID_BODY", 422, "url ist ein Pflichtfeld.");
  }

  const doc = await prisma.productDocument.create({
    data: {
      product_id: id,
      name: name.trim(),
      url: url.trim(),
      type: typeof type === "string" ? type : "datasheet",
      sort_order: typeof sort_order === "number" ? sort_order : 0,
    },
  });

  return c.json({ data: doc }, 201);
});

adminRoutes.patch("/documents/:docId", async (c) => {
  const prisma = getPrismaClient();
  const docId = c.req.param("docId");

  const existing = await prisma.productDocument.findUnique({ where: { id: docId } });
  if (!existing) throw new CatalogError("DOCUMENT_NOT_FOUND", 404, `Dokument nicht gefunden: ${docId}`);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const { name, url, type, sort_order } = body as Record<string, unknown>;

  const updated = await prisma.productDocument.update({
    where: { id: docId },
    data: {
      ...(typeof name === "string" && name.trim() && { name: name.trim() }),
      ...(typeof url === "string" && url.trim() && { url: url.trim() }),
      ...(typeof type === "string" && { type }),
      ...(typeof sort_order === "number" && { sort_order }),
    },
  });

  return c.json({ data: updated });
});

adminRoutes.delete("/documents/:docId", async (c) => {
  const prisma = getPrismaClient();
  const docId = c.req.param("docId");

  const existing = await prisma.productDocument.findUnique({ where: { id: docId } });
  if (!existing) throw new CatalogError("DOCUMENT_NOT_FOUND", 404, `Dokument nicht gefunden: ${docId}`);

  await prisma.productDocument.delete({ where: { id: docId } });
  return new Response(null, { status: 204 });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BLOG – BEITRÄGE
// ═══════════════════════════════════════════════════════════════════════════════

adminRoutes.get("/blog/posts", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
  const offset = Number(c.req.query("offset") ?? 0);
  const status = c.req.query("status") as "draft" | "published" | "archived" | undefined;
  const category = c.req.query("category");

  const [posts, total] = await BlogService.listAllPosts({ limit, offset, status, categorySlug: category });

  return c.json({
    data: posts.map((p) => {
      const de = p.translations.find((t) => t.locale === "de");
      return {
        id: p.id,
        slug: p.slug,
        status: p.status,
        featured: p.featured,
        coverImageUrl: p.cover_image_url,
        publishedAt: p.published_at?.toISOString() ?? null,
        readingTimeMinutes: p.reading_time_minutes,
        authorName: p.author_name,
        category: p.category
          ? { id: p.category.id, slug: p.category.slug }
          : null,
        tags: p.tags.map((pt) => ({ slug: pt.tag.slug, name: pt.tag.name })),
        titleDe: de?.title ?? p.slug,
        availableLocales: p.translations.map((t) => t.locale),
        createdAt: p.created_at.toISOString(),
        updatedAt: p.updated_at.toISOString(),
      };
    }),
    meta: { total, limit, offset },
  });
});

adminRoutes.post("/blog/posts", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const parsed = BlogPostInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_BODY",
      422,
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
  }

  const data = parsed.data;
  const prisma = getPrismaClient();

  const existing = await prisma.blogPost.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (existing) throw new CatalogError("SLUG_CONFLICT", 409, `Slug bereits vergeben: ${data.slug}`);

  const post = await prisma.blogPost.create({
    data: {
      slug: data.slug,
      status: data.status,
      cover_image_url: data.coverImageUrl ?? null,
      cover_image_alt: data.coverImageAlt ?? null,
      reading_time_minutes: data.readingTimeMinutes ?? null,
      featured: data.featured,
      category_id: data.categoryId ?? null,
      author_name: data.authorName ?? null,
      published_at: data.status === "published" ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null,
      translations: {
        create: data.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          excerpt: t.excerpt,
          content: t.content,
          meta_title: t.metaTitle ?? null,
          meta_description: t.metaDescription ?? null,
          og_title: t.ogTitle ?? null,
          og_description: t.ogDescription ?? null,
        })),
      },
      tags: {
        create: data.tagIds.map((tagId) => ({ tag_id: tagId })),
      },
    },
    include: {
      translations: { orderBy: { locale: "asc" } },
      category: { include: { translations: true } },
      tags: { include: { tag: true } },
    },
  });

  return c.json({ data: post }, 201);
});

adminRoutes.get("/blog/posts/:id", async (c) => {
  const id = c.req.param("id");
  const post = await BlogService.requirePostById(id);

  return c.json({
    data: {
      id: post.id,
      slug: post.slug,
      status: post.status,
      coverImageUrl: post.cover_image_url,
      coverImageAlt: post.cover_image_alt,
      publishedAt: post.published_at?.toISOString() ?? null,
      readingTimeMinutes: post.reading_time_minutes,
      featured: post.featured,
      categoryId: post.category_id,
      authorName: post.author_name,
      category: post.category ? { id: post.category.id, slug: post.category.slug } : null,
      tags: post.tags.map((pt) => ({ id: pt.tag.id, slug: pt.tag.slug, name: pt.tag.name })),
      translations: post.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        excerpt: t.excerpt,
        content: t.content,
        metaTitle: t.meta_title,
        metaDescription: t.meta_description,
        ogTitle: t.og_title,
        ogDescription: t.og_description,
        updatedAt: t.updated_at.toISOString(),
      })),
      createdAt: post.created_at.toISOString(),
      updatedAt: post.updated_at.toISOString(),
    },
  });
});

adminRoutes.patch("/blog/posts/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = getPrismaClient();

  const existing = await BlogService.requirePostById(id);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const parsed = BlogPostInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_BODY",
      422,
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
  }

  const data = parsed.data;

  // Slug-Konflikt nur prüfen wenn Slug sich ändert
  if (data.slug && data.slug !== existing.slug) {
    const conflict = await prisma.blogPost.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (conflict) throw new CatalogError("SLUG_CONFLICT", 409, `Slug bereits vergeben: ${data.slug}`);
  }

  if (data.translations) {
    await Promise.all(
      data.translations.map((t) =>
        prisma.blogPostTranslation.upsert({
          where: { post_id_locale: { post_id: id, locale: t.locale } },
          create: {
            post_id: id,
            locale: t.locale,
            title: t.title,
            excerpt: t.excerpt,
            content: t.content,
            meta_title: t.metaTitle ?? null,
            meta_description: t.metaDescription ?? null,
            og_title: t.ogTitle ?? null,
            og_description: t.ogDescription ?? null,
          },
          update: {
            title: t.title,
            excerpt: t.excerpt,
            content: t.content,
            meta_title: t.metaTitle ?? null,
            meta_description: t.metaDescription ?? null,
            og_title: t.ogTitle ?? null,
            og_description: t.ogDescription ?? null,
          },
        })
      )
    );
  }

  // Tags: Replace-All (deleteMany + createMany) in einer Transaction
  if (data.tagIds !== undefined) {
    await prisma.$transaction([
      prisma.blogPostTag.deleteMany({ where: { post_id: id } }),
      prisma.blogPostTag.createMany({
        data: data.tagIds.map((tagId) => ({ post_id: id, tag_id: tagId })),
      }),
    ]);
  }

  let newPublishedAt: Date | undefined;
  if (data.status === "published" && !existing.published_at) {
    newPublishedAt = new Date();
  } else if (data.publishedAt) {
    newPublishedAt = new Date(data.publishedAt);
  }

  const updated = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(data.slug && { slug: data.slug }),
      ...(data.status && { status: data.status }),
      ...(data.coverImageUrl !== undefined && { cover_image_url: data.coverImageUrl ?? null }),
      ...(data.coverImageAlt !== undefined && { cover_image_alt: data.coverImageAlt ?? null }),
      ...(data.readingTimeMinutes !== undefined && { reading_time_minutes: data.readingTimeMinutes ?? null }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.categoryId !== undefined && { category_id: data.categoryId ?? null }),
      ...(data.authorName !== undefined && { author_name: data.authorName ?? null }),
      ...(newPublishedAt && { published_at: newPublishedAt }),
    },
    include: {
      translations: { orderBy: { locale: "asc" } },
      category: { include: { translations: true } },
      tags: { include: { tag: true } },
    },
  });

  return c.json({ data: updated });
});

adminRoutes.patch("/blog/posts/:id/status", async (c) => {
  const id = c.req.param("id");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const parsed = BlogPostStatusInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_STATUS",
      422,
      `Ungültiger Status. Erlaubt: draft | published | archived.`
    );
  }

  const { status } = parsed.data;
  const prisma = getPrismaClient();

  const existing = await BlogService.requirePostById(id);

  const updated = await prisma.blogPost.update({
    where: { id },
    data: {
      status,
      // published_at beim ersten Veröffentlichen automatisch setzen
      ...(status === "published" && !existing.published_at && { published_at: new Date() }),
    },
    select: {
      id: true,
      slug: true,
      status: true,
      published_at: true,
      updated_at: true,
      translations: { where: { locale: "de" }, select: { title: true } },
    },
  });

  console.info(`[admin] Blog-Post-Status: ${updated.slug} ${existing.status} → ${updated.status}`);

  return c.json({
    data: {
      id: updated.id,
      slug: updated.slug,
      status: updated.status,
      publishedAt: updated.published_at?.toISOString() ?? null,
      titleDe: updated.translations[0]?.title ?? updated.slug,
      updatedAt: updated.updated_at.toISOString(),
    },
  });
});

adminRoutes.delete("/blog/posts/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = getPrismaClient();

  await BlogService.requirePostById(id); // wirft 404 wenn nicht vorhanden

  await prisma.blogPost.delete({ where: { id } });
  return new Response(null, { status: 204 });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BLOG – KATEGORIEN
// ═══════════════════════════════════════════════════════════════════════════════

adminRoutes.get("/blog/categories", async (c) => {
  const categories = await BlogService.listAllCategories();

  return c.json({
    data: categories.map((cat) => {
      const de = cat.translations.find((t) => t.locale === "de");
      return {
        id: cat.id,
        slug: cat.slug,
        sortOrder: cat.sort_order,
        isActive: cat.is_active,
        nameDe: de?.name ?? cat.slug,
        postCount: cat._count?.posts ?? 0,
        availableLocales: cat.translations.map((t) => t.locale),
      };
    }),
  });
});

adminRoutes.get("/blog/categories/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = getPrismaClient();

  const category = await prisma.blogCategory.findUnique({
    where: { id },
    include: { translations: { orderBy: { locale: "asc" } } },
  });

  if (!category) throw new CatalogError("CATEGORY_NOT_FOUND", 404, `Blog-Kategorie nicht gefunden: ${id}`);

  return c.json({ data: category });
});

adminRoutes.post("/blog/categories", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const parsed = BlogCategoryInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_BODY",
      422,
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
  }

  const data = parsed.data;
  const prisma = getPrismaClient();

  const existing = await prisma.blogCategory.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (existing) throw new CatalogError("SLUG_CONFLICT", 409, `Slug bereits vergeben: ${data.slug}`);

  const category = await prisma.blogCategory.create({
    data: {
      slug: data.slug,
      sort_order: data.sortOrder,
      is_active: data.isActive,
      translations: {
        create: data.translations.map((t) => ({
          locale: t.locale,
          name: t.name,
          description: t.description ?? null,
        })),
      },
    },
    include: { translations: { orderBy: { locale: "asc" } } },
  });

  return c.json({ data: category }, 201);
});

adminRoutes.patch("/blog/categories/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = getPrismaClient();

  const existing = await prisma.blogCategory.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!existing) throw new CatalogError("CATEGORY_NOT_FOUND", 404, `Blog-Kategorie nicht gefunden: ${id}`);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const parsed = BlogCategoryInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_BODY",
      422,
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
  }

  const data = parsed.data;

  if (data.slug && data.slug !== existing.slug) {
    const conflict = await prisma.blogCategory.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (conflict) throw new CatalogError("SLUG_CONFLICT", 409, `Slug bereits vergeben: ${data.slug}`);
  }

  if (data.translations) {
    await Promise.all(
      data.translations.map((t) =>
        prisma.blogCategoryTranslation.upsert({
          where: { category_id_locale: { category_id: id, locale: t.locale } },
          create: { category_id: id, locale: t.locale, name: t.name, description: t.description ?? null },
          update: { name: t.name, description: t.description ?? null },
        })
      )
    );
  }

  const updated = await prisma.blogCategory.update({
    where: { id },
    data: {
      ...(data.slug && { slug: data.slug }),
      ...(data.sortOrder !== undefined && { sort_order: data.sortOrder }),
      ...(data.isActive !== undefined && { is_active: data.isActive }),
    },
    include: { translations: { orderBy: { locale: "asc" } } },
  });

  return c.json({ data: updated });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BLOG – TAGS
// ═══════════════════════════════════════════════════════════════════════════════

adminRoutes.get("/blog/tags", async (c) => {
  const prisma = getPrismaClient();

  const tags = await prisma.blogTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return c.json({
    data: tags.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      postCount: t._count.posts,
    })),
  });
});

adminRoutes.post("/blog/tags", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const parsed = BlogTagInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_BODY",
      422,
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
  }

  const { slug, name } = parsed.data;
  const prisma = getPrismaClient();

  const existing = await prisma.blogTag.findUnique({ where: { slug }, select: { id: true } });
  if (existing) throw new CatalogError("SLUG_CONFLICT", 409, `Tag-Slug bereits vergeben: ${slug}`);

  const tag = await prisma.blogTag.create({ data: { slug, name } });

  return c.json({ data: tag }, 201);
});

adminRoutes.delete("/blog/tags/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = getPrismaClient();

  const existing = await prisma.blogTag.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new CatalogError("TAG_NOT_FOUND", 404, `Tag nicht gefunden: ${id}`);

  await prisma.blogTag.delete({ where: { id } });
  return new Response(null, { status: 204 });
});

// ─── Hilfsfunktionen (intern) ─────────────────────────────────────────────────

function strOrNull(v: unknown): string | null {
  return typeof v === "string" ? v.trim() || null : null;
}

function buildTranslationCreates(translations: Record<string, unknown> | undefined) {
  if (!translations) return [];
  const result = [];
  for (const locale of VALID_LOCALES) {
    const t = (translations as Record<string, Record<string, unknown>>)[locale];
    if (!t) continue;
    const name = typeof t.name === "string" ? t.name.trim() : "";
    if (!name) continue;
    result.push({
      locale,
      name,
      short_description: strOrNull(t.short_description),
      description: strOrNull(t.description),
      delivery_note: strOrNull(t.delivery_note),
      features: (Array.isArray(t.features) ? t.features : []) as Prisma.InputJsonValue,
      meta_title: strOrNull(t.meta_title),
      meta_description: strOrNull(t.meta_description),
      mounting_note: strOrNull(t.mounting_note),
      project_note: strOrNull(t.project_note),
    });
  }
  return result;
}

// ─── Admin Ticker-Routen ──────────────────────────────────────────────────────

adminRoutes.get("/ticker", async (c) => {
  const prisma = getPrismaClient();
  const messages = await prisma.liveTickerMessage.findMany({
    orderBy: [{ priority: "desc" }, { created_at: "desc" }],
    include: { translations: true },
  });

  const data = messages.map((msg) => ({
    id: msg.id,
    status: msg.status,
    type: msg.type,
    scope: msg.scope,
    product_id: msg.product_id,
    category_id: msg.category_id,
    solution_slug: msg.solution_slug,
    priority: msg.priority,
    starts_at: msg.starts_at?.toISOString() ?? null,
    ends_at: msg.ends_at?.toISOString() ?? null,
    link_href: msg.link_href,
    icon: msg.icon,
    translations: msg.translations.map((t) => ({
      locale: t.locale,
      text: t.text,
      link_label: t.link_label,
    })),
    created_at: msg.created_at.toISOString(),
    updated_at: msg.updated_at.toISOString(),
  }));

  return c.json({ data });
});

adminRoutes.post("/ticker", async (c) => {
  const prisma = getPrismaClient();
  const body = await c.req.json();
  const parsed = TickerInputSchema.safeParse(body);

  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_INPUT",
      422,
      parsed.error.issues.map((i) => i.message).join(", ")
    );
  }

  const { translations, ...fields } = parsed.data;

  const message = await prisma.liveTickerMessage.create({
    data: {
      ...fields,
      starts_at: fields.starts_at ? new Date(fields.starts_at) : null,
      ends_at: fields.ends_at ? new Date(fields.ends_at) : null,
      priority: fields.priority ?? 0,
      translations: {
        create: translations.map((t) => ({
          locale: t.locale,
          text: t.text,
          link_label: t.link_label ?? null,
        })),
      },
    },
    include: { translations: true },
  });

  return c.json({ data: message }, 201);
});

adminRoutes.get("/ticker/:id", async (c) => {
  const prisma = getPrismaClient();
  const message = await prisma.liveTickerMessage.findUnique({
    where: { id: c.req.param("id") },
    include: { translations: true },
  });

  if (!message) throw new CatalogError("NOT_FOUND", 404, "Ticker-Nachricht nicht gefunden");

  return c.json({ data: message });
});

adminRoutes.put("/ticker/:id", async (c) => {
  const prisma = getPrismaClient();
  const body = await c.req.json();
  const parsed = TickerInputSchema.safeParse(body);

  if (!parsed.success) {
    throw new CatalogError(
      "INVALID_INPUT",
      422,
      parsed.error.issues.map((i) => i.message).join(", ")
    );
  }

  const { translations, ...fields } = parsed.data;
  const id = c.req.param("id");

  const existing = await prisma.liveTickerMessage.findUnique({ where: { id } });
  if (!existing) throw new CatalogError("NOT_FOUND", 404, "Ticker-Nachricht nicht gefunden");

  await prisma.liveTickerMessageTranslation.deleteMany({ where: { message_id: id } });

  const message = await prisma.liveTickerMessage.update({
    where: { id },
    data: {
      ...fields,
      starts_at: fields.starts_at ? new Date(fields.starts_at) : null,
      ends_at: fields.ends_at ? new Date(fields.ends_at) : null,
      priority: fields.priority ?? existing.priority,
      translations: {
        create: translations.map((t) => ({
          locale: t.locale,
          text: t.text,
          link_label: t.link_label ?? null,
        })),
      },
    },
    include: { translations: true },
  });

  return c.json({ data: message });
});

adminRoutes.patch("/ticker/:id/status", async (c) => {
  const prisma = getPrismaClient();
  const body = await c.req.json();
  const parsed = TickerStatusUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new CatalogError("INVALID_INPUT", 422, "Ungültiger Status");
  }

  const id = c.req.param("id");
  const existing = await prisma.liveTickerMessage.findUnique({ where: { id } });
  if (!existing) throw new CatalogError("NOT_FOUND", 404, "Ticker-Nachricht nicht gefunden");

  const message = await prisma.liveTickerMessage.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return c.json({ data: { id: message.id, status: message.status } });
});

adminRoutes.delete("/ticker/:id", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");

  const existing = await prisma.liveTickerMessage.findUnique({ where: { id } });
  if (!existing) throw new CatalogError("NOT_FOUND", 404, "Ticker-Nachricht nicht gefunden");

  await prisma.liveTickerMessage.delete({ where: { id } });

  return c.json({ data: { deleted: true } });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AFFILIATE IMPORT  –  POST /import/affiliate-products
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Importiert Affiliate-Produkte aus einem JSON-Array (Dry-Run oder Commit).
 * Wird von n8n nach Normalisierung der Google-Sheet-Daten aufgerufen.
 *
 * Body: { mode: "dry_run" | "commit", products: AffiliateImportRow[] }
 * Response: ImportReport
 */
adminRoutes.post("/import/affiliate-products", async (c) => {
  const prisma = getPrismaClient();

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  // Doppelt-enkodiertes JSON (n8n-Quirk) entpacken
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      throw new CatalogError("INVALID_BODY", 422, "Body konnte nicht als JSON geparst werden.");
    }
  }

  const raw = body as Record<string, unknown>;
  const mode = raw?.mode;
  if (mode !== "dry_run" && mode !== "commit") {
    throw new CatalogError("INVALID_MODE", 422, 'mode muss "dry_run" oder "commit" sein.');
  }

  const productsRaw = raw?.products;
  if (!Array.isArray(productsRaw) || productsRaw.length === 0) {
    throw new CatalogError("INVALID_PRODUCTS", 422, "products muss ein nicht-leeres Array sein.");
  }

  const VALID_STATUSES = new Set(["draft", "active", "archived"]);
  const HTTPS_REGEX = /^https:\/\/.+/i;
  const SLUG_REGEX = /^[a-z0-9-]+$/;
  const ASIN_REGEX = /^B[A-Z0-9]{9}$/;

  type ImportIssue = { row: number; slug: string; field: string; message: string; level: "error" | "warning" };
  const issues: ImportIssue[] = [];
  const validRows: Record<string, unknown>[] = [];
  const seenSlugs = new Set<string>();

  for (let i = 0; i < productsRaw.length; i++) {
    const row = productsRaw[i] as Record<string, unknown>;
    const rowNum = i + 1;
    const slug = typeof row.slug === "string" ? row.slug.trim() : "";

    const addIssue = (field: string, message: string, level: "error" | "warning" = "error") => {
      issues.push({ row: rowNum, slug: slug || "(leer)", field, message, level });
    };

    if (!slug || !SLUG_REGEX.test(slug)) {
      addIssue("slug", `Ungültiger slug: "${row.slug}"`);
      continue;
    }
    if (seenSlugs.has(slug)) {
      addIssue("slug", `Doppelter slug: "${slug}"`);
      continue;
    }
    seenSlugs.add(slug);

    const status = typeof row.status === "string" ? row.status.trim() : "";
    if (!VALID_STATUSES.has(status)) addIssue("status", `Ungültiger Status: "${row.status}"`);

    const categorySlug = typeof row.category_slug === "string" ? row.category_slug.trim() : "";
    if (!categorySlug) addIssue("category_slug", "category_slug fehlt");

    const provider = typeof row.affiliate_provider === "string" ? row.affiliate_provider.trim() : "";
    if (!provider) addIssue("affiliate_provider", "affiliate_provider fehlt");
    else if (provider !== "amazon") addIssue("affiliate_provider", `Nur "amazon" erlaubt (MVP), nicht "${provider}"`);

    const url = typeof row.affiliate_url === "string" ? row.affiliate_url.trim() : "";
    if (!url) addIssue("affiliate_url", "affiliate_url fehlt");
    else if (!HTTPS_REGEX.test(url)) addIssue("affiliate_url", "affiliate_url muss HTTPS sein");

    const titleDe = typeof row.title_de === "string" ? row.title_de.trim() : "";
    if (!titleDe) { addIssue("title_de", "DE-Titel (title_de) fehlt"); continue; }

    const asin = typeof row.affiliate_asin === "string" ? row.affiliate_asin.trim() : "";
    if (asin && !ASIN_REGEX.test(asin)) addIssue("affiliate_asin", `Ungültige ASIN: "${asin}"`, "warning");

    const imageUrl = typeof row.image_url === "string" ? row.image_url.trim() : "";
    if (imageUrl && !HTTPS_REGEX.test(imageUrl)) addIssue("image_url", "image_url muss HTTPS sein");
    if (!imageUrl) addIssue("image_url", "Kein Bild gesetzt", "warning");

    if (!row.title_en) addIssue("title_en", "Kein EN-Titel gesetzt", "warning");
    if (!row.title_es) addIssue("title_es", "Kein ES-Titel gesetzt", "warning");

    validRows.push(row);
  }

  const errorCount = issues.filter((i) => i.level === "error").length;
  const warningCount = issues.filter((i) => i.level === "warning").length;

  if (mode === "dry_run" || errorCount > 0) {
    // Vorschau: wie viele wären neu/aktualisiert?
    const allSlugs = validRows.map((r) => r.slug as string);
    let wouldCreate = allSlugs.length;
    let wouldUpdate = 0;
    if (allSlugs.length > 0) {
      const existing = await prisma.product.findMany({
        where: { slug: { in: allSlugs } },
        select: { slug: true },
      });
      const existingSlugs = new Set(existing.map((p) => p.slug));
      wouldUpdate = allSlugs.filter((s) => existingSlugs.has(s)).length;
      wouldCreate = allSlugs.length - wouldUpdate;
    }

    return c.json({
      mode: "dry_run",
      success: errorCount === 0,
      summary: {
        total: productsRaw.length,
        valid: validRows.length,
        errors: errorCount,
        warnings: warningCount,
        would_create: wouldCreate,
        would_update: wouldUpdate,
      },
      issues,
    }, errorCount > 0 ? 422 : 200);
  }

  // ── Commit ──────────────────────────────────────────────────────────────────
  const categorySlugs = [...new Set(validRows.map((r) => r.category_slug as string).filter(Boolean))];
  const categories = await prisma.category.findMany({
    where: { slug: { in: categorySlugs } },
    select: { id: true, slug: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));
  const missingCats = categorySlugs.filter((s) => !categoryMap.has(s));
  if (missingCats.length > 0) {
    throw new CatalogError("UNKNOWN_CATEGORY", 422, `Unbekannte Kategorien: ${missingCats.join(", ")}`);
  }

  const allSlugs = validRows.map((r) => r.slug as string);
  const existingProducts = await prisma.product.findMany({
    where: { slug: { in: allSlugs } },
    select: { slug: true },
  });
  const existingSlugs = new Set(existingProducts.map((p) => p.slug));

  const results: Array<{ slug: string; action: "created" | "updated"; id: string }> = [];

  await prisma.$transaction(async (tx) => {
    for (const row of validRows) {
      const slug = row.slug as string;
      const categoryId = categoryMap.get(row.category_slug as string) ?? null;

      const normStr = (v: unknown): string | null => {
        if (typeof v !== "string") return null;
        const t = v.trim();
        return t.length > 0 ? t : null;
      };
      const normBool = (v: unknown, def = false): boolean => {
        if (typeof v === "boolean") return v;
        if (typeof v === "string") return ["true", "1", "ja", "yes"].includes(v.toLowerCase());
        return def;
      };

      const product = await tx.product.upsert({
        where: { slug },
        update: {
          product_type: "affiliate_external",
          status: row.status as "draft" | "active" | "archived",
          category_id: categoryId,
          affiliate_provider: normStr(row.affiliate_provider),
          affiliate_url: normStr(row.affiliate_url),
          affiliate_asin: normStr(row.affiliate_asin),
          affiliate_button_label: normStr(row.affiliate_button_label),
          affiliate_disclosure: normStr(row.affiliate_disclosure),
          affiliate_enabled: normBool(row.affiliate_enabled, false),
        },
        create: {
          slug,
          product_type: "affiliate_external",
          status: row.status as "draft" | "active" | "archived",
          category_id: categoryId,
          affiliate_provider: normStr(row.affiliate_provider),
          affiliate_url: normStr(row.affiliate_url),
          affiliate_asin: normStr(row.affiliate_asin),
          affiliate_button_label: normStr(row.affiliate_button_label),
          affiliate_disclosure: normStr(row.affiliate_disclosure),
          affiliate_enabled: normBool(row.affiliate_enabled, false),
        },
      });

      const locales: Array<"de" | "en" | "es"> = ["de", "en", "es"];
      for (const locale of locales) {
        const title = normStr(row[`title_${locale}`]);
        if (!title) continue;
        await tx.productTranslation.upsert({
          where: { product_id_locale: { product_id: product.id, locale } },
          update: {
            name: title,
            short_description: normStr(row[`short_description_${locale}`]),
            description: normStr(row[`description_${locale}`]),
            meta_title: normStr(row[`meta_title_${locale}`]),
            meta_description: normStr(row[`meta_description_${locale}`]),
          },
          create: {
            product_id: product.id,
            locale,
            name: title,
            short_description: normStr(row[`short_description_${locale}`]),
            description: normStr(row[`description_${locale}`]),
            meta_title: normStr(row[`meta_title_${locale}`]),
            meta_description: normStr(row[`meta_description_${locale}`]),
          },
        });
      }

      const imageUrl = normStr(row.image_url);
      if (imageUrl) {
        const existingImage = await tx.productImage.findFirst({
          where: { product_id: product.id, sort_order: 0 },
        });
        if (existingImage) {
          await tx.productImage.update({
            where: { id: existingImage.id },
            data: { url: imageUrl, alt: normStr(row.image_alt) },
          });
        } else {
          await tx.productImage.create({
            data: { product_id: product.id, url: imageUrl, alt: normStr(row.image_alt), sort_order: 0 },
          });
        }
      }

      results.push({ slug, action: existingSlugs.has(slug) ? "updated" : "created", id: product.id });
    }
  });

  const created = results.filter((r) => r.action === "created").length;
  const updated = results.filter((r) => r.action === "updated").length;

  console.info(`[admin] affiliate-import commit: ${created} erstellt, ${updated} aktualisiert`);

  return c.json({
    mode: "commit",
    success: true,
    summary: {
      total: productsRaw.length,
      created,
      updated,
      skipped: productsRaw.length - validRows.length,
      errors: 0,
    },
    products: results,
    issues: issues.filter((i) => i.level === "warning"),
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AFFILIATE HEALTH  –  PATCH /products/:id/affiliate-health
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Setzt den Health-Status eines Affiliate-Produkts nach n8n-Prüfung.
 * Body: { status: "ok"|"invalid_url"|"missing"|"timeout"|"blocked"|"error", message?: string }
 */
adminRoutes.patch("/products/:id/affiliate-health", async (c) => {
  const id = c.req.param("id");
  const prisma = getPrismaClient();

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, product_type: true, slug: true },
  });
  if (!product) throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);
  if (product.product_type !== "affiliate_external") {
    throw new CatalogError("NOT_AFFILIATE", 422, "Nur Affiliate-Produkte haben einen Health-Status.");
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const raw = body as Record<string, unknown>;
  const VALID_HEALTH = new Set(["ok", "invalid_url", "missing", "timeout", "blocked", "error"]);
  const status = typeof raw?.status === "string" ? raw.status.trim() : "";
  if (!VALID_HEALTH.has(status)) {
    throw new CatalogError(
      "INVALID_HEALTH_STATUS",
      422,
      `Ungültiger status: "${status}". Erlaubt: ok | invalid_url | missing | timeout | blocked | error`
    );
  }

  const message = typeof raw?.message === "string" && raw.message.trim().length > 0
    ? raw.message.trim()
    : null;

  const updated = await prisma.product.update({
    where: { id },
    data: {
      affiliate_health_status: status,
      affiliate_health_message: message,
      affiliate_last_checked_at: new Date(),
    },
    select: {
      id: true,
      slug: true,
      affiliate_health_status: true,
      affiliate_health_message: true,
      affiliate_last_checked_at: true,
    },
  });

  return c.json({
    data: {
      id: updated.id,
      slug: updated.slug,
      affiliateHealthStatus: updated.affiliate_health_status,
      affiliateHealthMessage: updated.affiliate_health_message,
      affiliateLastCheckedAt: updated.affiliate_last_checked_at?.toISOString() ?? null,
    },
  });
});
