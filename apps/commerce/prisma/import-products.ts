import { Locale, Prisma, PrismaClient, ProductStatus, ProductType } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

const VALID_PRODUCT_TYPES = new Set<string>([
  ProductType.direct_purchase,
  ProductType.configurable,
  ProductType.inquiry_only,
]);

const VALID_STATUSES = new Set<string>([
  ProductStatus.draft,
  ProductStatus.active,
  ProductStatus.archived,
]);

const OPTIONAL_LOCALES = [Locale.en, Locale.es] as const;

// ─── Import Types ─────────────────────────────────────────────────────────────

type ImportProductTranslation = {
  title: string;
  short_description?: string | null;
  description?: string | null;
  delivery_note?: string | null;
  features?: string[];
  meta_title?: string | null;
  meta_description?: string | null;
  mounting_note?: string | null;
  project_note?: string | null;
};

type ImportVariantTranslation = {
  name: string;
};

type ImportVariant = {
  sku: string;
  is_active?: boolean;
  price_cents?: number | null;
  price?: number | string | null;
  currency?: string;
  stock_quantity?: number;
  attributes?: Record<string, unknown>;
  weight_kg?: number | null;
  dimensions?: Record<string, unknown> | null;
  translations: {
    de: ImportVariantTranslation;
    en?: ImportVariantTranslation;
    es?: ImportVariantTranslation;
  };
};

type ImportImage = {
  url: string;
  alt?: string | null;
  sort_order?: number;
};

type ImportProduct = {
  slug: string;
  category_slug?: string | null;
  product_type: ProductType;
  status?: ProductStatus;
  translations: {
    de: ImportProductTranslation;
    en?: ImportProductTranslation;
    es?: ImportProductTranslation;
  };
  variants: ImportVariant[];
  images?: ImportImage[];
};

type ImportCategory = {
  slug: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  parent_slug?: string | null;
};

type CatalogImport = {
  categories?: ImportCategory[];
  products: ImportProduct[];
};

// ─── Validated Types ──────────────────────────────────────────────────────────

type ValidatedProductTranslation = {
  locale: Locale;
  title: string;
  short_description: string | null;
  description: string | null;
  delivery_note: string | null;
  features: string[];
  meta_title: string | null;
  meta_description: string | null;
  mounting_note: string | null;
  project_note: string | null;
};

type ValidatedVariantTranslation = {
  locale: Locale;
  name: string;
};

type ValidatedVariant = {
  sku: string;
  is_active: boolean;
  price_cents: number | null;
  currency: string;
  stock_quantity: number;
  attributes: Record<string, unknown>;
  weight_kg: number | null;
  dimensions: Record<string, unknown> | null;
  translations: ValidatedVariantTranslation[];
};

type ValidatedProduct = {
  slug: string;
  category_slug: string | null;
  product_type: ProductType;
  status: ProductStatus;
  translations: ValidatedProductTranslation[];
  variants: ValidatedVariant[];
  images: Array<{ url: string; alt: string | null; sort_order: number }>;
};

type ValidatedImport = {
  categories: ImportCategory[];
  products: ValidatedProduct[];
};

type ImportStats = {
  categoriesUpserted: number;
  productsUpserted: number;
  translationsUpserted: number;
  variantsUpserted: number;
  variantTranslationsUpserted: number;
  imagesReplaced: number;
};

