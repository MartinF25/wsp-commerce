import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { CatalogError } from "../types";
import { catalogRoutes } from "./routes";
import { adminRoutes } from "./routes/admin";
import { adminBundleRoutes } from "./routes/adminBundles";
import { adminStickerRoutes } from "./routes/adminStickers";
import { adminMarketListingRoutes } from "./routes/adminMarketListings";
import { blogRoutes } from "./routes/blog";
import { affiliateRoutes } from "./routes/affiliate";
import { tickerRoutes } from "./routes/ticker";
import {
  adminFeatureDefinitionRoutes,
  adminFeatureVisualRoutes,
  adminFeatureVisualSettingsRoutes,
  publicFeatureVisualRoutes,
} from "./routes/featureVisuals";
import { cancellationRoutes } from "./routes/cancellations";
import { adminCancellationRoutes, adminCancellationSettingsRoutes } from "./routes/adminCancellations";

/**
 * Hono-App-Factory
 *
 * Erstellt und konfiguriert die Hono-Instanz mit:
 * - Request-Logger
 * - CORS (origins werden in Produktion via Env eingeschränkt)
 * - Globaler Fehlerbehandlung (CatalogError → strukturierte JSON-Antwort)
 * - Catalog-Routen unter /api/catalog
 * - Health-Check unter /health
 *
 * Exportiert als Factory-Funktion, damit Tests eine frische Instanz erhalten.
 */
export function createApp() {
  const app = new Hono();

  // ─── Middleware ─────────────────────────────────────────────────────────────

  app.use("*", logger());

  app.use(
    "/api/*",
    cors({
      origin: process.env.CORS_ORIGIN ?? "*",
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "x-api-key", "X-Admin-Key"],
    })
  );

  // ─── Health ─────────────────────────────────────────────────────────────────

  app.get("/health", (c) =>
    c.json({ status: "ok", service: "commerce", ts: new Date().toISOString() })
  );

  // ─── Routen ─────────────────────────────────────────────────────────────────

  // WICHTIG: /api/catalog/feature-visuals muss VOR /api/catalog registriert
  // werden, da Hono Prefix-Routen beim ersten Match stoppt und /api/catalog
  // sonst alle Requests unter diesem Präfix abfängt.
  app.route("/api/catalog/feature-visuals", publicFeatureVisualRoutes);
  app.route("/api/catalog", catalogRoutes);
  app.route("/api/blog", blogRoutes);
  app.route("/api/admin", adminRoutes);
  app.route("/api/admin/bundles", adminBundleRoutes);
  app.route("/api/admin/stickers", adminStickerRoutes);
  app.route("/api/admin/market-listings", adminMarketListingRoutes);
  app.route("/api/admin/feature-definitions", adminFeatureDefinitionRoutes);
  app.route("/api/admin/feature-visuals", adminFeatureVisualRoutes);
  app.route("/api/admin/feature-visual-settings", adminFeatureVisualSettingsRoutes);
  app.route("/api/affiliate", affiliateRoutes);
  app.route("/api/ticker", tickerRoutes);
  app.route("/api/cancellations", cancellationRoutes);
  app.route("/api/admin/cancellations", adminCancellationRoutes);
  app.route("/api/admin/settings/cancellation", adminCancellationSettingsRoutes);

  // ─── 404-Handler ────────────────────────────────────────────────────────────

  app.notFound((c) =>
    c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: `Route nicht gefunden: ${c.req.method} ${c.req.path}`,
          status: 404,
        },
      },
      404
    )
  );

  // ─── Globaler Error-Handler ──────────────────────────────────────────────────

  app.onError((err, c) => {
    if (err instanceof CatalogError) {
      return c.json(
        {
          error: {
            code: err.code,
            message: err.message,
            status: err.statusCode,
          },
        },
        err.statusCode as 400 | 404 | 409 | 422 | 500
      );
    }

    // Unerwartete Fehler nicht nach außen leaken
    console.error("[commerce] Unerwarteter Fehler:", err);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Ein interner Fehler ist aufgetreten.",
          status: 500,
        },
      },
      500
    );
  });

  return app;
}
