import { Hono } from "hono";
import { z } from "zod";
import { getPrismaClient } from "../../lib/prisma";

/**
 * Affiliate-Routen – öffentlicher Tracking-Endpunkt
 *
 * POST /track
 *   Erfasst einen Klick auf einen Affiliate-Button (datensparsam).
 *   Gespeichert wird: productId, Zeitstempel, Referrer-Pfad, Locale.
 *   Nicht gespeichert: IP-Adresse, User-Agent, personenbezogene Daten.
 *
 *   Antwortet immer 200 OK – auch bei ungültiger productId (kein Info-Leak,
 *   da navigator.sendBeacon() die Response ignoriert).
 *
 *   400 nur bei strukturell falschem Body (Bug-Signal für den Client).
 */
export const affiliateRoutes = new Hono();

// ─── Body-Schema ──────────────────────────────────────────────────────────────

const TrackBodySchema = z.object({
  productId: z.string().uuid(),
  referrerPath: z.string().max(500).optional(),
  locale: z.enum(["de", "en", "es"]).optional(),
});

// ─── POST /track ──────────────────────────────────────────────────────────────

affiliateRoutes.post("/track", async (c) => {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Ungültiger JSON-Body." }, 400);
  }

  const parsed = TrackBodySchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: `Ungültige Felder: ${parsed.error.issues.map((i) => i.message).join(", ")}` },
      400
    );
  }

  const { productId, referrerPath, locale } = parsed.data;
  const prisma = getPrismaClient();

  // Produkt muss aktiv, vom Typ affiliate_external und affiliate_enabled=true sein.
  // Kein Fehler bei ungültigem productId – verhindert Enumeration über diesen Endpunkt.
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: "active",
      product_type: "affiliate_external",
      affiliate_enabled: true,
      affiliate_url: { not: null },
    },
    select: { id: true },
  });

  if (!product) {
    return c.json({}, 200);
  }

  await prisma.affiliateClick.create({
    data: {
      id: crypto.randomUUID(),
      product_id: product.id,
      referrer_path: referrerPath ?? null,
      locale: locale ?? null,
      // clicked_at: DB-Default (now())
      // Kein IP, kein User-Agent, keine personenbezogenen Daten
    },
  });

  return c.json({}, 200);
});
