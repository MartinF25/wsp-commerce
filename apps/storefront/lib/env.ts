/**
 * Typsichere Kapselung der Umgebungsvariablen für den Storefront.
 *
 * COMMERCE_API_URL wirft wenn ungesetzt (blockiert API-Calls).
 * Lead-Ingestion Priorität (erstes gesetztes gewinnt):
 *   1. FIREBASE_LEAD_FUNCTION_URL → Firebase Function (Firestore + n8n)
 *   2. N8N_WEBHOOK_URL            → n8n direkt (kein Firestore)
 *   3. RESEND_API_KEY             → E-Mail an LEAD_TO_EMAIL
 *   Keines gesetzt → Konsolen-Log in Development, Fehler in Production
 */

function getCommerceApiUrl(): string {
  const url = process.env.COMMERCE_API_URL;
  if (!url) {
    throw new Error(
      "COMMERCE_API_URL ist nicht gesetzt. " +
        "Bitte .env.local anlegen (Vorlage: .env.example)."
    );
  }
  return url.replace(/\/$/, "");
}

export const env = {
  get COMMERCE_API_URL() {
    return getCommerceApiUrl();
  },

  /** URL der deployten Firebase HTTP Function `onLeadSubmit`. Optional. */
  get FIREBASE_LEAD_FUNCTION_URL(): string | null {
    return process.env.FIREBASE_LEAD_FUNCTION_URL || null;
  },

  /** Basis-URL der n8n-Instanz (ohne trailing slash). Optional. */
  get N8N_WEBHOOK_URL(): string | null {
    const url = process.env.N8N_WEBHOOK_URL;
    return url ? url.replace(/\/$/, "") : null;
  },

  /** Resend API-Key für direkten E-Mail-Versand. Optional. */
  get RESEND_API_KEY(): string | null {
    return process.env.RESEND_API_KEY || null;
  },

  /** Ziel-E-Mail für Lead-Benachrichtigungen via Resend. */
  get LEAD_TO_EMAIL(): string {
    return process.env.LEAD_TO_EMAIL || "verkauf@wsp-solarenergie.de";
  },
};
