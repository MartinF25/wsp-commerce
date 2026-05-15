/**
 * Tests für bundleDiscount.ts
 *
 * Ausführung: npx ts-node src/utils/__tests__/bundleDiscount.test.ts
 */

import assert from "node:assert/strict";
import {
  calculateItemPrice,
  isBundleDiscountActive,
  isBundleValid,
  calculateBundlePriceInfo,
} from "../bundleDiscount";
import type { BundleWithItems } from "../../types";

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${(e as Error).message}`);
    failed++;
  }
}

function makeBundle(overrides: Partial<BundleWithItems> = {}): BundleWithItems {
  return {
    id: "bundle-1",
    status: "active",
    sort_order: 0,
    image_url: null,
    valid_from: null,
    valid_until: null,
    store_id: null,
    discount_type: "none",
    discount_percent: null,
    discount_cents: null,
    discount_mode: "all_items",
    min_items_for_discount: 1,
    valid_from_discount: null,
    valid_until_discount: null,
    display_mode: "card",
    tab_group: null,
    created_at: new Date(),
    updated_at: new Date(),
    translations: [],
    items: [],
    ...overrides,
  } as unknown as BundleWithItems;
}

function makeItem(productId: string, priceCents: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `item-${productId}`,
    bundle_id: "bundle-1",
    product_id: productId,
    quantity: 1,
    is_required: true,
    sort_order: 0,
    discount_percent: null,
    discount_cents: null,
    product: {
      id: productId,
      status: "active",
      variants: [
        {
          id: `variant-${productId}`,
          is_active: true,
          price_cents: priceCents,
          currency: "EUR",
          stock_quantity: 10,
          translations: [],
          attributes: {},
        },
      ],
      translations: [],
      images: [],
      documents: [],
    },
    ...overrides,
  };
}

// ─── calculateItemPrice ───────────────────────────────────────────────────────

console.log("\ncalculateItemPrice:");

test("gibt null zurück wenn Basispreis null", () => {
  assert.equal(calculateItemPrice(null, 10, null), null);
});

test("gibt Basispreis zurück ohne Rabatt", () => {
  assert.equal(calculateItemPrice(10000, null, null), 10000);
});

test("berechnet prozentualen Rabatt korrekt (10%)", () => {
  assert.equal(calculateItemPrice(10000, 10, null), 9000);
});

test("berechnet prozentualen Rabatt korrekt (15%)", () => {
  assert.equal(calculateItemPrice(20000, 15, null), 17000);
});

test("berechnet festen Rabatt in Cent (500 = 5€)", () => {
  assert.equal(calculateItemPrice(10000, null, 500), 9500);
});

test("prozentualer Rabatt hat Vorrang vor Centbetrag", () => {
  // 10% auf 10000 = 9000 (nicht 9500 trotz discountCents=500)
  assert.equal(calculateItemPrice(10000, 10, 500), 9000);
});

test("Rabatt kann nicht unter 0 fallen", () => {
  assert.equal(calculateItemPrice(100, null, 500), 0);
});

test("0%-Rabatt gibt Originalpreis zurück", () => {
  assert.equal(calculateItemPrice(10000, 0, null), 10000);
});

// ─── isBundleDiscountActive ───────────────────────────────────────────────────

console.log("\nisBundleDiscountActive:");

test("discount_type=none → immer false", () => {
  const bundle = makeBundle({ discount_type: "none" });
  assert.equal(isBundleDiscountActive(bundle), false);
});

test("discount_type=percentage ohne Zeitlimit → true", () => {
  const bundle = makeBundle({ discount_type: "percentage" });
  assert.equal(isBundleDiscountActive(bundle), true);
});

test("valid_from_discount in der Zukunft → false", () => {
  const future = new Date(Date.now() + 86400000); // +1 Tag
  const bundle = makeBundle({ discount_type: "percentage", valid_from_discount: future });
  assert.equal(isBundleDiscountActive(bundle), false);
});

test("valid_until_discount in der Vergangenheit → false", () => {
  const past = new Date(Date.now() - 86400000); // -1 Tag
  const bundle = makeBundle({ discount_type: "percentage", valid_until_discount: past });
  assert.equal(isBundleDiscountActive(bundle), false);
});

test("valid_until_discount in der Zukunft → true", () => {
  const future = new Date(Date.now() + 86400000);
  const bundle = makeBundle({ discount_type: "percentage", valid_until_discount: future });
  assert.equal(isBundleDiscountActive(bundle), true);
});

// ─── isBundleValid ────────────────────────────────────────────────────────────

console.log("\nisBundleValid:");

test("aktives Bundle ohne Zeitlimit → true", () => {
  const bundle = makeBundle({ status: "active" });
  assert.equal(isBundleValid(bundle), true);
});

test("inaktives Bundle → false", () => {
  const bundle = makeBundle({ status: "inactive" });
  assert.equal(isBundleValid(bundle), false);
});

test("aktives Bundle mit vergangener valid_until → false", () => {
  const past = new Date(Date.now() - 86400000);
  const bundle = makeBundle({ status: "active", valid_until: past });
  assert.equal(isBundleValid(bundle), false);
});

test("aktives Bundle mit zukünftiger valid_from → false", () => {
  const future = new Date(Date.now() + 86400000);
  const bundle = makeBundle({ status: "active", valid_from: future });
  assert.equal(isBundleValid(bundle), false);
});

// ─── calculateBundlePriceInfo ─────────────────────────────────────────────────

console.log("\ncalculateBundlePriceInfo:");

test("gibt null zurück wenn keine kaufbaren Produkte", () => {
  const bundle = makeBundle({
    status: "active",
    items: [makeItem("p1", null as unknown as number)] as unknown as BundleWithItems["items"],
  });
  assert.equal(calculateBundlePriceInfo(bundle), null);
});

test("berechnet Originalpreis ohne Rabatt korrekt", () => {
  const bundle = makeBundle({
    status: "active",
    discount_type: "none",
    items: [
      makeItem("p1", 10000),
      makeItem("p2", 20000),
    ] as unknown as BundleWithItems["items"],
  });
  const info = calculateBundlePriceInfo(bundle);
  assert.ok(info);
  assert.equal(info.originalTotalCents, 30000);
  assert.equal(info.discountedTotalCents, 30000);
  assert.equal(info.savingsCents, 0);
  assert.equal(info.hasDiscount, false);
});

test("berechnet prozentualen Bundle-Rabatt (10%)", () => {
  const bundle = makeBundle({
    status: "active",
    discount_type: "percentage",
    discount_percent: 10 as unknown as null,
    discount_mode: "all_items",
    items: [
      makeItem("p1", 10000),
      makeItem("p2", 20000),
    ] as unknown as BundleWithItems["items"],
  });
  const info = calculateBundlePriceInfo(bundle);
  assert.ok(info);
  assert.equal(info.originalTotalCents, 30000);
  assert.equal(info.discountedTotalCents, 27000); // 30000 - 10%
  assert.equal(info.savingsCents, 3000);
  assert.equal(info.hasDiscount, true);
  assert.ok(info.savingsPercent > 9.9 && info.savingsPercent < 10.1);
});

test("berechnet festen Bundle-Rabatt (5€ = 500 Cent)", () => {
  const bundle = makeBundle({
    status: "active",
    discount_type: "fixed",
    discount_cents: 500,
    discount_mode: "all_items",
    items: [
      makeItem("p1", 10000),
      makeItem("p2", 20000),
    ] as unknown as BundleWithItems["items"],
  });
  const info = calculateBundlePriceInfo(bundle);
  assert.ok(info);
  assert.equal(info.originalTotalCents, 30000);
  assert.equal(info.discountedTotalCents, 29500);
  assert.equal(info.savingsCents, 500);
});

test("per_item-Rabatt: individuelle Produkt-Rabatte werden addiert", () => {
  const bundle = makeBundle({
    status: "active",
    discount_type: "per_item",
    discount_mode: "all_items",
    items: [
      makeItem("p1", 10000, { discount_percent: 10 }),
      makeItem("p2", 20000, { discount_percent: 5 }),
    ] as unknown as BundleWithItems["items"],
  });
  const info = calculateBundlePriceInfo(bundle);
  assert.ok(info);
  assert.equal(info.originalTotalCents, 30000);
  // p1: 10000 - 10% = 9000, p2: 20000 - 5% = 19000 → 28000
  assert.equal(info.discountedTotalCents, 28000);
  assert.equal(info.savingsCents, 2000);
});

test("kein Rabatt wenn discount_type=none obwohl discount_percent gesetzt", () => {
  const bundle = makeBundle({
    status: "active",
    discount_type: "none",
    discount_percent: 10 as unknown as null,
    items: [makeItem("p1", 10000)] as unknown as BundleWithItems["items"],
  });
  const info = calculateBundlePriceInfo(bundle);
  assert.ok(info);
  assert.equal(info.savingsCents, 0);
  assert.equal(info.hasDiscount, false);
});

test("min_count-Modus: kein Rabatt wenn selectedCount < min", () => {
  const bundle = makeBundle({
    status: "active",
    discount_type: "percentage",
    discount_percent: 10 as unknown as null,
    discount_mode: "min_count",
    min_items_for_discount: 3,
    items: [
      makeItem("p1", 10000),
      makeItem("p2", 20000),
    ] as unknown as BundleWithItems["items"],
  });
  // Nur 1 Produkt ausgewählt, Minimum ist 3
  const info = calculateBundlePriceInfo(bundle, 1);
  assert.ok(info);
  assert.equal(info.savingsCents, 0);
});

test("min_count-Modus: Rabatt wenn selectedCount >= min", () => {
  const bundle = makeBundle({
    status: "active",
    discount_type: "percentage",
    discount_percent: 10 as unknown as null,
    discount_mode: "min_count",
    min_items_for_discount: 2,
    items: [
      makeItem("p1", 10000),
      makeItem("p2", 20000),
    ] as unknown as BundleWithItems["items"],
  });
  const info = calculateBundlePriceInfo(bundle, 2);
  assert.ok(info);
  assert.equal(info.savingsCents, 3000); // 10% von 30000
});

test("abgelaufener Rabatt → savingsCents = 0", () => {
  const past = new Date(Date.now() - 86400000);
  const bundle = makeBundle({
    status: "active",
    discount_type: "percentage",
    discount_percent: 20 as unknown as null,
    valid_until_discount: past,
    items: [makeItem("p1", 10000)] as unknown as BundleWithItems["items"],
  });
  const info = calculateBundlePriceInfo(bundle);
  assert.ok(info);
  assert.equal(info.savingsCents, 0);
});

test("Menge wird korrekt multipliziert", () => {
  const bundle = makeBundle({
    status: "active",
    discount_type: "percentage",
    discount_percent: 10 as unknown as null,
    items: [
      makeItem("p1", 10000, { quantity: 3 }),
    ] as unknown as BundleWithItems["items"],
  });
  const info = calculateBundlePriceInfo(bundle);
  assert.ok(info);
  assert.equal(info.originalTotalCents, 30000); // 10000 × 3
  assert.equal(info.discountedTotalCents, 27000); // 30000 - 10%
});

// ─── Ergebnis ─────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(40)}`);
if (failed === 0) {
  console.log(`✓ Alle ${passed} Tests bestanden.\n`);
  process.exit(0);
} else {
  console.error(`✗ ${failed} von ${passed + failed} Tests fehlgeschlagen.\n`);
  process.exit(1);
}
