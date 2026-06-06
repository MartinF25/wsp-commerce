/**
 * Blog-Seed: SkyWind NG Content Cluster
 *
 * Erstellt 5 SEO-optimierte Blogbeiträge mit DE + EN + ES Übersetzungen.
 * Lauf: cd apps/commerce && pnpm ts-node prisma/blog-seed-skywind.ts
 *
 * Idempotent: upsert auf slug, bestehende Einträge werden aktualisiert.
 */

import { PrismaClient, BlogStatus, Locale } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Hilfsfunktion: Blog-Tag upsert ───────────────────────────────────────────

async function upsertTag(slug: string, name: string) {
  return prisma.blogTag.upsert({
    where: { slug },
    update: { name },
    create: { slug, name },
  });
}

// ─── Hilfsfunktion: Blog-Kategorie upsert ────────────────────────────────────

async function upsertBlogCategory(
  slug: string,
  translations: { locale: Locale; name: string; description?: string }[]
) {
  const cat = await prisma.blogCategory.upsert({
    where: { slug },
    update: {},
    create: { slug },
  });
  for (const t of translations) {
    await prisma.blogCategoryTranslation.upsert({
      where: { category_id_locale: { category_id: cat.id, locale: t.locale } },
      update: { name: t.name, description: t.description },
      create: { category_id: cat.id, locale: t.locale, name: t.name, description: t.description },
    });
  }
  return cat;
}

// ─── Hilfsfunktion: Blogbeitrag mit Übersetzungen upsert ─────────────────────

