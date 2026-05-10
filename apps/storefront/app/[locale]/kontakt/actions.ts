"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { env } from "@/lib/env";
import { ANFRAGEART_VALUES, PROJEKTART_VALUES } from "./constants";

export { ANFRAGEART_VALUES, PROJEKTART_VALUES };

// ─── Validierungsschema ───────────────────────────────────────────────────────

function buildLeadFormSchema(t: Awaited<ReturnType<typeof getTranslations<"kontakt">>>) {
  return z.object({
    vorname: z.string().min(1, t("error_firstname_required")).max(100),
    nachname: z.string().min(1, t("error_lastname_required")).max(100),
    firma: z.string().max(200).optional(),
    email: z.string().email(t("error_email_invalid")),
    telefon: z.string().max(50).optional(),
    anfrageart: z.enum(ANFRAGEART_VALUES, {
      errorMap: () => ({ message: t("error_type_required") }),
    }),
    projektart: z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.enum(PROJEKTART_VALUES).optional()
    ),
    nachricht: z
      .string()
      .min(10, t("error_message_min"))
      .max(5000),
    // Honeypot – muss leer sein; bots füllen dieses Feld aus
    website: z.string().max(0, t("error_spam")),
  });
}

// ─── Mapping: Formular-Werte → n8n-Webhook-Werte ─────────────────────────────

const LEAD_TYPE_MAP: Record<(typeof ANFRAGEART_VALUES)[number], string> = {
  Privatprojekt: "private",
  Gewerbeprojekt: "commercial",
  "Landwirtschaft / Hof": "agriculture",
  Partneranfrage: "partner",
  Händleranfrage: "dealer",
  Montagepartnerschaft: "installer",
  "Allgemeine Beratung": "general",
};

const PRODUCT_INTEREST_MAP: Record<(typeof PROJEKTART_VALUES)[number], string> =
  {
    Solarzaun: "solarzaun",
    SkyWind: "skywind",
    Kombilösung: "kombi",
    "Beratung gewünscht": "consultation",
  };

// ─── Form State (shared mit KontaktForm.tsx) ──────────────────────────────────

export type LeadFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

// ─── Server Action ────────────────────────────────────────────────────────────

/**
 * Verarbeitet eine Kontaktanfrage:
 *   1. Validiert Formular-Daten mit Zod (inklusive Honeypot-Prüfung)
 *   2. Baut den n8n-Webhook-Payload auf (docs/n8n-webhooks.md)
 *   3a. FIREBASE_LEAD_FUNCTION_URL gesetzt → sendet an Firebase Function
 *       (Firebase Function schreibt Firestore + triggert n8n)
 *   3b. Nur N8N_WEBHOOK_URL gesetzt → sendet direkt an n8n (dev-Fallback,
 *       kein Firestore-Eintrag)
 *   3c. Nichts gesetzt → Konsolen-Log in Development, Fehler in Production
 */
