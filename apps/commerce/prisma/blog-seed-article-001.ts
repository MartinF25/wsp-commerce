/**
 * Blog-Seed: Artikel 001
 * "How Much Energy Does a Micro Wind Turbine Produce?"
 *
 * Lauf: cd apps/commerce && pnpm ts-node prisma/blog-seed-article-001.ts
 *
 * Voraussetzung: blog-seed-categories.ts muss zuerst ausgeführt worden sein
 * (Kategorie "micro-wind-energy" muss in der DB existieren).
 *
 * Idempotent: upsert auf slug.
 */

import { PrismaClient, BlogStatus, Locale } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertTag(slug: string, name: string) {
  return prisma.blogTag.upsert({
    where: { slug },
    update: { name },
    create: { slug, name },
  });
}

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
      update: { title: t.title, excerpt: t.excerpt, content: t.content, meta_title: t.meta_title, meta_description: t.meta_description },
      create: { post_id: post.id, locale: t.locale, title: t.title, excerpt: t.excerpt, content: t.content, meta_title: t.meta_title, meta_description: t.meta_description },
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
  console.log("🌱 Blog-Seed: Artikel 001 startet …\n");

  // Tags
  await upsertTag("micro-wind-turbine", "Micro Wind Turbine");
  await upsertTag("energy-production", "Energy Production");
  await upsertTag("wind-energy", "Wind Energy");
  await upsertTag("skywind-ng", "SkyWind NG");
  await upsertTag("guide", "Guide");
  console.log("  ✓ Tags");

  // Kategorie sicherstellen (idempotent)
  const cat = await upsertBlogCategory("micro-wind-energy", [
    { locale: Locale.en, name: "Micro Wind Energy", description: "Guides, comparisons and technical deep-dives on micro wind turbines." },
    { locale: Locale.de, name: "Micro Wind Energy", description: "Ratgeber, Vergleiche und Technik-Analysen zu Mikrowindkraftanlagen." },
    { locale: Locale.es, name: "Micro Wind Energy", description: "Guías, comparativas y análisis técnicos sobre mini aerogeneradores." },
  ]);
  console.log("  ✓ Kategorie micro-wind-energy");

  // ── Artikel ────────────────────────────────────────────────────────────────

  await upsertBlogPost({
    slug: "how-much-energy-does-a-micro-wind-turbine-produce",
    status: BlogStatus.published,
    featured: true,
    published_at: new Date("2026-06-06"),
    reading_time_minutes: 7,
    author_name: "WSP Solarenergie Editorial",
    cover_image_url: "/images/skywind-hero.png",
    cover_image_alt: "SkyWind NG micro wind turbine generating energy",
    category_id: cat.id,
    tags: ["micro-wind-turbine", "energy-production", "wind-energy", "skywind-ng", "guide"],
    translations: [

      // ── English (primary) ──────────────────────────────────────────────────
      {
        locale: Locale.en,
        title: "How Much Energy Does a Micro Wind Turbine Produce?",
        excerpt: "Concrete output numbers, the key variables that affect yield, and a clear picture of what to expect from a modern micro wind turbine — including the SkyWind NG 1kW and 2kW.",
        meta_title: "How Much Energy Does a Micro Wind Turbine Produce? | WSP Blog",
        meta_description: "Real output figures for micro wind turbines: annual kWh by wind speed, SkyWind NG 1kW vs 2kW, and how output compares to typical household consumption.",
        content: `## How Much Energy Does a Micro Wind Turbine Produce?

If you're considering a micro wind turbine for your home, farm, or off-grid setup, the first question is almost always the same: how much electricity will it actually generate?

The honest answer depends on your specific site. But we can give you concrete numbers, the key variables that matter, and a realistic picture of what to expect from a modern micro wind turbine.

## What Determines Micro Wind Turbine Energy Production?

Three variables drive annual output:

**Wind speed** is the single most important factor. Because power output scales with the cube of wind speed, small differences in average wind speed lead to large differences in annual yield. A site with 6 m/s average wind speed produces roughly 2.4× more energy than a 4 m/s site.

**Turbine size and rotor diameter** determine how much energy can be extracted from available wind. A 2kW model with a larger rotor captures significantly more energy than a 1kW unit at the same location.

**Installation height and site turbulence** also matter. Wind speeds increase with altitude and are more consistent away from obstacles. A turbine on a 6 m mast in an open field consistently outperforms the same unit on a 3 m mast in a built-up area.

## SkyWind NG: Real Output by Wind Speed

The [SkyWind NG](/skywind-ng) is a compact micro wind turbine available in 1kW and 2kW configurations. Based on real-world installations across Europe, here are the typical annual yields:

| Average Wind Speed | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| 4 m/s | ~900–1,200 kWh | ~1,600–2,200 kWh |
| 5 m/s | ~1,500–2,000 kWh | ~2,800–3,600 kWh |
| 6 m/s | ~2,200–2,800 kWh | ~4,000–5,200 kWh |
| 7 m/s | ~2,800–3,500 kWh | ~5,000–6,500 kWh |

*These ranges reflect typical installation conditions in Central Europe. Actual output depends on your specific site, mast height, and local wind patterns.*

At an average inland site with 5 m/s, the SkyWind NG 1kW produces approximately **1,500–2,000 kWh per year** — enough to cover a meaningful share of a household's electricity needs.

## How Does This Compare to Household Consumption?

For context:

- An average German or UK household uses approximately **3,500–4,500 kWh per year**
- Adding an electric vehicle raises consumption by roughly **2,000–3,000 kWh annually**
- A heat pump adds another **3,000–6,000 kWh per year**

At a good wind site (5 m/s average), the SkyWind NG 1kW covers roughly **40–55% of a typical household's base consumption**. For higher self-sufficiency, the 2kW model or a combination with a [solar fence](/solarzaun) or rooftop PV is recommended. A well-designed [hybrid solar-wind system](/hybrid-solar-wind-system) can achieve self-sufficiency rates of 65–80%.

## Getting the Most Out of Your Turbine

A few practical steps make a real difference to annual output:

**Choose the right mast height.** Every additional metre of mast height increases wind speed access. A 5–6 m mast is the minimum for most residential sites.

**Site it in the open.** As a general rule, the turbine should be mounted at least twice the height of nearby trees or buildings, and positioned to face the prevailing wind direction without obstructions within 100–200 m.

**Pair it with battery storage.** An [off-grid battery system](/off-grid-wind-turbine) stores excess energy produced during windy periods for use when the wind drops — raising your self-consumption rate significantly.

**Get a site check first.** We offer a free, no-obligation assessment of your specific location before you commit to any purchase.

## Frequently Asked Questions

**How much energy does a 1kW wind turbine produce per day?**

At 5 m/s average wind speed, a 1kW micro wind turbine produces roughly **4–6 kWh per day** on average. Output varies considerably: calm days may produce less than 1 kWh, while strong wind events can generate 12+ kWh in a single day.

**What is the minimum wind speed for a micro wind turbine?**

The SkyWind NG starts generating electricity at approximately 2.5 m/s (9 km/h). For an economically sound investment, however, an annual average of at least **4 m/s** is recommended. Below that, payback periods become too long at most sites.

**How does micro wind turbine output compare to solar panels?**

At a good 5 m/s site, the SkyWind NG 1kW produces 1,500–2,000 kWh/year. A comparable 1 kWp solar installation yields roughly 900–1,100 kWh/year in Central Europe. The advantage of combining both is timing: wind peaks in autumn and winter, solar peaks in summer — making them a natural complement. See our guide to [hybrid solar-wind systems](/hybrid-solar-wind-system).

**Can a micro wind turbine power a whole house?**

A single SkyWind NG 1kW typically covers 40–55% of a standard household's consumption at a good site. For full self-sufficiency, a 2kW model or a combination with solar and battery storage is recommended.

---

Want to know how much energy a micro wind turbine would produce at your specific location? We offer a free site check — realistic output estimates with no obligation.

[See the SkyWind NG product page →](/skywind-ng) · [Request a free consultation →](/kontakt)

---

*Looking for more guides on small wind turbines? Browse our [Micro Wind Energy resource centre](/blog/category/micro-wind-energy) for installation tips, site assessments, comparisons and economic analyses.*`,
      },

      // ── German (required by system – full translation) ─────────────────────
      {
        locale: Locale.de,
        title: "Wie viel Energie produziert eine Kleinwindanlage?",
        excerpt: "Konkrete Ertragszahlen, die wichtigsten Einflussfaktoren und realistische Erwartungen – auch für die SkyWind NG 1kW und 2kW.",
        meta_title: "Wie viel Energie produziert eine Kleinwindanlage? | WSP Blog",
        meta_description: "Reale Ertragszahlen für Kleinwindanlagen: jährliche kWh nach Windgeschwindigkeit, SkyWind NG 1kW vs. 2kW und Vergleich mit typischem Haushaltsverbrauch.",
        content: `## Wie viel Energie produziert eine Kleinwindanlage?

Die erste Frage, die fast alle potenziellen Betreiber stellen, lautet: Wie viel Strom erzeugt eine Kleinwindanlage wirklich? Die ehrliche Antwort hängt vom konkreten Standort ab – aber wir können Ihnen belastbare Zahlen, die entscheidenden Einflussfaktoren und realistische Erwartungen liefern.

## Was bestimmt den Ertrag einer Kleinwindanlage?

**Windgeschwindigkeit** ist der bei weitem wichtigste Faktor. Da die Leistung mit der dritten Potenz der Windgeschwindigkeit steigt, hat ein Standort mit 6 m/s mittlerer Jahreswindgeschwindigkeit rund 2,4-mal mehr Ertrag als einer mit 4 m/s.

**Anlagengröße und Rotordurchmesser** bestimmen, wie viel Energie dem Wind entnommen werden kann.

**Montagehöhe und Turbulenz** beeinflussen ebenfalls den Ertrag erheblich. Höher heißt mehr Wind und weniger Verwirbelungen.

## SkyWind NG: Reale Erträge nach Windgeschwindigkeit

| Mittlere Windgeschwindigkeit | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| 4 m/s | ~900–1.200 kWh | ~1.600–2.200 kWh |
| 5 m/s | ~1.500–2.000 kWh | ~2.800–3.600 kWh |
| 6 m/s | ~2.200–2.800 kWh | ~4.000–5.200 kWh |
| 7 m/s | ~2.800–3.500 kWh | ~5.000–6.500 kWh |

An einem typischen deutschen Binnenlandstandort mit 5 m/s produziert die SkyWind NG 1kW ca. **1.500–2.000 kWh pro Jahr** – genug, um einen erheblichen Teil des Haushaltsstrombedarfs zu decken.

## Wie viel ist das im Verhältnis zum Verbrauch?

- Durchschnittlicher Haushalt: ca. **3.500–4.000 kWh/Jahr**
- E-Auto-Laden: ca. **2.000–3.000 kWh/Jahr** zusätzlich
- Wärmepumpe: ca. **3.000–6.000 kWh/Jahr** zusätzlich

An einem windreichen Standort deckt die SkyWind NG 1kW rund **40–55 % des Basisverbrauchs** eines Haushalts. In Kombination mit einem [Solarzaun](/solarzaun) oder einer [Hybrid-Solar-Wind-Lösung](/hybrid-solar-wind-system) sind Eigenversorgungsquoten von 65–80 % realistisch.

## Häufige Fragen

**Wie viel produziert eine 1kW-Windkraftanlage pro Tag?**
Bei 5 m/s mittlerer Windgeschwindigkeit durchschnittlich **4–6 kWh pro Tag** – mit deutlichen Schwankungen je nach Wetterlage.

**Welche Mindestwindgeschwindigkeit ist nötig?**
Die SkyWind NG startet bei ca. 2,5 m/s. Für eine wirtschaftliche Investition empfehlen wir mindestens **4 m/s Jahresmittelwert**.

**Lohnt sich Wind statt Solar?**
Wind und Solar ergänzen sich ideal: Wind erzeugt mehr im Herbst und Winter, Solar im Sommer. Unser Ratgeber zu [Hybrid-Solar-Wind-Systemen](/hybrid-solar-wind-system) erklärt, warum die Kombination am meisten Sinn ergibt.

---

Erfahren Sie, wie viel eine Kleinwindanlage an Ihrem Standort produzieren würde – kostenlos und unverbindlich.

[Zur SkyWind NG Produktseite →](/skywind-ng) | [Beratung anfragen →](/kontakt)`,
      },

      // ── Spanish (stub) ─────────────────────────────────────────────────────
      {
        locale: Locale.es,
        title: "¿Cuánta Energía Produce un Mini Aerogenerador?",
        excerpt: "Cifras reales de producción, los factores clave que afectan al rendimiento y expectativas realistas para el SkyWind NG 1kW y 2kW.",
        meta_title: "¿Cuánta Energía Produce un Mini Aerogenerador? | WSP Blog",
        meta_description: "Cifras reales de producción de mini aerogeneradores: kWh anuales según velocidad del viento, SkyWind NG 1kW vs 2kW y comparativa con el consumo doméstico.",
        content: `## ¿Cuánta Energía Produce un Mini Aerogenerador?

La pregunta más frecuente al considerar un mini aerogenerador es siempre la misma: ¿cuánta electricidad generará realmente? La respuesta honesta depende de tu ubicación específica — pero podemos darte cifras concretas y expectativas realistas.

## Qué Determina la Producción de Energía

**La velocidad del viento** es el factor más importante. Como la potencia aumenta con el cubo de la velocidad del viento, pequeñas diferencias en la media anual tienen un gran impacto en la producción anual.

**El tamaño y el diámetro del rotor** determinan cuánta energía puede extraer la turbina del viento disponible.

**La altura de instalación y la turbulencia** también influyen significativamente en el rendimiento.

## SkyWind NG: Producción Real por Velocidad de Viento

| Velocidad Media del Viento | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| 4 m/s | ~900–1.200 kWh | ~1.600–2.200 kWh |
| 5 m/s | ~1.500–2.000 kWh | ~2.800–3.600 kWh |
| 6 m/s | ~2.200–2.800 kWh | ~4.000–5.200 kWh |
| 7 m/s | ~2.800–3.500 kWh | ~5.000–6.500 kWh |

En una ubicación europea típica con 5 m/s de media, el SkyWind NG 1kW produce aproximadamente **1.500–2.000 kWh al año**.

## Preguntas Frecuentes

**¿Cuánta energía produce un aerogenerador de 1kW al día?**
A 5 m/s de media, aproximadamente **4–6 kWh al día** de media, con importantes variaciones según las condiciones climáticas.

**¿Cuál es la velocidad de viento mínima necesaria?**
El SkyWind NG comienza a generar electricidad a 2,5 m/s. Para una inversión rentable, se recomienda una media anual de al menos **4 m/s**.

**¿Vale la pena combinar viento y solar?**
El viento y la solar se complementan perfectamente: el viento produce más en otoño e invierno, la solar en verano. Consulta nuestra guía sobre [sistemas híbridos solar-eólico](/hybrid-solar-wind-system).

---

¿Quieres saber cuánta energía produciría un mini aerogenerador en tu ubicación específica? Ofrecemos una valoración gratuita y sin compromiso.

[Ver la página del producto SkyWind NG →](/skywind-ng) | [Solicitar consulta gratuita →](/kontakt)`,
      },
    ],
  });

  console.log("  ✓ Artikel: how-much-energy-does-a-micro-wind-turbine-produce");
  console.log("\n✅ Blog-Seed Artikel 001 abgeschlossen.");
  console.log("\nAufruf im Browser: /en/blog/how-much-energy-does-a-micro-wind-turbine-produce");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
