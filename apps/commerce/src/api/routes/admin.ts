/**
 * Admin-Routen – geschützte Verwaltungs-API
 *
 * Authentifizierung: X-Admin-Key Header gegen ADMIN_SECRET env-Variable.
 * Einfacher Shared-Secret-Schutz ohne Session/JWT – ausreichend für den MVP,
 * da die Admin-API nicht im Browser aufgerufen wird (CLI / internes Tool).
 *
 * Endpunkte (relativ zu /api/admin):
 *   GET    /products                   → alle Produkte (alle Status, inkl. draft/archived)
 *   PATCH  /products/:id/status        → Produkt-Status setzen (draft|active|archived)
 *   GET    /categories                 → alle Kategorien inkl. Sichtbarkeit
 *   PATCH  /categories/:id/visibility  → Kategorie-Sichtbarkeit umschalten
 *
 * Sicherheitshinweis:
 *   ADMIN_SECRET muss in der Produktion gesetzt sein. Ist er nicht gesetzt,
 *   antwortet die gesamte Admin-API mit 503 (nicht 401) – das verhindert,
 *   dass ein offener Admin-Endpunkt bei fehlender Konfiguration entsteht.
 */

import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { getPrismaClient } from "../../lib/prisma";
import { CatalogError } from "../../types";

// ─── Gültige Status-Werte ─────────────────────────────────────────────────────

const VALID_STATUSES = ["draft", "active", "archived"] as const;
type ProductStatusValue = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is ProductStatusValue {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

// ─── Auth-Middleware ──────────────────────────────────────────────────────────

const requireAdminKey: MiddlewareHandler = async (c, next) => {
  const secret = process.env.ADMIN_SECRET;

  // Kein Secret gesetzt → Admin deaktiviert (fail-closed, nicht fail-open)
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

// Alle Admin-Routen erfordern den Admin-Key
adminRoutes.use("*", requireAdminKey);

// ─── GET /products ────────────────────────────────────────────────────────────

/**
 * Liefert alle Produkte unabhängig vom Status (draft / active / archived).
 * Geeignet für Redaktions-Listen und Status-Überblick.
 * Keine Mapper-Transformation – Rohdaten für Admin-Kontext.
 *
 * Response: { data: AdminProductSummary[] }
 */
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

// ─── PATCH /products/:id/status ───────────────────────────────────────────────

/**
 * Setzt den Status eines Produkts.
 *
 * Body:    { "status": "active" }   (draft | active | archived)
 * Erfolg: { data: { id, slug, name, status, updated_at } }
 *
 * Statusübergänge (alle erlaubt, keine Transition-Guards nötig für MVP):
 *   draft    → active    (veröffentlichen)
 *   active   → draft     (zurückziehen)
 *   active   → archived  (archivieren)
 *   archived → active    (wieder veröffentlichen)
 *   archived → draft     (zurück in Bearbeitung)
 */
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

// ─── GET /categories ──────────────────────────────────────────────────────────

/**
 * Liefert alle Kategorien inkl. is_active-Status.
 * Im Gegensatz zur öffentlichen Route werden auch inaktive Kategorien geliefert.
 *
 * Response: { data: AdminCategorySummary[] }
 */
adminRoutes.get("/categories", async (c) => {
  const prisma = getPrismaClient();

  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  return c.json({
    data: categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      is_active: cat.is_active,
      parent_id: cat.parent_id ?? null,
      productCount: cat._count.products,
    })),
  });
});

// ─── GET /products/:id/documents ─────────────────────────────────────────────

/**
 * Liefert alle Dokumente eines Produkts, sortiert nach sort_order.
 * Response: { data: ProductDocument[] }
 */
adminRoutes.get("/products/:id/documents", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!product) throw new CatalogError("PRODUCT_NOT_FOUND", 404, `Produkt nicht gefunden: ${id}`);

  const docs = await prisma.productDocument.findMany({
    where: { product_id: id },
    orderBy: { sort_order: "asc" },
  });

  return c.json({ data: docs });
});

// ─── POST /products/:id/documents ────────────────────────────────────────────

/**
 * Fügt ein Dokument zu einem Produkt hinzu.
 *
 * Body: { name: string, url: string, type?: string, sort_order?: number }
 * Response: { data: ProductDocument }
 */
adminRoutes.post("/products/:id/documents", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
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

// ─── PATCH /documents/:docId ──────────────────────────────────────────────────

/**
 * Aktualisiert ein bestehendes Dokument (partielle Updates möglich).
 *
 * Body: { name?: string, url?: string, type?: string, sort_order?: number }
 * Response: { data: ProductDocument }
 */
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

// ─── DELETE /documents/:docId ─────────────────────────────────────────────────

/**
 * Löscht ein Dokument dauerhaft.
 * Response: 204 No Content
 */
adminRoutes.delete("/documents/:docId", async (c) => {
  const prisma = getPrismaClient();
  const docId = c.req.param("docId");

  const existing = await prisma.productDocument.findUnique({ where: { id: docId } });
  if (!existing) throw new CatalogError("DOCUMENT_NOT_FOUND", 404, `Dokument nicht gefunden: ${docId}`);

  await prisma.productDocument.delete({ where: { id: docId } });

  return new Response(null, { status: 204 });
});

// ─── PATCH /categories/:id/visibility ────────────────────────────────────────

/**
 * Setzt die Sichtbarkeit einer Kategorie.
 *
 * Eine inaktive Kategorie (is_active=false) ist in der öffentlichen API
 * nicht sichtbar. Ihre Produkte erscheinen nicht in Kategorie-Abfragen –
 * aber die Produkte selbst bleiben im Katalog sichtbar, wenn status="active".
 *
 * Body:    { "is_active": false }
 * Erfolg: { data: { id, slug, name, is_active } }
 */
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

  return c.json({
    data: {
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      is_active: updated.is_active,
    },
  });
});
