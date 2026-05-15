import { Hono } from "hono";
import { productRoutes } from "./products";
import { categoryRoutes } from "./categories";
import { bundleRoutes } from "./bundles";

/**
 * Katalog-Routen
 *
 * Montiert alle öffentlichen Katalog-Endpunkte unter einem gemeinsamen Präfix.
 * Wird in app.ts unter /api/catalog eingehängt.
 *
 * Endpunkte (relativ zu /api/catalog):
 *   GET /products          → Produktliste (paginiert, filterbar)
 *   GET /products/:slug    → Produktdetail
 *   GET /categories        → Kategorienliste (mit Produktzählern)
 *   GET /categories/:slug  → Kategoriedetail (mit Produkten)
 *   GET /bundles           → Bundles für Produkt oder Kategorie
 *   GET /bundles/:id       → Bundle-Detail
 */
export const catalogRoutes = new Hono();

catalogRoutes.route("/products", productRoutes);
catalogRoutes.route("/categories", categoryRoutes);
catalogRoutes.route("/bundles", bundleRoutes);
