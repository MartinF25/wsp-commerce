/**
 * Blog-Seed: Internationale Kategorien
 *
 * Legt die 6 SEO-Blog-Kategorien mit DE + EN + ES Übersetzungen an.
 * Lauf: cd apps/commerce && pnpm ts-node prisma/blog-seed-categories.ts
 *
 * Idempotent: upsert auf slug — bestehende Einträge werden aktualisiert.
 * Dieser Seed erstellt NUR Kategorien, keine Artikel.
 */

import { PrismaClient, Locale } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertBlogCategory(
  slug: string,
  sortOrder: number,
  translations: { locale: Locale; name: string; description?: string }[]
) {
  const cat = await prisma.blogCategory.upsert({
    where: { slug },
    update: { sort_order: sortOrder },
    create: { slug, sort_order: sortOrder, is_active: true },
  });

  for (const t of translations) {
    await prisma.blogCategoryTranslation.upsert({
      where: { category_id_locale: { category_id: cat.id, locale: t.locale } },
      update: { name: t.name, description: t.description },
      create: {
        category_id: cat.id,
        locale: t.locale,
        name: t.name,
        description: t.description,
      },
    });
  }

  return cat;
}

async function main() {
  console.log("🌱 Blog-Seed: Internationale Kategorien startet …\n");

  // ── 1. Micro Wind Energy ───────────────────────────────────────────────────
  await upsertBlogCategory("micro-wind-energy", 1, [
    {
      locale: Locale.en,
      name: "Micro Wind Energy",
      description: "Guides, comparisons and technical deep-dives on micro wind turbines for homes, farms and off-grid use.",
    },
    {
      locale: Locale.de,
      name: "Micro Wind Energy",
      description: "Ratgeber, Vergleiche und Technik-Analysen zu Mikrowindkraftanlagen für Eigenheim, Hof und Off-Grid-Einsatz.",
    },
    {
      locale: Locale.es,
      name: "Micro Wind Energy",
      description: "Guías, comparativas y análisis técnicos sobre mini aerogeneradores para hogares, granjas y uso off-grid.",
    },
  ]);
  console.log("  ✓ micro-wind-energy");

  // ── 2. Off Grid Power ──────────────────────────────────────────────────────
  await upsertBlogCategory("off-grid-power", 2, [
    {
      locale: Locale.en,
      name: "Off Grid Power",
      description: "Everything about off-grid energy systems: batteries, wind turbines, solar panels and autonomous power supply.",
    },
    {
      locale: Locale.de,
      name: "Off Grid Power",
      description: "Alles zu autarken Energiesystemen: Batteriespeicher, Windkraft, Solar und netzunabhängige Stromversorgung.",
    },
    {
      locale: Locale.es,
      name: "Off Grid Power",
      description: "Todo sobre sistemas de energía autónomos: baterías, aerogeneradores, paneles solares y suministro eléctrico independiente.",
    },
  ]);
  console.log("  ✓ off-grid-power");

  // ── 3. Hybrid Solar Wind Systems ──────────────────────────────────────────
  await upsertBlogCategory("hybrid-solar-wind-systems", 3, [
    {
      locale: Locale.en,
      name: "Hybrid Solar Wind Systems",
      description: "How to combine solar panels and wind turbines into efficient hybrid energy systems for year-round power.",
    },
    {
      locale: Locale.de,
      name: "Hybrid Solar Wind Systeme",
      description: "Wie Sie Solarmodule und Windkraftanlagen zu effizienten Hybridsystemen für ganzjährige Stromversorgung kombinieren.",
    },
    {
      locale: Locale.es,
      name: "Sistemas Híbridos Solar-Eólico",
      description: "Cómo combinar paneles solares y aerogeneradores en sistemas híbridos eficientes para suministro de energía todo el año.",
    },
  ]);
  console.log("  ✓ hybrid-solar-wind-systems");

  // ── 4. Rooftop Wind Turbines ───────────────────────────────────────────────
  await upsertBlogCategory("rooftop-wind-turbines", 4, [
    {
      locale: Locale.en,
      name: "Rooftop Wind Turbines",
      description: "Installation guides, performance data and practical tips for mounting small wind turbines on rooftops.",
    },
    {
      locale: Locale.de,
      name: "Dach-Windkraftanlagen",
      description: "Montageleitfäden, Ertragsdaten und praktische Tipps zur Installation von Kleinwindanlagen auf Dächern.",
    },
    {
      locale: Locale.es,
      name: "Aerogeneradores en Tejado",
      description: "Guías de instalación, datos de rendimiento y consejos prácticos para montar aerogeneradores en tejados.",
    },
  ]);
  console.log("  ✓ rooftop-wind-turbines");

  // ── 5. Energy Independence ────────────────────────────────────────────────
  await upsertBlogCategory("energy-independence", 5, [
    {
      locale: Locale.en,
      name: "Energy Independence",
      description: "Strategies, real-world examples and step-by-step plans for achieving energy autarky at home, on farms and in businesses.",
    },
    {
      locale: Locale.de,
      name: "Energieunabhängigkeit",
      description: "Strategien, Praxisbeispiele und Schritt-für-Schritt-Pläne für vollständige Energieautarkie für Eigenheime, Höfe und Betriebe.",
    },
    {
      locale: Locale.es,
      name: "Independencia Energética",
      description: "Estrategias, ejemplos reales y planes paso a paso para lograr la autarquía energética en hogares, granjas y empresas.",
    },
  ]);
  console.log("  ✓ energy-independence");

  // ── 6. Battery Storage ────────────────────────────────────────────────────
  await upsertBlogCategory("battery-storage", 6, [
    {
      locale: Locale.en,
      name: "Battery Storage",
      description: "Battery storage systems for wind and solar energy: technology comparisons, sizing guides and installation tips.",
    },
    {
      locale: Locale.de,
      name: "Batteriespeicher",
      description: "Batteriespeichersysteme für Wind- und Solarenergie: Technologievergleich, Dimensionierungsratgeber und Installationstipps.",
    },
    {
      locale: Locale.es,
      name: "Almacenamiento en Baterías",
      description: "Sistemas de almacenamiento en baterías para energía eólica y solar: comparativas tecnológicas y guías de dimensionamiento.",
    },
  ]);
  console.log("  ✓ battery-storage");

  console.log("\n✅ 6 Blog-Kategorien angelegt / aktualisiert.");
  console.log("\nNächster Schritt: Artikel-Seed mit blog-seed-international.ts erstellen.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
