/**
 * Admin-Routen für das Widerruf-System
 *
 * Geschützt durch X-Admin-Key (identisch wie alle anderen Admin-Routen).
 *
 * Endpunkte (relativ zu /api/admin):
 *   GET    /cancellations                          → Liste aller Anfragen (Suche, Filter, Paging)
 *   GET    /cancellations/:id                      → Detail einer Anfrage
 *   PATCH  /cancellations/:id/status               → Status ändern
 *   PATCH  /cancellations/:id/notes                → Interne Notizen speichern
 *   GET    /cancellations/:id/logs                 → Log-Historie
 *   POST   /cancellations/:id/resend-email         → Kunden-E-Mail erneut versenden
 *   GET    /settings/cancellation                  → Einstellungen lesen
 *   PUT    /settings/cancellation                  → Einstellungen speichern
 *   GET    /settings/cancellation/excluded-products
 *   POST   /settings/cancellation/excluded-products
 *   DELETE /settings/cancellation/excluded-products/:id
 *   GET    /settings/cancellation/excluded-categories
 *   POST   /settings/cancellation/excluded-categories
 *   DELETE /settings/cancellation/excluded-categories/:id
 */

import { Hono } from "hono";
import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "../../lib/prisma";
import { CatalogError } from "../../types";

const VALID_STATUSES = [
  "widerruf_beantragt",
  "widerruf_in_pruefung",
  "widerruf_akzeptiert",
  "widerruf_abgelehnt",
] as const;
type CancellationStatusValue = (typeof VALID_STATUSES)[number];

function isValidStatus(v: unknown): v is CancellationStatusValue {
  return typeof v === "string" && (VALID_STATUSES as readonly string[]).includes(v);
}

// ─── E-Mail: Kunden-Bestätigung erneut senden ────────────────────────────────

