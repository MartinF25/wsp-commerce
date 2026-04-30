"use server";

import { z } from "zod";
import { env } from "@/lib/env";

const NewsletterSchema = z.object({
  email: z
    .string()
    .email("Bitte eine gültige E-Mail-Adresse eingeben.")
    .transform((e) => e.trim().toLowerCase()),
  firstName: z.string().max(100).optional(),
  consentGiven: z.literal("true", {
    errorMap: () => ({ message: "Zustimmung ist erforderlich." }),
  }),
  website: z.string().max(0, "Spam erkannt."),
});

export type NewsletterFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const CONSENT_TEXT =
  "Ich stimme der Verarbeitung meiner E-Mail-Adresse gemäß der Datenschutzerklärung zu. Die Einwilligung kann jederzeit widerrufen werden.";

export async function subscribeNewsletter(
  _prevState: NewsletterFormState,
  formData: FormData
): Promise<NewsletterFormState> {
  const rawFirstName = (formData.get("firstName") as string)?.trim() || undefined;

  const raw = {
    email: formData.get("email"),
    firstName: rawFirstName,
    consentGiven: formData.get("consentGiven") ?? "",
    website: formData.get("website") ?? "",
  };

  const parsed = NewsletterSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Ungültige Eingabe.";
    return { status: "error", message: firstError };
  }

  const { email, firstName } = parsed.data;
  const now = new Date().toISOString();

  const payload = {
    type: "newsletter",
    email,
    firstName: firstName ?? null,
    consentGiven: true,
    consentText: CONSENT_TEXT,
    consentTimestamp: now,
    source: "newsletter_popup",
    submittedAt: now,
  };

  try {
    const newsletterFunctionUrl = env.FIREBASE_LEAD_FUNCTION_URL;
    const n8nUrl = env.N8N_WEBHOOK_URL;

    if (newsletterFunctionUrl) {
      const res = await fetch(newsletterFunctionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(
          `[subscribeNewsletter] Firebase Function Error ${res.status}:`,
          body
        );
        throw new Error(
          `Firebase Function antwortete mit Status ${res.status}`
        );
      }
    } else if (n8nUrl) {
      const res = await fetch(`${n8nUrl}/webhook/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "newsletter.subscription.created",
          sentAt: now,
          subscription: payload,
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        console.error(`[subscribeNewsletter] n8n Error ${res.status}`);
        throw new Error(`n8n-Webhook antwortete mit Status ${res.status}`);
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[subscribeNewsletter] Kein Endpunkt konfiguriert. Payload (Dev):",
          JSON.stringify(payload, null, 2)
        );
      } else {
        throw new Error("Kein Übermittlungsendpunkt konfiguriert.");
      }
    }

    return { status: "success" };
  } catch (err) {
    console.error("[subscribeNewsletter]", err);
    return {
      status: "error",
      message:
        "Anmeldung konnte nicht verarbeitet werden. Bitte versuchen Sie es später erneut.",
    };
  }
}
