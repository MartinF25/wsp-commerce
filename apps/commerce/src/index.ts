/**
 * Commerce Core Entry Point
 *
 * Exports alle Services, Mapper, Types und Utilities für die Katalog-Schicht.
 *
 * Konsumenten:
 *   - REST API (Phase C-3)       → importiert Services + Mapper
 *   - Storefront Server (Phase 3+) → importiert Mapper-Output-Typen via @wsp/contracts
 *   - Admin API (Phase 5)         → importiert Services + Mapper
 */

// Services (Prisma-Zugriffe gekapselt)
export * from "./services";

// Mapper (Prisma → @wsp/contracts Contract-Typen)
export * from "./mappers";

// Interne Prisma-nahe Types (nur für commerce-interne Verwendung)
export type { ProductWithVariants, CategoryWithProducts, ListProductsFilter } from "./types";
export { CatalogError } from "./types";

// Prisma-Client-Lifecycle
export { getPrismaClient, disconnectPrisma } from "./lib/prisma";
