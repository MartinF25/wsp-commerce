/**
 * Blog-Seed: Artikel 002
 * "SkyWind NG Review: A Compact Micro Wind Turbine for Homes, Farms and Off-Grid Projects"
 *
 * Lauf: cd apps/commerce && pnpm ts-node prisma/blog-seed-article-002.ts
 *
 * Voraussetzung: blog-seed-categories.ts muss zuerst ausgeführt worden sein.
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
  console.log("🌱 Blog-Seed: Artikel 002 startet …\n");

  // Tags
  await upsertTag("skywind-ng", "SkyWind NG");
  await upsertTag("micro-wind-turbine", "Micro Wind Turbine");
  await upsertTag("review", "Review");
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
    slug: "skywind-ng-micro-wind-turbine-review",
    status: BlogStatus.published,
    featured: true,
    published_at: new Date("2026-06-10"),
    reading_time_minutes: 8,
    author_name: "WSP Solarenergie Editorial",
    cover_image_url: "/images/skywind-rooftop.png",
    cover_image_alt: "SkyWind NG micro wind turbine installed on a residential property",
    category_id: cat.id,
    tags: ["skywind-ng", "micro-wind-turbine", "review", "guide"],
    translations: [

      // ── English (primary) ──────────────────────────────────────────────────
      {
        locale: Locale.en,
        title: "SkyWind NG Review: A Compact Micro Wind Turbine for Homes, Farms and Off-Grid Projects",
        excerpt: "An honest look at the SkyWind NG micro wind turbine: specifications, real-world performance, installation requirements and the sites where it genuinely earns its place.",
        meta_title: "SkyWind NG Review 2026 – Micro Wind Turbine for Homes & Off-Grid Use | WSP Blog",
        meta_description: "An honest review of the SkyWind NG micro wind turbine: specifications, real-world performance, installation requirements and who it's actually right for.",
        content: `## SkyWind NG: A Compact Micro Wind Turbine for Homes, Farms and Off-Grid Projects

Not all wind turbines are built for the same purpose. The SkyWind NG is designed specifically for small-scale applications — residential properties, agricultural holdings, rural businesses and off-grid sites that need a reliable, independent power source without the infrastructure of a large commercial turbine.

This guide covers what the SkyWind NG actually is, where it works best, what installation involves, and whether it's the right choice for your project.

## What Is the SkyWind NG?

The SkyWind NG is a compact micro wind turbine engineered for decentralised energy production. Available in two configurations — 1kW and 2kW — it suits a range of property sizes and energy requirements.

Unlike industrial turbines, the SkyWind NG is built for practical deployment on private and semi-commercial sites: quiet enough for residential use, compact enough for a standard garden or farmyard, and designed to integrate with existing solar and battery systems.

Key technical features:

- **Variable-speed rotor** — adjusts automatically to wind conditions for consistent output across a wide speed range
- **Low cut-in speed** — begins generating electricity from approximately 2.5 m/s (9 km/h)
- **Flanged mast system** — allows roof or ground mounting from 3 m upward
- **Grid-tied and off-grid compatible** — works with batteries, grid inverters or standalone off-grid systems

For full specifications, dimensions and pricing, see the [SkyWind NG product page](/skywind-ng).

## SkyWind NG 1kW vs. 2kW: Which Model Fits Your Project?

| | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| Rated power | 1,000 W | 2,000 W |
| Rotor diameter | ~2.2 m | ~3.0 m |
| Cut-in wind speed | ~2.5 m/s | ~2.5 m/s |
| Annual yield at 5 m/s | 1,500–2,000 kWh | 2,800–3,600 kWh |
| Annual yield at 6 m/s | 2,200–2,800 kWh | 4,000–5,200 kWh |
| Best suited for | Single homes, small farms, cabins | Larger properties, businesses, remote sites |

The **1kW model** is the right starting point for most residential applications. A typical single-family home consumes 3,500–4,500 kWh/year; at a 5 m/s site, the 1kW covers roughly 40–55% of base consumption.

The **2kW model** makes sense where the property has strong wind access (6+ m/s annual average) or where higher self-sufficiency is the goal — especially combined with electric vehicle charging or a heat pump.

## Where Does the SkyWind NG Perform Best?

**Open rural properties.** Farmyards, agricultural holdings and rural homes with minimal wind obstruction within 100–200 metres. These sites typically see the strongest and most consistent wind speeds — exactly what the SkyWind NG is optimised for.

**Coastal and elevated locations.** Properties near the coastline or on elevated terrain often exceed 5 m/s annual average — the threshold at which the SkyWind NG becomes clearly economically viable.

**Off-grid cabins and remote sites.** With the right battery configuration, the SkyWind NG operates as a fully autonomous power source. Our [off-grid wind turbine guide](/off-grid-wind-turbine) covers battery sizing, inverter selection and full system design.

**Hybrid solar-wind installations.** The SkyWind NG pairs naturally with solar panels — wind and solar complement each other seasonally, with wind strongest in autumn and winter when solar output drops. A well-designed [hybrid solar-wind system](/hybrid-solar-wind-system) combining both typically achieves self-sufficiency rates of 65–80%.

The SkyWind NG is less suited to dense urban environments, heavily shaded plots, or locations with an annual average wind speed below 4 m/s. We will tell you directly if your site is not appropriate — a poor-wind-site installation helps nobody.

## Installation: What to Expect

A standard SkyWind NG installation involves four stages:

1. **Site assessment** — wind data analysis, mast position planning, grid connection review
2. **Foundation** — concrete base for the flanged mast (1–2 days depending on ground conditions)
3. **Mast and turbine mounting** — typically a half-day for a trained two-person team
4. **Connection** — grid inverter or battery system wiring

Recommended mast height for most residential sites is 5–6 metres. Height matters: every additional metre above local obstacles increases wind speed and reduces turbulence. It's usually the most cost-effective performance upgrade available.

We provide a free site check before any equipment is ordered — covering wind assessment, mast position and connection planning.

## The SkyWind NG in a Hybrid Energy System

The SkyWind NG's value increases significantly within a hybrid energy setup. For a detailed comparison of wind and solar output across the seasons — and how to size a combined system — see our guide on [micro wind turbines and hybrid energy](/micro-wind-turbine).

The short version: solar fills summer, wind covers the rest. Add battery storage and the result is a genuinely self-sufficient setup across all four seasons.

## Frequently Asked Questions

**Is the SkyWind NG available outside Germany?**

Yes. We ship across Europe, with EU delivery typically within 5–10 business days. International orders outside the EU are handled on request — [contact us](/kontakt) for a shipping quote and lead time.

**What maintenance does the SkyWind NG require?**

An annual visual inspection and a full service every 3–5 years. The variable-speed generator has no gearbox, which substantially reduces mechanical wear compared to older turbine designs.

**Does the SkyWind NG qualify for subsidies?**

In Germany, small wind turbines are eligible for KfW Program 270 financing. Most EU member states have equivalent renewable energy support programmes. We recommend checking your national energy agency for current incentives — and we are happy to advise during a consultation.

**How does the SkyWind NG compare to solar panels on yield?**

At a good 5 m/s site, the 1kW SkyWind NG produces 1,500–2,000 kWh/year. A comparable 1 kWp solar installation produces around 900–1,100 kWh/year in Central Europe — but at completely different times of year. For a detailed breakdown, read our [energy output comparison guide](/blog/how-much-energy-does-a-micro-wind-turbine-produce).

**Can the SkyWind NG be mounted on a roof?**

Yes, via a flanged mast. Roof installation requires a structural assessment to confirm the building can carry the load and manage vibration transfer. Ground mounting is generally simpler and often delivers better wind access.

---

Ready to find out if the SkyWind NG fits your project? The [SkyWind NG product page](/skywind-ng) has full technical specifications, model comparison and ordering information.

[Request a free site consultation →](/kontakt)

---

*More guides on small wind turbines, off-grid systems and hybrid energy setups: [Micro Wind Energy resource centre →](/blog/category/micro-wind-energy)*`,
      },

      // ── German (full translation) ──────────────────────────────────────────
      {
        locale: Locale.de,
        title: "SkyWind NG: Kompakte Kleinwindanlage für Eigenheim, Hof und Off-Grid-Projekte",
        excerpt: "Ein ehrlicher Blick auf die SkyWind NG Kleinwindanlage: Spezifikationen, reale Leistung, Installationsanforderungen und die Standorte, an denen sie wirklich überzeugt.",
        meta_title: "SkyWind NG Erfahrungen 2026 – Kleinwindanlage für Eigenheim & Off-Grid | WSP Blog",
        meta_description: "SkyWind NG ehrlich bewertet: Spezifikationen, reale Leistung, Installationsanforderungen und für wen sich die Anlage wirklich lohnt.",
        content: `## SkyWind NG: Kompakte Kleinwindanlage für Eigenheim, Hof und Off-Grid-Projekte

Die SkyWind NG ist eine Kleinwindanlage für dezentrale Anwendungen – Eigenheime, landwirtschaftliche Betriebe, Gewerbeobjekte und netzferne Standorte, die eine zuverlässige, unabhängige Stromversorgung brauchen.

Dieser Ratgeber erklärt, was die SkyWind NG ist, wo sie am besten funktioniert, was die Installation bedeutet und ob sie für Ihr Projekt geeignet ist.

## Was ist die SkyWind NG?

Die SkyWind NG ist eine kompakte Kleinwindanlage für die dezentrale Stromerzeugung. Sie ist in zwei Konfigurationen erhältlich – 1kW und 2kW – und damit für verschiedene Grundstücksgrößen und Energiebedarfe geeignet.

Technische Merkmale im Überblick:
- **Drehzahlgeregelter Rotor** – passt sich automatisch an die Windverhältnisse an
- **Niedriger Anlaufwert** – Stromerzeugung ab ca. 2,5 m/s
- **Flanschmast-System** – Dach- oder Bodenmontage ab 3 m Höhe
- **Netz- und Off-Grid-fähig** – kompatibel mit Batterien, Netzwechselrichtern und autarken Systemen

Alle technischen Details finden Sie auf der [SkyWind NG Produktseite](/skywind-ng).

## SkyWind NG 1kW vs. 2kW – welches Modell passt?

| | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| Nennleistung | 1.000 W | 2.000 W |
| Rotordurchmesser | ~2,2 m | ~3,0 m |
| Jahresertrag bei 5 m/s | 1.500–2.000 kWh | 2.800–3.600 kWh |
| Jahresertrag bei 6 m/s | 2.200–2.800 kWh | 4.000–5.200 kWh |

Das **1kW-Modell** ist der richtige Einstieg für die meisten privaten Anwendungen. Das **2kW-Modell** lohnt sich bei Standorten mit gutem Windangebot (ab 6 m/s Jahresmittel) oder wenn eine höhere Autarkie angestrebt wird – zum Beispiel in Kombination mit einem E-Auto oder einer Wärmepumpe.

## Wo leistet die SkyWind NG am meisten?

**Offene Ländliche Lagen.** Höfe, landwirtschaftliche Grundstücke und Landhäuser ohne nennenswerte Windschatten im Umkreis von 100–200 m.

**Küstennahe und erhöhte Standorte.** Eigenschaften in Küstennähe oder auf Anhöhen erreichen oft über 5 m/s Jahresmittel – die Schwelle, ab der die SkyWind NG wirtschaftlich klar sinnvoll wird.

**Off-Grid-Hütten und abgelegene Standorte.** Mit der richtigen Batteriekonfiguration arbeitet die SkyWind NG als vollständig autonome Stromquelle. Unser [Off-Grid-Windkraft-Ratgeber](/off-grid-wind-turbine) deckt Batteriedimensionierung und Systemplanung ab.

**Hybrid-Solar-Wind-Anlagen.** Die SkyWind NG ergänzt Solarmodule ideal – Wind erzeugt mehr im Herbst und Winter, Solar im Sommer. Ein gut geplantes [Solar-Wind-Hybridsystem](/hybrid-solar-wind-system) erreicht typischerweise 65–80 % Eigenversorgungsquote.

## Was kostet die Installation?

Eine Standard-Installation umfasst Standortanalyse, Fundamentbau, Mastmontage und Anschluss. Die Gesamtkosten für Anlage, Mast und Montage liegen je nach Konfiguration und Standort zwischen 5.000 und 12.000 €.

Wir bieten vor dem Kauf eine kostenlose Standortprüfung an – Windanalyse, Mastposition und Netzanschlussplanung inklusive.

## Häufige Fragen

**Ist die SkyWind NG auch außerhalb Deutschlands erhältlich?**
Ja. Wir liefern in ganz Europa, innerhalb der EU in der Regel innerhalb von 5–10 Werktagen. Anfragen für Lieferungen außerhalb der EU nehmen wir gerne [über das Kontaktformular](/kontakt) entgegen.

**Wie aufwendig ist die Wartung?**
Jährliche Sichtprüfung und eine Vollwartung alle 3–5 Jahre. Der drehzahlgeregelte Generator hat kein Getriebe – das reduziert den mechanischen Verschleiß erheblich.

**Gibt es Fördermöglichkeiten?**
In Deutschland ist die KfW-Förderung (Programm 270) für Kleinwindanlagen nutzbar. Viele Bundesländer haben zusätzliche Förderprogramme. Wir beraten Sie im Gespräch gerne zu aktuellen Möglichkeiten.

**Wie verhält sich die SkyWind NG im Vergleich zu Solar?**
Bei 5 m/s produziert die 1kW-Anlage 1.500–2.000 kWh/Jahr, eine vergleichbare 1-kWp-PV-Anlage ca. 900–1.100 kWh – allerdings zu ganz anderen Jahreszeiten. Den detaillierten Vergleich zeigt unser [Ertragsvergleich-Ratgeber](/blog/how-much-energy-does-a-micro-wind-turbine-produce).

---

Wollen Sie wissen, ob die SkyWind NG für Ihren Standort geeignet ist? Alle technischen Details finden Sie auf der [SkyWind NG Produktseite](/skywind-ng).

[Jetzt kostenlose Standortprüfung anfordern →](/kontakt)

---

*Weitere Ratgeber zu Kleinwindanlagen, Off-Grid-Systemen und Hybrideenergie: [Micro Wind Energy Themenseite →](/blog/category/micro-wind-energy)*`,
      },

      // ── Spanish (stub) ─────────────────────────────────────────────────────
      {
        locale: Locale.es,
        title: "SkyWind NG: Mini Aerogenerador Compacto para Hogares, Granjas y Proyectos Off-Grid",
        excerpt: "Una evaluación honesta del mini aerogenerador SkyWind NG: especificaciones, rendimiento real, requisitos de instalación y para qué tipo de proyectos es realmente adecuado.",
        meta_title: "SkyWind NG Review 2026 – Mini Aerogenerador para Hogares y Off-Grid | WSP Blog",
        meta_description: "Review honesta del SkyWind NG: especificaciones, rendimiento real, requisitos de instalación y para quién es realmente adecuado.",
        content: `## SkyWind NG: Mini Aerogenerador para Hogares, Granjas y Proyectos Off-Grid

El SkyWind NG está diseñado específicamente para aplicaciones a pequeña escala: propiedades residenciales, explotaciones agrícolas, negocios rurales y ubicaciones off-grid que necesitan una fuente de energía fiable e independiente.

Esta guía cubre qué es el SkyWind NG, dónde funciona mejor, qué implica la instalación y si es la opción correcta para tu proyecto.

## ¿Qué es el SkyWind NG?

El SkyWind NG es un mini aerogenerador compacto diseñado para la producción descentralizada de energía. Disponible en dos configuraciones — 1kW y 2kW — se adapta a diferentes tamaños de propiedad y necesidades energéticas.

Características técnicas clave:
- **Rotor de velocidad variable** — se ajusta automáticamente a las condiciones de viento
- **Baja velocidad de arranque** — comienza a generar electricidad desde aproximadamente 2,5 m/s
- **Sistema de mástil con brida** — permite instalación en tejado o suelo desde 3 m de altura
- **Compatible con red y off-grid** — funciona con baterías, inversores de red o sistemas autónomos

Para especificaciones completas, consulta la [página del producto SkyWind NG](/skywind-ng).

## SkyWind NG 1kW vs. 2kW

| | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| Potencia nominal | 1.000 W | 2.000 W |
| Diámetro del rotor | ~2,2 m | ~3,0 m |
| Producción anual a 5 m/s | 1.500–2.000 kWh | 2.800–3.600 kWh |
| Producción anual a 6 m/s | 2.200–2.800 kWh | 4.000–5.200 kWh |

## ¿Dónde Funciona Mejor el SkyWind NG?

**Propiedades rurales abiertas.** Granjas y terrenos agrícolas con mínimas obstrucciones de viento en un radio de 100–200 m.

**Ubicaciones costeras y elevadas.** Las propiedades cerca de la costa o en terrenos elevados suelen superar los 5 m/s de media anual — el umbral en el que el SkyWind NG es claramente viable económicamente.

**Cabañas off-grid y ubicaciones remotas.** Con la configuración de batería correcta, el SkyWind NG funciona como fuente de energía totalmente autónoma. Consulta nuestra [guía de aerogeneradores off-grid](/off-grid-wind-turbine).

**Instalaciones híbridas solar-eólico.** El SkyWind NG combina naturalmente con paneles solares. Un [sistema híbrido solar-eólico](/hybrid-solar-wind-system) bien diseñado alcanza tasas de autosuficiencia del 65–80%.

## Preguntas Frecuentes

**¿Está disponible el SkyWind NG fuera de Alemania?**
Sí. Realizamos envíos a toda Europa, con entrega en la UE normalmente en 5–10 días hábiles. Para pedidos fuera de la UE, [contáctanos](/kontakt).

**¿Qué mantenimiento requiere el SkyWind NG?**
Inspección visual anual y un servicio completo cada 3–5 años. El generador de velocidad variable no tiene caja de engranajes, lo que reduce significativamente el desgaste mecánico.

**¿Cómo se compara el SkyWind NG con los paneles solares?**
A 5 m/s, el modelo de 1kW produce 1.500–2.000 kWh/año. Una instalación solar de 1 kWp produce unos 900–1.100 kWh en Europa Central, pero en épocas del año completamente diferentes. Para una comparativa detallada, lee nuestra [guía de producción energética](/blog/how-much-energy-does-a-micro-wind-turbine-produce).

---

¿Listo para saber si el SkyWind NG es adecuado para tu proyecto? La [página del producto SkyWind NG](/skywind-ng) tiene especificaciones técnicas completas e información de pedido.

[Solicitar una consulta gratuita →](/kontakt)

---

*Más guías sobre mini aerogeneradores, sistemas off-grid y energía híbrida: [Centro de recursos Micro Wind Energy →](/blog/category/micro-wind-energy)*`,
      },
    ],
  });

  console.log("  ✓ Artikel: skywind-ng-micro-wind-turbine-review");
  console.log("\n✅ Blog-Seed Artikel 002 abgeschlossen.");
  console.log("\nAufruf im Browser: /en/blog/skywind-ng-micro-wind-turbine-review");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
