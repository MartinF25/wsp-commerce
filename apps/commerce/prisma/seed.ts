/**
 * Prisma Seed – wsp-commerce Katalog
 *
 * Kategorien: Solarzaun, SkyWind, Kombilösung
 * Produkte: 6 Produkte mit DE-Translations + Varianten
 *
 * Sprachneutrale Stammdaten (slug, product_type, status, category_id, SKU, Preis)
 * liegen auf Product/ProductVariant. Alle Texte liegen in ProductTranslation /
 * ProductVariantTranslation mit locale = "de" als Pflichteinträge.
 */

import { PrismaClient, ProductType, ProductStatus, Locale } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertTranslation(
  product_id: string,
  data: {
    name: string;
    short_description?: string;
    description?: string;
    delivery_note?: string;
    features?: string[];
    meta_title?: string;
    meta_description?: string;
    mounting_note?: string;
    project_note?: string;
  }
) {
  const payload = {
    ...data,
    features: data.features ?? [],
  };
  await prisma.productTranslation.upsert({
    where: { product_id_locale: { product_id, locale: Locale.de } },
    update: payload,
    create: { product_id, locale: Locale.de, ...payload },
  });
}

async function upsertVariantTranslation(variant_id: string, name: string) {
  await prisma.productVariantTranslation.upsert({
    where: { variant_id_locale: { variant_id, locale: Locale.de } },
    update: { name },
    create: { variant_id, locale: Locale.de, name },
  });
}

