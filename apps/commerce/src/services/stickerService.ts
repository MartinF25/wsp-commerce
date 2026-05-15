import { getPrismaClient } from "../lib/prisma";
import type { StickerWithRelations } from "../types";
import { CatalogError } from "../types";
import type {
  StickerCreateInput,
  StickerUpdateInput,
  StickerStatus,
  StickerProductOverrideInput,
} from "@wsp/contracts";

// ─── In-Memory Cache ───────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minuten

let cachedStickers: StickerWithRelations[] | null = null;
let cacheExpiresAt = 0;

function invalidateCache(): void {
  cachedStickers = null;
  cacheExpiresAt = 0;
}

// ─── Prisma Include ────────────────────────────────────────────────────────────

const STICKER_INCLUDE = {
  translations: true,
  rules: true,
  product_overrides: true,
} as const;

// ─── StickerService ────────────────────────────────────────────────────────────

/**
 * StickerService
 *
 * Kapselt alle Sticker-Datenbankoperationen.
 * Stellt eine gecachte Methode bereit, die von der Rule Engine genutzt wird.
 */
export class StickerService {
  /**
   * Gibt alle aktiven Sticker mit ihren Regeln und Translations zurück.
   * Ergebnis wird für CACHE_TTL_MS gecacht, um wiederholte Listenabfragen zu vermeiden.
   * Cache wird bei Write-Operationen (create/update/delete) invalidiert.
   */
  static async getActiveStickersForRuleEngine(): Promise<StickerWithRelations[]> {
    const now = Date.now();
    if (cachedStickers !== null && now < cacheExpiresAt) {
      return cachedStickers;
    }

    const prisma = getPrismaClient();
    const stickers = await prisma.sticker.findMany({
      where: { status: "active" },
      include: STICKER_INCLUDE,
      orderBy: [{ priority: "desc" }, { sort_order: "asc" }],
    }) as StickerWithRelations[];

    cachedStickers = stickers;
    cacheExpiresAt = now + CACHE_TTL_MS;
    return stickers;
  }

  /** Alle Sticker (auch inaktive) – für Admin-Ansichten. */
  static async listAllStickers(): Promise<StickerWithRelations[]> {
    const prisma = getPrismaClient();
    return prisma.sticker.findMany({
      include: STICKER_INCLUDE,
      orderBy: [{ sort_order: "asc" }, { priority: "desc" }, { created_at: "desc" }],
    }) as Promise<StickerWithRelations[]>;
  }

  /** Einzelnen Sticker per ID laden. Gibt null zurück wenn nicht gefunden. */
  static async getStickerById(id: string): Promise<StickerWithRelations | null> {
    const prisma = getPrismaClient();
    return prisma.sticker.findUnique({
      where: { id },
      include: STICKER_INCLUDE,
    }) as Promise<StickerWithRelations | null>;
  }

  /** Sticker per ID laden, wirft 404 wenn nicht gefunden. */
  static async requireStickerById(id: string): Promise<StickerWithRelations> {
    const sticker = await StickerService.getStickerById(id);
    if (!sticker) {
      throw new CatalogError("STICKER_NOT_FOUND", 404, `Sticker nicht gefunden: ${id}`);
    }
    return sticker;
  }

  /** Neuen Sticker anlegen. Invalidiert den Cache. */
  static async createSticker(input: {
    name: string;
    status: StickerStatus;
    priority: number;
    sort_order: number;
    type: StickerWithRelations["type"];
    image_url?: string | null;
    text_color?: string | null;
    bg_color?: string | null;
    border_color?: string | null;
    font_size?: string | null;
    font_bold: boolean;
    font_italic: boolean;
    border_radius?: string | null;
    padding?: string | null;
    opacity?: number | null;
    css_class?: string | null;
    custom_css?: string | null;
    link_url?: string | null;
    position: StickerWithRelations["position"];
    position_x?: number | null;
    position_y?: number | null;
    size_config: Record<string, string>;
    valid_from?: Date | null;
    valid_until?: Date | null;
    store_id?: string | null;
    customer_groups?: string[] | null;
    max_per_product: number;
    allow_override: boolean;
    translations: Array<{
      locale: "de" | "en" | "es";
      text?: string | null;
      tooltip?: string | null;
      tooltip_link_label?: string | null;
      tooltip_link_url?: string | null;
      link_url?: string | null;
    }>;
    rules: Array<{
      rule_type: StickerWithRelations["rules"][0]["rule_type"];
      category_id?: string | null;
      price_min_cents?: number | null;
      price_max_cents?: number | null;
      availability_status?: string | null;
      new_arrival_days?: number | null;
    }>;
  }): Promise<StickerWithRelations> {
    invalidateCache();
    const prisma = getPrismaClient();

    const { translations, rules, ...rest } = input;

    const sticker = await prisma.sticker.create({
      data: {
        ...rest,
        size_config: rest.size_config,
        customer_groups: rest.customer_groups ?? undefined,
        translations: { create: translations },
        rules: { create: rules },
      },
      include: STICKER_INCLUDE,
    }) as StickerWithRelations;

    return sticker;
  }

