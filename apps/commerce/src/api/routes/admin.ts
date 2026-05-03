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
 */

import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { Prisma } from "@prisma/client";
import { getPrismaClient } from "../../lib/prisma";
import { CatalogError } from "../../types";

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

const VALID_STATUSES = ["draft", "active", "archived"] as const;
type ProductStatusValue = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is ProductStatusValue {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

const VALID_PRODUCT_TYPES = ["direct_purchase", "configurable", "inquiry_only"] as const;
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

// ─── Auth-Middleware ──────────────────────────────────────────────────────────

const requireAdminKey: MiddlewareHandler = async (c, next) => {
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return c.json(
      {
        error: {
          code: "ADMIN_NOT_CONFIGURED",
          message: "Admin-API ist nicht konfiguriert. ADMIN_SECRET setzen.",
          status: 503,
        },
      },
      503
    );
  }

  const provided = c.req.header("X-Admin-Key");

  if (!provided || provided !== secret) {
    return c.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Ungültiger oder fehlender X-Admin-Key Header.",
          status: 401,
        },
      },
      401
    );
  }

  await next();
};

// ─── Router ───────────────────────────────────────────────────────────────────

export const adminRoutes = new Hono();

adminRoutes.use("*", requireAdminKey);

// ═══════════════════════════════════════════════════════════════════════════════
// KATEGORIEN
// ═══════════════════════════════════════════════════════════════════════════════

adminRoutes.get("/categories", async (c) => {
  const prisma = getPrismaClient();

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return c.json({
    data: categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description ?? null,
      is_active: cat.is_active,
      parent_id: cat.parent_id ?? null,
      productCount: cat._count.products,
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

  const { name, slug, description, is_active, parent_id } = body as Record<string, unknown>;

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

  const { name, slug, description, is_active, parent_id } = body as Record<string, unknown>;

  const updateData: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) updateData.name = name.trim();
  if (typeof slug === "string" && slug.trim() && slug.trim() !== existing.slug) {
    const slugConflict = await prisma.category.findUnique({ where: { slug: slug.trim() }, select: { id: true } });
    if (slugConflict) throw new CatalogError("SLUG_CONFLICT", 409, `Slug bereits vergeben: ${slug.trim()}`);
    updateData.slug = slug.trim();
  }
  if (typeof description === "string") updateData.description = description.trim() || null;
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