async function main() {
  console.log("🌱 Seed startet …");

  // ─── Alte Produkte bereinigen ────────────────────────────────────────────────
  const obsoleteSlugs = ["skywind-kleinwindanlage"];
  for (const slug of obsoleteSlugs) {
    const old = await prisma.product.findUnique({ where: { slug } });
    if (old) {
      await prisma.productVariant.deleteMany({ where: { product_id: old.id } });
      await prisma.product.delete({ where: { id: old.id } });
      console.log(`🗑 Gelöscht: ${slug}`);
    }
  }

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

  // ─── SOLARZAUN STANDARD ──────────────────────────────────────────────────────

  const solarzaunStandard = await prisma.product.upsert({
    where: { slug: "solarzaun-standard" },
    update: {},
    create: {
      slug: "solarzaun-standard",
      product_type: ProductType.configurable,
      status: ProductStatus.active,
      category_id: catSolarzaun.id,
    },
  });

  await upsertTranslation(solarzaunStandard.id, {
    name: "Solarzaun Standard",
    short_description:
      "Solarmodule integriert in hochwertige Zaunelemente – Einfriedung und Stromerzeugung in einem System. Ideal für Wohngrundstücke.",
    description:
      "Der Solarzaun Standard verbindet moderne Photovoltaik mit einer hochwertigen Einfriedung. " +
      "Die integrierten Solarmodule erzeugen zuverlässig Strom, während der Zaun Ihr Grundstück schützt und strukturiert.\n\n" +
      "Geeignet für Privatgrundstücke, Gewerbeflächen und landwirtschaftliche Areale. " +
      "Die Anlage ist modular erweiterbar und lässt sich mit einer Hausbatterie oder direkt ins Netz einspeisen.\n\n" +
      "Verfügbar in den Farben Anthrazit und Grün – passend zu modernen und klassischen Grundstücken.",
  });

  for (const v of [
    { sku: "SZ-3M-ANT", name: "3 m, Anthrazit", price_cents: 129900, attributes: { laenge_m: 3, farbe: "Anthrazit", leistung_wp: 300 } },
    { sku: "SZ-3M-GRN", name: "3 m, Grün",      price_cents: 129900, attributes: { laenge_m: 3, farbe: "Grün",      leistung_wp: 300 } },
    { sku: "SZ-6M-ANT", name: "6 m, Anthrazit", price_cents: 249900, attributes: { laenge_m: 6, farbe: "Anthrazit", leistung_wp: 600 } },
    { sku: "SZ-6M-GRN", name: "6 m, Grün",      price_cents: 249900, attributes: { laenge_m: 6, farbe: "Grün",      leistung_wp: 600 } },
  ]) {
    const variant = await prisma.productVariant.upsert({
      where: { sku: v.sku },
      update: { price_cents: v.price_cents, attributes: v.attributes },
      create: { sku: v.sku, price_cents: v.price_cents, attributes: v.attributes, product_id: solarzaunStandard.id, currency: "EUR" },
    });
    await upsertVariantTranslation(variant.id, v.name);
  }

  // ─── SOLARZAUN GEWERBE ───────────────────────────────────────────────────────

  const solarzaunGewerbe = await prisma.product.upsert({
    where: { slug: "solarzaun-gewerbe" },
    update: {},
    create: {
      slug: "solarzaun-gewerbe",
      product_type: ProductType.configurable,
      status: ProductStatus.active,
      category_id: catSolarzaun.id,
    },
  });

  await upsertTranslation(solarzaunGewerbe.id, {
    name: "Solarzaun Gewerbe",
    short_description:
      "Großflächige Solareinfriedung für Betriebsgelände, Parkplätze und Industrieflächen. Hohe Eigenversorgung, maximale Flächennutzung.",
    description:
      "Der Solarzaun Gewerbe ist für Betriebe, Landwirte und Kommunen konzipiert, die große Freiflächen energetisch nutzen möchten. " +
      "Als Einfriedung für Betriebsgelände, Parkflächen oder Lagerareale erzeugt er nennenswerte Mengen an Eigenstrom.\n\n" +
      "Die robuste Stahlkonstruktion ist für dauerhafte Außenbeanspruchung ausgelegt. " +
      "Auf Wunsch mit integriertem Monitoring und direkter Anbindung an bestehende Energiemanagementsysteme.\n\n" +
      "Preise verstehen sich als Richtpreis – das finale Angebot richtet sich nach Geländeform, Bodenbeschaffenheit und Installationsaufwand.",
  });

  for (const v of [
    { sku: "SZG-12M-ANT", name: "12 m, Anthrazit", price_cents: 490000,  attributes: { laenge_m: 12, farbe: "Anthrazit", leistung_wp: 1200 } },
    { sku: "SZG-25M-ANT", name: "25 m, Anthrazit", price_cents: 980000,  attributes: { laenge_m: 25, farbe: "Anthrazit", leistung_wp: 2500 } },
    { sku: "SZG-50M-ANT", name: "50 m, Anthrazit", price_cents: 1890000, attributes: { laenge_m: 50, farbe: "Anthrazit", leistung_wp: 5000 } },
  ]) {
    const variant = await prisma.productVariant.upsert({
      where: { sku: v.sku },
      update: { price_cents: v.price_cents, attributes: v.attributes },
      create: { sku: v.sku, price_cents: v.price_cents, attributes: v.attributes, product_id: solarzaunGewerbe.id, currency: "EUR" },
    });
    await upsertVariantTranslation(variant.id, v.name);
  }

  // ─── SKYWIND 1 kW ───────────────────────────────────────────────────────────

  const skywind1kw = await prisma.product.upsert({
    where: { slug: "skywind-1kw" },
    update: {},
    create: {
      slug: "skywind-1kw",
      product_type: ProductType.configurable,
      status: ProductStatus.active,
      category_id: catSkywind.id,
    },
  });

  await upsertTranslation(skywind1kw.id, {
    name: "SkyWind 1 kW",
    short_description:
      "Kompakte Kleinwindanlage für Privatgrundstücke. Geräuscharm, wartungsarm, ab 500 m² Grundstücksgröße geeignet.",
    description:
      "Die SkyWind 1 kW ist unsere Einsteigeranlage für private Nutzer mit ausreichend Grundstücksfläche. " +
      "Mit einem Rotordurchmesser von 2,4 m erzeugt sie bei guten Windverhältnissen bis zu 2.000 kWh im Jahr.\n\n" +
      "Das kompakte Design fügt sich harmonisch in das Grundstück ein. " +
      "Die Anlage arbeitet geräuscharm und wartungsarm – ideal für Wohngebiete und Randlagen.\n\n" +
      "Wählbar mit Standard- oder Mastmontage. Montage durch zertifizierte Partner inklusive.",
  });

  for (const v of [
    { sku: "SW-1KW-STD",  name: "1 kW – Standardmontage",   price_cents: 289900, attributes: { leistung_kw: 1, rotordurchmesser_m: 2.4, zielgruppe: "Privatgrundstück" } },
    { sku: "SW-1KW-MAST", name: "1 kW – inkl. Mastmontage", price_cents: 349900, attributes: { leistung_kw: 1, rotordurchmesser_m: 2.4, zielgruppe: "Privatgrundstück" } },
  ]) {
    const variant = await prisma.productVariant.upsert({
      where: { sku: v.sku },
      update: { price_cents: v.price_cents, attributes: v.attributes },
      create: { sku: v.sku, price_cents: v.price_cents, attributes: v.attributes, product_id: skywind1kw.id, currency: "EUR" },
    });
    await upsertVariantTranslation(variant.id, v.name);
  }

  // ─── SKYWIND 3 kW ───────────────────────────────────────────────────────────

  const skywind3kw = await prisma.product.upsert({
    where: { slug: "skywind-3kw" },
    update: {},
    create: {
      slug: "skywind-3kw",
      product_type: ProductType.configurable,
      status: ProductStatus.active,
      category_id: catSkywind.id,
    },
  });

  await upsertTranslation(skywind3kw.id, {
    name: "SkyWind 3 kW",
    short_description:
      "Leistungsstarke Windanlage für Gewerbe, Höfe und Betriebe. Bis zu 6.000 kWh Jahreserzeugung bei durchschnittlichem Windstandort.",
    description:
      "Die SkyWind 3 kW ist die Wahl für Gewerbebetriebe, landwirtschaftliche Höfe und Kommunen, " +
      "die ihren Eigenstrombedarf deutlich senken wollen. Der Rotor mit 3,8 m Durchmesser erzeugt " +
      "selbst bei mäßigen Windverhältnissen verlässlich Strom.\n\n" +
      "Die Anlage verfügt über ein digitales Monitoring-System und lässt sich problemlos mit einer Photovoltaikanlage kombinieren. " +
      "Geeignet für Freiflächen mit mindestens 2.000 m² Abstand zur nächsten Bebauung.",
  });

  for (const v of [
    { sku: "SW-3KW-STD",  name: "3 kW – Standardmontage",   price_cents: 649900, attributes: { leistung_kw: 3, rotordurchmesser_m: 3.8, zielgruppe: "Gewerbe / Hof" } },
    { sku: "SW-3KW-MAST", name: "3 kW – inkl. Mastmontage", price_cents: 749900, attributes: { leistung_kw: 3, rotordurchmesser_m: 3.8, zielgruppe: "Gewerbe / Hof" } },
  ]) {
    const variant = await prisma.productVariant.upsert({
      where: { sku: v.sku },
      update: { price_cents: v.price_cents, attributes: v.attributes },
      create: { sku: v.sku, price_cents: v.price_cents, attributes: v.attributes, product_id: skywind3kw.id, currency: "EUR" },
    });
    await upsertVariantTranslation(variant.id, v.name);
  }

  // ─── SKYWIND 5 kW ───────────────────────────────────────────────────────────

  const skywind5kw = await prisma.product.upsert({
    where: { slug: "skywind-5kw" },
    update: {},
    create: {
      slug: "skywind-5kw",
      product_type: ProductType.configurable,
      status: ProductStatus.active,
      category_id: catSkywind.id,
    },
  });

  await upsertTranslation(skywind5kw.id, {
    name: "SkyWind 5 kW",
    short_description:
      "Industrieanlage für Landwirtschaft und Großgewerbe. Bis zu 10.000 kWh/Jahr – maximale Autarkie für große Objekte.",
    description:
      "Die SkyWind 5 kW ist unsere leistungsstärkste Anlage für landwirtschaftliche Betriebe und Großgewerbe. " +
      "Mit 5,2 m Rotordurchmesser und einer Nennleistung von 5 kW erzeugt sie bei mittlerem Windstandort " +
      "ca. 8.000–10.000 kWh Strom pro Jahr.\n\n" +
      "Ideal für Betriebe mit hohem Eigenstrombedarf: Milchwirtschaft, Lagerhaltung, Verarbeitungsbetriebe. " +
      "Die Anlage lässt sich in ein bestehendes Energiemanagement integrieren.",
  });

  const sw5kw = await prisma.productVariant.upsert({
    where: { sku: "SW-5KW-STD" },
    update: { price_cents: 989900 },
    create: {
      sku: "SW-5KW-STD",
      price_cents: 989900,
      currency: "EUR",
      product_id: skywind5kw.id,
      attributes: { leistung_kw: 5, rotordurchmesser_m: 5.2, zielgruppe: "Landwirtschaft / Großgewerbe" },
    },
  });
  await upsertVariantTranslation(sw5kw.id, "5 kW – Komplettanlage");

  // ─── SOLAR + WIND KOMBILÖSUNG ────────────────────────────────────────────────

  const kombi = await prisma.product.upsert({
    where: { slug: "solar-wind-kombiloesung" },
    update: {},
    create: {
      slug: "solar-wind-kombiloesung",
      product_type: ProductType.inquiry_only,
      status: ProductStatus.active,
      category_id: catKombi.id,
    },
  });

  await upsertTranslation(kombi.id, {
    name: "Solar + Wind Kombilösung",
    short_description:
      "Die perfekte Kombination aus Solarzaun und SkyWind – maximale Autarkie durch ganzjährige Stromerzeugung bei jedem Wetter.",
    description:
      "Wenn die Sonne nicht scheint, weht oft Wind – und umgekehrt. " +
      "Unsere Kombilösung vereint einen Solarzaun mit einer SkyWind-Anlage zu einem ganzjährig effizienten Energiesystem.\n\n" +
      "Die individuelle Planung berücksichtigt Ihre Fläche, Ihren Energiebedarf und lokale Windverhältnisse. " +
      "Auf Wunsch ergänzen wir die Anlage um einen Batteriespeicher für maximale Eigenversorgung.\n\n" +
      "Jede Kombilösung ist ein Einzelprojekt – kein Standardpaket. " +
      "Sprechen Sie uns an, und wir erstellen Ihnen ein maßgeschneidertes Konzept.",
  });

  for (const v of [
    { sku: "KO-STANDARD-RICHTPREIS", name: "Kombiprojekt Privat (Richtpreis)",  price_cents: 450000,  attributes: { hinweis: "Individuelles Angebot auf Anfrage" } },
    { sku: "KO-GEWERBE-RICHTPREIS",  name: "Kombiprojekt Gewerbe (Richtpreis)", price_cents: 1200000, attributes: { hinweis: "Individuelles Angebot auf Anfrage" } },
  ]) {
    const variant = await prisma.productVariant.upsert({
      where: { sku: v.sku },
      update: { price_cents: v.price_cents },
      create: { sku: v.sku, price_cents: v.price_cents, attributes: v.attributes, product_id: kombi.id, currency: "EUR" },
    });
    await upsertVariantTranslation(variant.id, v.name);
  }

  // ─── Demo-Bilder (Karussell-Test) ───────────────────────────────────────────

  const demoImages: { product_id: string; images: { url: string; alt: string; sort_order: number }[] }[] = [
    {
      product_id: solarzaunStandard.id,
      images: [
        { url: "https://picsum.photos/seed/sz-main/800/600",    alt: "Solarzaun am Wohnhaus",    sort_order: 0 },
        { url: "https://picsum.photos/seed/sz-detail/800/600",  alt: "Solarzaun Detailansicht",  sort_order: 1 },
        { url: "https://picsum.photos/seed/sz-garten/800/600",  alt: "Solarzaun im Garten",      sort_order: 2 },
        { url: "https://picsum.photos/seed/sz-montage/800/600", alt: "Solarzaun Montage",         sort_order: 3 },
      ],
    },
    {
      product_id: skywind5kw.id,
      images: [
        { url: "https://picsum.photos/seed/sw5-main/800/600",    alt: "SkyWind 5 kW Anlage",          sort_order: 0 },
        { url: "https://picsum.photos/seed/sw5-rotor/800/600",   alt: "SkyWind Rotor Nahaufnahme",     sort_order: 1 },
        { url: "https://picsum.photos/seed/sw5-standort/800/600",alt: "SkyWind Standort Gewerbe",      sort_order: 2 },
        { url: "https://picsum.photos/seed/sw5-tech/800/600",    alt: "SkyWind Technische Details",    sort_order: 3 },
      ],
    },
  ];

  for (const { product_id, images } of demoImages) {
    await prisma.productImage.deleteMany({ where: { product_id } });
    await prisma.productImage.createMany({ data: images.map((img) => ({ ...img, product_id })) });
  }

  console.log("✅ Kategorien:", [catSolarzaun.slug, catSkywind.slug, catKombi.slug].join(", "));
  console.log("✅ Produkte:", [
    solarzaunStandard.slug,
    solarzaunGewerbe.slug,
    skywind1kw.slug,
    skywind3kw.slug,
    skywind5kw.slug,
    kombi.slug,
  ].join(", "));

  // ─── Demo-Blogbeiträge ────────────────────────────────────────────────────────

  await prisma.blogPost.deleteMany({
    where: { slug: { in: ["solarzaun-ratgeber", "kleinwindanlage-faq"] } },
  });

  await prisma.blogPost.createMany({
    data: [
      {
        slug: "solarzaun-ratgeber",
        title: "Solarzaun: So verwandeln Sie Ihren Zaun in ein Kraftwerk",
        excerpt: "Ein Solarzaun erzeugt Strom, grenzt Ihr Grundstück ab und sieht dabei modern aus. Wir erklären, wie es funktioniert und für wen es sich lohnt.",
        content: `<h2>Was ist ein Solarzaun?</h2>
<p>Ein Solarzaun kombiniert die Funktion eines klassischen Einfriedungszauns mit der Stromerzeugung durch integrierte Solarmodule. Die Module sind vertikal angebracht – ideal für Grundstücksgrenzen, Gärten und Gewerbeflächen.</p>
<h2>Vorteile gegenüber herkömmlichen Dachmodulen</h2>
<ul>
  <li><strong>Doppelte Nutzung:</strong> Zaun und Kraftwerk in einem.</li>
  <li><strong>Keine Dachstatik notwendig:</strong> Ideal für ältere Gebäude.</li>
  <li><strong>Sichtschutz + Ästhetik:</strong> Modernes Design, das sich ins Gesamtbild fügt.</li>
  <li><strong>Förderfähig:</strong> In vielen Bundesländern als Photovoltaikanlage förderbar.</li>
</ul>
<h2>Für wen lohnt sich ein Solarzaun?</h2>
<p>Besonders interessant ist der Solarzaun für Hausbesitzer mit großen Grundstücken, Landwirte mit weitläufigen Hofanlagen sowie Gewerbebetriebe, die Einfriedung und Energieerzeugung kombinieren möchten.</p>
<h2>Jetzt Beratung anfragen</h2>
<p>Wir analysieren kostenlos Ihr Grundstück und zeigen Ihnen, welche Leistung mit einem Solarzaun möglich ist.</p>`,
        author: "Redaktion SolarWind",
        tags: ["Solarzaun", "Photovoltaik", "Ratgeber"],
        status: "published" as const,
        published_at: new Date("2026-04-01"),
      },
      {
        slug: "kleinwindanlage-faq",
        title: "Kleinwindanlage SkyWind – Die 10 häufigsten Fragen",
        excerpt: "Wie viel Strom erzeugt eine Kleinwindanlage? Brauche ich eine Genehmigung? Wir beantworten die wichtigsten Fragen rund um SkyWind.",
        content: `<h2>1. Wie viel Strom erzeugt SkyWind?</h2>
<p>Je nach Modell und Standort erzeugt eine SkyWind-Anlage zwischen 1.000 und 8.000 kWh pro Jahr. Mit einer 5-kW-Anlage an einem windreichen Standort können Sie einen Großteil Ihres Haushaltsstroms selbst produzieren.</p>
<h2>2. Brauche ich eine Genehmigung?</h2>
<p>In den meisten Bundesländern ist für Kleinwindanlagen bis 10 m Nabenhöhe keine Baugenehmigung erforderlich. Wir unterstützen Sie bei der Klärung der lokalen Vorschriften.</p>
<h2>3. Wie laut ist eine Kleinwindanlage?</h2>
<p>Moderne Kleinwindanlagen wie SkyWind arbeiten mit deutlich reduziertem Geräuschpegel. Im Normalbetrieb liegt der Schallpegel bei ca. 35–45 dB(A) – vergleichbar mit einem ruhigen Büro.</p>
<h2>4. Kann ich Solar und Wind kombinieren?</h2>
<p>Ja – unsere Kombilösungen verbinden SkyWind mit Solarzaun-Modulen für eine wetterunabhängige Eigenversorgung. Wind erzeugt Strom, wenn die Sonne nicht scheint, und umgekehrt.</p>`,
        author: "Redaktion SolarWind",
        tags: ["SkyWind", "Kleinwindanlage", "FAQ"],
        status: "published" as const,
        published_at: new Date("2026-04-10"),
      },
    ],
  });

  console.log("📝 Demo-Blogbeiträge angelegt.");
  console.log("🌱 Seed abgeschlossen.");
}

main()
  .catch((e) => {
    console.error("❌ Seed fehlgeschlagen:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