  /** Sticker aktualisieren. Ersetzt Translations + Rules vollständig. Invalidiert Cache. */
  static async updateSticker(
    id: string,
    input: {
      name?: string;
      status?: StickerStatus;
      priority?: number;
      sort_order?: number;
      type?: StickerWithRelations["type"];
      image_url?: string | null;
      text_color?: string | null;
      bg_color?: string | null;
      border_color?: string | null;
      font_size?: string | null;
      font_bold?: boolean;
      font_italic?: boolean;
      border_radius?: string | null;
      padding?: string | null;
      opacity?: number | null;
      css_class?: string | null;
      custom_css?: string | null;
      link_url?: string | null;
      position?: StickerWithRelations["position"];
      position_x?: number | null;
      position_y?: number | null;
      size_config?: Record<string, string>;
      valid_from?: Date | null;
      valid_until?: Date | null;
      store_id?: string | null;
      customer_groups?: string[] | null;
      max_per_product?: number;
      allow_override?: boolean;
      translations?: Array<{
        locale: "de" | "en" | "es";
        text?: string | null;
        tooltip?: string | null;
        tooltip_link_label?: string | null;
        tooltip_link_url?: string | null;
        link_url?: string | null;
      }>;
      rules?: Array<{
        rule_type: StickerWithRelations["rules"][0]["rule_type"];
        category_id?: string | null;
        price_min_cents?: number | null;
        price_max_cents?: number | null;
        availability_status?: string | null;
        new_arrival_days?: number | null;
      }>;
    }
  ): Promise<StickerWithRelations> {
    invalidateCache();
    const prisma = getPrismaClient();
    const { translations, rules, ...rest } = input;

    await prisma.sticker.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.size_config !== undefined ? { size_config: rest.size_config } : {}),
        ...(rest.customer_groups !== undefined
          ? { customer_groups: rest.customer_groups ?? undefined }
          : {}),
        ...(translations !== undefined
          ? {
              translations: {
                deleteMany: {},
                create: translations,
              },
            }
          : {}),
        ...(rules !== undefined
          ? {
              rules: {
                deleteMany: {},
                create: rules,
              },
            }
          : {}),
      },
    });

    return StickerService.requireStickerById(id);
  }

  /** Status eines Stickers setzen. Invalidiert Cache. */
  static async updateStickerStatus(id: string, status: StickerStatus): Promise<void> {
    invalidateCache();
    const prisma = getPrismaClient();
    await prisma.sticker.update({ where: { id }, data: { status } });
  }

  /** Sticker löschen. Invalidiert Cache. */
  static async deleteSticker(id: string): Promise<void> {
    invalidateCache();
    const prisma = getPrismaClient();
    await prisma.sticker.delete({ where: { id } });
  }

  // ─── Produkt-Overrides ────────────────────────────────────────────────────

  /** Produkt-Override anlegen oder aktualisieren (upsert). */
  static async upsertProductOverride(
    stickerId: string,
    input: StickerProductOverrideInput
  ): Promise<void> {
    invalidateCache();
    const prisma = getPrismaClient();
    await prisma.stickerProductOverride.upsert({
      where: {
        sticker_id_product_id: {
          sticker_id: stickerId,
          product_id: input.product_id,
        },
      },
      create: {
        sticker_id: stickerId,
        product_id: input.product_id,
        enabled: input.enabled ?? true,
        excluded: input.excluded ?? false,
      },
      update: {
        enabled: input.enabled ?? true,
        excluded: input.excluded ?? false,
      },
    });
  }

  /** Produkt-Override entfernen. */
  static async removeProductOverride(stickerId: string, productId: string): Promise<void> {
    invalidateCache();
    const prisma = getPrismaClient();
    await prisma.stickerProductOverride.deleteMany({
      where: { sticker_id: stickerId, product_id: productId },
    });
  }
}
