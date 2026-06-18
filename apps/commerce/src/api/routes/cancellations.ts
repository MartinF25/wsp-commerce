/**
 * Öffentliche Widerruf-API
 *
 * POST /api/cancellations/request
 *   Nimmt eine EU-Widerrufsanfrage entgegen.
 *
 * Sicherheitsmaßnahmen:
 *   - In-Memory Rate-Limit: max. 5 Anfragen pro IP / 15 Minuten
 *   - Honeypot-Feld (website) muss leer sein
 *   - Duplikat-Check: gleiche E-Mail + Bestellnummer innerhalb von 24h
 *   - Serverseitige Zod-Validierung + HTML-Sanitizing
 *   - IP-Hash (SHA-256, kein Klartext) für DSGVO-konformes Logging
 *   - Keine sensiblen Fehlermeldungen nach außen
 */

import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import * as crypto from "crypto";
import { getPrismaClient } from "../../lib/prisma";

// ─── Rate Limiting (In-Memory) ────────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 Minuten

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Stale Entries stündlich bereinigen
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitStore.entries()) {
    if (now > val.resetAt) rateLimitStore.delete(key);
  }
}, 60 * 60 * 1000);

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "wsp-cancellation-2026";
  return crypto.createHash("sha256").update(ip + salt).digest("hex").slice(0, 16);
}

function getClientIp(c: Context): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

// ─── Validierungsschema ───────────────────────────────────────────────────────

const RequestSchema = z.object({
  order_reference:      z.string().min(1).max(100),
  customer_first_name:  z.string().min(1).max(100),
  customer_last_name:   z.string().min(1).max(100),
  customer_email:       z.string().email().max(254),
  message:              z.string().max(5000).optional(),
  locale:               z.enum(["de", "en", "es"]).default("de"),
  website:              z.string().max(0, "").optional(), // Honeypot
});

// ─── E-Mail-Templates ─────────────────────────────────────────────────────────

type RequestData = {
  id: string;
  order_reference: string;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  message?: string | null;
  locale: string;
};