// ─── Entry Point ──────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fileArg = args.find((arg) => !arg.startsWith("--"));

  if (!fileArg) {
    fail(["Pfad zur Importdatei fehlt. Beispiel: npm run import:products -- prisma/catalog-import.example.json"]);
  }

  const filePath = resolve(process.cwd(), fileArg);
  const parsed = readJson(filePath);
  const result = validateImport(parsed);

  if (result.errors.length > 0) {
    fail(result.errors);
  }

  if (dryRun) {
    printValidationOk(result.data, filePath);
    return prisma.$disconnect();
  }

  importCatalog(result.data)
    .then((stats) => {
      console.log("Import abgeschlossen.");
      console.log(`Kategorien upserted:             ${stats.categoriesUpserted}`);
      console.log(`Produkte upserted:               ${stats.productsUpserted}`);
      console.log(`Produkt-Übersetzungen upserted:  ${stats.translationsUpserted}`);
      console.log(`Varianten upserted:              ${stats.variantsUpserted}`);
      console.log(`Varianten-Übersetzungen upserted:${stats.variantTranslationsUpserted}`);
      console.log(`Bilder ersetzt:                  ${stats.imagesReplaced}`);
    })
    .catch((error) => {
      console.error("Import fehlgeschlagen:");
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

// ─── JSON Reader ──────────────────────────────────────────────────────────────

function readJson(filePath: string): unknown {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail([`Importdatei konnte nicht gelesen oder geparst werden: ${filePath} (${message})`]);
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateImport(input: unknown): { data: ValidatedImport; errors: string[] } {
  const errors: string[] = [];

  if (!isPlainObject(input)) {
    return emptyResult(["Root muss ein JSON-Objekt sein."]);
  }

  const data = input as Partial<CatalogImport>;
  const categoriesRaw = data.categories ?? [];
  const productsRaw = data.products;

  if (!Array.isArray(categoriesRaw)) errors.push("categories muss ein Array sein, wenn vorhanden.");
  if (!Array.isArray(productsRaw)) errors.push("products muss ein Array sein.");

  if (errors.length > 0) return emptyResult(errors);

  const categories = categoriesRaw as ImportCategory[];
  const products = productsRaw as ImportProduct[];

  validateUnique(categories.map((c) => c.slug), "Kategorie slug", errors);
  validateUnique(products.map((p) => p.slug), "Produkt slug", errors);

  const categorySlugs = new Set(categories.map((c) => c.slug));
  const seenSkus: string[] = [];
  const validatedProducts: ValidatedProduct[] = [];

  categories.forEach((cat, i) => validateCategory(cat, i, categorySlugs, errors));

  products.forEach((product, i) => {
    const validated = validateProduct(product, i, categorySlugs, errors);
    if (validated) {
      validatedProducts.push(validated);
      seenSkus.push(...validated.variants.map((v) => v.sku));
    }
  });

  validateUnique(seenSkus, "Varianten-SKU", errors);

  return { data: { categories, products: validatedProducts }, errors };
}

function validateCategory(
  category: ImportCategory,
  index: number,
  categorySlugs: Set<string>,
  errors: string[]
) {
  const path = `categories[${index}]`;
  if (!isPlainObject(category)) {
    errors.push(`${path}: muss ein Objekt sein.`);
    return;
  }
  requireNonEmptyString(category.slug, `${path}.slug`, errors);
  requireNonEmptyString(category.name, `${path}.name`, errors);
  validateOptionalString(category.description, `${path}.description`, errors);
  validateOptionalBoolean(category.is_active, `${path}.is_active`, errors);

  if (category.parent_slug !== undefined && category.parent_slug !== null) {
    requireNonEmptyString(category.parent_slug, `${path}.parent_slug`, errors);
    if (typeof category.parent_slug === "string" && !categorySlugs.has(category.parent_slug)) {
      errors.push(`${path}.parent_slug: Kategorie "${category.parent_slug}" ist nicht in categories enthalten.`);
    }
    if (category.parent_slug === category.slug) {
      errors.push(`${path}.parent_slug: Kategorie darf nicht ihr eigener Parent sein.`);
    }
  }
}

function validateProduct(
  product: unknown,
  index: number,
  categorySlugs: Set<string>,
  errors: string[]
): ValidatedProduct | null {
  const path = `products[${index}]`;
  if (!isPlainObject(product)) {
    errors.push(`${path}: muss ein Objekt sein.`);
    return null;
  }

  const p = product as ImportProduct;

  requireNonEmptyString(p.slug, `${path}.slug`, errors);

  if (!VALID_PRODUCT_TYPES.has(p.product_type)) {
    errors.push(`${path}.product_type: erlaubt sind direct_purchase, configurable, inquiry_only.`);
  }

  const status = p.status ?? ProductStatus.draft;
  if (!VALID_STATUSES.has(status)) {
    errors.push(`${path}.status: erlaubt sind draft, active, archived.`);
  }

  if (p.category_slug !== undefined && p.category_slug !== null) {
    requireNonEmptyString(p.category_slug, `${path}.category_slug`, errors);
  }

  if (!isPlainObject(p.translations)) {
    errors.push(`${path}.translations: muss ein Objekt mit mindestens "de" sein.`);
    return null;
  }

  const translations: ValidatedProductTranslation[] = [];

  // DE ist Pflicht
  const deTranslation = validateProductTranslation(
    (p.translations as Record<string, unknown>).de,
    `${path}.translations.de`,
    true,
    errors
  );
  if (deTranslation) {
    translations.push({ locale: Locale.de, ...deTranslation });
  }

  // EN und ES sind optional – fehlende oder leere Blöcke werden übersprungen
  for (const locale of OPTIONAL_LOCALES) {
    const raw = (p.translations as Record<string, unknown>)[locale];
    if (raw !== undefined && raw !== null) {
      const t = validateProductTranslation(raw, `${path}.translations.${locale}`, false, errors);
      if (t) {
        translations.push({ locale, ...t });
      }
    }
  }

  if (!Array.isArray(p.variants) || p.variants.length === 0) {
    errors.push(`${path}.variants: mindestens eine Variante ist erforderlich.`);
    return null;
  }

  const variants = p.variants
    .map((variant, i) => validateVariant(variant, `${path}.variants[${i}]`, errors))
    .filter((v): v is ValidatedVariant => v !== null);

  const imagesRaw = p.images ?? [];
  if (!Array.isArray(imagesRaw)) {
    errors.push(`${path}.images: muss ein Array sein, wenn vorhanden.`);
  }
  const images = Array.isArray(imagesRaw)
    ? imagesRaw
        .map((img, i) => validateImage(img, `${path}.images[${i}]`, errors))
        .filter((img): img is NonNullable<typeof img> => img !== null)
    : [];

  return {
    slug: typeof p.slug === "string" ? p.slug.trim() : "",
    category_slug: normalizeNullableString(p.category_slug),
    product_type: p.product_type,
    status,
    translations,
    variants,
    images,
  };
}

type ProductTranslationCore = Omit<ValidatedProductTranslation, "locale">;

function validateProductTranslation(
  input: unknown,
  path: string,
  required: boolean,
  errors: string[]
): ProductTranslationCore | null {
  if (!isPlainObject(input)) {
    if (required) errors.push(`${path}: muss ein Objekt sein.`);
    return null;
  }

  const t = input as ImportProductTranslation;
  const title = normalizeNullableString(t.title);

  if (!title) {
    if (required) errors.push(`${path}.title: muss ein nicht-leerer String sein.`);
    // Optionale Sprache ohne title wird lautlos übersprungen
    return null;
  }

  validateOptionalString(t.short_description, `${path}.short_description`, errors);
  validateOptionalString(t.description, `${path}.description`, errors);
  validateOptionalString(t.delivery_note, `${path}.delivery_note`, errors);
  validateOptionalString(t.meta_title, `${path}.meta_title`, errors);
  validateOptionalString(t.meta_description, `${path}.meta_description`, errors);
  validateOptionalString(t.mounting_note, `${path}.mounting_note`, errors);
  validateOptionalString(t.project_note, `${path}.project_note`, errors);

  if (t.features !== undefined) {
    if (!Array.isArray(t.features) || t.features.some((f) => typeof f !== "string" || f.trim() === "")) {
      errors.push(`${path}.features: muss ein Array aus nicht-leeren Strings sein.`);
    }
  }

  return {
    title,
    short_description: normalizeNullableString(t.short_description),
    description: normalizeNullableString(t.description),
    delivery_note: normalizeNullableString(t.delivery_note),
    features: Array.isArray(t.features) ? t.features.map((f) => f.trim()).filter(Boolean) : [],
    meta_title: normalizeNullableString(t.meta_title),
    meta_description: normalizeNullableString(t.meta_description),
    mounting_note: normalizeNullableString(t.mounting_note),
    project_note: normalizeNullableString(t.project_note),
  };
}

function validateVariant(
  variant: unknown,
  path: string,
  errors: string[]
): ValidatedVariant | null {
  if (!isPlainObject(variant)) {
    errors.push(`${path}: muss ein Objekt sein.`);
    return null;
  }

  const v = variant as ImportVariant;

  requireNonEmptyString(v.sku, `${path}.sku`, errors);
  validateOptionalBoolean(v.is_active, `${path}.is_active`, errors);
  validateOptionalNumber(v.weight_kg, `${path}.weight_kg`, errors);

  const currency = v.currency ?? "EUR";
  if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
    errors.push(`${path}.currency: muss ein ISO-4217-Code mit drei Großbuchstaben sein, z. B. EUR.`);
  }

  const stockQuantity = v.stock_quantity ?? 0;
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    errors.push(`${path}.stock_quantity: muss eine ganze Zahl >= 0 sein.`);
  }

  const price_cents = parsePriceCents(v, path, errors);
  validateOptionalRecord(v.attributes, `${path}.attributes`, errors);
  validateOptionalRecord(v.dimensions, `${path}.dimensions`, errors);

  if (!isPlainObject(v.translations)) {
    errors.push(`${path}.translations: muss ein Objekt mit mindestens "de" sein.`);
    return null;
  }

  const translations: ValidatedVariantTranslation[] = [];

  // DE-Name ist Pflicht
  const deTrans = v.translations as Record<string, unknown>;
  const deName = normalizeNullableString(
    isPlainObject(deTrans.de) ? (deTrans.de as ImportVariantTranslation).name : undefined
  );
  if (!deName) {
    errors.push(`${path}.translations.de.name: muss ein nicht-leerer String sein.`);
  } else {
    translations.push({ locale: Locale.de, name: deName });
  }

  // EN und ES optional
  for (const locale of OPTIONAL_LOCALES) {
    const raw = deTrans[locale];
    if (isPlainObject(raw)) {
      const name = normalizeNullableString((raw as ImportVariantTranslation).name);
      if (name) {
        translations.push({ locale, name });
      }
    }
  }

  return {
    sku: typeof v.sku === "string" ? v.sku.trim() : "",
    is_active: v.is_active ?? true,
    price_cents,
    currency,
    stock_quantity: stockQuantity,
    attributes: isPlainObject(v.attributes) ? v.attributes : {},
    weight_kg: typeof v.weight_kg === "number" ? v.weight_kg : null,
    dimensions: isPlainObject(v.dimensions) ? v.dimensions : null,
    translations,
  };
}

function validateImage(
  image: unknown,
  path: string,
  errors: string[]
): { url: string; alt: string | null; sort_order: number } | null {
  if (!isPlainObject(image)) {
    errors.push(`${path}: muss ein Objekt sein.`);
    return null;
  }

  const img = image as ImportImage;
  requireNonEmptyString(img.url, `${path}.url`, errors);
  validateOptionalString(img.alt, `${path}.alt`, errors);

  if (img.sort_order !== undefined && (!Number.isInteger(img.sort_order) || img.sort_order < 0)) {
    errors.push(`${path}.sort_order: muss eine ganze Zahl >= 0 sein.`);
  }

  return {
    url: typeof img.url === "string" ? img.url.trim() : "",
    alt: normalizeNullableString(img.alt),
    sort_order: img.sort_order ?? 0,
  };
}

function parsePriceCents(variant: ImportVariant, path: string, errors: string[]): number | null {
  const hasPriceCents = variant.price_cents !== undefined;
  const hasPrice = variant.price !== undefined;

  if (hasPriceCents && hasPrice) {
    errors.push(`${path}: entweder price_cents oder price angeben, nicht beides.`);
    return null;
  }

  if (!hasPriceCents && !hasPrice) return null;

  if (hasPriceCents) {
    const pc = variant.price_cents;
    if (pc === null || pc === undefined) return null;
    if (!Number.isInteger(pc) || pc < 0) {
      errors.push(`${path}.price_cents: muss eine ganze Zahl >= 0 oder null sein.`);
      return null;
    }
    return pc;
  }

  if (variant.price === null) return null;

  const value =
    typeof variant.price === "string"
      ? Number(variant.price.replace(",", "."))
      : variant.price;

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    errors.push(`${path}.price: muss eine positive Zahl in Euro sein, z. B. 1299.00.`);
    return null;
  }

  return Math.round(value * 100);
}

