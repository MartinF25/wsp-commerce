/**
 * Typsichere Kapselung der Umgebungsvariablen für den Storefront.
 *
 * COMMERCE_API_URL wirft wenn ungesetzt (blockiert API-Calls).
 * FIREBASE_LEAD_FUNCTION_URL und N8N_WEBHOOK_URL sind optional:
 *   - Beide gesetzt → Server Action nutzt Firebase Function (empfohlen)
 *   - Nur N8N_WEBHOOK_URL → Server Action ruft n8n direkt (Fallback)
 *   - Keines gesetzt → nur Konsolen-Log in Development, Fehler in Production
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
};
