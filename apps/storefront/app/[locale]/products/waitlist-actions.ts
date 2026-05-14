"use server";

import { WaitlistSubmitSchema } from "@wsp/contracts";
import { env } from "@/lib/env";

export type WaitlistFormState = {
  status: "idle" | "success" | "error" | "duplicate";
  message?: string;
};

/**
 * Speichert eine Wartelisten-Anmeldung:
 *   1. Zod-Validierung + Honeypot-Prüfung
 *   2. Sendet an Firebase Function (product.waitlist.created)
 *      → Firebase Function schreibt Firestore product_waitlist + triggert n8n
 *   Fallback: direkt an n8n (dev-Modus, kein Firestore)
 */
export async function submitWaitlist(
  _prevState: WaitlistFormState,
  formData: FormData
): Promise<WaitlistFormState> {
  const raw = {
    productId: formData.get("productId"),
    productSlug: formData.get("productSlug"),
    productName: formData.get("productName"),
    variantId: formData.get("variantId") || undefined,
    variantSku: formData.get("variantSku") || undefined,
    email: formData.get("email"),
    firstName: formData.get("firstName") || undefined,
    locale: formData.get("locale"),
    consentAccepted: formData.get("consentAccepted") === "true" ? true : undefined,
    sourcePath: formData.get("sourcePath"),
    website: formData.get("website") ?? "", // honeypot
  };

  // Honeypot: sofort abbrechen ohne Fehlermeldung
  if (raw.website) {
    return { status: "success" };
  }

  const parsed = WaitlistSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Ungültige Eingabe";
    return { status: "error", message: firstError };
  }

  const data = parsed.data;

  const payload = {
    type: "product.waitlist.created",
    productId: data.productId,
    productSlug: data.productSlug,
    productName: data.productName,
    variantId: data.variantId ?? null,
    variantSku: data.variantSku ?? null,
    email: data.email,
    firstName: data.firstName ?? null,
    locale: data.locale,
    consentAccepted: data.consentAccepted,
    sourcePath: data.sourcePath,
    submittedAt: new Date().toISOString(),
  };

  const firebaseUrl = env.FIREBASE_LEAD_FUNCTION_URL;
  const n8nUrl = env.N8N_WEBHOOK_URL;

  if (!firebaseUrl && !n8nUrl) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[waitlist] dev-mode payload:", payload);
      return { status: "success" };
    }
    return { status: "error", message: "Konfigurationsfehler. Bitte versuchen Sie es später erneut." };
  }

  try {
    const url = firebaseUrl ?? n8nUrl!;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 409) {
      return { status: "duplicate" };
    }

    if (!res.ok) {
      console.error("[waitlist] upstream error", res.status);
      return { status: "error" };
    }

    return { status: "success" };
  } catch (err) {
    console.error("[waitlist] fetch error", err);
    return { status: "error" };
  }
}