function buildCustomerEmail(req: RequestData, dateStr: string): { subject: string; html: string; text: string } {
  const name = `${req.customer_first_name} ${req.customer_last_name}`;

  const subjects: Record<string, string> = {
    de: `Widerrufsanfrage erhalten – Bestellung ${req.order_reference}`,
    en: `Cancellation request received – Order ${req.order_reference}`,
    es: `Solicitud de desistimiento recibida – Pedido ${req.order_reference}`,
  };

  const subject = subjects[req.locale] ?? subjects.de;

  const intros: Record<string, string> = {
    de: `Guten Tag ${name},`,
    en: `Dear ${name},`,
    es: `Estimado/a ${name},`,
  };
  const bodyTexts: Record<string, string> = {
    de: `wir haben Ihre Widerrufsanfrage für Bestellung <strong>${req.order_reference}</strong> erhalten.<br><br>
         Wir werden Ihre Anfrage prüfen und uns so schnell wie möglich bei Ihnen melden.`,
    en: `we have received your cancellation request for order <strong>${req.order_reference}</strong>.<br><br>
         We will review your request and get back to you as soon as possible.`,
    es: `hemos recibido su solicitud de desistimiento para el pedido <strong>${req.order_reference}</strong>.<br><br>
         Revisaremos su solicitud y nos pondremos en contacto con usted lo antes posible.`,
  };
  const footerTexts: Record<string, string> = {
    de: "Mit freundlichen Grüßen,<br>Ihr WSP-Solarenergie Team",
    en: "Kind regards,<br>Your WSP Solar Energy Team",
    es: "Atentamente,<br>Su equipo de WSP Solarenergie",
  };
  const receivedTexts: Record<string, string> = {
    de: "Eingegangen am",
    en: "Received on",
    es: "Recibido el",
  };
  const messageLabels: Record<string, string> = {
    de: "Ihre Nachricht",
    en: "Your message",
    es: "Su mensaje",
  };

  const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1C1C1E">
  <div style="background:#1C1C1E;padding:20px 24px;border-radius:8px 8px 0 0">
    <p style="color:#22C55E;font-size:18px;font-weight:600;margin:0">Solarzaun &amp; SkyWind</p>
    <p style="color:#94A3B8;font-size:12px;margin:4px 0 0">WSP-Solarenergie</p>
  </div>
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px">
    <p style="margin-top:0">${intros[req.locale] ?? intros.de}</p>
    <p>${bodyTexts[req.locale] ?? bodyTexts.de}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr>
        <td style="padding:6px 0;color:#6B7280;width:160px">${receivedTexts[req.locale] ?? receivedTexts.de}</td>
        <td style="padding:6px 0">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6B7280">Ref.-Nr.</td>
        <td style="padding:6px 0"><strong>${req.order_reference}</strong></td>
      </tr>
    </table>
    ${req.message ? `
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
    <p style="font-size:13px;color:#6B7280;margin-bottom:4px">${messageLabels[req.locale] ?? messageLabels.de}:</p>
    <p style="font-size:14px;line-height:1.6;white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:6px">${req.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
    ` : ""}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
    <p style="font-size:14px">${footerTexts[req.locale] ?? footerTexts.de}</p>
  </div>
</div>`;

  const text = `${intros[req.locale] ?? intros.de}\n\n${(bodyTexts[req.locale] ?? bodyTexts.de).replace(/<[^>]*>/g, "")}\n\nRef.: ${req.order_reference}\n${receivedTexts[req.locale] ?? receivedTexts.de}: ${dateStr}${req.message ? `\n\n${messageLabels[req.locale] ?? messageLabels.de}:\n${req.message}` : ""}\n\n${(footerTexts[req.locale] ?? footerTexts.de).replace(/<[^>]*>/g, "")}`;

  return { subject, html, text };
}

function buildAdminEmail(req: RequestData, adminDetailUrl: string, dateStr: string): { subject: string; html: string; text: string } {
  const name = `${req.customer_first_name} ${req.customer_last_name}`;
  const subject = `Neue Widerrufsanfrage: ${req.order_reference} – ${name}`;

  const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1C1C1E">
  <h2 style="color:#1C1C1E;font-size:18px;margin-bottom:4px">Neue Widerrufsanfrage</h2>
  <p style="color:#6B7280;font-size:13px;margin-top:0">WSP-Solarenergie Shop · ${dateStr}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:6px 0;color:#6B7280;width:160px">Bestellnummer</td><td style="padding:6px 0"><strong>${req.order_reference}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6B7280">Name</td><td style="padding:6px 0">${name}</td></tr>
    <tr><td style="padding:6px 0;color:#6B7280">E-Mail</td><td style="padding:6px 0"><a href="mailto:${req.customer_email}" style="color:#2563EB">${req.customer_email}</a></td></tr>
    <tr><td style="padding:6px 0;color:#6B7280">Sprache</td><td style="padding:6px 0">${req.locale.toUpperCase()}</td></tr>
  </table>
  ${req.message ? `
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
  <p style="font-size:13px;color:#6B7280;margin-bottom:4px">Nachricht des Kunden:</p>
  <p style="font-size:14px;line-height:1.6;white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:6px">${req.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
  ` : ""}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
  <p>
    <a href="${adminDetailUrl}" style="display:inline-block;background:#2563EB;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">→ Anfrage im Adminbereich öffnen</a>
  </p>
  <p style="font-size:12px;color:#9CA3AF;margin-top:16px">ID: ${req.id}</p>
</div>`;

  const text = `Neue Widerrufsanfrage\n\nBestellnummer: ${req.order_reference}\nName: ${name}\nE-Mail: ${req.customer_email}\nSprache: ${req.locale.toUpperCase()}\n${req.message ? `\nNachricht:\n${req.message}\n` : ""}\nAdmin-Link: ${adminDetailUrl}\nID: ${req.id}`;

  return { subject, html, text };
}

function buildRejectionEmail(req: RequestData, dateStr: string): { subject: string; html: string; text: string } {
  const name = `${req.customer_first_name} ${req.customer_last_name}`;

  const subjects: Record<string, string> = {
    de: `Ihre Widerrufsanfrage – Bestellung ${req.order_reference}`,
    en: `Your cancellation request – Order ${req.order_reference}`,
    es: `Su solicitud de desistimiento – Pedido ${req.order_reference}`,
  };

  const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1C1C1E">
  <div style="background:#1C1C1E;padding:20px 24px;border-radius:8px 8px 0 0">
    <p style="color:#22C55E;font-size:18px;font-weight:600;margin:0">Solarzaun &amp; SkyWind</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px">
    <p style="margin-top:0">${{ de: `Guten Tag ${name},`, en: `Dear ${name},`, es: `Estimado/a ${name},` }[req.locale] ?? `Guten Tag ${name},`}</p>
    <p>${{ de: `vielen Dank für Ihre Widerrufsanfrage für Bestellung <strong>${req.order_reference}</strong>.`, en: `Thank you for your cancellation request for order <strong>${req.order_reference}</strong>.`, es: `Gracias por su solicitud de desistimiento para el pedido <strong>${req.order_reference}</strong>.` }[req.locale] ?? ""}</p>
    <p>${{ de: `Nach Prüfung Ihrer Anfrage müssen wir Ihnen leider mitteilen, dass wir Ihren Widerruf zum jetzigen Zeitpunkt nicht annehmen können. Falls Sie Fragen haben oder der Meinung sind, dass es sich um einen Irrtum handelt, wenden Sie sich bitte direkt an uns.`, en: `After reviewing your request, we regret to inform you that we are unable to process your cancellation at this time. If you have any questions or believe there has been an error, please contact us directly.`, es: `Tras revisar su solicitud, lamentamos informarle que no podemos procesar su desistimiento en este momento. Si tiene alguna pregunta o cree que se ha producido un error, contáctenos directamente.` }[req.locale] ?? ""}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
    <table style="font-size:14px;width:100%">
      <tr><td style="padding:4px 0;color:#6B7280;width:140px">Bestellnummer</td><td><strong>${req.order_reference}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#6B7280">Datum</td><td>${dateStr}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
    <p style="font-size:14px">${{ de: "Mit freundlichen Grüßen,<br>Ihr WSP-Solarenergie Team", en: "Kind regards,<br>Your WSP Solar Energy Team", es: "Atentamente,<br>Su equipo de WSP Solarenergie" }[req.locale] ?? "Mit freundlichen Grüßen,<br>Ihr WSP-Solarenergie Team"}</p>
  </div>
</div>`;

  const text = `${name},\n\nWir haben Ihre Widerrufsanfrage für Bestellung ${req.order_reference} geprüft. Leider können wir den Widerruf zum jetzigen Zeitpunkt nicht annehmen. Bei Fragen wenden Sie sich bitte direkt an uns.\n\nMit freundlichen Grüßen,\nWSP-Solarenergie Team`;

  return { subject: subjects[req.locale] ?? subjects.de, html, text };
}

async function sendRejectionEmail(req: RequestData, adminEmail: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from   = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const dateStr = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });

  const { subject, html, text } = buildRejectionEmail(req, dateStr);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [req.customer_email],
      reply_to: adminEmail || "verkauf@wsp-solarenergie.de",
      subject,
      html,
      text,
    }),
  });

  return res.ok;
}

async function sendEmails(
  req: RequestData,
  adminEmail: string,
  adminDetailUrl: string
): Promise<{ customerSent: boolean; adminSent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[cancellations] RESEND_API_KEY nicht gesetzt – E-Mails werden nicht verschickt.");
    return { customerSent: false, adminSent: false };
  }

  const dateStr = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const toAdmin = adminEmail || process.env.LEAD_TO_EMAIL || "verkauf@wsp-solarenergie.de";

  const { subject: cSubject, html: cHtml, text: cText } = buildCustomerEmail(req, dateStr);
  const { subject: aSubject, html: aHtml, text: aText } = buildAdminEmail(req, adminDetailUrl, dateStr);

  const [customerResult, adminResult] = await Promise.allSettled([
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [req.customer_email], reply_to: toAdmin, subject: cSubject, html: cHtml, text: cText }),
    }),
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [toAdmin], reply_to: req.customer_email, subject: aSubject, html: aHtml, text: aText }),
    }),
  ]);

  const customerSent = customerResult.status === "fulfilled" && (customerResult as PromiseFulfilledResult<Response>).value.ok;
  const adminSent    = adminResult.status === "fulfilled"    && (adminResult    as PromiseFulfilledResult<Response>).value.ok;

  if (!customerSent) console.error("[cancellations] Kunden-E-Mail fehlgeschlagen:", customerResult);
  if (!adminSent)    console.error("[cancellations] Admin-E-Mail fehlgeschlagen:",   adminResult);

  return { customerSent, adminSent };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const cancellationRoutes = new Hono();

cancellationRoutes.post("/request", async (c) => {
  const ip = getClientIp(c);

  // 1. Rate-Limit
  if (!checkRateLimit(ip)) {
    console.warn(`[cancellations] Rate-Limit ausgelöst für IP-Hash: ${hashIp(ip)}`);
    return c.json(
      { error: { code: "RATE_LIMITED", message: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.", status: 429 } },
      429
    );
  }

  // 2. Body parsen
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json(
      { error: { code: "INVALID_BODY", message: "Ungültige Anfrage.", status: 422 } },
      422
    );
  }

  // 3. Validierung
  const parsed = RequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Bitte überprüfen Sie Ihre Eingaben.", status: 422 } },
      422
    );
  }

  const data = parsed.data;

  // 4. Honeypot – still succeed (Bot-Trap)
  if (data.website && data.website.length > 0) {
    return c.json({ data: { success: true } });
  }

  const prisma = getPrismaClient();

  // 5. Feature aktiv?
  const settings = await prisma.cancellationSettings.findUnique({ where: { id: "default" } });
  if (settings && !settings.is_active) {
    return c.json(
      { error: { code: "FEATURE_DISABLED", message: "Das Widerrufsformular ist derzeit nicht verfügbar.", status: 503 } },
      503
    );
  }

  // 6. Duplikat-Check (gleiche E-Mail + Bestellnummer in den letzten 24h)
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const duplicate = await prisma.cancellationRequest.findFirst({
    where: {
      customer_email:   data.customer_email.toLowerCase(),
      order_reference:  data.order_reference,
      created_at:       { gte: since24h },
    },
    select: { id: true },
  });

  if (duplicate) {
    console.info(`[cancellations] Duplikat-Einsendung blockiert: ${data.order_reference}`);
    return c.json({ data: { success: true } }); // gleiche Antwort wie Erfolg
  }

  // 7. Sanitizing
  const sanitized = {
    order_reference:      stripHtml(data.order_reference),
    customer_first_name:  stripHtml(data.customer_first_name),
    customer_last_name:   stripHtml(data.customer_last_name),
    customer_email:       data.customer_email.toLowerCase(),
    message:              data.message ? stripHtml(data.message) : null,
    locale:               data.locale,
    customer_ip_hash:     hashIp(ip),
  };

  // 8. Fristenmodus & Deadline-Check
  // Gibt das Ergebnis der Fristprüfung zurück.
  // Im Soft-Modus (kein Bestellsystem) immer "unknown" – Händler prüft manuell.
  // Sobald Bestelldaten verfügbar sind, hier die Logik implementieren.
  function checkDeadline(): "within" | "possible_exceeded" | "exceeded" | "unknown" {
    return "unknown";
  }

  const mode = settings?.mode ?? "always_submit";
  const deadlineCheckResult = checkDeadline();

  // Modus 3: Bei definitiv abgelaufener Frist → automatisch ablehnen
  const autoReject = mode === "auto_reject" && deadlineCheckResult === "exceeded";

  // 9. Request in DB anlegen
  const initialStatus = autoReject ? "widerruf_abgelehnt" : "widerruf_beantragt";

  const request = await prisma.cancellationRequest.create({
    data: {
      ...sanitized,
      status:                  initialStatus,
      deadline_check_result:   deadlineCheckResult,
      excluded_items_detected: false,
    },
  });

  // 10. Log: neue Anfrage
  const logDetails = autoReject
    ? `Widerrufsanfrage für Bestellung „${sanitized.order_reference}" automatisch abgelehnt (Modus 3: Frist überschritten).`
    : `Widerrufsanfrage für Bestellung „${sanitized.order_reference}" eingegangen.`;

  await prisma.cancellationLog.create({
    data: {
      request_id:   request.id,
      event:        autoReject ? "auto_rejected" : "request_created",
      details:      logDetails,
      performed_by: "system",
    },
  });

  console.info(`[cancellations] Neue Anfrage: ${request.id} – Ref. ${request.order_reference} – Modus: ${mode}${autoReject ? " (AUTO-ABGELEHNT)" : ""}`);

  const adminEmail    = settings?.admin_email || process.env.LEAD_TO_EMAIL || "verkauf@wsp-solarenergie.de";
  const adminBaseUrl  = process.env.ADMIN_URL ?? "http://localhost:3002";
  const adminDetailUrl = `${adminBaseUrl}/widerrufe/${request.id}`;

  if (autoReject) {
    // Modus 3: Ablehnungs-E-Mail an Kunden + Info an Admin
    const [rejectionSent, adminNotified] = await Promise.allSettled([
      sendRejectionEmail(request, adminEmail),
      sendEmails({ ...request, message: request.message ?? null }, adminEmail, adminDetailUrl),
    ]);

    const now = new Date();
    const update: Record<string, Date> = {};
    if (rejectionSent.status === "fulfilled" && rejectionSent.value) {
      update.rejection_email_sent_at = now;
    }
    if (adminNotified.status === "fulfilled") {
      const r = adminNotified.value;
      if (r?.adminSent) update.admin_email_sent_at = now;
    }

    if (Object.keys(update).length > 0) {
      await prisma.cancellationRequest.update({ where: { id: request.id }, data: update });
    }

    if (update.rejection_email_sent_at) {
      await prisma.cancellationLog.create({
        data: { request_id: request.id, event: "rejection_email_sent", performed_by: "system" },
      });
    }

    return c.json({ data: { success: true, requestId: request.id } }, 201);
  }

  // 11. Modus 1 & 2: E-Mails versenden
  const emailResults = await sendEmails({ ...request, message: request.message ?? null }, adminEmail, adminDetailUrl).catch((err) => {
    console.error("[cancellations] E-Mail-Fehler:", err);
    return null;
  });

  // 12. Zeitstempel aktualisieren
  if (emailResults) {
    const now = new Date();
    const emailUpdate: Record<string, Date | null> = {};
    if (emailResults.customerSent) emailUpdate.customer_email_sent_at = now;
    if (emailResults.adminSent)    emailUpdate.admin_email_sent_at    = now;

    if (Object.keys(emailUpdate).length > 0) {
      await prisma.cancellationRequest.update({ where: { id: request.id }, data: emailUpdate });
    }

    const emailLogs = [];
    if (emailResults.customerSent) emailLogs.push({ request_id: request.id, event: "customer_email_sent", performed_by: "system" });
    if (emailResults.adminSent)    emailLogs.push({ request_id: request.id, event: "admin_email_sent",   performed_by: "system" });
    if (emailLogs.length > 0) {
      await prisma.cancellationLog.createMany({ data: emailLogs });
    }
  }

  // Modus 2: Hinweis-Log bei möglicher Fristüberschreitung
  if (mode === "plausibility_check" && (deadlineCheckResult === "possible_exceeded" || deadlineCheckResult === "exceeded")) {
    await prisma.cancellationLog.create({
      data: {
        request_id:   request.id,
        event:        "deadline_flag",
        details:      `Plausibilitätsprüfung: Frist möglicherweise überschritten (${deadlineCheckResult}). Anfrage trotzdem weitergeleitet.`,
        performed_by: "system",
      },
    });
  }

  return c.json({ data: { success: true, requestId: request.id } }, 201);
});
