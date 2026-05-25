/**
 * FeatureVisualService – Business Logic für das Feature Visual Engine
 *
 * Zuständigkeiten:
 * - CRUD für FeatureDefinition, FeatureVisual, FeatureVisualSettings
 * - Matching: Feature-Strings → ResolvedFeatureVisual
 * - Prioritätsauflösung: product > category > global, dann priority DESC
 * - In-Memory-Cache für Settings + Definitions (kurze TTL)
 */

import { type PrismaClient, Prisma, type FeatureVisualScope } from "@prisma/client";
import type {
  CreateFeatureDefinition,
  UpdateFeatureDefinition,
  CreateFeatureVisual,
  UpdateFeatureVisual,
  UpdateFeatureVisualSettings,
  ResolvedFeatureVisual,
  FeatureWithVisual,
  LocalizedText,
  FeatureMatchType,
} from "@wsp/contracts";
import {
  matchesDefinition,
  parseFeatureString,
  resolveLocalized,
} from "@wsp/contracts";

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidateAll(): void {
    this.store.clear();
  }
}

const SETTINGS_CACHE_TTL = 60_000;    // 60 s
const DEFINITIONS_CACHE_TTL = 30_000; // 30 s
const VISUALS_CACHE_TTL = 15_000;     // 15 s

// ─── Service ─────────────────────────────────────────────────────────────────

export class FeatureVisualService {
  private settingsCache = new SimpleCache<
    Awaited<ReturnType<PrismaClient["featureVisualSettings"]["findUnique"]>>
  >();
  private definitionsCache = new SimpleCache<
    Awaited<ReturnType<PrismaClient["featureDefinition"]["findMany"]>>
  >();
  private visualsCache = new SimpleCache<
    Awaited<ReturnType<PrismaClient["featureVisual"]["findMany"]>>
  >();

  constructor(private db: PrismaClient) {}

  // ─── Settings ────────────────────────────────────────────────────────────────

  async getSettings() {
    const cached = this.settingsCache.get("settings");
    if (cached !== undefined) return cached;

    let settings = await this.db.featureVisualSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      // Auto-create singleton with defaults on first access
      settings = await this.db.featureVisualSettings.create({
        data: { id: "singleton" },
      });
    }

