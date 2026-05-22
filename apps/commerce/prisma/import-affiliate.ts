/**
 * Affiliate-Produkt CSV-Import
 *
 * Liest eine CSV-Datei, validiert alle Zeilen und schreibt per Upsert in die DB.
 *
 * CLI:
 *   pnpm --filter commerce import:affiliate --file ./imports/affiliate-products.csv --dry-run
 *   pnpm --filter commerce import:affiliate --file ./imports/affiliate-products.csv --commit
 *
 * Felder: siehe imports/affiliate-products.example.csv
 */

import { Locale, PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

const AFFILIATE_ASIN_REGEX = /^B[A-Z0-9]{9}$/;
const SLUG_REGEX = /^[a-z0-9-]+$/;
const HTTPS_REGEX = /^https:\/\/.+/i;
const VALID_STATUSES = new Set(["draft", "active", "archived"]);
const VALID_HEALTH_STATUSES = new Set(["ok", "invalid_url", "missing", "timeout", "blocked", "error"]);

// ─── Types ────────────────────────────────────────────────────────────────────

type CsvRow = Record<string, string>;

type ValidatedAffiliateRow = {
  slug: string;
  status: "draft" | "active" | "archived";
  category_slug: string;
  affiliate_provider: string;
  affiliate_url: string;
  affiliate_enabled: boolean;
  affiliate_asin: string | null;
  affiliate_button_label: string | null;
  affiliate_disclosure: string | null;
  image_url: string | null;
  image_alt: string | null;
  sort_order: number;
  featured: boolean;
  title_de: string;
  short_description_de: string | null;
  description_de: string | null;
  meta_title_de: string | null;
  meta_description_de: string | null;
  title_en: string | null;
  short_description_en: string | null;
  description_en: string | null;
  meta_title_en: string | null;
  meta_description_en: string | null;
  title_es: string | null;
  short_description_es: string | null;
  description_es: string | null;
  meta_title_es: string | null;
  meta_description_es: string | null;
};

type RowIssue = {
  row: number;
  slug: string;
  field: string;
  message: string;
  level: "error" | "warning";
};

type ImportResult = {
  total: number;
  valid: number;
  errors: number;
  warnings: number;
  created: number;
  updated: number;
  issues: RowIssue[];
};

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCsv(content: string): CsvRow[] {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCsvLine(line);
    const row: CsvRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function normalizeStr(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBool(value: string | undefined, defaultVal = false): boolean {
  if (!value) return defaultVal;
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1" || v === "ja" || v === "yes";
}

function validateRow(
  row: CsvRow,
  rowIndex: number,
  issues: RowIssue[]
): ValidatedAffiliateRow | null {
  const slug = normalizeStr(row.slug);
  const rowNum = rowIndex + 2; // +1 für Header, +1 für 1-basiert
  const addIssue = (field: string, message: string, level: "error" | "warning" = "error") => {
    issues.push({ row: rowNum, slug: slug ?? "(leer)", field, message, level });
  };

  // --- Pflichtfelder ---
  if (!slug) {
    addIssue("slug", "slug fehlt oder ist leer");
    return null;
  }
  if (!SLUG_REGEX.test(slug)) {
    addIssue("slug", `slug hat ungültiges Format: "${slug}" (nur a-z, 0-9, Bindestriche)`);
    return null;
  }

  const status = normalizeStr(row.status);
  if (!status || !VALID_STATUSES.has(status)) {
    addIssue("status", `Ungültiger Status: "${row.status}" (erlaubt: draft, active, archived)`);
  }

  const category_slug = normalizeStr(row.category_slug);
  if (!category_slug) {
    addIssue("category_slug", "category_slug ist Pflicht");
  }

  const sales_channel = normalizeStr(row.sales_channel);
  if (sales_channel && sales_channel !== "affiliate_external") {
    addIssue("sales_channel", `Ungültiger sales_channel: "${sales_channel}" (erlaubt: affiliate_external)`);
  }

  const affiliate_provider = normalizeStr(row.affiliate_provider);
  if (!affiliate_provider) {
    addIssue("affiliate_provider", "affiliate_provider ist Pflicht (z.B. amazon)");
  } else if (affiliate_provider !== "amazon") {
    addIssue("affiliate_provider", `Ungültiger Anbieter: "${affiliate_provider}" – MVP unterstützt nur "amazon"`);
  }

  const affiliate_url = normalizeStr(row.affiliate_url);
  const affiliate_enabled = parseBool(row.affiliate_enabled, false);
  if (!affiliate_url) {
    addIssue("affiliate_url", "affiliate_url ist Pflicht");
  } else if (!HTTPS_REGEX.test(affiliate_url)) {
    addIssue("affiliate_url", `affiliate_url muss eine HTTPS-URL sein: "${affiliate_url}"`);
  }

  if (affiliate_enabled && status === "active" && !affiliate_url) {
    addIssue("affiliate_url", "Aktives Affiliate-Produkt mit affiliate_enabled=true braucht affiliate_url");
  }

  const title_de = normalizeStr(row.title_de);
  if (!title_de) {
    addIssue("title_de", "DE-Titel (title_de) ist Pflicht");
    return null;
  }

  // --- Optionale Felder mit Validierung ---
  const affiliate_asin = normalizeStr(row.affiliate_asin);
  if (affiliate_asin && !AFFILIATE_ASIN_REGEX.test(affiliate_asin)) {
    addIssue("affiliate_asin", `ASIN-Format ungültig: "${affiliate_asin}" (erwartet: B + 9 alphanumerische Zeichen)`, "warning");
  }

  const image_url = normalizeStr(row.image_url);
  if (image_url && !HTTPS_REGEX.test(image_url)) {
    addIssue("image_url", `image_url muss eine HTTPS-URL sein: "${image_url}"`);
  }

  const sort_order_raw = parseInt(row.sort_order ?? "0", 10);
  const sort_order = isNaN(sort_order_raw) ? 0 : sort_order_raw;

  const title_en = normalizeStr(row.title_en);
  const title_es = normalizeStr(row.title_es);

  if (!title_en) addIssue("title_en", "Kein EN-Titel gesetzt – Storefront fällt auf DE zurück", "warning");
  if (!title_es) addIssue("title_es", "Kein ES-Titel gesetzt – Storefront fällt auf DE zurück", "warning");
  if (!image_url) addIssue("image_url", "Kein Bild gesetzt – Produkt erscheint ohne Bild", "warning");

  const hasError = issues.some((i) => i.row === rowNum && i.level === "error");
  if (hasError) return null;

  return {
    slug,
    status: (status ?? "draft") as "draft" | "active" | "archived",
    category_slug: category_slug!,
    affiliate_provider: affiliate_provider!,
    affiliate_url: affiliate_url!,
    affiliate_enabled,
    affiliate_asin: affiliate_asin && AFFILIATE_ASIN_REGEX.test(affiliate_asin) ? affiliate_asin : null,
    affiliate_button_label: normalizeStr(row.affiliate_button_label),
    affiliate_disclosure: normalizeStr(row.affiliate_disclosure),
    image_url,
    image_alt: normalizeStr(row.image_alt),
    sort_order,
    featured: parseBool(row.featured, false),
    title_de,
    short_description_de: normalizeStr(row.short_description_de),
    description_de: normalizeStr(row.description_de),
    meta_title_de: normalizeStr(row.meta_title_de),
    meta_description_de: normalizeStr(row.meta_description_de),
    title_en,
    short_description_en: normalizeStr(row.short_description_en),
    description_en: normalizeStr(row.description_en),
    meta_title_en: normalizeStr(row.meta_title_en),
    meta_description_en: normalizeStr(row.meta_description_en),
    title_es,
    short_description_es: normalizeStr(row.short_description_es),
    description_es: normalizeStr(row.description_es),
    meta_title_es: normalizeStr(row.meta_title_es),
    meta_description_es: normalizeStr(row.meta_description_es),
  };
}

// ─── Cross-Row-Validierung ────────────────────────────────────────────────────

function checkDuplicateSlugs(rows: CsvRow[], issues: RowIssue[]) {
  const seen = new Map<string, number>();
  for (let i = 0; i < rows.length; i++) {
    const slug = rows[i].slug?.trim();
    if (!slug) continue;
    if (seen.has(slug)) {
      issues.push({
        row: i + 2,
        slug,
        field: "slug",
        message: `Doppelter slug "${slug}" – kommt auch in Zeile ${seen.get(slug)} vor`,
        level: "error",
      });
    } else {
      seen.set(slug, i + 2);
    }
  }
}

// ─── DB-Import ────────────────────────────────────────────────────────────────

async function importRows(
  rows: ValidatedAffiliateRow[],
  dryRun: boolean
): Promise<{ created: number; updated: number }> {
  if (dryRun) return { created: 0, updated: 0 };

  // Kategorie-Slugs vorab auflösen
  const categorySlugs = [...new Set(rows.map((r) => r.category_slug))];
  const categories = await prisma.category.findMany({
    where: { slug: { in: categorySlugs } },
    select: { id: true, slug: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  const missingSlugs = categorySlugs.filter((s) => !categoryMap.has(s));
  if (missingSlugs.length > 0) {
    throw new Error(`Unbekannte category_slug-Werte: ${missingSlugs.join(", ")}`);
  }

  // Vorhandene Produkte ermitteln (created vs. updated)
  const allSlugs = rows.map((r) => r.slug);
  const existing = await prisma.product.findMany({
    where: { slug: { in: allSlugs } },
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((p) => p.slug));

  let created = 0;
  let updated = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const categoryId = categoryMap.get(row.category_slug) ?? null;

      const product = await tx.product.upsert({
        where: { slug: row.slug },
        update: {
          product_type: "affiliate_external",
          status: row.status,
          category_id: categoryId,
          affiliate_provider: row.affiliate_provider,
          affiliate_url: row.affiliate_url,
          affiliate_asin: row.affiliate_asin,
          affiliate_button_label: row.affiliate_button_label,
          affiliate_disclosure: row.affiliate_disclosure,
          affiliate_enabled: row.affiliate_enabled,
        },
        create: {
          slug: row.slug,
          product_type: "affiliate_external",
          status: row.status,
          category_id: categoryId,
          affiliate_provider: row.affiliate_provider,
          affiliate_url: row.affiliate_url,
          affiliate_asin: row.affiliate_asin,
          affiliate_button_label: row.affiliate_button_label,
          affiliate_disclosure: row.affiliate_disclosure,
          affiliate_enabled: row.affiliate_enabled,
        },
      });

      if (existingSlugs.has(row.slug)) {
        updated++;
      } else {
        created++;
      }

      // ── Translations ──────────────────────────────────────────────────────
      const translationData: Array<{
        locale: Locale;
        name: string;
        short_description: string | null;
        description: string | null;
        meta_title: string | null;
        meta_description: string | null;
      }> = [
        {
          locale: Locale.de,
          name: row.title_de,
          short_description: row.short_description_de,
          description: row.description_de,
          meta_title: row.meta_title_de,
          meta_description: row.meta_description_de,
        },
      ];

      if (row.title_en) {
        translationData.push({
          locale: Locale.en,
          name: row.title_en,
          short_description: row.short_description_en,
          description: row.description_en,
          meta_title: row.meta_title_en,
          meta_description: row.meta_description_en,
        });
      }

      if (row.title_es) {
        translationData.push({
          locale: Locale.es,
          name: row.title_es,
          short_description: row.short_description_es,
          description: row.description_es,
          meta_title: row.meta_title_es,
          meta_description: row.meta_description_es,
        });
      }

      for (const t of translationData) {
        await tx.productTranslation.upsert({
          where: { product_id_locale: { product_id: product.id, locale: t.locale } },
          update: {
            name: t.name,
            short_description: t.short_description,
            description: t.description,
            meta_title: t.meta_title,
            meta_description: t.meta_description,
          },
          create: {
            product_id: product.id,
            locale: t.locale,
            name: t.name,
            short_description: t.short_description,
            description: t.description,
            meta_title: t.meta_title,
            meta_description: t.meta_description,
          },
        });
      }

      // ── Bild ──────────────────────────────────────────────────────────────
      if (row.image_url) {
        const existingImage = await tx.productImage.findFirst({
          where: { product_id: product.id, sort_order: 0 },
        });
        if (existingImage) {
          await tx.productImage.update({
            where: { id: existingImage.id },
            data: { url: row.image_url, alt: row.image_alt },
          });
        } else {
          await tx.productImage.create({
            data: {
              product_id: product.id,
              url: row.image_url,
              alt: row.image_alt,
              sort_order: 0,
            },
          });
        }
      }
    }
  });

  return { created, updated };
}

// ─── Report ───────────────────────────────────────────────────────────────────

function printReport(result: ImportResult, filePath: string, dryRun: boolean) {
  const mode = dryRun ? "DRY-RUN (keine Schreibvorgänge)" : "COMMIT";
  const sep = "─".repeat(60);

  console.log(`\n${sep}`);
  console.log("  Affiliate-Import Report");
  console.log(sep);
  console.log(`  Datum:      ${new Date().toLocaleString("de-DE")}`);
  console.log(`  Datei:      ${filePath}`);
  console.log(`  Modus:      ${mode}`);
  console.log(sep);
  console.log(`  Geprüft:    ${result.total}`);
  console.log(`  Gültig:     ${result.valid}`);
  console.log(`  Fehler:     ${result.errors}`);
  console.log(`  Warnungen:  ${result.warnings}`);

  if (dryRun) {
    console.log(`\n  Vorschau (bei --commit):`);
    console.log(`    Neu:              ${result.created}`);
    console.log(`    Aktualisiert:     ${result.updated}`);
  } else {
    console.log(`\n  Ergebnis:`);
    console.log(`    Erstellt:         ${result.created}`);
    console.log(`    Aktualisiert:     ${result.updated}`);
  }

  const errors = result.issues.filter((i) => i.level === "error");
  const warnings = result.issues.filter((i) => i.level === "warning");

  if (errors.length > 0) {
    console.log(`\n--- FEHLER (${errors.length}) ---`);
    for (const issue of errors) {
      console.log(`  Zeile ${String(issue.row).padStart(3)}: [${issue.field}] ${issue.message}`);
    }
  }

  if (warnings.length > 0) {
    console.log(`\n--- WARNUNGEN (${warnings.length}) ---`);
    for (const issue of warnings) {
      console.log(`  Zeile ${String(issue.row).padStart(3)}: [${issue.field}] ${issue.message}`);
    }
  }

  console.log();
  if (result.errors > 0) {
    console.log(`→ Import nicht ausgeführt (${result.errors} Fehler). Fehler beheben und erneut ausführen.\n`);
  } else if (dryRun) {
    console.log(`→ Validierung erfolgreich. Mit --commit ausführen um zu importieren.\n`);
  } else {
    console.log(`→ Import erfolgreich abgeschlossen.\n`);
  }
}

function printJsonReport(result: ImportResult, filePath: string, dryRun: boolean) {
  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry_run" : "commit",
        file: filePath,
        timestamp: new Date().toISOString(),
        success: result.errors === 0,
        summary: {
          total: result.total,
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
          created: result.created,
          updated: result.updated,
        },
        issues: result.issues,
      },
      null,
      2
    )
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const doCommit = args.includes("--commit");
  const jsonOutput = args.includes("--format") && args[args.indexOf("--format") + 1] === "json";
  const fileArg = args[args.indexOf("--file") + 1];

  if (!fileArg) {
    console.error("Fehler: --file <pfad> fehlt.");
    console.error("Beispiel: pnpm --filter commerce import:affiliate --file ./imports/affiliate-products.csv --dry-run");
    process.exit(1);
  }

  if (!dryRun && !doCommit) {
    console.error("Fehler: Entweder --dry-run oder --commit angeben.");
    process.exit(1);
  }

  const filePath = resolve(process.cwd(), fileArg);
  let content: string;
  try {
    content = readFileSync(filePath, "utf8").replace(/^﻿/, ""); // BOM entfernen
  } catch (err) {
    console.error(`Datei konnte nicht gelesen werden: ${filePath}`);
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const rows = parseCsv(content);
  if (rows.length === 0) {
    console.error("CSV hat keine Datenzeilen.");
    process.exit(1);
  }

  const issues: RowIssue[] = [];
  checkDuplicateSlugs(rows, issues);

  const validatedRows: ValidatedAffiliateRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const validated = validateRow(rows[i], i, issues);
    if (validated) validatedRows.push(validated);
  }

  const errorCount = issues.filter((i) => i.level === "error").length;
  const warningCount = issues.filter((i) => i.level === "warning").length;

  let created = 0;
  let updated = 0;

  if (errorCount === 0) {
    try {
      const counts = await importRows(validatedRows, dryRun);
      created = counts.created;
      updated = counts.updated;
    } catch (err) {
      console.error("Import-Fehler:");
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  } else {
    // Vorschau: Wie viele wären neu/aktualisiert?
    if (dryRun && validatedRows.length > 0) {
      const allSlugs = validatedRows.map((r) => r.slug);
      const existing = await prisma.product.findMany({
        where: { slug: { in: allSlugs } },
        select: { slug: true },
      });
      const existingSlugs = new Set(existing.map((p) => p.slug));
      updated = validatedRows.filter((r) => existingSlugs.has(r.slug)).length;
      created = validatedRows.filter((r) => !existingSlugs.has(r.slug)).length;
    }
  }

  const result: ImportResult = {
    total: rows.length,
    valid: validatedRows.length,
    errors: errorCount,
    warnings: warningCount,
    created,
    updated,
    issues,
  };

  if (jsonOutput) {
    printJsonReport(result, filePath, dryRun);
  } else {
    printReport(result, filePath, dryRun);
  }

  if (errorCount > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error("Unerwarteter Fehler:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
