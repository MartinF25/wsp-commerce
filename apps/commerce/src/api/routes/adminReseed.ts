import { Hono } from "hono";
import { getPrismaClient } from "../../lib/prisma";
import { requireAdminKey } from "../middleware/requireAdminKey";
import { ProductType, ProductStatus, Locale } from "@prisma/client";

export const adminReseedRoutes = new Hono();
adminReseedRoutes.use("*", requireAdminKey);

adminReseedRoutes.post("/", async (c) => {
  const prisma = getPrismaClient();
  const log: string[] = [];

  // ─── Kategorien ─────────────────────────────────────────────────────────────

  const catSolarzaun = await prisma.category.upsert({
    where: { slug: "solarzaun" },
    update: { name: "Solarzaun" },
    create: { slug: "solarzaun", name: "Solarzaun" },
  });
  const catSkywind = await prisma.category.upsert({
    where: { slug: "skywind" },
    update: { name: "SkyWind" },
    create: { slug: "skywind", name: "SkyWind" },
  });
  const catKombi = await prisma.category.upsert({
    where: { slug: "kombiloesung" },
    update: { name: "Kombilösung" },
    create: { slug: "kombiloesung", name: "Kombilösung" },
  });
  const catZubehoer = await prisma.category.upsert({
    where: { slug: "solar-zubehoer" },
    update: { name: "Solar Zubehör" },
    create: { slug: "solar-zubehoer", name: "Solar Zubehör" },
  });
  log.push(`Kategorien: ${[catSolarzaun.slug, catSkywind.slug, catKombi.slug, catZubehoer.slug].join(", ")}`);

  // ─── Kategorie-Übersetzungen ─────────────────────────────────────────────────

  async function upsertCatT(catId: string, locale: Locale, data: { name: string; description: string; meta_title: string; meta_description: string }) {
    await prisma.categoryTranslation.upsert({
      where: { category_id_locale: { category_id: catId, locale } },
      update: data,
      create: { category_id: catId, locale, ...data },
    });
  }

  await upsertCatT(catSolarzaun.id, Locale.de, { name: "Solarzaun", description: "Solarmodule integriert in Zaunelemente.", meta_title: "Solarzaun – Photovoltaik & Einfriedung | WSP Solar", meta_description: "Solarzaun kaufen: Solarmodule und Einfriedung in einem System." });
  await upsertCatT(catSolarzaun.id, Locale.en, { name: "Solar Fence", description: "Solar modules integrated into fence elements.", meta_title: "Solar Fence | WSP Solar", meta_description: "Buy solar fence systems for residential and commercial use." });
  await upsertCatT(catSkywind.id, Locale.de, { name: "SkyWind", description: "Kleine Windkraftanlagen für private und gewerbliche Nutzung.", meta_title: "SkyWind Kleinwindanlagen | WSP Solar", meta_description: "Kleinwindanlagen von SkyWind: 1 kW bis 5 kW. Jetzt konfigurieren." });
  await upsertCatT(catSkywind.id, Locale.en, { name: "SkyWind", description: "Small wind turbines for residential and commercial use.", meta_title: "SkyWind Small Wind Turbines | WSP Solar", meta_description: "SkyWind turbines: 1 kW to 5 kW. Configure your system now." });
  await upsertCatT(catKombi.id, Locale.de, { name: "Kombilösung", description: "Solar und Wind kombiniert – maximale Autarkie.", meta_title: "Kombilösung Solar & Wind | WSP Solar", meta_description: "Solar und Wind in einem System für maximale Autarkie." });
  await upsertCatT(catKombi.id, Locale.en, { name: "Combo Solution", description: "Solar and wind combined – maximum energy independence.", meta_title: "Combo Solution Solar & Wind | WSP Solar", meta_description: "Solar and wind in one system for maximum independence." });
  await upsertCatT(catZubehoer.id, Locale.de, { name: "Solar Zubehör", description: "Wechselrichter, Laderegler, Optimizer und Halterungen.", meta_title: "Solar Zubehör | WSP Solar", meta_description: "Solar Zubehör: Wechselrichter, Laderegler, Optimizer, Halterungen." });
  await upsertCatT(catZubehoer.id, Locale.en, { name: "Solar Accessories", description: "Inverters, charge controllers, optimizers and mounting systems.", meta_title: "Solar Accessories | WSP Solar", meta_description: "Solar accessories: inverters, charge controllers, optimizers, mounts." });
  log.push("Kategorie-Übersetzungen: ok");

  // ─── Produkt-Helpers ────────────────────────────────────────────────────────

  async function upsertTranslation(productId: string, data: { name: string; short_description: string; description: string }) {
    await prisma.productTranslation.upsert({
      where: { product_id_locale: { product_id: productId, locale: Locale.de } },
      update: data,
      create: { product_id: productId, locale: Locale.de, ...data },
    });
  }

  async function upsertVariantT(variantId: string, name: string) {
    await prisma.productVariantTranslation.upsert({
      where: { variant_id_locale: { variant_id: variantId, locale: Locale.de } },
      update: { name },
      create: { variant_id: variantId, locale: Locale.de, name },
    });
  }

  // ─── SOLARZAUN STANDARD ──────────────────────────────────────────────────────

  const szStd = await prisma.product.upsert({
    where: { slug: "solarzaun-standard" },
    update: {},
    create: { slug: "solarzaun-standard", product_type: ProductType.configurable, status: ProductStatus.active, category_id: catSolarzaun.id },
  });
  await upsertTranslation(szStd.id, {
    name: "Solarzaun Standard",
    short_description: "Solarmodule integriert in hochwertige Zaunelemente – Einfriedung und Stromerzeugung in einem System.",
    description: "Der Solarzaun Standard verbindet moderne Photovoltaik mit einer hochwertigen Einfriedung. Geeignet für Privatgrundstücke, Gewerbeflächen und landwirtschaftliche Areale.",
  });
  for (const v of [
    { sku: "SZ-3M-ANT", name: "3 m, Anthrazit", price_cents: 129900, attributes: { laenge_m: 3, farbe: "Anthrazit", leistung_wp: 300 } },
    { sku: "SZ-3M-GRN", name: "3 m, Grün",      price_cents: 129900, attributes: { laenge_m: 3, farbe: "Grün",      leistung_wp: 300 } },
    { sku: "SZ-6M-ANT", name: "6 m, Anthrazit", price_cents: 249900, attributes: { laenge_m: 6, farbe: "Anthrazit", leistung_wp: 600 } },
    { sku: "SZ-6M-GRN", name: "6 m, Grün",      price_cents: 249900, attributes: { laenge_m: 6, farbe: "Grün",      leistung_wp: 600 } },
  ]) {
    const vr = await prisma.productVariant.upsert({ where: { sku: v.sku }, update: { price_cents: v.price_cents }, create: { sku: v.sku, price_cents: v.price_cents, attributes: v.attributes, product_id: szStd.id, currency: "EUR" } });
    await upsertVariantT(vr.id, v.name);
  }

  // ─── SOLARZAUN GEWERBE ────────────────────────────────────────────────────────

  const szGew = await prisma.product.upsert({
    where: { slug: "solarzaun-gewerbe" },
    update: {},
    create: { slug: "solarzaun-gewerbe", product_type: ProductType.configurable, status: ProductStatus.active, category_id: catSolarzaun.id },
  });
  await upsertTranslation(szGew.id, {
    name: "Solarzaun Gewerbe",
    short_description: "Großflächige Solareinfriedung für Betriebsgelände, Parkplätze und Industrieflächen.",
    description: "Der Solarzaun Gewerbe ist für Betriebe, Landwirte und Kommunen konzipiert, die große Freiflächen energetisch nutzen möchten.",
  });
  for (const v of [
    { sku: "SZG-12M-ANT", name: "12 m, Anthrazit", price_cents: 490000,  attributes: { laenge_m: 12, farbe: "Anthrazit", leistung_wp: 1200 } },
    { sku: "SZG-25M-ANT", name: "25 m, Anthrazit", price_cents: 980000,  attributes: { laenge_m: 25, farbe: "Anthrazit", leistung_wp: 2500 } },
    { sku: "SZG-50M-ANT", name: "50 m, Anthrazit", price_cents: 1890000, attributes: { laenge_m: 50, farbe: "Anthrazit", leistung_wp: 5000 } },
  ]) {
    const vr = await prisma.productVariant.upsert({ where: { sku: v.sku }, update: { price_cents: v.price_cents }, create: { sku: v.sku, price_cents: v.price_cents, attributes: v.attributes, product_id: szGew.id, currency: "EUR" } });
    await upsertVariantT(vr.id, v.name);
  }

  // ─── SKYWIND 1 kW ────────────────────────────────────────────────────────────

  const sw1 = await prisma.product.upsert({
    where: { slug: "skywind-1kw" },
    update: {},
    create: { slug: "skywind-1kw", product_type: ProductType.configurable, status: ProductStatus.active, category_id: catSkywind.id },
  });
  await upsertTranslation(sw1.id, {
    name: "SkyWind 1 kW",
    short_description: "Kompakte Kleinwindanlage für Privatgrundstücke. Geräuscharm, wartungsarm.",
    description: "Die SkyWind 1 kW ist unsere Einsteigeranlage für private Nutzer. Mit einem Rotordurchmesser von 2,4 m erzeugt sie bis zu 2.000 kWh im Jahr.",
  });
  for (const v of [
    { sku: "SW-1KW-STD",  name: "1 kW – Standardmontage",   price_cents: 289900, attributes: { leistung_kw: 1, rotordurchmesser_m: 2.4 } },
    { sku: "SW-1KW-MAST", name: "1 kW – inkl. Mastmontage", price_cents: 349900, attributes: { leistung_kw: 1, rotordurchmesser_m: 2.4 } },
  ]) {
    const vr = await prisma.productVariant.upsert({ where: { sku: v.sku }, update: { price_cents: v.price_cents }, create: { sku: v.sku, price_cents: v.price_cents, attributes: v.attributes, product_id: sw1.id, currency: "EUR" } });
    await upsertVariantT(vr.id, v.name);
  }

  // ─── SKYWIND 3 kW ────────────────────────────────────────────────────────────

  const sw3 = await prisma.product.upsert({
    where: { slug: "skywind-3kw" },
    update: {},
    create: { slug: "skywind-3kw", product_type: ProductType.configurable, status: ProductStatus.active, category_id: catSkywind.id },
  });
  await upsertTranslation(sw3.id, {
    name: "SkyWind 3 kW",
    short_description: "Leistungsstarke Windanlage für Gewerbe und Höfe. Bis zu 6.000 kWh Jahreserzeugung.",
    description: "Die SkyWind 3 kW ist die Wahl für Gewerbebetriebe und landwirtschaftliche Höfe. Der Rotor mit 3,8 m Durchmesser erzeugt verlässlich Strom.",
  });
  for (const v of [
    { sku: "SW-3KW-STD",  name: "3 kW – Standardmontage",   price_cents: 649900, attributes: { leistung_kw: 3, rotordurchmesser_m: 3.8 } },
    { sku: "SW-3KW-MAST", name: "3 kW – inkl. Mastmontage", price_cents: 749900, attributes: { leistung_kw: 3, rotordurchmesser_m: 3.8 } },
  ]) {
    const vr = await prisma.productVariant.upsert({ where: { sku: v.sku }, update: { price_cents: v.price_cents }, create: { sku: v.sku, price_cents: v.price_cents, attributes: v.attributes, product_id: sw3.id, currency: "EUR" } });
    await upsertVariantT(vr.id, v.name);
  }

  // ─── SKYWIND 5 kW ────────────────────────────────────────────────────────────

  const sw5 = await prisma.product.upsert({
    where: { slug: "skywind-5kw" },
    update: {},
    create: { slug: "skywind-5kw", product_type: ProductType.configurable, status: ProductStatus.active, category_id: catSkywind.id },
  });
  await upsertTranslation(sw5.id, {
    name: "SkyWind 5 kW",
    short_description: "Industrieanlage für Landwirtschaft. Bis zu 10.000 kWh/Jahr.",
    description: "Die SkyWind 5 kW ist unsere leistungsstärkste Anlage für landwirtschaftliche Betriebe und Großgewerbe. 5,2 m Rotordurchmesser, ca. 8.000–10.000 kWh/Jahr.",
  });
  const sw5v = await prisma.productVariant.upsert({ where: { sku: "SW-5KW-STD" }, update: { price_cents: 989900 }, create: { sku: "SW-5KW-STD", price_cents: 989900, currency: "EUR", product_id: sw5.id, attributes: { leistung_kw: 5, rotordurchmesser_m: 5.2 } } });
  await upsertVariantT(sw5v.id, "5 kW – Komplettanlage");

  // ─── KOMBILÖSUNG ────────────────────────────────────────────────────────────

  const kombi = await prisma.product.upsert({
    where: { slug: "solar-wind-kombiloesung" },
    update: {},
    create: { slug: "solar-wind-kombiloesung", product_type: ProductType.inquiry_only, status: ProductStatus.active, category_id: catKombi.id },
  });
  await upsertTranslation(kombi.id, {
    name: "Solar + Wind Kombilösung",
    short_description: "Kombination aus Solarzaun und SkyWind – maximale Autarkie durch ganzjährige Stromerzeugung.",
    description: "Wenn die Sonne nicht scheint, weht oft Wind. Unsere Kombilösung vereint Solarzaun und SkyWind zu einem ganzjährig effizienten Energiesystem. Jede Kombilösung ist ein Einzelprojekt.",
  });
  for (const v of [
    { sku: "KO-STANDARD-RICHTPREIS", name: "Kombiprojekt Privat (Richtpreis)",  price_cents: 450000,  attributes: { hinweis: "Individuelles Angebot auf Anfrage" } },
    { sku: "KO-GEWERBE-RICHTPREIS",  name: "Kombiprojekt Gewerbe (Richtpreis)", price_cents: 1200000, attributes: { hinweis: "Individuelles Angebot auf Anfrage" } },
  ]) {
    const vr = await prisma.productVariant.upsert({ where: { sku: v.sku }, update: { price_cents: v.price_cents }, create: { sku: v.sku, price_cents: v.price_cents, attributes: v.attributes, product_id: kombi.id, currency: "EUR" } });
    await upsertVariantT(vr.id, v.name);
  }

  log.push(`Produkte: solarzaun-standard, solarzaun-gewerbe, skywind-1kw, skywind-3kw, skywind-5kw, solar-wind-kombiloesung`);

  // ─── Blog Posts ─────────────────────────────────────────────────────────────

  for (const post of [
    {
      slug: "solarzaun-ratgeber",
      published_at: new Date("2026-04-01"),
      author_name: "Redaktion SolarWind",
      status: "published" as const,
      title: "Solarzaun: So verwandeln Sie Ihren Zaun in ein Kraftwerk",
      excerpt: "Ein Solarzaun erzeugt Strom, grenzt Ihr Grundstück ab und sieht dabei modern aus.",
      content: "<h2>Was ist ein Solarzaun?</h2><p>Ein Solarzaun kombiniert die Funktion eines klassischen Einfriedungszauns mit der Stromerzeugung durch integrierte Solarmodule.</p>",
    },
    {
      slug: "kleinwindanlage-faq",
      published_at: new Date("2026-04-10"),
      author_name: "Redaktion SolarWind",
      status: "published" as const,
      title: "Kleinwindanlage SkyWind – Die 10 häufigsten Fragen",
      excerpt: "Wie viel Strom erzeugt eine Kleinwindanlage? Brauche ich eine Genehmigung?",
      content: "<h2>1. Wie viel Strom erzeugt SkyWind?</h2><p>Je nach Modell und Standort zwischen 1.000 und 8.000 kWh pro Jahr.</p>",
    },
  ]) {
    const { title, excerpt, content, ...postData } = post;
    const bp = await prisma.blogPost.upsert({
      where: { slug: postData.slug },
      update: { status: postData.status as any, published_at: postData.published_at, author_name: postData.author_name },
      create: { ...postData, status: postData.status as any },
    });
    await prisma.blogPostTranslation.upsert({
      where: { post_id_locale: { post_id: bp.id, locale: Locale.de } },
      update: { title, excerpt, content },
      create: { post_id: bp.id, locale: Locale.de, title, excerpt, content },
    });
  }
  log.push("Blog Posts: solarzaun-ratgeber, kleinwindanlage-faq");

  return c.json({ ok: true, log });
});