    this.settingsCache.set("settings", settings, SETTINGS_CACHE_TTL);
    return settings;
  }

  async updateSettings(data: UpdateFeatureVisualSettings) {
    const settings = await this.db.featureVisualSettings.upsert({
      where: { id: "singleton" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: { id: "singleton", ...(data as any) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: data as any,
    });
    this.settingsCache.invalidate("settings");
    return settings;
  }

  // ─── FeatureDefinition CRUD ───────────────────────────────────────────────────

  async listDefinitions(params?: { categoryId?: string; activeOnly?: boolean }) {
    const cacheKey = `defs:${params?.categoryId ?? "*"}:${params?.activeOnly ?? true}`;
    const cached = this.definitionsCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const where: Prisma.FeatureDefinitionWhereInput = {};
    if (params?.activeOnly !== false) where.is_active = true;
    if (params?.categoryId) {
      where.OR = [
        { category_id: null },
        { category_id: params.categoryId },
      ];
    }

    const defs = await this.db.featureDefinition.findMany({
      where,
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });

    this.definitionsCache.set(cacheKey, defs, DEFINITIONS_CACHE_TTL);
    return defs;
  }

  async getDefinitionById(id: string) {
    return this.db.featureDefinition.findUnique({ where: { id } });
  }

  async getDefinitionBySlug(slug: string) {
    return this.db.featureDefinition.findUnique({ where: { slug } });
  }

  async createDefinition(data: CreateFeatureDefinition) {
    const result = await this.db.featureDefinition.create({
      data: {
        slug: data.slug,
        names: data.names as Prisma.InputJsonValue,
        descriptions: data.descriptions ? (data.descriptions as Prisma.InputJsonValue) : Prisma.JsonNull,
        match_pattern: data.match_pattern ?? null,
        match_type: (data.match_type ?? "contains") as any,
        category_id: data.category_id ?? null,
        sort_order: data.sort_order ?? 0,
        is_active: data.is_active ?? true,
      },
    });
    this.definitionsCache.invalidateAll();
    return result;
  }

  async updateDefinition(id: string, data: UpdateFeatureDefinition) {
    const result = await this.db.featureDefinition.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.names !== undefined && { names: data.names as Prisma.InputJsonValue }),
        ...(data.descriptions !== undefined && {
          descriptions: data.descriptions ? (data.descriptions as Prisma.InputJsonValue) : Prisma.JsonNull,
        }),
        ...(data.match_pattern !== undefined && { match_pattern: data.match_pattern }),
        ...(data.match_type !== undefined && { match_type: data.match_type as any }),
        ...(data.category_id !== undefined && { category_id: data.category_id }),
        ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });
    this.definitionsCache.invalidateAll();
    return result;
  }

  async deleteDefinition(id: string) {
    const result = await this.db.featureDefinition.delete({ where: { id } });
    this.definitionsCache.invalidateAll();
    this.visualsCache.invalidateAll();
    return result;
  }

  // ─── FeatureVisual CRUD ───────────────────────────────────────────────────────

  async listVisuals(params?: {
    definitionId?: string;
    categoryId?: string;
    productId?: string;
    scope?: FeatureVisualScope;
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.FeatureVisualWhereInput = {};
    if (params?.activeOnly !== false) where.is_active = true;
    if (params?.definitionId) where.feature_definition_id = params.definitionId;
    if (params?.scope) where.scope = params.scope;
    if (params?.categoryId) where.category_id = params.categoryId;
    if (params?.productId) where.product_id = params.productId;

    const [items, total] = await Promise.all([
      this.db.featureVisual.findMany({
        where,
        orderBy: [{ scope: "asc" }, { priority: "desc" }, { created_at: "asc" }],
        take: params?.limit ?? 100,
        skip: params?.offset ?? 0,
      }),
      this.db.featureVisual.count({ where }),
    ]);
    return { items, total };
  }

  async getVisualById(id: string) {
    return this.db.featureVisual.findUnique({ where: { id } });
  }

  async createVisual(data: CreateFeatureVisual) {
    const result = await this.db.featureVisual.create({
      data: {
        feature_definition_id: data.feature_definition_id ?? null,
        feature_value: data.feature_value ?? null,
        scope: (data.scope ?? "global") as any,
        category_id: data.category_id ?? null,
        product_id: data.product_id ?? null,
        image_url: data.image_url ?? null,
        svg_content: data.svg_content ?? null,
        image_width: data.image_width ?? null,
        image_height: data.image_height ?? null,
        alt_texts: data.alt_texts ? (data.alt_texts as Prisma.InputJsonValue) : Prisma.JsonNull,
        labels: data.labels ? (data.labels as Prisma.InputJsonValue) : Prisma.JsonNull,
        tooltips: data.tooltips ? (data.tooltips as Prisma.InputJsonValue) : Prisma.JsonNull,
        link_url: data.link_url ?? null,
        link_target: data.link_target ?? "_self",
        link_rel: data.link_rel ?? null,
        color_primary: data.color_primary ?? null,
        color_secondary: data.color_secondary ?? null,
        css_class: data.css_class ?? null,
        priority: data.priority ?? 0,
        is_active: data.is_active ?? true,
      },
    });
    this.visualsCache.invalidateAll();
    return result;
  }

  async updateVisual(id: string, data: UpdateFeatureVisual) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = {};
    if (data.feature_definition_id !== undefined) update.feature_definition_id = data.feature_definition_id;
    if (data.feature_value !== undefined) update.feature_value = data.feature_value;
    if (data.scope !== undefined) update.scope = data.scope;
    if (data.category_id !== undefined) update.category_id = data.category_id;
    if (data.product_id !== undefined) update.product_id = data.product_id;
    if (data.image_url !== undefined) update.image_url = data.image_url;
    if (data.svg_content !== undefined) update.svg_content = data.svg_content;
    if (data.image_width !== undefined) update.image_width = data.image_width;
    if (data.image_height !== undefined) update.image_height = data.image_height;
    if (data.alt_texts !== undefined) update.alt_texts = data.alt_texts as Prisma.InputJsonValue;
    if (data.labels !== undefined) update.labels = data.labels as Prisma.InputJsonValue;
    if (data.tooltips !== undefined) update.tooltips = data.tooltips as Prisma.InputJsonValue;
    if (data.link_url !== undefined) update.link_url = data.link_url;
    if (data.link_target !== undefined) update.link_target = data.link_target;
    if (data.link_rel !== undefined) update.link_rel = data.link_rel;
    if (data.color_primary !== undefined) update.color_primary = data.color_primary;
    if (data.color_secondary !== undefined) update.color_secondary = data.color_secondary;
    if (data.css_class !== undefined) update.css_class = data.css_class;
    if (data.priority !== undefined) update.priority = data.priority;
    if (data.is_active !== undefined) update.is_active = data.is_active;

    const result = await this.db.featureVisual.update({ where: { id }, data: update });
    this.visualsCache.invalidateAll();
    return result;
  }

  async deleteVisual(id: string) {
    const result = await this.db.featureVisual.delete({ where: { id } });
    this.visualsCache.invalidateAll();
    return result;
  }

  // ─── Core Resolution Engine ────────────────────────────────────────────────

  /**
   * Löst Feature-Strings eines Produkts gegen vorhandene Visuals auf.
   *
   * Auflösungsreihenfolge (höchste Priorität zuerst):
   * 1. scope=product  + featureValue exact match
   * 2. scope=product  + featureDefinition match
   * 3. scope=category + featureValue exact match
   * 4. scope=category + featureDefinition match
   * 5. scope=global   + featureValue exact match
   * 6. scope=global   + featureDefinition match
   * 7. Kein Visual → null
   */
  async resolveProductFeatures(
    featureStrings: string[],
    options: {
      productId?: string;
      categoryId?: string;
      locale: string;
    },
  ): Promise<FeatureWithVisual[]> {
    if (featureStrings.length === 0) return [];

    const cacheKey = `resolve:${options.productId ?? "_"}:${options.categoryId ?? "_"}`;
    let allVisuals = this.visualsCache.get(cacheKey);

    if (!allVisuals) {
      // Load all relevant visuals in one query
      const scopeFilter: Prisma.FeatureVisualWhereInput[] = [
        { scope: "global" },
      ];
      if (options.categoryId) scopeFilter.push({ scope: "category", category_id: options.categoryId });
      if (options.productId) scopeFilter.push({ scope: "product", product_id: options.productId });

      allVisuals = await this.db.featureVisual.findMany({
        where: { is_active: true, OR: scopeFilter },
        orderBy: [{ priority: "desc" }, { created_at: "asc" }],
      });
      this.visualsCache.set(cacheKey, allVisuals, VISUALS_CACHE_TTL);
    }

    const definitions = await this.listDefinitions({
      categoryId: options.categoryId,
      activeOnly: true,
    });

    return featureStrings.map((raw) => {
      const { key, value } = parseFeatureString(raw);
      const visual = this.findBestVisual(raw, value, allVisuals!, definitions, options);
      return { raw, key, value, visual };
    });
  }

  private findBestVisual(
    raw: string,
    value: string | null,
    allVisuals: Awaited<ReturnType<PrismaClient["featureVisual"]["findMany"]>>,
    definitions: Awaited<ReturnType<PrismaClient["featureDefinition"]["findMany"]>>,
    options: { productId?: string; categoryId?: string; locale: string },
  ): ResolvedFeatureVisual | null {
    const SCOPE_PRIORITY: Record<string, number> = { product: 3, category: 2, global: 1 };

    // Match all visuals that apply to this feature string
    const candidates: Array<{
      visual: typeof allVisuals[number];
      score: number;
    }> = [];

    for (const visual of allVisuals) {
      // Scope guard
      if (visual.scope === "product" && visual.product_id !== options.productId) continue;
      if (visual.scope === "category" && visual.category_id !== options.categoryId) continue;

      const scopeScore = SCOPE_PRIORITY[visual.scope] ?? 0;

      // 1. Exact feature_value match (highest within scope)
      if (visual.feature_value) {
        const featureValueMatch =
          value?.toLowerCase() === visual.feature_value.toLowerCase() ||
          raw.toLowerCase().includes(visual.feature_value.toLowerCase());
        if (featureValueMatch) {
          candidates.push({ visual, score: scopeScore * 100 + visual.priority + 10 });
          continue;
        }
      }

      // 2. Definition match
      if (visual.feature_definition_id) {
        const def = definitions.find((d) => d.id === visual.feature_definition_id);
        if (def?.match_pattern) {
          const matches = matchesDefinition(raw, def.match_pattern, def.match_type as FeatureMatchType);
          if (matches) {
            candidates.push({ visual, score: scopeScore * 100 + visual.priority });
            continue;
          }
        }
      }

      // 3. No filter = matches everything (lowest within scope)
      if (!visual.feature_value && !visual.feature_definition_id) {
        candidates.push({ visual, score: scopeScore * 100 + visual.priority - 5 });
      }
    }

    if (candidates.length === 0) return null;

    // Pick the highest-scoring candidate
    const best = candidates.sort((a, b) => b.score - a.score)[0].visual;
    const def = best.feature_definition_id
      ? definitions.find((d) => d.id === best.feature_definition_id)
      : null;

    const defNames = def?.names as LocalizedText | null;
    const labels = best.labels as LocalizedText | null;
    const tooltips = best.tooltips as LocalizedText | null;
    const altTexts = best.alt_texts as LocalizedText | null;

    const label =
      resolveLocalized(labels, options.locale) ||
      resolveLocalized(defNames, options.locale) ||
      raw;

    return {
      id: best.id,
      label,
      tooltip: resolveLocalized(tooltips, options.locale),
      altText: resolveLocalized(altTexts, options.locale) || label,
      imageUrl: best.image_url,
      svgContent: best.svg_content,
      imageWidth: best.image_width,
      imageHeight: best.image_height,
      linkUrl: best.link_url,
      linkTarget: best.link_target ?? "_self",
      linkRel: best.link_rel,
      colorPrimary: best.color_primary,
      colorSecondary: best.color_secondary,
      cssClass: best.css_class,
      scope: best.scope as any,
      featureValue: best.feature_value,
      definitionSlug: def?.slug ?? null,
    };
  }

  // ─── Bulk resolve for product listing ─────────────────────────────────────

  /**
   * Lädt nur die kompakten Visuals für Produktkarten (miniature).
   * Gibt maximal N Visuals zurück, damit die Karte nicht überladen wird.
   */
  async resolveMiniatureVisuals(
    featureStrings: string[],
    options: {
      productId?: string;
      categoryId?: string;
      locale: string;
      maxIcons?: number;
    },
  ): Promise<ResolvedFeatureVisual[]> {
    const features = await this.resolveProductFeatures(featureStrings, options);
    const withVisuals = features.filter((f) => f.visual !== null);
    const max = options.maxIcons ?? 4;
    return withVisuals.slice(0, max).map((f) => f.visual!);
  }
}