async function upsertBlogPost(opts: {
  slug: string;
  status?: BlogStatus;
  featured?: boolean;
  published_at?: Date;
  reading_time_minutes?: number;
  author_name?: string;
  cover_image_url?: string;
  cover_image_alt?: string;
  category_id?: string;
  tags?: string[];
  translations: {
    locale: Locale;
    title: string;
    excerpt: string;
    content: string;
    meta_title?: string;
    meta_description?: string;
  }[];
}) {
  const post = await prisma.blogPost.upsert({
    where: { slug: opts.slug },
    update: {
      status: opts.status ?? BlogStatus.published,
      featured: opts.featured ?? false,
      published_at: opts.published_at ?? new Date(),
      reading_time_minutes: opts.reading_time_minutes,
      author_name: opts.author_name,
      cover_image_url: opts.cover_image_url,
      cover_image_alt: opts.cover_image_alt,
      category_id: opts.category_id,
    },
    create: {
      slug: opts.slug,
      status: opts.status ?? BlogStatus.published,
      featured: opts.featured ?? false,
      published_at: opts.published_at ?? new Date(),
      reading_time_minutes: opts.reading_time_minutes,
      author_name: opts.author_name,
      cover_image_url: opts.cover_image_url,
      cover_image_alt: opts.cover_image_alt,
      category_id: opts.category_id,
    },
  });

  for (const t of opts.translations) {
    await prisma.blogPostTranslation.upsert({
      where: { post_id_locale: { post_id: post.id, locale: t.locale } },
      update: {
        title: t.title,
        excerpt: t.excerpt,
        content: t.content,
        meta_title: t.meta_title,
        meta_description: t.meta_description,
      },
      create: {
        post_id: post.id,
        locale: t.locale,
        title: t.title,
        excerpt: t.excerpt,
        content: t.content,
        meta_title: t.meta_title,
        meta_description: t.meta_description,
      },
    });
  }

  if (opts.tags && opts.tags.length > 0) {
    await prisma.blogPostTag.deleteMany({ where: { post_id: post.id } });
    for (const tagSlug of opts.tags) {
      const tag = await prisma.blogTag.findUnique({ where: { slug: tagSlug } });
      if (tag) {
        await prisma.blogPostTag.upsert({
          where: { post_id_tag_id: { post_id: post.id, tag_id: tag.id } },
          update: {},
          create: { post_id: post.id, tag_id: tag.id },
        });
      }
    }
  }

  return post;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Blog-Seed: SkyWind NG Content Cluster startet …");

  // Tags anlegen
  const tags = {
    skywindNg: await upsertTag("skywind-ng", "SkyWind NG"),
    kleinwindanlage: await upsertTag("kleinwindanlage", "Kleinwindanlage"),
    windenergie: await upsertTag("windenergie", "Windenergie"),
    photovoltaik: await upsertTag("photovoltaik", "Photovoltaik"),
    ratgeber: await upsertTag("ratgeber", "Ratgeber"),
    wirtschaftlichkeit: await upsertTag("wirtschaftlichkeit", "Wirtschaftlichkeit"),
    kombiloesung: await upsertTag("kombiloesung", "Kombilösung"),
  };

  // Blog-Kategorie
  const catSkywind = await upsertBlogCategory("skywind-ng", [
    { locale: Locale.de, name: "SkyWind NG", description: "Alles rund um die SkyWind NG Kleinwindanlage" },
    { locale: Locale.en, name: "SkyWind NG", description: "Everything about the SkyWind NG small wind turbine" },
    { locale: Locale.es, name: "SkyWind NG", description: "Todo sobre el pequeño aerogenerador SkyWind NG" },
  ]);

  console.log("  ✓ Tags + Kategorie angelegt");

  // ── Artikel 1: SkyWind NG Erfahrungen ────────────────────────────────────────

  await upsertBlogPost({
    slug: "skywind-ng-erfahrungen",
    status: BlogStatus.published,
    featured: true,
    published_at: new Date("2026-06-01"),
    reading_time_minutes: 8,
    author_name: "WSP Solarenergie Redaktion",
    cover_image_url: "/images/skywind-hero.png",
    cover_image_alt: "SkyWind NG Kleinwindanlage im Betrieb",
    category_id: catSkywind.id,
    tags: ["skywind-ng", "kleinwindanlage", "ratgeber"],
    translations: [
      {
        locale: Locale.de,
        title: "SkyWind NG Erfahrungen – Was Kunden nach einem Jahr berichten",
        excerpt:
          "Wie schlägt sich die SkyWind NG im Alltag? Wir haben Betreiber nach ihren Erfahrungen befragt und zusammengefasst, was die Anlage wirklich leistet – und wo Grenzen liegen.",
        meta_title: "SkyWind NG Erfahrungen 2026 – Praxisberichte & Kundenmeinungen | WSP",
        meta_description:
          "SkyWind NG Erfahrungen aus der Praxis: Ertrag, Geräusch, Montage und Genehmigung. Was Betreiber nach einem Jahr wirklich berichten.",
        content: `## SkyWind NG Erfahrungen: Was Betreiber wirklich sagen

Die SkyWind NG ist seit einigen Jahren auf dem Markt – genug Zeit, um echte Erfahrungen von Betreibern zu sammeln. Als autorisierter Händler und Installationspartner haben wir direkten Kontakt zu unseren Kunden und können berichten, was die Anlage in der Praxis wirklich leistet.

### Erfahrung 1: Ertrag und Windverhältnisse

Der häufigste Feedback-Punkt betrifft den Ertrag. Betreiber an **windgünstigen Standorten** (offene Lagen, Küstennähe, erhöhte Grundstücke) berichten von Jahreserträgen zwischen **1.800 und 3.200 kWh** mit der SkyWind NG 1kW. Die 2kW-Variante erreicht an optimalen Standorten bis zu **5.000 kWh pro Jahr**.

Die Kehrseite: An windschwachen Standorten – dichte Bebauung, stark geschützte Tallage – bleibt der Ertrag deutlich hinter den Erwartungen. **Unsere Empfehlung:** Vor dem Kauf immer eine Standortanalyse durchführen lassen. Wir empfehlen die SkyWind NG nur, wenn die Windverhältnisse tatsächlich ausreichen.

> „Ich habe die SkyWind NG 2kW jetzt ein Jahr auf meinem Grundstück in der Lüneburger Heide. Der Jahresertrag lag bei 4.100 kWh – das übertrifft meine ursprüngliche Erwartung deutlich." – Betreiber, Niedersachsen

### Erfahrung 2: Geräuschpegel im Alltag

Ein häufiger Einwand gegen Kleinwindanlagen ist der befürchtete Lärm. Die Erfahrungen mit der SkyWind NG sind hier **überwiegend positiv**: Die meisten Betreiber berichten, dass die Anlage im normalen Betrieb kaum wahrnehmbar ist.

Gemessene Werte liegen bei **42–47 dB(A)** in 10 Metern Entfernung – vergleichbar mit einem ruhigen Gespräch oder einem leichten Geräusch im Hintergrund. Bei Nennwindgeschwindigkeit (ab ca. 10 m/s) ist ein deutlicheres Rauschen hörbar, das jedoch im Bereich erlaubter Werte liegt.

**Wichtig:** Betreiber, die die Anlage direkt am Schlafzimmerfenster oder in sehr ruhiger Wohnlage installiert haben, berichten von störenderem Empfinden. Die Montage sollte möglichst weit vom Wohnbereich erfolgen.

### Erfahrung 3: Montage und Installation

Die meisten Kunden berichten von einer **problemlosen Montage** durch unsere zertifizierten Partner. Typische Montagezeit für eine SkyWind NG inklusive Flanschmast: **ein halber bis ein Arbeitstag**.

Herausforderungen entstehen bei:
- **Schwierigem Untergrund** (Felsgestein, sehr sandiger Boden) → erhöhter Aufwand beim Mastfundament
- **Sehr alten Gebäuden** bei Dachmontage → Statikprüfung empfohlen
- **Netzanschluss** → je nach Entfernung zum Hausanschluss kann eine Erdkabelverlegung nötig sein

### Erfahrung 4: Genehmigung in der Praxis

Die Genehmigungslage variiert stark nach Bundesland und Gemeinde. Unsere Kunden berichten:

- **Niedersachsen, Sachsen-Anhalt, Mecklenburg-Vorpommern:** In der Regel genehmigungsfrei bis 10 m Masthöhe
- **Bayern, Baden-Württemberg:** Häufiger Baugenehmigung erforderlich, teils lange Bearbeitungszeiten
- **NRW, Hessen:** Gemischt – von Gemeinde zu Gemeinde verschieden

**Unser Service:** Wir unterstützen Sie bei der Klärung der Genehmigungspflicht und begleiten Sie bei Bedarf durch den Antragsprozess.

### Erfahrung 5: Kombination mit Photovoltaik

Besonders positiv fallen die Erfahrungen aus, wenn die SkyWind NG **zusammen mit einer Photovoltaik-Anlage** betrieben wird. Die Ergänzung ist saisonal ideal:

- **Winter/Herbst:** Wind liefert mehr, Solar weniger → SkyWind übernimmt
- **Sommer:** Solar auf Hochleistung, Wind als Ergänzung
- **Bewölkte Tage:** Wind produziert, Solar wenig → SkyWind sichert Grundlast

Mit einem Batteriespeicher berichten Kombinations-Betreiber von **Eigenversorgungsquoten zwischen 65 und 80 Prozent** – deutlich mehr als mit Solar allein.

### Fazit: Für wen lohnt sich die SkyWind NG?

Die SkyWind NG ist eine **zuverlässige Kleinwindanlage** – wenn der Standort stimmt. Die ehrlichen Erfahrungen unserer Kunden zeigen:

✓ Windreiche Standorte: Ja, lohnt sich
✓ Kombination mit PV: Deutlicher Mehrwert
✓ Geräuschbelastung: Im Rahmen, bei weitem Abstand zum Wohnbereich unproblematisch
✗ Windschwache Lagen: Nicht empfohlen
✗ Dichte Innenstadtlage: Wirtschaftlichkeit fraglich

Möchten Sie erfahren, ob Ihr Standort für die SkyWind NG geeignet ist? [Jetzt Standort prüfen lassen](/kontakt).

Weitere Informationen zur SkyWind NG finden Sie auf unserer [SkyWind NG Produktseite](/skywind-ng).`,
      },
      {
        locale: Locale.en,
        title: "SkyWind NG Reviews – What Customers Report After One Year",
        excerpt:
          "How does the SkyWind NG perform in everyday use? We gathered real user experiences on yield, noise, installation and permits.",
        meta_title: "SkyWind NG Reviews 2026 – Real User Experiences | WSP Solarenergie",
        meta_description:
          "SkyWind NG real-world reviews: yield, noise levels, installation and permit requirements from actual operators.",
        content: `## SkyWind NG Reviews: Real-World Experiences

The SkyWind NG has been on the market for several years, giving us enough time to collect genuine feedback from operators. As an authorized dealer and installation partner, we have direct contact with our customers.

### Yield and Wind Conditions

Operators at **wind-favorable locations** (open terrain, coastal areas, elevated plots) report annual yields between **1,800 and 3,200 kWh** with the SkyWind NG 1kW. The 2kW version reaches up to **5,000 kWh per year** at optimal sites.

**Our recommendation:** Always have a site analysis done before purchasing. We only recommend the SkyWind NG if wind conditions are genuinely sufficient.

### Noise Levels

Most operators report that the SkyWind NG is barely noticeable in normal operation. Measured values are **42–47 dB(A)** at 10 meters – comparable to a quiet conversation.

### Installation

Typical installation time for a SkyWind NG including flange mast: **half to one working day** when performed by our certified partners.

### Combination with Solar

The most positive feedback comes from operators running the SkyWind NG **together with a photovoltaic system**. With a battery storage system, combination operators report **self-sufficiency rates between 65 and 80 percent**.

For more details, visit our [SkyWind NG product page](/skywind-ng).`,
      },
      {
        locale: Locale.es,
        title: "SkyWind NG Experiencias – Qué Reportan los Clientes Tras un Año",
        excerpt:
          "¿Cómo funciona el SkyWind NG en la práctica? Recopilamos experiencias reales sobre rendimiento, ruido, instalación y permisos.",
        meta_title: "SkyWind NG Experiencias 2026 – Opiniones Reales de Usuarios | WSP",
        meta_description:
          "Experiencias reales con el SkyWind NG: rendimiento, nivel de ruido, instalación y requisitos de permisos según operadores.",
        content: `## SkyWind NG Experiencias: Opiniones Reales

El SkyWind NG lleva varios años en el mercado, tiempo suficiente para recopilar opiniones genuinas de operadores. Como distribuidor autorizado y socio de instalación, tenemos contacto directo con nuestros clientes.

### Rendimiento y Condiciones de Viento

Los operadores en **ubicaciones favorables al viento** (terreno abierto, zonas costeras, terrenos elevados) reportan rendimientos anuales de entre **1.800 y 3.200 kWh** con el SkyWind NG 1kW. La variante de 2kW alcanza hasta **5.000 kWh al año** en sitios óptimos.

### Nivel de Ruido

La mayoría de los operadores reportan que el SkyWind NG es apenas perceptible en funcionamiento normal. Los valores medidos son **42–47 dB(A)** a 10 metros, comparable a una conversación tranquila.

### Combinación con Energía Solar

Los comentarios más positivos provienen de operadores que usan el SkyWind NG **junto con un sistema fotovoltaico**. Con almacenamiento de batería, los operadores de combinación reportan **tasas de autosuficiencia de entre el 65 y el 80 por ciento**.

Para más información, visita nuestra [página de producto SkyWind NG](/skywind-ng).`,
      },
    ],
  });

  console.log("  ✓ Artikel 1: SkyWind NG Erfahrungen");

  // ── Artikel 2: SkyWind NG vs Photovoltaik ────────────────────────────────────

  await upsertBlogPost({
    slug: "skywind-ng-vs-photovoltaik",
    status: BlogStatus.published,
    featured: true,
    published_at: new Date("2026-06-03"),
    reading_time_minutes: 7,
    author_name: "WSP Solarenergie Redaktion",
    cover_image_url: "/images/skywind-rooftop.png",
    cover_image_alt: "SkyWind NG und Photovoltaik im Vergleich",
    category_id: catSkywind.id,
    tags: ["skywind-ng", "photovoltaik", "ratgeber", "kombiloesung"],
    translations: [
      {
        locale: Locale.de,
        title: "SkyWind NG vs. Photovoltaik – Was leistet was, und wann kombinieren?",
        excerpt:
          "Solar oder Wind? Oder beides? Wir vergleichen die SkyWind NG Kleinwindanlage direkt mit einer Dach-PV-Anlage – nach Ertrag, Kosten, Standortanforderungen und Wirtschaftlichkeit.",
        meta_title: "SkyWind NG vs. Photovoltaik 2026 – Vergleich Ertrag & Kosten | WSP",
        meta_description:
          "SkyWind NG Kleinwindanlage vs. Photovoltaik: Direktvergleich nach Ertrag, Kosten, Standortbedarf und Wirtschaftlichkeit – wann sich was lohnt.",
        content: `## SkyWind NG vs. Photovoltaik – Der direkte Vergleich

Kleinwindanlage oder Solaranlage? Für viele Eigenheimbesitzer und Gewerbetreibende ist das eine der ersten Fragen, wenn es um dezentrale Stromerzeugung geht. Die kurze Antwort: Es kommt auf Ihren Standort an – und oft macht eine Kombination aus beidem am meisten Sinn.

### Unterschied 1: Wann wird Strom erzeugt?

Dies ist der fundamentale Unterschied zwischen Wind und Solar:

| | SkyWind NG | Photovoltaik |
|---|---|---|
| Sommer, sonnig | Gering bis mittel | **Maximal** |
| Winter, bewölkt | **Hoch** | Gering |
| Nacht | Ja (wenn Wind) | Nein |
| Regen, Sturm | Ja | Kaum |
| Stabiler Jahresverlauf | **Gleichmäßiger** | Saisonal stark |

Die SkyWind NG erzeugt **das ganze Jahr über Strom** – auch nachts und bei Bewölkung. Photovoltaik hat dagegen einen starken saisonalen Charakter mit Höchstleistung im Sommer.

**Fazit:** Wind und Solar ergänzen sich ideal. Der Eigenverbrauch lässt sich durch Kombination erheblich steigern.

### Unterschied 2: Standortanforderungen

**Photovoltaik** funktioniert nahezu überall in Deutschland – selbst bei Nord-Ausrichtung lässt sich ein Ertrag erzielen. Entscheidend ist freie Dach- oder Freifläche mit möglichst wenig Verschattung.

**SkyWind NG** braucht ausreichenden Wind. Faustregel: Mindestens **4 m/s mittlere Jahreswindgeschwindigkeit** für wirtschaftlichen Betrieb. Das ist vor allem gegeben bei:
- Offenen Lagen (wenig Bebauung und Bewuchs im Umkreis)
- Küstennähe (Nord- und Ostseeküste, Inseln)
- Erhöhten Standorten (Bergrücken, Hänge)
- Landwirtschaftlichen Freiflächen

In dichten Stadtlagen oder windgeschützten Tälern ist die PV in der Regel die bessere Wahl.

### Unterschied 3: Installationsaufwand

| | SkyWind NG | Dach-PV |
|---|---|---|
| Montagezeit | 0,5–1 Tag | 1–2 Tage |
| Statikanforderungen | Mast/Fundament | Dachstatik |
| Genehmigung | Teils erforderlich | Meist nein |
| Wartungsaufwand | Gering (jährlich prüfen) | Sehr gering |

### Unterschied 4: Kosten und Wirtschaftlichkeit

Die Anschaffungskosten für eine **SkyWind NG 2kW** inklusive Mast und Installation liegen je nach Konfiguration bei ca. **8.000–15.000 €**. Eine vergleichbare **PV-Anlage (5 kWp)** kostet ca. **8.000–12.000 €** (ohne Speicher).

Der **Jahresertrag** ist bei PV in sonnigem Deutschland in der Regel höher – außer Sie befinden sich in einer ausgesprochenen Windregion.

**Amortisation:**
- PV-Anlage: typisch 8–12 Jahre
- SkyWind NG: bei gutem Standort ebenfalls 8–12 Jahre

### Wann macht welche Lösung Sinn?

**Photovoltaik zuerst**, wenn:
- Ihr Standort gut geeignet ist (freies Dach, Süd-Ausrichtung)
- Wind an Ihrem Standort schwach ist (< 4 m/s)
- Budget begrenzt ist → besseres Preis-Leistungs-Verhältnis

**SkyWind NG sinnvoll**, wenn:
- Ihr Standort windig ist (> 4 m/s)
- Das Dach bereits belegt, ungünstig ausgerichtet oder nicht verfügbar ist
- Sie eine stabile Stromerzeugung auch im Winter möchten
- Sie sowieso eine Einfriedung/Masten benötigen

**Kombination empfohlen**, wenn:
- Ausreichend Platz und Budget vorhanden
- Maximale Autarkie angestrebt wird
- Saisonale Unterschiede ausgeglichen werden sollen

### Fazit

Für die meisten Eigenheimbesitzer ist **Photovoltaik der erste Schritt** – zuverlässig, günstig, überall funktionsfähig. Die SkyWind NG ist eine **sinnvolle Ergänzung** für windreiche Standorte, die auch nachts und im Winter Strom erzeugen und ihre Autarkie maximieren wollen.

Mehr über die [SkyWind NG Kleinwindanlage](/skywind-ng) oder direkt [Beratung anfragen](/kontakt).`,
      },
      {
        locale: Locale.en,
        title: "SkyWind NG vs. Photovoltaics – What Does What, and When to Combine?",
        excerpt:
          "Wind or solar? Or both? We compare the SkyWind NG small wind turbine directly with a rooftop PV system by yield, costs, site requirements and economics.",
        meta_title: "SkyWind NG vs. Solar PV 2026 – Yield & Cost Comparison | WSP",
        meta_description:
          "SkyWind NG vs. photovoltaics: direct comparison by yield, costs, site requirements and economics – which pays off when.",
        content: `## SkyWind NG vs. Photovoltaics – Direct Comparison

Small wind turbine or solar panels? For many homeowners, this is one of the first questions about decentralized power generation. The short answer: it depends on your location – and often a combination of both makes the most sense.

### When Is Power Generated?

| | SkyWind NG | Photovoltaics |
|---|---|---|
| Summer, sunny | Low to medium | **Maximum** |
| Winter, overcast | **High** | Low |
| Night | Yes (when windy) | No |
| Year-round stability | **More even** | Seasonal |

The SkyWind NG generates **power all year round** – even at night and in overcast conditions. Solar has strong seasonal characteristics with peak output in summer.

### Site Requirements

**Photovoltaics** works almost everywhere. **SkyWind NG** needs sufficient wind – at least **4 m/s average annual wind speed** for economical operation.

### When Does Each Solution Make Sense?

**Photovoltaics first** when your site has good solar exposure and weak winds.

**SkyWind NG** makes sense when your site is windy, the roof is already occupied, or you want stable winter production.

**Combination recommended** for maximum self-sufficiency.

Learn more about the [SkyWind NG wind turbine](/skywind-ng) or [request a consultation](/kontakt).`,
      },
      {
        locale: Locale.es,
        title: "SkyWind NG vs. Fotovoltaica – ¿Qué Hace Qué y Cuándo Combinarlos?",
        excerpt:
          "¿Viento o solar? ¿O ambos? Comparamos el aerogenerador SkyWind NG con una instalación fotovoltaica en tejado según rendimiento, costes y requisitos de ubicación.",
        meta_title: "SkyWind NG vs. Fotovoltaica 2026 – Comparativa Rendimiento | WSP",
        meta_description:
          "SkyWind NG vs. fotovoltaica: comparativa directa por rendimiento, costes, requisitos de ubicación y rentabilidad.",
        content: `## SkyWind NG vs. Fotovoltaica – Comparativa Directa

¿Aerogenerador pequeño o paneles solares? Para muchos propietarios, esta es una de las primeras preguntas sobre la generación descentralizada de electricidad. La respuesta corta: depende de tu ubicación, y a menudo una combinación de ambos tiene más sentido.

### ¿Cuándo se Genera Electricidad?

El SkyWind NG genera **electricidad durante todo el año**, incluso de noche y en días nublados. La energía solar tiene características estacionales marcadas con producción máxima en verano.

### ¿Cuándo Tiene Sentido Cada Solución?

**Fotovoltaica primero** cuando tu ubicación tiene buena exposición solar y vientos débiles.

**SkyWind NG** tiene sentido cuando tu ubicación es ventosa o el tejado ya está ocupado.

**Combinación recomendada** para máxima autosuficiencia.

Más información sobre el [aerogenerador SkyWind NG](/skywind-ng) o [solicita una consulta](/kontakt).`,
      },
    ],
  });

  console.log("  ✓ Artikel 2: SkyWind NG vs. Photovoltaik");

  // ── Artikel 3: Lohnt sich eine Kleinwindanlage? ────────────────────────────

  await upsertBlogPost({
    slug: "lohnt-sich-kleinwindanlage",
    status: BlogStatus.published,
    featured: false,
    published_at: new Date("2026-06-05"),
    reading_time_minutes: 6,
    author_name: "WSP Solarenergie Redaktion",
    cover_image_url: "/images/skywind-hero.png",
    cover_image_alt: "Kleinwindanlage Wirtschaftlichkeit Ratgeber",
    category_id: catSkywind.id,
    tags: ["kleinwindanlage", "wirtschaftlichkeit", "ratgeber", "skywind-ng"],
    translations: [
      {
        locale: Locale.de,
        title: "Lohnt sich eine Kleinwindanlage? Die ehrliche Antwort für 2026",
        excerpt:
          "Lohnt sich eine Kleinwindanlage wirtschaftlich? Wir liefern die ehrliche Antwort: wann ja, wann nein – und welche Standortbedingungen entscheidend sind.",
        meta_title: "Lohnt sich eine Kleinwindanlage 2026? Wirtschaftlichkeit ehrlich erklärt | WSP",
        meta_description:
          "Lohnt sich eine Kleinwindanlage? Wir erklären, wann eine Investition in Windenergie für Eigenheim und Gewerbe wirtschaftlich sinnvoll ist.",
        content: `## Lohnt sich eine Kleinwindanlage? Die ehrliche Antwort

Vorab: Wir beantworten diese Frage ehrlich – auch wenn das bedeutet, dass wir manchmal sagen müssen: nein, bei Ihnen lohnt es sich nicht. Das ist unser Versprechen.

### Die Kurzantwort

Eine Kleinwindanlage lohnt sich **dann**, wenn:
1. Ihr Standort ausreichend Wind hat (> 4 m/s mittlere Jahreswindgeschwindigkeit)
2. Die Anlage korrekt dimensioniert und montiert wurde
3. Eigenverbrauch oder Einspeisung wirtschaftlich sinnvoll sind

Sie lohnt sich **nicht**, wenn:
1. Ihr Standort windschwach ist (dichte Bebauung, windgeschützte Tallage)
2. Nachbarn rechtliche Einwände erheben könnten
3. Günstigere Alternativen besser passen (z. B. PV)

### Die entscheidenden Faktoren

**Faktor 1: Windgeschwindigkeit**

Die mittlere Jahreswindgeschwindigkeit ist der wichtigste Faktor. Faustregel:

| Windgeschwindigkeit | Wirtschaftlichkeit |
|---|---|
| > 6 m/s | Sehr gut – Anlage empfohlen |
| 4–6 m/s | Gut – Anlage sinnvoll |
| 3–4 m/s | Bedingt – Einzelfallprüfung |
| < 3 m/s | Nicht empfohlen |

Den Windatlas für Ihren Standort finden Sie beim [Deutschen Wetterdienst](https://www.dwd.de/DE/klimaumwelt/klimaatlas/klimaatlas_node.html){:target="_blank"}.

**Faktor 2: Strompreis**

Bei 0,30 €/kWh und einem Jahresertrag von 2.000 kWh beträgt die jährliche Einsparung **600 €**. Steigt der Strompreis, verbessert sich die Wirtschaftlichkeit entsprechend.

**Faktor 3: Eigenverbrauchsquote**

Je mehr des erzeugten Stroms direkt verbraucht (statt eingespeist) wird, desto besser die Wirtschaftlichkeit. Ziel: Eigenverbrauchsquote > 60 %.

**Faktor 4: Fördermittel**

KfW, Landesförderbanken und kommunale Programme können die Investition erheblich entlasten. Aktuelle Programme erfragen Sie im [Beratungsgespräch](/kontakt).

### Rechenbeispiel: SkyWind NG 1kW an einem guten Standort

- Investition: ca. 8.000 € (Anlage + Mast + Montage)
- Jahresertrag: 2.000 kWh
- Einsparung bei 0,30 €/kWh: 600 €/Jahr
- **Amortisation: ca. 13 Jahre**

Bei steigenden Strompreisen oder Fördermitteln verkürzt sich die Amortisation deutlich.

### Unsere Empfehlung

Fragen Sie uns nach einer kostenlosen Standortanalyse. Wir prüfen Ihren Standort, rechnen die Wirtschaftlichkeit durch und sagen Ihnen klar, ob und welche Anlage sich für Sie lohnt.

➜ [Jetzt kostenlose Standortanalyse anfordern](/kontakt)

Mehr zur [SkyWind NG Kleinwindanlage](/skywind-ng).`,
      },
      {
        locale: Locale.en,
        title: "Is a Small Wind Turbine Worth It? The Honest Answer for 2026",
        excerpt:
          "Is a small wind turbine economically viable? We provide the honest answer: when yes, when no, and which site conditions are decisive.",
        meta_title: "Is a Small Wind Turbine Worth It 2026? Honest Economic Analysis | WSP",
        meta_description:
          "Is a small wind turbine worth the investment? We explain when wind energy makes economic sense for homes and businesses.",
        content: `## Is a Small Wind Turbine Worth It? The Honest Answer

A small wind turbine pays off **when** your site has sufficient wind (> 4 m/s annual average) and the system is correctly sized and installed. It does **not** pay off in wind-poor locations or dense urban areas.

### The Key Factors

**Wind speed** is the single most important factor. Rule of thumb: above 4 m/s annual average, a turbine is worth considering. Below 3 m/s, it is generally not recommended.

**Electricity price:** At €0.30/kWh and 2,000 kWh annual yield, annual savings are **€600**.

**Own consumption rate:** The higher the share of self-consumed electricity (vs. grid feed-in), the better the economics.

### Sample Calculation: SkyWind NG 1kW at a Good Site

- Investment: approx. €8,000 (turbine + mast + installation)
- Annual yield: 2,000 kWh
- Annual savings at €0.30/kWh: €600
- **Payback period: approx. 13 years**

Learn more about the [SkyWind NG wind turbine](/skywind-ng) or [request a free site analysis](/kontakt).`,
      },
      {
        locale: Locale.es,
        title: "¿Vale la Pena un Pequeño Aerogenerador? La Respuesta Honesta para 2026",
        excerpt:
          "¿Es rentable económicamente un pequeño aerogenerador? Damos la respuesta honesta: cuándo sí, cuándo no, y qué condiciones de ubicación son decisivas.",
        meta_title: "¿Vale la Pena un Pequeño Aerogenerador 2026? Análisis Económico | WSP",
        meta_description:
          "¿Vale la pena invertir en un pequeño aerogenerador? Explicamos cuándo la energía eólica tiene sentido económico para hogares y empresas.",
        content: `## ¿Vale la Pena un Pequeño Aerogenerador? La Respuesta Honesta

Un pequeño aerogenerador es rentable **cuando** tu ubicación tiene suficiente viento (> 4 m/s de media anual) y el sistema está correctamente dimensionado e instalado. **No** es rentable en ubicaciones con poco viento o zonas urbanas densas.

### Factores Clave

La **velocidad del viento** es el factor más importante. Como regla general: por encima de 4 m/s de media anual, vale la pena considerar un aerogenerador. Por debajo de 3 m/s, generalmente no se recomienda.

### Cálculo de Ejemplo: SkyWind NG 1kW en una Buena Ubicación

- Inversión: aprox. 8.000 € (turbina + mástil + instalación)
- Producción anual: 2.000 kWh
- Ahorro anual a 0,30 €/kWh: **600 €**
- **Periodo de amortización: aprox. 13 años**

Más información sobre el [aerogenerador SkyWind NG](/skywind-ng) o [solicita un análisis de ubicación gratuito](/kontakt).`,
      },
    ],
  });

  console.log("  ✓ Artikel 3: Lohnt sich eine Kleinwindanlage?");

  // ── Artikel 4: SkyWind NG Kosten ─────────────────────────────────────────────

  await upsertBlogPost({
    slug: "skywind-ng-kosten",
    status: BlogStatus.published,
    featured: false,
    published_at: new Date("2026-06-08"),
    reading_time_minutes: 5,
    author_name: "WSP Solarenergie Redaktion",
    cover_image_url: "/images/skywind-hero.png",
    cover_image_alt: "SkyWind NG Kosten und Preise",
    category_id: catSkywind.id,
    tags: ["skywind-ng", "kleinwindanlage", "wirtschaftlichkeit"],
    translations: [
      {
        locale: Locale.de,
        title: "SkyWind NG Kosten 2026 – Preis, Förderung und Amortisation",
        excerpt:
          "Was kostet die SkyWind NG wirklich? Wir schlüsseln alle Kostenbestandteile auf: Anlagenpreis, Mast, Montage, Netzanschluss und Förderoptionen.",
        meta_title: "SkyWind NG Kosten & Preis 2026 – Vollständige Kostenübersicht | WSP",
        meta_description:
          "SkyWind NG Kosten im Überblick: Anlagenpreis, Mast, Montage, Netzanschluss und Förderung. Reale Gesamtkosten für 1kW und 2kW Modell.",
        content: `## SkyWind NG Kosten 2026 – Was kostet die Kleinwindanlage wirklich?

Die Frage nach dem Preis ist berechtigt. Wir schlüsseln alle Kostenkomponenten transparent auf – ohne versteckte Posten.

### Übersicht der Kostenbestandteile

| Kostenkomponente | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| Anlage (inkl. Regler) | ca. 3.500–4.500 € | ca. 5.500–7.000 € |
| Flanschmast (3–6 m) | ca. 500–1.200 € | ca. 800–1.500 € |
| Montage & Installation | ca. 800–1.500 € | ca. 1.200–2.000 € |
| Netzanschluss / Kabel | ca. 300–800 € | ca. 300–800 € |
| **Gesamtkosten (ca.)** | **5.100–8.000 €** | **7.800–11.300 €** |

*Alle Preise sind Richtwerte und hängen von Standort, Konfiguration und Montageaufwand ab.*

### Was ist im Anlagenpreis enthalten?

Der Anlagenpreis umfasst in der Regel:
- Windgenerator mit Rotor
- Laderegler / Wechselrichter
- Naben- und Montagematerial
- Betriebsanleitung und Dokumentation

Nicht enthalten: Mast, Fundament, Montage, Kabel, Netzanschluss.

### Förderung: Was gibt es?

Kleinwindanlagen können in Deutschland über verschiedene Programme gefördert werden:

**KfW Programm 270 (Erneuerbare Energien):** Günstige Kredite für erneuerbare Energieprojekte, auch für Kleinwindanlagen.

**Landesförderung:** Viele Bundesländer haben eigene Förderprogramme. Besonders aktiv sind aktuell Bayern, NRW und Schleswig-Holstein.

**EEG-Einspeisung:** Überschussstrom kann ins Netz eingespeist und vergütet werden. Die aktuelle Vergütung für Kleinanlagen beträgt ca. 7–8 ct/kWh.

### Amortisation im Detail

Beispielrechnung für SkyWind NG 2kW, guter Standort:
- Gesamtinvestition: 9.000 €
- Jahresertrag: 3.500 kWh
- Eigenverbrauch: 70 % → 2.450 kWh × 0,30 €/kWh = **735 €/Jahr Einsparung**
- Einspeisung: 30 % → 1.050 kWh × 0,08 €/kWh = **84 €/Jahr Einspeisung**
- **Gesamtjahresertrag: ca. 819 €**
- **Amortisation: ca. 11 Jahre**

Bei steigenden Strompreisen verbessert sich die Amortisation jedes Jahr.

### Wie erhalte ich ein konkretes Angebot?

Preise für die SkyWind NG finden Sie direkt in unserem [Shop](/products). Für ein vollständiges Projektangebot inklusive Mast, Montage und Netzanschluss [kontaktieren Sie uns](/kontakt) – die Beratung ist kostenlos und unverbindlich.

Mehr zur [SkyWind NG Kleinwindanlage](/skywind-ng).`,
      },
      {
        locale: Locale.en,
        title: "SkyWind NG Cost 2026 – Price, Subsidies and Payback Period",
        excerpt:
          "What does the SkyWind NG actually cost? We break down all cost components: turbine price, mast, installation, grid connection and subsidy options.",
        meta_title: "SkyWind NG Cost & Price 2026 – Complete Cost Overview | WSP",
        meta_description:
          "SkyWind NG costs at a glance: turbine price, mast, installation, grid connection and subsidies. Real total costs for 1kW and 2kW models.",
        content: `## SkyWind NG Cost 2026 – What Does the Small Wind Turbine Really Cost?

We break down all cost components transparently – no hidden items.

### Cost Overview

| Cost Component | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| Turbine (incl. controller) | approx. €3,500–4,500 | approx. €5,500–7,000 |
| Flange mast (3–6 m) | approx. €500–1,200 | approx. €800–1,500 |
| Installation | approx. €800–1,500 | approx. €1,200–2,000 |
| Grid connection / cable | approx. €300–800 | approx. €300–800 |
| **Total cost (approx.)** | **€5,100–8,000** | **€7,800–11,300** |

### Subsidies

Small wind turbines in Germany can be funded through KfW Program 270 (Renewable Energy) and various state programs. Feed-in compensation under EEG is approx. 7–8 ct/kWh.

View current [SkyWind NG prices in our shop](/products) or [request a free consultation](/kontakt).`,
      },
      {
        locale: Locale.es,
        title: "SkyWind NG Costes 2026 – Precio, Subvenciones y Amortización",
        excerpt:
          "¿Qué cuesta realmente el SkyWind NG? Desglosamos todos los componentes de coste: precio del equipo, mástil, instalación, conexión a red y opciones de subvención.",
        meta_title: "SkyWind NG Costes y Precio 2026 – Resumen Completo | WSP",
        meta_description:
          "Costes del SkyWind NG: precio del equipo, mástil, instalación, conexión a red y subvenciones. Costes totales reales para modelos de 1kW y 2kW.",
        content: `## SkyWind NG Costes 2026 – ¿Cuánto Cuesta Realmente el Pequeño Aerogenerador?

Desglosamos todos los componentes de coste de forma transparente.

### Resumen de Costes

| Componente de Coste | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| Turbina (incl. controlador) | aprox. 3.500–4.500 € | aprox. 5.500–7.000 € |
| Mástil de brida (3–6 m) | aprox. 500–1.200 € | aprox. 800–1.500 € |
| Instalación | aprox. 800–1.500 € | aprox. 1.200–2.000 € |
| Conexión a red / cable | aprox. 300–800 € | aprox. 300–800 € |
| **Coste total (aprox.)** | **5.100–8.000 €** | **7.800–11.300 €** |

Consulta los precios actuales del [SkyWind NG en nuestra tienda](/products) o [solicita una consulta gratuita](/kontakt).`,
      },
    ],
  });

  console.log("  ✓ Artikel 4: SkyWind NG Kosten");

  // ── Artikel 5: Kleinwindanlage Einfamilienhaus ────────────────────────────────

  await upsertBlogPost({
    slug: "kleinwindanlage-einfamilienhaus",
    status: BlogStatus.published,
    featured: false,
    published_at: new Date("2026-06-10"),
    reading_time_minutes: 6,
    author_name: "WSP Solarenergie Redaktion",
    cover_image_url: "/images/solarzaun-house.png",
    cover_image_alt: "Kleinwindanlage für Einfamilienhaus",
    category_id: catSkywind.id,
    tags: ["kleinwindanlage", "skywind-ng", "ratgeber", "windenergie"],
    translations: [
      {
        locale: Locale.de,
        title: "Kleinwindanlage für das Einfamilienhaus – Was geht, was nicht",
        excerpt:
          "Kann ich als Hausbesitzer eine Kleinwindanlage aufstellen? Wir erklären, welche Anlagen für Einfamilienhäuser geeignet sind, was genehmigungspflichtig ist und wann sich das lohnt.",
        meta_title: "Kleinwindanlage Einfamilienhaus 2026 – Genehmigung, Kosten & Eignung | WSP",
        meta_description:
          "Kleinwindanlage für Einfamilienhaus: Was ist erlaubt? Was kostet es? Und lohnt es sich? Alles Wichtige für Hausbesitzer.",
        content: `## Kleinwindanlage für das Einfamilienhaus – Alles Wichtige

Immer mehr Hausbesitzer fragen sich, ob eine Kleinwindanlage auf dem eigenen Grundstück möglich und sinnvoll ist. Die kurze Antwort: ja – unter bestimmten Voraussetzungen.

### Welche Kleinwindanlagen eignen sich für Einfamilienhäuser?

Für private Haushalte kommen in erster Linie kompakte Anlagen in Frage. Die **SkyWind NG** ist speziell für diesen Anwendungsfall entwickelt:

- **SkyWind NG 1kW:** Ideal für Einfamilienhäuser mit mittlerem Energiebedarf und begrenzter Grundstücksgröße
- **SkyWind NG 2kW:** Für größere Grundstücke und höheren Strombedarf (z. B. mit E-Auto, Wärmepumpe)

### Wo kann die Anlage montiert werden?

**Option 1: Freistehendes Mast auf dem Grundstück**
Die häufigste Lösung. Flanschmast mit 3–6 m Länge auf einem Betonfundament. Vorteil: optimale Windausnutzung, Abstand zum Wohnbereich.

**Option 2: Dachmontage**
Möglich, aber anspruchsvoller. Statikprüfung des Daches erforderlich. Nachteil: Vibrationen können auf Gebäude übertragen werden.

**Option 3: Fassadenmontage**
Nur bei speziellen Vertikalachs-Anlagen. Für SkyWind NG nicht vorgesehen.

### Genehmigung für Kleinwindanlagen am Einfamilienhaus

Die Genehmigungspflicht variiert stark:

**Häufig genehmigungsfrei** (wenn folgende Kriterien erfüllt):
- Masthöhe bis 10 m (Bundesland-abhängig)
- Außerhalb von Naturschutzgebieten und denkmalgeschützten Bereichen
- Einhaltung der Abstandsflächen laut Landesbauordnung

**Baugenehmigung erforderlich** in:
- Manchen Bundesländern generell bei Windanlagen
- Bebauungsplan-Gebieten mit Einschränkungen
- Denkmalschutzzonen

**Unser Service:** Wir klären die Genehmigungspflicht für Ihren konkreten Standort kostenlos im Beratungsgespräch.

### Anforderungen an das Grundstück

Mindestempfehlungen für den wirtschaftlichen Betrieb:
- **Grundstücksgröße:** > 500 m² (damit ausreichend Abstand zu Nachbargrenzen)
- **Windoffenheit:** Keine hohen Gebäude oder Bäume im Windschatten (Umkreis ca. 100–200 m)
- **Windgeschwindigkeit:** > 4 m/s mittlere Jahreswindgeschwindigkeit

### Typisches Installationsbeispiel

Einfamilienhaus, 150 m² Wohnfläche, Stromverbrauch 5.000 kWh/Jahr:
- Anlage: SkyWind NG 1kW + Flanschmast 5 m
- Jahresertrag (bei 5 m/s): ca. 1.800 kWh
- Eigenverbrauch: ca. 1.200 kWh (deckt 24 % des Bedarfs)
- Einsparung: ca. 360 €/Jahr
- Kombination mit Dach-PV oder [Solarzaun](/solarzaun) empfohlen für höhere Autarkie

### Fazit

Eine Kleinwindanlage für das Einfamilienhaus ist sinnvoll, wenn Ihr Grundstück ausreichend Platz und Wind bietet. Die SkyWind NG ist speziell auf private Haushalte zugeschnitten und lässt sich gut mit bestehenden Solar- oder [Kombilösungen](/kombiloesungen) verbinden.

➜ [Kostenlos beraten lassen](/kontakt) | Mehr zur [SkyWind NG](/skywind-ng)`,
      },
      {
        locale: Locale.en,
        title: "Small Wind Turbine for Single-Family Homes – What Works and What Doesn't",
        excerpt:
          "Can I install a small wind turbine as a homeowner? We explain which turbines suit single-family homes, what requires permits, and when it's worth it.",
        meta_title: "Small Wind Turbine for Single-Family Home 2026 – Permit, Cost & Suitability | WSP",
        meta_description:
          "Small wind turbine for single-family home: what is permitted, what does it cost, and is it worth it? Everything homeowners need to know.",
        content: `## Small Wind Turbine for the Single-Family Home – Everything You Need to Know

The **SkyWind NG** is specifically designed for residential use, available as a 1kW model for average-sized plots and a 2kW model for larger properties.

### Where Can the Turbine Be Installed?

**Option 1: Free-standing mast on the property** – Most common solution. Flange mast 3–6 m on a concrete foundation.

**Option 2: Roof mounting** – Possible but requires a structural survey. Vibrations may transfer to the building.

### Permit Requirements

Permit requirements vary by state. Installations are often permit-free when mast height stays below 10 m and setback distances are respected. Always verify with local authorities.

### Typical Example

Single-family home, 150 m², annual consumption 5,000 kWh:
- Turbine: SkyWind NG 1kW + 5m mast
- Annual yield (at 5 m/s): approx. 1,800 kWh (covers ~36% of demand)
- Annual savings: approx. €360

Combine with rooftop PV or a [solar fence](/solarzaun) for higher self-sufficiency.

[Request a free consultation](/kontakt) | Learn more about [SkyWind NG](/skywind-ng).`,
      },
      {
        locale: Locale.es,
        title: "Pequeño Aerogenerador para Casa Unifamiliar – Qué Funciona y Qué No",
        excerpt:
          "¿Puedo instalar un pequeño aerogenerador como propietario de vivienda? Explicamos qué turbinas son adecuadas, qué requiere permisos y cuándo vale la pena.",
        meta_title: "Pequeño Aerogenerador Casa Unifamiliar 2026 – Permisos, Costes | WSP",
        meta_description:
          "Pequeño aerogenerador para casa unifamiliar: qué está permitido, cuánto cuesta y si vale la pena. Todo lo que los propietarios necesitan saber.",
        content: `## Pequeño Aerogenerador para Casa Unifamiliar – Todo lo Que Necesitas Saber

El **SkyWind NG** está diseñado específicamente para uso residencial, disponible como modelo de 1kW para parcelas de tamaño medio y modelo de 2kW para propiedades más grandes.

### Ejemplo Típico

Casa unifamiliar, 150 m², consumo anual de 5.000 kWh:
- Turbina: SkyWind NG 1kW + mástil de 5 m
- Producción anual (a 5 m/s): aprox. 1.800 kWh (cubre ~36% del consumo)
- Ahorro anual: aprox. 360 €

Combina con paneles solares en tejado o una [valla solar](/solarzaun) para mayor autosuficiencia.

[Solicita una consulta gratuita](/kontakt) | Más sobre [SkyWind NG](/skywind-ng).`,
      },
    ],
  });

  console.log("  ✓ Artikel 5: Kleinwindanlage Einfamilienhaus");

  console.log("\n✅ Blog-Seed abgeschlossen. 5 Artikel mit DE + EN + ES angelegt.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