// ─── Import ───────────────────────────────────────────────────────────────────

async function importCatalog(data: ValidatedImport): Promise<ImportStats> {
  const stats: ImportStats = {
    categoriesUpserted: 0,
    productsUpserted: 0,
    translationsUpserted: 0,
    variantsUpserted: 0,
    variantTranslationsUpserted: 0,
    imagesReplaced: 0,
  };

  await prisma.$transaction(async (tx) => {
    const categoryIds = new Map<string, string>();

    // ── Kategorien ──────────────────────────────────────────────────────────
    for (const cat of data.categories) {
      const upserted = await tx.category.upsert({
        where: { slug: cat.slug },
        update: {
          name: cat.name,
          description: normalizeNullableString(cat.description),
          is_active: cat.is_active ?? true,
        },
        create: {
          slug: cat.slug,
          name: cat.name,
          description: normalizeNullableString(cat.description),
          is_active: cat.is_active ?? true,
        },
      });
      categoryIds.set(cat.slug, upserted.id);
      stats.categoriesUpserted += 1;
    }

    // Parent-Verknüpfungen nach erstem Pass setzen
    for (const cat of data.categories) {
      if (!cat.parent_slug) continue;
      const id = categoryIds.get(cat.slug);
      const parentId = categoryIds.get(cat.parent_slug);
      if (id && parentId) {
        await tx.category.update({ where: { id }, data: { parent_id: parentId } });
      }
    }

    // ── Kategorie-IDs für Produkte auflösen ─────────────────────────────────
    const productCategorySlugs = [
      ...new Set(
        data.products
          .map((p) => p.category_slug)
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      ),
    ];

    const missingSlugs = productCategorySlugs.filter((s) => !categoryIds.has(s));
    if (missingSlugs.length > 0) {
      const existing = await tx.category.findMany({
        where: { slug: { in: missingSlugs } },
        select: { id: true, slug: true },
      });
      for (const c of existing) categoryIds.set(c.slug, c.id);

      const unresolved = missingSlugs.filter((s) => !categoryIds.has(s));
      if (unresolved.length > 0) {
        throw new Error(`Unbekannte category_slug-Werte: ${unresolved.join(", ")}`);
      }
    }

    // ── Produkte ────────────────────────────────────────────────────────────
    for (const product of data.products) {
      const categoryId = product.category_slug ? (categoryIds.get(product.category_slug) ?? null) : null;

      const upserted = await tx.product.upsert({
        where: { slug: product.slug },
        update: {
          product_type: product.product_type,
          status: product.status,
          category_id: categoryId,
        },
        create: {
          slug: product.slug,
          product_type: product.product_type,
          status: product.status,
          category_id: categoryId,
        },
      });
      stats.productsUpserted += 1;

      // ── Produkt-Übersetzungen ──────────────────────────────────────────────
      for (const t of product.translations) {
        await tx.productTranslation.upsert({
          where: { product_id_locale: { product_id: upserted.id, locale: t.locale } },
          update: {
            name: t.title,
            short_description: t.short_description,
            description: t.description,
            delivery_note: t.delivery_note,
            features: t.features,
            meta_title: t.meta_title,
            meta_description: t.meta_description,
            mounting_note: t.mounting_note,
            project_note: t.project_note,
          },
          create: {
            product_id: upserted.id,
            locale: t.locale,
            name: t.title,
            short_description: t.short_description,
            description: t.description,
            delivery_note: t.delivery_note,
            features: t.features,
            meta_title: t.meta_title,
            meta_description: t.meta_description,
            mounting_note: t.mounting_note,
            project_note: t.project_note,
          },
        });
        stats.translationsUpserted += 1;
      }

      // ── Varianten ──────────────────────────────────────────────────────────
      for (const variant of product.variants) {
        const existing = await tx.productVariant.findUnique({
          where: { sku: variant.sku },
          select: { product_id: true },
        });

        if (existing && existing.product_id !== upserted.id) {
          throw new Error(
            `SKU "${variant.sku}" gehört bereits zu einem anderen Produkt. Import abgebrochen.`
          );
        }

        const dimensionsValue =
          variant.dimensions === null
            ? Prisma.DbNull
            : (variant.dimensions as Prisma.InputJsonObject);

        const upsertedVariant = await tx.productVariant.upsert({
          where: { sku: variant.sku },
          update: {
            is_active: variant.is_active,
            price_cents: variant.price_cents,
            currency: variant.currency,
            stock_quantity: variant.stock_quantity,
            attributes: variant.attributes as Prisma.InputJsonObject,
            weight_kg: variant.weight_kg,
            dimensions: dimensionsValue,
          },
          create: {
            product_id: upserted.id,
            sku: variant.sku,
            is_active: variant.is_active,
            price_cents: variant.price_cents,
            currency: variant.currency,
            stock_quantity: variant.stock_quantity,
            attributes: variant.attributes as Prisma.InputJsonObject,
            weight_kg: variant.weight_kg,
            dimensions: dimensionsValue,
          },
        });
        stats.variantsUpserted += 1;

        // ── Varianten-Übersetzungen ────────────────────────────────────────
        for (const vt of variant.translations) {
          await tx.productVariantTranslation.upsert({
            where: { variant_id_locale: { variant_id: upsertedVariant.id, locale: vt.locale } },
            update: { name: vt.name },
            create: { variant_id: upsertedVariant.id, locale: vt.locale, name: vt.name },
          });
          stats.variantTranslationsUpserted += 1;
        }
      }

      // ── Bilder ────────────────────────────────────────────────────────────
      await tx.productImage.deleteMany({ where: { product_id: upserted.id } });
      if (product.images.length > 0) {
        await tx.productImage.createMany({
          data: product.images.map((img, i) => ({
            product_id: upserted.id,
            url: img.url,
            alt: img.alt,
            sort_order: img.sort_order ?? i,
          })),
        });
        stats.imagesReplaced += product.images.length;
      }
    }
  });

  return stats;
}

