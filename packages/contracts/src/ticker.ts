import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const LiveTickerStatusSchema = z.enum(["draft", "active", "archived"]);
export type LiveTickerStatus = z.infer<typeof LiveTickerStatusSchema>;

export const LiveTickerTypeSchema = z.enum([
  "info",
  "offer",
  "availability",
  "blog",
  "product",
  "warning",
]);
export type LiveTickerType = z.infer<typeof LiveTickerTypeSchema>;

export const LiveTickerScopeSchema = z.enum([
  "global",
  "product",
  "category",
  "solution",
]);
export type LiveTickerScope = z.infer<typeof LiveTickerScopeSchema>;

// ─── Public Contract (gelöst für eine Locale) ─────────────────────────────────

/**
 * Einzelne Ticker-Nachricht – locale-aufgelöst.
 * text und link_label sind bereits in der angeforderten Sprache (oder DE-Fallback).
 */
export const TickerMessageSchema = z.object({
  id: z.string(),
  type: LiveTickerTypeSchema,
  scope: LiveTickerScopeSchema,
  product_id: z.string().nullable(),
  category_id: z.string().nullable(),
  solution_slug: z.string().nullable(),
  priority: z.number().int(),
  starts_at: z.string().datetime().nullable(),
  ends_at: z.string().datetime().nullable(),
  link_href: z.string().nullable(),
  icon: z.string().nullable(),
  text: z.string(),
  link_label: z.string().nullable(),
});
export type TickerMessage = z.infer<typeof TickerMessageSchema>;

// ─── Admin Contract (alle Übersetzungen) ─────────────────────────────────────

export const TickerTranslationSchema = z.object({
  locale: z.enum(["de", "en", "es"]),
  text: z.string(),
  link_label: z.string().nullable(),
});
export type TickerTranslation = z.infer<typeof TickerTranslationSchema>;

export const TickerMessageAdminSchema = z.object({
  id: z.string(),
  status: LiveTickerStatusSchema,
  type: LiveTickerTypeSchema,
  scope: LiveTickerScopeSchema,
  product_id: z.string().nullable(),
  category_id: z.string().nullable(),
  solution_slug: z.string().nullable(),
  priority: z.number().int(),
  starts_at: z.string().datetime().nullable(),
  ends_at: z.string().datetime().nullable(),
  link_href: z.string().nullable(),
  icon: z.string().nullable(),
  translations: z.array(TickerTranslationSchema),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type TickerMessageAdmin = z.infer<typeof TickerMessageAdminSchema>;

// ─── Input ────────────────────────────────────────────────────────────────────

export const TickerInputSchema = z.object({
  type: LiveTickerTypeSchema,
  scope: LiveTickerScopeSchema,
  product_id: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  solution_slug: z.string().nullable().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  link_href: z.string().url().nullable().optional(),
  icon: z.string().nullable().optional(),
  translations: z
    .array(TickerTranslationSchema)
    .min(1, "Mindestens eine Übersetzung (DE) erforderlich"),
});
export type TickerInput = z.infer<typeof TickerInputSchema>;

export const TickerStatusUpdateSchema = z.object({
  status: LiveTickerStatusSchema,
});
export type TickerStatusUpdate = z.infer<typeof TickerStatusUpdateSchema>;
