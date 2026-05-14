import { z } from "zod";

// ─── WaitlistSubmit ───────────────────────────────────────────────────────────

/**
 * Eingabe-Schema für die Wartelisten-Anmeldung im Storefront.
 * website ist ein Honeypot-Feld – muss leer sein.
 * Keine IP, keine Session-Daten – bewusst datensparsam.
 */
export const WaitlistSubmitSchema = z.object({
  productId: z.string().uuid(),
  productSlug: z.string().min(1),
  productName: z.string().min(1),
  variantId: z.string().uuid().optional(),
  variantSku: z.string().optional(),
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  locale: z.enum(["de", "en", "es"]),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: "Einwilligung erforderlich" }),
  }),
  sourcePath: z.string().min(1),
  website: z.string().max(0).optional(), // honeypot
});
export type WaitlistSubmit = z.infer<typeof WaitlistSubmitSchema>;

// ─── WaitlistEntry (Firestore-Dokument, read-only im Contract) ───────────────

export const WaitlistStatusSchema = z.enum([
  "pending",
  "notified",
  "cancelled",
  "failed",
]);
export type WaitlistStatus = z.infer<typeof WaitlistStatusSchema>;

export const WaitlistEntrySchema = z.object({
  id: z.string(),
  productId: z.string().uuid(),
  productSlug: z.string(),
  productName: z.string(),
  variantId: z.string().uuid().optional(),
  variantSku: z.string().optional(),
  email: z.string().email(),
  firstName: z.string().optional(),
  locale: z.enum(["de", "en", "es"]),
  consentAccepted: z.boolean(),
  status: WaitlistStatusSchema,
  sourcePath: z.string(),
  createdAt: z.string().datetime(),
  notifiedAt: z.string().datetime().optional(),
  n8nStatus: z.enum(["pending", "sent", "failed"]),
  n8nSentAt: z.string().datetime().optional(),
});
export type WaitlistEntry = z.infer<typeof WaitlistEntrySchema>;

// ─── Admin: Waitlist-Statistik pro Produkt ───────────────────────────────────

export const WaitlistStatsSchema = z.object({
  productId: z.string().uuid(),
  productSlug: z.string(),
  productName: z.string(),
  totalEntries: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  notifiedCount: z.number().int().nonnegative(),
});
export type WaitlistStats = z.infer<typeof WaitlistStatsSchema>;
