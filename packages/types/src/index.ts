/**
 * @wsp/types – Typen-only Re-Export
 *
 * Re-exportiert alle TypeScript-Typen aus @wsp/contracts ohne Zod-Runtime.
 * Gedacht für Konsumenten, die nur Typen benötigen und Zod nicht im Bundle haben wollen
 * (z. B. reine Client-Komponenten, Edge-Funktionen).
 *
 * Wer Zod-Validierung braucht, importiert direkt aus @wsp/contracts.
 */

// ─── Query / Filter ───────────────────────────────────────────────────────────

export type {
  Locale,
  ProductType,
  ProductStatus,
  Pagination,
  CatalogFilter,
  ProductQuery,
} from "@wsp/contracts";

// ─── Produkt ──────────────────────────────────────────────────────────────────

export type {
  Variant,
  PriceDisplay,
  ProductImage,
  ProductDocument,
  ProductSummary,
  ProductDetail,
  ProductListResult,
} from "@wsp/contracts";

// ─── Kategorie ────────────────────────────────────────────────────────────────

export type {
  CategorySummary,
  CategoryDetail,
  CategoryTreeNode,
} from "@wsp/contracts";