// ─── Dry-Run Output ───────────────────────────────────────────────────────────

function printValidationOk(data: ValidatedImport, filePath: string) {
  const variantCount = data.products.reduce((n, p) => n + p.variants.length, 0);
  const translationCount = data.products.reduce((n, p) => n + p.translations.length, 0);
  const variantTranslationCount = data.products.reduce(
    (n, p) => n + p.variants.reduce((m, v) => m + v.translations.length, 0),
    0
  );
  const imageCount = data.products.reduce((n, p) => n + p.images.length, 0);

  console.log("Importdatei ist valide (--dry-run, keine DB-Schreibvorgänge).");
  console.log(`Datei:                  ${filePath}`);
  console.log(`Kategorien:             ${data.categories.length}`);
  console.log(`Produkte:               ${data.products.length}`);
  console.log(`Produkt-Übersetzungen:  ${translationCount}`);
  console.log(`Varianten:              ${variantCount}`);
  console.log(`Varianten-Übersetzungen:${variantTranslationCount}`);
  console.log(`Bilder:                 ${imageCount}`);

  const localeBreakdown = new Map<Locale, number>();
  for (const product of data.products) {
    for (const t of product.translations) {
      localeBreakdown.set(t.locale, (localeBreakdown.get(t.locale) ?? 0) + 1);
    }
  }
  console.log("Sprachen-Verteilung (Produkte):");
  for (const [locale, count] of localeBreakdown) {
    console.log(`  ${locale.toUpperCase()}: ${count} Produkt(e)`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateUnique(values: unknown[], label: string, errors: string[]) {
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string" || value.trim() === "") continue;
    if (seen.has(value)) errors.push(`${label} "${value}" ist mehrfach in der Importdatei enthalten.`);
    seen.add(value);
  }
}

function requireNonEmptyString(value: unknown, path: string, errors: string[]) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${path}: muss ein nicht-leerer String sein.`);
  }
}

function validateOptionalString(value: unknown, path: string, errors: string[]) {
  if (value !== undefined && value !== null && typeof value !== "string") {
    errors.push(`${path}: muss ein String oder null sein.`);
  }
}

function validateOptionalBoolean(value: unknown, path: string, errors: string[]) {
  if (value !== undefined && typeof value !== "boolean") {
    errors.push(`${path}: muss true oder false sein.`);
  }
}

function validateOptionalNumber(value: unknown, path: string, errors: string[]) {
  if (value !== undefined && value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
    errors.push(`${path}: muss eine Zahl >= 0 oder null sein.`);
  }
}

function validateOptionalRecord(value: unknown, path: string, errors: string[]) {
  if (value !== undefined && value !== null && !isPlainObject(value)) {
    errors.push(`${path}: muss ein JSON-Objekt oder null sein.`);
  }
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emptyResult(errors: string[]): { data: ValidatedImport; errors: string[] } {
  return { data: { categories: [], products: [] }, errors };
}

function fail(errors: string[]): never {
  console.error("Import abgebrochen:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

void main();
