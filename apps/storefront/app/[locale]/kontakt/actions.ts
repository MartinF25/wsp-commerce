"use server";

import { z } from "zod";
import { env } from "@/lib/env";

// ─── Zulässige Enum-Werte (müssen mit KontaktForm.tsx übereinstimmen) ────────

const ANFRAGEART_VALUES = [
  "Privatprojekt",
  "Gewerbeprojekt",
  "Landwirtschaft / Hof",
  "Partneranfrage",
  "Händleranfrage",
  "Montagepartnerschaft",
  "Allgemeine Beratung",
] as const;

const PROJEKTART_VALUES = [
  "Solarzaun",
  "SkyWind",
  "Kombilösung",
  "Beratung gewünscht",
] as const;

// ─── Validierungsschema ───────────────────────────────────────────────────────

const LeadFormSchema = z.object({
  vorname: z.string().min(1, "Vorname ist erforderlich.").max(100),
  nachname: z.string().min(1, "Nachname ist erforderlich.").max(100),
  firma: z.string().max(200).optional(),
  email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben."),
  telefon: z.string().max(50).optional(),
  anfrageart: z.enum(ANFRAGEART_VALUES, {
    errorMap: () => ({ message: "Bitte eine Anfrageart wählen." }),
  }),
  projektart: z.enum(PROJEKTART_VALUES).optional(),
  nachricht: z
    .string()
    .min(10, "Bitte mindestens 10 Zeichen eingeben.")
    .max(5000),
  // Honeypot – muss leer sein; bots füllen dieses Feld aus
  website: z.string().max(0, "Spam erkannt."),
});

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
      parsed.error.issues[0]?.message ?? "Ungültige Eingabe. Bitte prüfen Sie Ihre Angaben.";
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
      message:
        "Ihre Anfrage konnte leider nicht übermittelt werden. " +
        "Bitte versuchen Sie es später erneut oder schreiben Sie uns direkt per E-Mail.",
    };
  }
}
