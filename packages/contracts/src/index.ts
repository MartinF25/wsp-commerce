/**
 * @wsp/contracts – Öffentliche Katalog-Contracts
 *
 * Enthält Zod-Schemas und inferierte TypeScript-Typen für alle
 * Katalog-Operationen. Kein @prisma/client, kein Framework-Code.
 *
 * Verwendung:
 *   import { ProductDetailSchema, type ProductDetail } from "@wsp/contracts";
 *
 * Konsumenten:
 *   - apps/commerce  → Mapper validieren Output gegen diese Schemas
 *   - apps/storefront → Typen für Props und Fetcher
 *   - apps/admin     → Typen für Tabellen und Formulare
 */
export * from "./catalog";