export async function submitKontaktanfrage(
  _prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const t = await getTranslations("kontakt");
  const LeadFormSchema = buildLeadFormSchema(t);

  // ── 1. FormData extrahieren und validieren ────────────────────────────────

  const raw = {
    vorname: formData.get("vorname"),
    nachname: formData.get("nachname"),
    firma: (formData.get("firma") as string) || undefined,
    email: formData.get("email"),
    telefon: (formData.get("telefon") as string) || undefined,
    anfrageart: formData.get("anfrageart"),
    projektart: (formData.get("projektart") as string) || undefined,
    nachricht: formData.get("nachricht"),
    website: formData.get("website") ?? "", // honeypot
  };

  const parsed = LeadFormSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? t("error_invalid_input");
    return { status: "error", message: firstError };
  }

  const data = parsed.data;

  // ── 2. Webhook-Payload aufbauen (nach docs/n8n-webhooks.md §POST /webhook/lead) ──

  const webhookPayload = {
    type: "lead",
    leadType: LEAD_TYPE_MAP[data.anfrageart],
    firstName: data.vorname,
    lastName: data.nachname,
    company: data.firma ?? null,
    email: data.email,
    phone: data.telefon ?? null,
    message: data.nachricht,
    productInterest: data.projektart
      ? PRODUCT_INTEREST_MAP[data.projektart]
      : "consultation",
    region: null, // nicht im Formular erhoben – n8n kann per Geo-Lookup befüllen
    submittedAt: new Date().toISOString(),
  };

  // ── 3. Übermitteln ────────────────────────────────────────────────────────

  try {
    const firebaseUrl = env.FIREBASE_LEAD_FUNCTION_URL;
    const n8nUrl = env.N8N_WEBHOOK_URL;

    if (firebaseUrl) {
      // Primärer Pfad: Firebase Function empfängt, schreibt Firestore, triggert n8n
      const res = await fetch(firebaseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
        cache: "no-store",
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[submitKontaktanfrage] Firebase Function Error ${res.status}:`, body);
        throw new Error(`Firebase Function antwortete mit Status ${res.status}`);
      }
    } else if (n8nUrl) {
      // Fallback: direkt an n8n (kein Firestore-Eintrag)
      const res = await fetch(`${n8nUrl}/webhook/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
        cache: "no-store",
      });

      if (!res.ok) {
        console.error(`[submitKontaktanfrage] n8n Error ${res.status}`);
        throw new Error(`n8n-Webhook antwortete mit Status ${res.status}`);
      }
    } else if (env.RESEND_API_KEY) {
      // Einfacher E-Mail-Fallback via Resend
      await sendLeadEmail(data, env.RESEND_API_KEY, env.LEAD_TO_EMAIL);
    } else {
      // Kein Endpunkt konfiguriert
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[submitKontaktanfrage] Kein Endpunkt konfiguriert. Payload (nur Dev):",
          JSON.stringify(webhookPayload, null, 2)
        );
        // In Development trotzdem Success zurückgeben – Formular testbar
      } else {
        throw new Error("Kein Übermittlungsendpunkt konfiguriert.");
      }
    }

    return { status: "success" };
  } catch (err) {
    console.error("[submitKontaktanfrage]", err);
    return {
      status: "error",
      message: t("error_submit"),
    };
  }
}

// ─── Resend E-Mail-Versand ────────────────────────────────────────────────────

type LeadData = {
  vorname: string;
  nachname: string;
  firma?: string;
  email: string;
  telefon?: string;
  anfrageart: string;
  projektart?: string;
  nachricht: string;
};

async function sendLeadEmail(
  data: LeadData,
  apiKey: string,
  toEmail: string
): Promise<void> {
  const subject = `Neue Anfrage: ${data.anfrageart} – ${data.vorname} ${data.nachname}`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1C1C1E">
      <h2 style="color:#22C55E;margin-bottom:4px">Neue Kontaktanfrage</h2>
      <p style="color:#6B7280;margin-top:0;font-size:14px">WSP-Solarenergie Webshop</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#6B7280;width:140px">Name</td><td style="padding:6px 0"><strong>${data.vorname} ${data.nachname}</strong></td></tr>
        ${data.firma ? `<tr><td style="padding:6px 0;color:#6B7280">Firma</td><td style="padding:6px 0">${data.firma}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#6B7280">E-Mail</td><td style="padding:6px 0"><a href="mailto:${data.email}" style="color:#22C55E">${data.email}</a></td></tr>
        ${data.telefon ? `<tr><td style="padding:6px 0;color:#6B7280">Telefon</td><td style="padding:6px 0"><a href="tel:${data.telefon}" style="color:#22C55E">${data.telefon}</a></td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#6B7280">Anfrageart</td><td style="padding:6px 0">${data.anfrageart}</td></tr>
        ${data.projektart ? `<tr><td style="padding:6px 0;color:#6B7280">Projektart</td><td style="padding:6px 0">${data.projektart}</td></tr>` : ""}
      </table>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
      <p style="font-size:14px;color:#6B7280;margin-bottom:4px">Nachricht:</p>
      <p style="font-size:14px;line-height:1.6;white-space:pre-wrap">${data.nachricht.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
      <p style="font-size:12px;color:#9CA3AF">Eingegangen: ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "WSP Kontaktformular <onboarding@resend.dev>",
      to: [toEmail],
      reply_to: [data.email],
      subject,
      html,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[sendLeadEmail] Resend Error ${res.status}:`, body);
    throw new Error(`E-Mail-Versand fehlgeschlagen (Status ${res.status})`);
  }
}
