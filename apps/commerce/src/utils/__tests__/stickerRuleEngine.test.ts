/**
 * Unit Tests – StickerRuleEngine
 *
 * Testet die Regelauswertung in Isolation ohne Datenbankzugriff.
 * Alle Prisma-Typen werden als Plain-Objects gemockt.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { StickerRuleEngine, toProductRuleContext } from "../../services/stickerRuleEngine";
import type { StickerWithRelations, ProductRuleContext } from "../../types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = new Date("2026-05-15T12:00:00Z");

function makeSticker(overrides: Partial<StickerWithRelations> = {}): StickerWithRelations {
  return {
    id: "sticker-1",
    name: "Test Sticker",
    status: "active",
    priority: 0,
    sort_order: 0,
    type: "text",
    image_url: null,
    text_color: "#fff",
    bg_color: "#22c55e",
    border_color: null,
    font_size: "12px",
    font_bold: false,
    font_italic: false,
    border_radius: "4px",
    padding: "4px 8px",
    opacity: null,
    css_class: null,
    custom_css: null,
    link_url: null,
    position: "top_left",
    position_x: null,
    position_y: null,
    size_config: {},
    valid_from: null,
    valid_until: null,
    store_id: null,
    customer_groups: null,
    max_per_product: 3,
    allow_override: true,
    created_at: NOW,
    updated_at: NOW,
    translations: [{ id: "t1", sticker_id: "sticker-1", locale: "de", text: "NEU", tooltip: null, tooltip_link_label: null, tooltip_link_url: null, link_url: null }],
    rules: [],
    product_overrides: [],
    ...overrides,
  } as unknown as StickerWithRelations;
}

function makeProduct(overrides: Partial<ProductRuleContext> = {}): ProductRuleContext {
  return {
    id: "product-1",
    category_id: "cat-solar",
    availability_status: "in_stock",
    created_at: new Date("2026-04-01T00:00:00Z"),
    min_price_cents: 129900,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("StickerRuleEngine", () => {

  describe("Sticker-Gültigkeit", () => {
    it("ignoriert inaktive Sticker", () => {
      const engine = new StickerRuleEngine([
        makeSticker({ status: "inactive", rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "all_products", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null }] }),
      ], NOW);
      expect(engine.resolve(makeProduct())).toHaveLength(0);
    });

    it("ignoriert Sticker, dessen valid_from in der Zukunft liegt", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          valid_from: new Date("2026-06-01T00:00:00Z"),
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "all_products", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null }],
        }),
      ], NOW);
      expect(engine.resolve(makeProduct())).toHaveLength(0);
    });

    it("ignoriert abgelaufene Sticker (valid_until in Vergangenheit)", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          valid_until: new Date("2026-01-01T00:00:00Z"),
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "all_products", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null }],
        }),
      ], NOW);
      expect(engine.resolve(makeProduct())).toHaveLength(0);
    });

    it("zeigt Sticker innerhalb des Gültigkeitszeitraums", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          valid_from: new Date("2026-05-01T00:00:00Z"),
          valid_until: new Date("2026-06-01T00:00:00Z"),
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "all_products", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null }],
        }),
      ], NOW);
      expect(engine.resolve(makeProduct())).toHaveLength(1);
    });
  });

  describe("Regel: all_products", () => {
    it("zeigt Sticker für jedes Produkt", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "all_products", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null }],
        }),
      ], NOW);

      expect(engine.resolve(makeProduct({ id: "p1" }))).toHaveLength(1);
      expect(engine.resolve(makeProduct({ id: "p2", category_id: null }))).toHaveLength(1);
    });

    it("zeigt keinen Sticker wenn keine Regeln definiert", () => {
      const engine = new StickerRuleEngine([makeSticker({ rules: [] })], NOW);
      expect(engine.resolve(makeProduct())).toHaveLength(0);
    });
  });

  describe("Regel: category", () => {
    it("zeigt Sticker nur für Produkte der passenden Kategorie", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "category", category_id: "cat-solar", price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null }],
        }),
      ], NOW);

      expect(engine.resolve(makeProduct({ category_id: "cat-solar" }))).toHaveLength(1);
      expect(engine.resolve(makeProduct({ category_id: "cat-wind" }))).toHaveLength(0);
      expect(engine.resolve(makeProduct({ category_id: null }))).toHaveLength(0);
    });
  });

  describe("Regel: price_range", () => {
    it("zeigt Sticker für Produkte im Preisbereich (min + max)", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "price_range", category_id: null, price_min_cents: 100000, price_max_cents: 200000, availability_status: null, new_arrival_days: null }],
        }),
      ], NOW);

      expect(engine.resolve(makeProduct({ min_price_cents: 150000 }))).toHaveLength(1);
      expect(engine.resolve(makeProduct({ min_price_cents: 99999 }))).toHaveLength(0);
      expect(engine.resolve(makeProduct({ min_price_cents: 200001 }))).toHaveLength(0);
    });

    it("behandelt null-Preise korrekt (kein Treffer)", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "price_range", category_id: null, price_min_cents: 0, price_max_cents: 500000, availability_status: null, new_arrival_days: null }],
        }),
      ], NOW);
      expect(engine.resolve(makeProduct({ min_price_cents: null }))).toHaveLength(0);
    });

    it("erlaubt nur min-Grenze (kein max)", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "price_range", category_id: null, price_min_cents: 100000, price_max_cents: null, availability_status: null, new_arrival_days: null }],
        }),
      ], NOW);
      expect(engine.resolve(makeProduct({ min_price_cents: 100000 }))).toHaveLength(1);
      expect(engine.resolve(makeProduct({ min_price_cents: 500000 }))).toHaveLength(1);
      expect(engine.resolve(makeProduct({ min_price_cents: 99999 }))).toHaveLength(0);
    });
  });

  describe("Regel: availability", () => {
    it("zeigt Sticker nur bei passendem Verfügbarkeitsstatus", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "availability", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: "out_of_stock", new_arrival_days: null }],
        }),
      ], NOW);

      expect(engine.resolve(makeProduct({ availability_status: "out_of_stock" }))).toHaveLength(1);
      expect(engine.resolve(makeProduct({ availability_status: "in_stock" }))).toHaveLength(0);
    });
  });

  describe("Regel: new_arrival", () => {
    it("zeigt Sticker für Produkte der letzten N Tage", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "new_arrival", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: 30 }],
        }),
      ], NOW);

      // 10 Tage alt → NEU
      expect(engine.resolve(makeProduct({ created_at: new Date("2026-05-05T00:00:00Z") }))).toHaveLength(1);
      // 45 Tage alt → nicht NEU
      expect(engine.resolve(makeProduct({ created_at: new Date("2026-03-31T00:00:00Z") }))).toHaveLength(0);
    });
  });

  describe("OR-Logik bei mehreren Regeln", () => {
    it("zeigt Sticker wenn mindestens eine Regel zutrifft", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          rules: [
            { id: "r1", sticker_id: "sticker-1", rule_type: "category", category_id: "cat-solar", price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null },
            { id: "r2", sticker_id: "sticker-1", rule_type: "availability", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: "out_of_stock", new_arrival_days: null },
          ],
        }),
      ], NOW);

      // Kategorie trifft zu
      expect(engine.resolve(makeProduct({ category_id: "cat-solar", availability_status: "in_stock" }))).toHaveLength(1);
      // Verfügbarkeit trifft zu
      expect(engine.resolve(makeProduct({ category_id: "cat-other", availability_status: "out_of_stock" }))).toHaveLength(1);
      // Nichts trifft zu
      expect(engine.resolve(makeProduct({ category_id: "cat-other", availability_status: "in_stock" }))).toHaveLength(0);
    });
  });

  describe("Produkt-Overrides", () => {
    it("manuelle Aktivierung zeigt Sticker auch ohne passende Regel", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "category", category_id: "cat-solar", price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null }],
          product_overrides: [
            { id: "o1", sticker_id: "sticker-1", product_id: "product-override", enabled: true, excluded: false },
          ],
        }),
      ], NOW);

      // Produkt hat andere Kategorie, aber manueller Override → anzeigen
      expect(engine.resolve(makeProduct({ id: "product-override", category_id: "cat-other" }))).toHaveLength(1);
    });

    it("enabled=false deaktiviert Sticker für ein Produkt", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "all_products", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null }],
          product_overrides: [
            { id: "o1", sticker_id: "sticker-1", product_id: "product-disabled", enabled: false, excluded: false },
          ],
        }),
      ], NOW);

      expect(engine.resolve(makeProduct({ id: "product-disabled" }))).toHaveLength(0);
      // Anderes Produkt nicht betroffen
      expect(engine.resolve(makeProduct({ id: "product-other" }))).toHaveLength(1);
    });

    it("excluded=true schließt Produkt aus (Sticker ignoriert)", () => {
      const engine = new StickerRuleEngine([
        makeSticker({
          rules: [{ id: "r1", sticker_id: "sticker-1", rule_type: "all_products", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null }],
          product_overrides: [
            { id: "o1", sticker_id: "sticker-1", product_id: "product-excluded", enabled: true, excluded: true },
          ],
        }),
      ], NOW);

      expect(engine.resolve(makeProduct({ id: "product-excluded" }))).toHaveLength(0);
    });
  });

  describe("Priorität & max_per_product", () => {
    it("sortiert Sticker absteigend nach Priorität", () => {
      const sticker1 = makeSticker({ id: "s1", name: "Prio 5", priority: 5, max_per_product: 10, rules: [{ id: "r1", sticker_id: "s1", rule_type: "all_products", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null }], product_overrides: [] });
      const sticker2 = makeSticker({ id: "s2", name: "Prio 1", priority: 1, max_per_product: 10, rules: [{ id: "r2", sticker_id: "s2", rule_type: "all_products", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null }], product_overrides: [] });
      const engine = new StickerRuleEngine([sticker2, sticker1], NOW);
      const result = engine.resolve(makeProduct());
      expect(result[0].id).toBe("s1");
      expect(result[1].id).toBe("s2");
    });

    it("begrenzt die Anzahl auf das niedrigste max_per_product", () => {
      const stickers = Array.from({ length: 5 }, (_, i) =>
        makeSticker({ id: `s${i}`, name: `Sticker ${i}`, max_per_product: 2, rules: [{ id: `r${i}`, sticker_id: `s${i}`, rule_type: "all_products", category_id: null, price_min_cents: null, price_max_cents: null, availability_status: null, new_arrival_days: null }], product_overrides: [] })
      );
      const engine = new StickerRuleEngine(stickers, NOW);
      expect(engine.resolve(makeProduct())).toHaveLength(2);
    });
  });
});

describe("toProductRuleContext", () => {
  it("berechnet min_price_cents korrekt aus aktiven Varianten", () => {
    const ctx = toProductRuleContext({
      id: "p1",
      category_id: "cat-1",
      availability_status: "in_stock",
      created_at: NOW,
      variants: [
        { is_active: true, price_cents: 99900 },
        { is_active: true, price_cents: 149900 },
        { is_active: false, price_cents: 50000 }, // inaktiv → ignorieren
      ],
    });
    expect(ctx.min_price_cents).toBe(99900);
  });

  it("setzt min_price_cents auf null wenn keine Varianten einen Preis haben", () => {
    const ctx = toProductRuleContext({
      id: "p1",
      category_id: null,
      availability_status: "on_request",
      created_at: NOW,
      variants: [
        { is_active: true, price_cents: null },
      ],
    });
    expect(ctx.min_price_cents).toBeNull();
  });
});
