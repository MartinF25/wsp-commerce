import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { CatalogError } from "../types";
import { catalogRoutes } from "./routes";
import { adminRoutes } from "./routes/admin";
import { blogRoutes } from "./routes/blog";

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
      allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
      allowHeaders: ["Content-Type", "x-api-key"],
    })
  );

  // ─── Health ─────────────────────────────────────────────────────────────────

  app.get("/health", (c) =>
    c.json({ status: "ok", service: "commerce", ts: new Date().toISOString() })
  );

  // ─── Routen ─────────────────────────────────────────────────────────────────

  app.route("/api/catalog", catalogRoutes);
  app.route("/api/blog", blogRoutes);
  app.route("/api/admin", adminRoutes);

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