async function resendCustomerEmail(requestId: string, adminEmail: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const prisma = getPrismaClient();
  const req = await prisma.cancellationRequest.findUnique({ where: { id: requestId } });
  if (!req) return false;

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const dateStr = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });

  const subjects: Record<string, string> = {
    de: `Widerrufsanfrage erhalten – Bestellung ${req.order_reference}`,
    en: `Cancellation request received – Order ${req.order_reference}`,
    es: `Solicitud de desistimiento recibida – Pedido ${req.order_reference}`,
  };

  const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1C1C1E">
  <div style="background:#1C1C1E;padding:20px 24px;border-radius:8px 8px 0 0">
    <p style="color:#22C55E;font-size:18px;font-weight:600;margin:0">Solarzaun &amp; SkyWind</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px">
    <p>Guten Tag ${req.customer_first_name} ${req.customer_last_name},</p>
    <p>wir haben Ihre Widerrufsanfrage für Bestellung <strong>${req.order_reference}</strong> erhalten.
       Wir werden Ihre Anfrage prüfen und uns zeitnah bei Ihnen melden.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
    <table style="width:100%;font-size:14px">
      <tr><td style="padding:4px 0;color:#6B7280;width:140px">Eingegangen am</td><td>${dateStr}</td></tr>
      <tr><td style="padding:4px 0;color:#6B7280">Ref.-Nr.</td><td><strong>${req.order_reference}</strong></td></tr>
    </table>
    ${req.message ? `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/><p style="font-size:13px;color:#6B7280">Ihre Nachricht:</p><p style="font-size:14px;white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:6px">${req.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : ""}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
    <p style="font-size:14px">Mit freundlichen Grüßen,<br>Ihr WSP-Solarenergie Team</p>
  </div>
</div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [req.customer_email],
      reply_to: adminEmail || "verkauf@wsp-solarenergie.de",
      subject: subjects[req.locale] ?? subjects.de,
      html,
    }),
  });

  return res.ok;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const adminCancellationRoutes = new Hono();

// ─── Liste ────────────────────────────────────────────────────────────────────

adminCancellationRoutes.get("/", async (c) => {
  const prisma = getPrismaClient();
  const q      = c.req.query("q")?.trim() || undefined;
  const status = c.req.query("status") || undefined;
  const limit  = Math.min(Number(c.req.query("limit") ?? 50), 100);
  const offset = Number(c.req.query("offset") ?? 0);

  const where: Prisma.CancellationRequestWhereInput = {};

  if (status && isValidStatus(status)) where.status = status;

  if (q) {
    where.OR = [
      { order_reference:     { contains: q, mode: "insensitive" } },
      { customer_email:      { contains: q, mode: "insensitive" } },
      { customer_first_name: { contains: q, mode: "insensitive" } },
      { customer_last_name:  { contains: q, mode: "insensitive" } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.cancellationRequest.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
      select: {
        id:                      true,
        order_reference:         true,
        customer_email:          true,
        customer_first_name:     true,
        customer_last_name:      true,
        status:                  true,
        deadline_check_result:   true,
        excluded_items_detected: true,
        locale:                  true,
        created_at:              true,
        updated_at:              true,
      },
    }),
    prisma.cancellationRequest.count({ where }),
  ]);

  return c.json({
    data: requests.map((r) => ({
      ...r,
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
    })),
    meta: { total, limit, offset },
  });
});

// ─── Detail ───────────────────────────────────────────────────────────────────

adminCancellationRoutes.get("/:id", async (c) => {
  const prisma = getPrismaClient();
  const id     = c.req.param("id");

  const request = await prisma.cancellationRequest.findUnique({
    where: { id },
    include: {
      logs: { orderBy: { created_at: "asc" } },
    },
  });

  if (!request) throw new CatalogError("NOT_FOUND", 404, `Widerrufsanfrage nicht gefunden: ${id}`);

  return c.json({
    data: {
      ...request,
      created_at: request.created_at.toISOString(),
      updated_at: request.updated_at.toISOString(),
      customer_email_sent_at:   request.customer_email_sent_at?.toISOString() ?? null,
      admin_email_sent_at:      request.admin_email_sent_at?.toISOString() ?? null,
      rejection_email_sent_at:  request.rejection_email_sent_at?.toISOString() ?? null,
      logs: request.logs.map((l) => ({
        ...l,
        created_at: l.created_at.toISOString(),
      })),
    },
  });
});

// ─── Status ändern ────────────────────────────────────────────────────────────

adminCancellationRoutes.patch("/:id/status", async (c) => {
  const prisma = getPrismaClient();
  const id     = c.req.param("id");

  const existing = await prisma.cancellationRequest.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!existing) throw new CatalogError("NOT_FOUND", 404, `Widerrufsanfrage nicht gefunden: ${id}`);

  let body: unknown;
  try { body = await c.req.json(); } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const raw = (body as Record<string, unknown>)?.status;
  if (!isValidStatus(raw)) {
    throw new CatalogError("INVALID_STATUS", 422, `Ungültiger Status: ${raw}. Erlaubt: ${VALID_STATUSES.join(" | ")}`);
  }

  const updated = await prisma.cancellationRequest.update({
    where: { id },
    data:  { status: raw },
    select: { id: true, status: true, updated_at: true },
  });

  await prisma.cancellationLog.create({
    data: {
      request_id:   id,
      event:        "status_changed",
      details:      `Status geändert: ${existing.status} → ${raw}`,
      performed_by: "admin",
    },
  });

  console.info(`[admin/cancellations] Status: ${id} ${existing.status} → ${raw}`);

  return c.json({
    data: {
      id:         updated.id,
      status:     updated.status,
      updated_at: updated.updated_at.toISOString(),
    },
  });
});

// ─── Notizen speichern ────────────────────────────────────────────────────────

adminCancellationRoutes.patch("/:id/notes", async (c) => {
  const prisma = getPrismaClient();
  const id     = c.req.param("id");

  const existing = await prisma.cancellationRequest.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new CatalogError("NOT_FOUND", 404, `Widerrufsanfrage nicht gefunden: ${id}`);

  let body: unknown;
  try { body = await c.req.json(); } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const notes = (body as Record<string, unknown>)?.admin_notes;
  const updated = await prisma.cancellationRequest.update({
    where: { id },
    data:  { admin_notes: typeof notes === "string" ? notes.slice(0, 10000) : null },
    select: { id: true, admin_notes: true, updated_at: true },
  });

  await prisma.cancellationLog.create({
    data: { request_id: id, event: "notes_updated", performed_by: "admin" },
  });

  return c.json({ data: updated });
});

// ─── Logs abrufen ─────────────────────────────────────────────────────────────

adminCancellationRoutes.get("/:id/logs", async (c) => {
  const prisma = getPrismaClient();
  const id     = c.req.param("id");

  const existing = await prisma.cancellationRequest.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new CatalogError("NOT_FOUND", 404, `Widerrufsanfrage nicht gefunden: ${id}`);

  const logs = await prisma.cancellationLog.findMany({
    where:   { request_id: id },
    orderBy: { created_at: "asc" },
  });

  return c.json({
    data: logs.map((l) => ({ ...l, created_at: l.created_at.toISOString() })),
  });
});

// ─── E-Mail erneut senden ─────────────────────────────────────────────────────

adminCancellationRoutes.post("/:id/resend-email", async (c) => {
  const prisma = getPrismaClient();
  const id     = c.req.param("id");

  const existing = await prisma.cancellationRequest.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new CatalogError("NOT_FOUND", 404, `Widerrufsanfrage nicht gefunden: ${id}`);

  const settings = await prisma.cancellationSettings.findUnique({ where: { id: "default" } });
  const adminEmail = settings?.admin_email || process.env.LEAD_TO_EMAIL || "verkauf@wsp-solarenergie.de";

  const sent = await resendCustomerEmail(id, adminEmail);

  if (sent) {
    await prisma.cancellationRequest.update({
      where: { id },
      data:  { customer_email_sent_at: new Date() },
    });
    await prisma.cancellationLog.create({
      data: { request_id: id, event: "customer_email_resent", performed_by: "admin" },
    });
  }

  return c.json({ data: { sent } });
});

// ─── Einstellungen ────────────────────────────────────────────────────────────

export const adminCancellationSettingsRoutes = new Hono();

adminCancellationSettingsRoutes.get("/", async (c) => {
  const prisma    = getPrismaClient();
  const settings  = await prisma.cancellationSettings.findUnique({ where: { id: "default" } });

  // Defaults zurückgeben falls noch kein Datensatz existiert
  return c.json({
    data: settings ?? {
      id: "default",
      is_active:               true,
      deadline_days:           14,
      delivery_buffer_days:    2,
      mode:                    "always_submit",
      admin_email:             "",
      show_footer_link:        true,
      show_account_link:       true,
      privacy_page_url:        null,
      cancellation_policy_url: null,
      noindex:                 false,
      meta_title_de:           null,
      meta_title_en:           null,
      meta_title_es:           null,
      meta_description_de:     null,
      meta_description_en:     null,
      meta_description_es:     null,
    },
  });
});

adminCancellationSettingsRoutes.put("/", async (c) => {
  const prisma = getPrismaClient();

  let body: unknown;
  try { body = await c.req.json(); } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const b = body as Record<string, unknown>;

  const VALID_MODES = ["always_submit", "plausibility_check", "auto_reject"] as const;

  const data: Record<string, unknown> = {};
  if (typeof b.is_active            === "boolean") data.is_active            = b.is_active;
  if (typeof b.deadline_days        === "number")  data.deadline_days        = Math.max(1, Math.round(b.deadline_days));
  if (typeof b.delivery_buffer_days === "number")  data.delivery_buffer_days = Math.max(0, Math.round(b.delivery_buffer_days));
  if (typeof b.mode === "string" && (VALID_MODES as readonly string[]).includes(b.mode)) data.mode = b.mode;
  if (typeof b.admin_email          === "string")  data.admin_email          = b.admin_email.trim();
  if (typeof b.show_footer_link     === "boolean") data.show_footer_link     = b.show_footer_link;
  if (typeof b.show_account_link    === "boolean") data.show_account_link    = b.show_account_link;
  if (typeof b.noindex              === "boolean") data.noindex              = b.noindex;

  for (const field of ["privacy_page_url", "cancellation_policy_url", "meta_title_de", "meta_title_en", "meta_title_es", "meta_description_de", "meta_description_en", "meta_description_es"]) {
    if (field in b) data[field] = typeof b[field] === "string" ? (b[field] as string).trim() || null : null;
  }

  const settings = await prisma.cancellationSettings.upsert({
    where:  { id: "default" },
    create: { id: "default", ...data } as Parameters<typeof prisma.cancellationSettings.upsert>[0]["create"],
    update: data,
  });

  console.info("[admin/cancellations] Einstellungen aktualisiert");

  return c.json({ data: settings });
});

// ─── Excluded Products ────────────────────────────────────────────────────────

adminCancellationSettingsRoutes.get("/excluded-products", async (c) => {
  const prisma   = getPrismaClient();
  const excluded = await prisma.cancellationExcludedProduct.findMany({ orderBy: { created_at: "asc" } });
  return c.json({ data: excluded });
});

adminCancellationSettingsRoutes.post("/excluded-products", async (c) => {
  const prisma = getPrismaClient();

  let body: unknown;
  try { body = await c.req.json(); } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const b = body as Record<string, unknown>;
  if (typeof b.product_id !== "string" || !b.product_id) throw new CatalogError("INVALID_BODY", 422, "product_id erforderlich.");
  if (typeof b.product_slug !== "string" || !b.product_slug) throw new CatalogError("INVALID_BODY", 422, "product_slug erforderlich.");
  if (typeof b.product_name !== "string" || !b.product_name) throw new CatalogError("INVALID_BODY", 422, "product_name erforderlich.");

  const entry = await prisma.cancellationExcludedProduct.upsert({
    where:  { product_id: b.product_id },
    create: {
      product_id:   b.product_id,
      product_slug: b.product_slug,
      product_name: b.product_name,
      reason:       typeof b.reason === "string" ? b.reason.trim() || null : null,
    },
    update: {
      product_slug: b.product_slug,
      product_name: b.product_name,
      reason:       typeof b.reason === "string" ? b.reason.trim() || null : null,
    },
  });

  return c.json({ data: entry }, 201);
});

adminCancellationSettingsRoutes.delete("/excluded-products/:id", async (c) => {
  const prisma = getPrismaClient();
  const id     = c.req.param("id");

  const existing = await prisma.cancellationExcludedProduct.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new CatalogError("NOT_FOUND", 404, `Ausschluss nicht gefunden: ${id}`);

  await prisma.cancellationExcludedProduct.delete({ where: { id } });
  return new Response(null, { status: 204 });
});

// ─── Excluded Categories ──────────────────────────────────────────────────────

adminCancellationSettingsRoutes.get("/excluded-categories", async (c) => {
  const prisma   = getPrismaClient();
  const excluded = await prisma.cancellationExcludedCategory.findMany({ orderBy: { created_at: "asc" } });
  return c.json({ data: excluded });
});

adminCancellationSettingsRoutes.post("/excluded-categories", async (c) => {
  const prisma = getPrismaClient();

  let body: unknown;
  try { body = await c.req.json(); } catch {
    throw new CatalogError("INVALID_BODY", 422, "Body muss gültiges JSON sein.");
  }

  const b = body as Record<string, unknown>;
  if (typeof b.category_id !== "string" || !b.category_id) throw new CatalogError("INVALID_BODY", 422, "category_id erforderlich.");
  if (typeof b.category_slug !== "string" || !b.category_slug) throw new CatalogError("INVALID_BODY", 422, "category_slug erforderlich.");
  if (typeof b.category_name !== "string" || !b.category_name) throw new CatalogError("INVALID_BODY", 422, "category_name erforderlich.");

  const entry = await prisma.cancellationExcludedCategory.upsert({
    where:  { category_id: b.category_id },
    create: {
      category_id:   b.category_id,
      category_slug: b.category_slug,
      category_name: b.category_name,
      reason:        typeof b.reason === "string" ? b.reason.trim() || null : null,
    },
    update: {
      category_slug: b.category_slug,
      category_name: b.category_name,
      reason:        typeof b.reason === "string" ? b.reason.trim() || null : null,
    },
  });

  return c.json({ data: entry }, 201);
});

adminCancellationSettingsRoutes.delete("/excluded-categories/:id", async (c) => {
  const prisma = getPrismaClient();
  const id     = c.req.param("id");

  const existing = await prisma.cancellationExcludedCategory.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new CatalogError("NOT_FOUND", 404, `Ausschluss nicht gefunden: ${id}`);

  await prisma.cancellationExcludedCategory.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
