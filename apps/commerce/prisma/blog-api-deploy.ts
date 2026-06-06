/**
 * Blog Deploy via Admin-API
 * Lauf: cd apps/commerce && pnpm ts-node prisma/blog-api-deploy.ts
 */

const API = "https://commerce-api-production-614e.up.railway.app";
const ADMIN_KEY = process.env.ADMIN_SECRET ?? "Admin6826!";

const headers = {
  "Content-Type": "application/json",
  "X-Admin-Key": ADMIN_KEY,
};

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API}/api/admin${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } })?.error?.message ?? text;
    // 409 = already exists → ok
    if (res.status === 409) return null;
    throw new Error(`${method} ${path} → ${res.status}: ${msg}`);
  }
  return (json as { data?: unknown })?.data ?? json;
}

async function upsertCategory(slug: string, translations: { locale: string; name: string; description?: string }[]) {
  // Try to get existing
  const list = await api("GET", "/blog/categories") as { slug: string; id: string }[] | null;
  if (Array.isArray(list)) {
    const existing = list.find((c) => c.slug === slug);
    if (existing) { console.log(`  → Kategorie '${slug}' existiert bereits (${existing.id})`); return existing.id; }
  }
  const result = await api("POST", "/blog/categories", { slug, translations }) as { id: string } | null;
  if (!result) throw new Error(`Kategorie '${slug}' konnte nicht erstellt werden`);
  return (result as { id: string }).id;
}

async function upsertTag(slug: string, name: string) {
  const list = await api("GET", "/blog/tags") as { slug: string; id: string }[] | null;
  if (Array.isArray(list)) {
    const existing = list.find((t) => t.slug === slug);
    if (existing) return existing.id;
  }
  const result = await api("POST", "/blog/tags", { slug, name }) as { id: string } | null;
  if (!result) throw new Error(`Tag '${slug}' konnte nicht erstellt werden`);
  return (result as { id: string }).id;
}

async function postExists(slug: string) {
  const list = await api("GET", `/blog/posts?limit=100`) as { items?: { slug: string }[] } | null;
  if (!list) return false;
  const items = (list as { data?: { slug: string }[] })?.data ?? (list as { slug: string }[]);
  return Array.isArray(items) && items.some((p) => p.slug === slug);
}

async function createPost(post: {
  slug: string;
  status: string;
  featured?: boolean;
  publishedAt?: string;
  readingTimeMinutes?: number;
  authorName?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  categoryId?: string;
  tagIds: string[];
  translations: {
    locale: string;
    title: string;
    excerpt: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
  }[];
}) {
  const exists = await postExists(post.slug);
  if (exists) {
    console.log(`  → '${post.slug}' existiert bereits, wird übersprungen`);
    return;
  }
  await api("POST", "/blog/posts", post);
  console.log(`  ✓ '${post.slug}' erstellt`);
}

async function main() {
  console.log("🚀 Blog-Deploy via Admin-API startet …\n");

  // ── Kategorie ────────────────────────────────────────────────────────────────
  console.log("Kategorie anlegen …");
  const catId = await upsertCategory("skywind-ng", [
    { locale: "de", name: "SkyWind NG", description: "Alles rund um die SkyWind NG Kleinwindanlage" },
    { locale: "en", name: "SkyWind NG", description: "Everything about the SkyWind NG small wind turbine" },
    { locale: "es", name: "SkyWind NG", description: "Todo sobre el pequeño aerogenerador SkyWind NG" },
  ]);
  console.log(`  Kategorie-ID: ${catId}\n`);

  // ── Tags ─────────────────────────────────────────────────────────────────────
  console.log("Tags anlegen …");
  const tagMap: Record<string, string> = {};
  for (const [slug, name] of [
    ["skywind-ng", "SkyWind NG"],
    ["kleinwindanlage", "Kleinwindanlage"],
    ["windenergie", "Windenergie"],
    ["photovoltaik", "Photovoltaik"],
    ["ratgeber", "Ratgeber"],
    ["wirtschaftlichkeit", "Wirtschaftlichkeit"],
    ["kombiloesung", "Kombilösung"],
  ] as [string, string][]) {
    tagMap[slug] = await upsertTag(slug, name);
    console.log(`  ✓ Tag '${slug}'`);
  }
  console.log();

  // ── Artikel 1: SkyWind NG Erfahrungen ────────────────────────────────────────
  console.log("Artikel 1: SkyWind NG Erfahrungen …");
  await createPost({
    slug: "skywind-ng-erfahrungen",
    status: "published",
    featured: true,
    publishedAt: "2026-06-01T10:00:00Z",
    readingTimeMinutes: 8,
    authorName: "WSP Solarenergie Redaktion",
    coverImageUrl: "https://webshop.wsp-solarenergie.de/images/skywind-hero.png",
    coverImageAlt: "SkyWind NG Kleinwindanlage im Betrieb",
    categoryId: catId,
    tagIds: [tagMap["skywind-ng"], tagMap["kleinwindanlage"], tagMap["ratgeber"]],
    translations: [
      {
        locale: "de",
        title: "SkyWind NG Erfahrungen – Was Kunden nach einem Jahr berichten",
        excerpt: "Wie schlägt sich die SkyWind NG im Alltag? Wir haben Betreiber nach ihren Erfahrungen befragt und zusammengefasst, was die Anlage wirklich leistet – und wo Grenzen liegen.",
        metaTitle: "SkyWind NG Erfahrungen 2026 – Praxisberichte & Kundenmeinungen | WSP",
        metaDescription: "SkyWind NG Erfahrungen aus der Praxis: Ertrag, Geräusch, Montage und Genehmigung. Was Betreiber nach einem Jahr wirklich berichten.",
        content: `## SkyWind NG Erfahrungen: Was Betreiber wirklich sagen

Die SkyWind NG ist seit einigen Jahren auf dem Markt – genug Zeit, um echte Erfahrungen von Betreibern zu sammeln. Als autorisierter Händler und Installationspartner haben wir direkten Kontakt zu unseren Kunden.

### Erfahrung 1: Ertrag und Windverhältnisse

Betreiber an **windgünstigen Standorten** (offene Lagen, Küstennähe, erhöhte Grundstücke) berichten von Jahreserträgen zwischen **1.800 und 3.200 kWh** mit der SkyWind NG 1kW. Die 2kW-Variante erreicht an optimalen Standorten bis zu **5.000 kWh pro Jahr**.

> „Ich habe die SkyWind NG 2kW jetzt ein Jahr auf meinem Grundstück in der Lüneburger Heide. Der Jahresertrag lag bei 4.100 kWh – das übertrifft meine ursprüngliche Erwartung deutlich." – Betreiber, Niedersachsen

### Erfahrung 2: Geräuschpegel im Alltag

Gemessene Werte liegen bei **42–47 dB(A)** in 10 Metern Entfernung – vergleichbar mit einem ruhigen Gespräch. Im Normalbetrieb kaum wahrnehmbar.

### Erfahrung 3: Montage und Installation

Typische Montagezeit für eine SkyWind NG inklusive Flanschmast: **ein halber bis ein Arbeitstag** durch zertifizierte Partner.

### Erfahrung 4: Genehmigung in der Praxis

- **Niedersachsen, Sachsen-Anhalt, MV:** In der Regel genehmigungsfrei bis 10 m Masthöhe
- **Bayern, Baden-Württemberg:** Häufiger Baugenehmigung erforderlich
- **NRW, Hessen:** Von Gemeinde zu Gemeinde verschieden

### Erfahrung 5: Kombination mit Photovoltaik

Mit einem Batteriespeicher berichten Kombinations-Betreiber von **Eigenversorgungsquoten zwischen 65 und 80 Prozent** – deutlich mehr als mit Solar allein.

### Fazit

✓ Windreiche Standorte: Ja, lohnt sich
✓ Kombination mit PV: Deutlicher Mehrwert
✗ Windschwache Lagen: Nicht empfohlen

Möchten Sie erfahren, ob Ihr Standort für die SkyWind NG geeignet ist? [Jetzt Standort prüfen lassen](/kontakt). Weitere Informationen auf unserer [SkyWind NG Produktseite](/skywind-ng).`,
      },
      {
        locale: "en",
        title: "SkyWind NG Reviews – What Customers Report After One Year",
        excerpt: "How does the SkyWind NG perform in everyday use? Real user experiences on yield, noise, installation and permits.",
        metaTitle: "SkyWind NG Reviews 2026 – Real User Experiences | WSP Solarenergie",
        metaDescription: "SkyWind NG real-world reviews: yield, noise levels, installation and permit requirements from actual operators.",
        content: `## SkyWind NG Reviews: Real-World Experiences

Operators at **wind-favorable locations** report annual yields between **1,800 and 3,200 kWh** with the SkyWind NG 1kW. The 2kW version reaches up to **5,000 kWh per year** at optimal sites.

Noise levels measure **42–47 dB(A)** at 10 meters – comparable to a quiet conversation.

With battery storage, combination operators report **self-sufficiency rates between 65 and 80 percent**.

Learn more on our [SkyWind NG product page](/skywind-ng) or [request a free site analysis](/kontakt).`,
      },
      {
        locale: "es",
        title: "SkyWind NG Experiencias – Qué Reportan los Clientes Tras un Año",
        excerpt: "¿Cómo funciona el SkyWind NG en la práctica? Experiencias reales sobre rendimiento, ruido, instalación y permisos.",
        metaTitle: "SkyWind NG Experiencias 2026 – Opiniones Reales | WSP Solarenergie",
        metaDescription: "Experiencias reales con el SkyWind NG: rendimiento, nivel de ruido, instalación y requisitos de permisos.",
        content: `## SkyWind NG Experiencias: Opiniones Reales

Los operadores en ubicaciones favorables al viento reportan rendimientos anuales de entre **1.800 y 3.200 kWh** con el SkyWind NG 1kW.

Los niveles de ruido miden **42–47 dB(A)** a 10 metros, comparable a una conversación tranquila.

Con almacenamiento de batería, los operadores reportan **tasas de autosuficiencia del 65–80%**.

Más información en nuestra [página SkyWind NG](/skywind-ng) o [solicita una consulta gratuita](/kontakt).`,
      },
    ],
  });

  // ── Artikel 2: SkyWind NG vs Photovoltaik ────────────────────────────────────
  console.log("Artikel 2: SkyWind NG vs. Photovoltaik …");
  await createPost({
    slug: "skywind-ng-vs-photovoltaik",
    status: "published",
    featured: true,
    publishedAt: "2026-06-03T10:00:00Z",
    readingTimeMinutes: 7,
    authorName: "WSP Solarenergie Redaktion",
    coverImageUrl: "https://webshop.wsp-solarenergie.de/images/skywind-rooftop.png",
    coverImageAlt: "SkyWind NG und Photovoltaik im Vergleich",
    categoryId: catId,
    tagIds: [tagMap["skywind-ng"], tagMap["photovoltaik"], tagMap["ratgeber"], tagMap["kombiloesung"]],
    translations: [
      {
        locale: "de",
        title: "SkyWind NG vs. Photovoltaik – Was leistet was, und wann kombinieren?",
        excerpt: "Solar oder Wind? Oder beides? Wir vergleichen die SkyWind NG direkt mit einer Dach-PV-Anlage nach Ertrag, Kosten und Standortanforderungen.",
        metaTitle: "SkyWind NG vs. Photovoltaik 2026 – Vergleich Ertrag & Kosten | WSP",
        metaDescription: "SkyWind NG vs. Photovoltaik: Direktvergleich nach Ertrag, Kosten, Standortbedarf und Wirtschaftlichkeit.",
        content: `## SkyWind NG vs. Photovoltaik – Der direkte Vergleich

### Wann wird Strom erzeugt?

| | SkyWind NG | Photovoltaik |
|---|---|---|
| Sommer, sonnig | Gering bis mittel | **Maximal** |
| Winter, bewölkt | **Hoch** | Gering |
| Nacht | Ja (wenn Wind) | Nein |
| Stabiler Jahresverlauf | **Gleichmäßiger** | Saisonal stark |

### Standortanforderungen

**Photovoltaik** funktioniert nahezu überall. **SkyWind NG** braucht mindestens **4 m/s** mittlere Jahreswindgeschwindigkeit.

### Wann macht welche Lösung Sinn?

**Photovoltaik zuerst** bei gutem Dach und schwachem Wind. **SkyWind NG** bei windigem Standort oder belegtem Dach. **Kombination** für maximale Autarkie.

Mehr zur [SkyWind NG Kleinwindanlage](/skywind-ng) oder [Kombilösungen](/kombiloesungen). Direkt [Beratung anfragen](/kontakt).`,
      },
      {
        locale: "en",
        title: "SkyWind NG vs. Photovoltaics – What Does What, and When to Combine?",
        excerpt: "Wind or solar? We compare the SkyWind NG with a rooftop PV system by yield, costs and site requirements.",
        metaTitle: "SkyWind NG vs. Solar PV 2026 – Yield & Cost Comparison | WSP",
        metaDescription: "SkyWind NG vs. photovoltaics: direct comparison by yield, costs, site requirements and economics.",
        content: `## SkyWind NG vs. Photovoltaics – Direct Comparison

The SkyWind NG generates power all year round including nights and overcast days. Solar has peak output in summer. They complement each other ideally.

**Photovoltaics first** when site has good solar exposure and weak winds. **SkyWind NG** makes sense at windy sites or when the roof is occupied. **Combination** recommended for maximum self-sufficiency.

Learn more about [SkyWind NG](/skywind-ng) or [request a consultation](/kontakt).`,
      },
      {
        locale: "es",
        title: "SkyWind NG vs. Fotovoltaica – ¿Qué Hace Qué y Cuándo Combinarlos?",
        excerpt: "¿Viento o solar? Comparamos el SkyWind NG con una instalación fotovoltaica según rendimiento, costes y requisitos de ubicación.",
        metaTitle: "SkyWind NG vs. Fotovoltaica 2026 – Comparativa | WSP",
        metaDescription: "SkyWind NG vs. fotovoltaica: comparativa directa por rendimiento, costes y rentabilidad.",
        content: `## SkyWind NG vs. Fotovoltaica – Comparativa Directa

El SkyWind NG genera electricidad todo el año, incluso de noche y en días nublados. La solar tiene producción máxima en verano. Se complementan perfectamente.

**Fotovoltaica primero** cuando la ubicación tiene buena exposición solar. **SkyWind NG** cuando la ubicación es ventosa o el tejado está ocupado.

Más sobre [SkyWind NG](/skywind-ng) o [solicita una consulta](/kontakt).`,
      },
    ],
  });

  // ── Artikel 3: Lohnt sich eine Kleinwindanlage? ────────────────────────────
  console.log("Artikel 3: Lohnt sich eine Kleinwindanlage? …");
  await createPost({
    slug: "lohnt-sich-kleinwindanlage",
    status: "published",
    featured: false,
    publishedAt: "2026-06-05T10:00:00Z",
    readingTimeMinutes: 6,
    authorName: "WSP Solarenergie Redaktion",
    coverImageUrl: "https://webshop.wsp-solarenergie.de/images/skywind-hero.png",
    coverImageAlt: "Kleinwindanlage Wirtschaftlichkeit",
    categoryId: catId,
    tagIds: [tagMap["kleinwindanlage"], tagMap["wirtschaftlichkeit"], tagMap["ratgeber"]],
    translations: [
      {
        locale: "de",
        title: "Lohnt sich eine Kleinwindanlage? Die ehrliche Antwort für 2026",
        excerpt: "Lohnt sich eine Kleinwindanlage wirtschaftlich? Wir liefern die ehrliche Antwort: wann ja, wann nein – und welche Standortbedingungen entscheidend sind.",
        metaTitle: "Lohnt sich eine Kleinwindanlage 2026? Wirtschaftlichkeit erklärt | WSP",
        metaDescription: "Lohnt sich eine Kleinwindanlage? Wann eine Investition in Windenergie für Eigenheim und Gewerbe wirklich wirtschaftlich ist.",
        content: `## Lohnt sich eine Kleinwindanlage? Die ehrliche Antwort

### Wann lohnt sie sich?

✓ Standort mit > 4 m/s mittlerer Jahreswindgeschwindigkeit
✓ Ausreichend Platz auf dem Grundstück
✓ Kombination mit PV oder Speicher geplant

✗ Windschwacher Standort (< 3 m/s): **Nicht empfohlen**
✗ Dichte Innenstadtlage: Wirtschaftlichkeit fraglich

### Rechenbeispiel SkyWind NG 2kW

- Investition: ca. 9.000 €
- Jahresertrag (5 m/s): 3.500 kWh
- Einsparung: ca. 820 €/Jahr
- **Amortisation: ca. 11 Jahre**

Den Windatlas für Ihren Standort finden Sie beim [Deutschen Wetterdienst](https://www.dwd.de/DE/klimaumwelt/klimaatlas/klimaatlas_node.html).

➜ [Kostenlose Standortanalyse anfragen](/kontakt) | [SkyWind NG entdecken](/skywind-ng)`,
      },
      {
        locale: "en",
        title: "Is a Small Wind Turbine Worth It? The Honest Answer for 2026",
        excerpt: "Is a small wind turbine economically viable? The honest answer: when yes, when no, and which conditions are decisive.",
        metaTitle: "Is a Small Wind Turbine Worth It 2026? Honest Economic Analysis | WSP",
        metaDescription: "Is a small wind turbine worth the investment? When wind energy makes economic sense for homes and businesses.",
        content: `## Is a Small Wind Turbine Worth It? The Honest Answer

A small wind turbine pays off when your site has **> 4 m/s annual average wind speed**. At < 3 m/s, it is generally not recommended.

**Sample calculation – SkyWind NG 2kW at a good site:**
- Investment: approx. €9,000
- Annual yield: 3,500 kWh → Annual savings: ~€820
- **Payback period: approx. 11 years**

[Request a free site analysis](/kontakt) | [Discover SkyWind NG](/skywind-ng)`,
      },
      {
        locale: "es",
        title: "¿Vale la Pena un Pequeño Aerogenerador? La Respuesta Honesta 2026",
        excerpt: "¿Es rentable un pequeño aerogenerador? La respuesta honesta: cuándo sí, cuándo no, y qué condiciones son decisivas.",
        metaTitle: "¿Vale la Pena un Pequeño Aerogenerador 2026? Análisis Económico | WSP",
        metaDescription: "¿Vale la pena invertir en un pequeño aerogenerador? Cuándo tiene sentido económico para hogares y empresas.",
        content: `## ¿Vale la Pena un Pequeño Aerogenerador? La Respuesta Honesta

Un aerogenerador es rentable cuando tu sitio tiene **> 4 m/s de velocidad media anual del viento**. Con < 3 m/s, generalmente no se recomienda.

**Ejemplo – SkyWind NG 2kW en buena ubicación:**
- Inversión: aprox. 9.000 €
- Producción anual: 3.500 kWh → Ahorro anual: ~820 €
- **Período de amortización: aprox. 11 años**

[Solicita un análisis de ubicación gratuito](/kontakt) | [Descubre el SkyWind NG](/skywind-ng)`,
      },
    ],
  });

  // ── Artikel 4: SkyWind NG Kosten ─────────────────────────────────────────────
  console.log("Artikel 4: SkyWind NG Kosten …");
  await createPost({
    slug: "skywind-ng-kosten",
    status: "published",
    featured: false,
    publishedAt: "2026-06-08T10:00:00Z",
    readingTimeMinutes: 5,
    authorName: "WSP Solarenergie Redaktion",
    coverImageUrl: "https://webshop.wsp-solarenergie.de/images/skywind-hero.png",
    coverImageAlt: "SkyWind NG Kosten und Preise",
    categoryId: catId,
    tagIds: [tagMap["skywind-ng"], tagMap["wirtschaftlichkeit"]],
    translations: [
      {
        locale: "de",
        title: "SkyWind NG Kosten 2026 – Preis, Förderung und Amortisation",
        excerpt: "Was kostet die SkyWind NG wirklich? Alle Kostenbestandteile aufgeschlüsselt: Anlagenpreis, Mast, Montage, Netzanschluss und Förderoptionen.",
        metaTitle: "SkyWind NG Kosten & Preis 2026 – Vollständige Übersicht | WSP",
        metaDescription: "SkyWind NG Kosten: Anlagenpreis, Mast, Montage, Netzanschluss und Förderung. Reale Gesamtkosten für 1kW und 2kW.",
        content: `## SkyWind NG Kosten 2026 – Alle Preisbestandteile

| Komponente | NG 1kW | NG 2kW |
|---|---|---|
| Anlage (inkl. Regler) | 3.500–4.500 € | 5.500–7.000 € |
| Flanschmast (3–6 m) | 500–1.200 € | 800–1.500 € |
| Montage | 800–1.500 € | 1.200–2.000 € |
| Netzanschluss | 300–800 € | 300–800 € |
| **Gesamt (ca.)** | **5.100–8.000 €** | **7.800–11.300 €** |

### Förderung

**KfW 270:** Günstige Kredite für erneuerbare Energieprojekte.
**EEG-Einspeisung:** ca. 7–8 ct/kWh für Überschussstrom.
**Landesförderung:** Bayern, NRW, Schleswig-Holstein besonders aktiv.

Aktuelle Preise im [Shop](/products) oder [Beratung anfragen](/kontakt). Mehr zur [SkyWind NG](/skywind-ng).`,
      },
      {
        locale: "en",
        title: "SkyWind NG Cost 2026 – Price, Subsidies and Payback Period",
        excerpt: "What does the SkyWind NG actually cost? All cost components broken down: turbine, mast, installation, grid connection and subsidies.",
        metaTitle: "SkyWind NG Cost & Price 2026 – Complete Overview | WSP",
        metaDescription: "SkyWind NG costs: turbine price, mast, installation, grid connection and subsidies for 1kW and 2kW models.",
        content: `## SkyWind NG Cost 2026

| Component | NG 1kW | NG 2kW |
|---|---|---|
| Turbine (incl. controller) | €3,500–4,500 | €5,500–7,000 |
| Flange mast (3–6 m) | €500–1,200 | €800–1,500 |
| Installation | €800–1,500 | €1,200–2,000 |
| Grid connection | €300–800 | €300–800 |
| **Total (approx.)** | **€5,100–8,000** | **€7,800–11,300** |

View [prices in our shop](/products) or [request a free consultation](/kontakt). More about [SkyWind NG](/skywind-ng).`,
      },
      {
        locale: "es",
        title: "SkyWind NG Costes 2026 – Precio, Subvenciones y Amortización",
        excerpt: "¿Cuánto cuesta realmente el SkyWind NG? Todos los componentes de coste desglosados: equipo, mástil, instalación y subvenciones.",
        metaTitle: "SkyWind NG Costes 2026 – Resumen Completo | WSP",
        metaDescription: "Costes del SkyWind NG: precio del equipo, mástil, instalación y subvenciones para modelos 1kW y 2kW.",
        content: `## SkyWind NG Costes 2026

| Componente | NG 1kW | NG 2kW |
|---|---|---|
| Turbina (incl. controlador) | 3.500–4.500 € | 5.500–7.000 € |
| Mástil (3–6 m) | 500–1.200 € | 800–1.500 € |
| Instalación | 800–1.500 € | 1.200–2.000 € |
| Conexión a red | 300–800 € | 300–800 € |
| **Total (aprox.)** | **5.100–8.000 €** | **7.800–11.300 €** |

Ver [precios en la tienda](/products) o [solicitar consulta gratuita](/kontakt). Más sobre [SkyWind NG](/skywind-ng).`,
      },
    ],
  });

  // ── Artikel 5: Kleinwindanlage Einfamilienhaus ────────────────────────────────
  console.log("Artikel 5: Kleinwindanlage Einfamilienhaus …");
  await createPost({
    slug: "kleinwindanlage-einfamilienhaus",
    status: "published",
    featured: false,
    publishedAt: "2026-06-10T10:00:00Z",
    readingTimeMinutes: 6,
    authorName: "WSP Solarenergie Redaktion",
    coverImageUrl: "https://webshop.wsp-solarenergie.de/images/solarzaun-house.png",
    coverImageAlt: "Kleinwindanlage für Einfamilienhaus",
    categoryId: catId,
    tagIds: [tagMap["kleinwindanlage"], tagMap["skywind-ng"], tagMap["ratgeber"]],
    translations: [
      {
        locale: "de",
        title: "Kleinwindanlage für das Einfamilienhaus – Was geht, was nicht",
        excerpt: "Kann ich als Hausbesitzer eine Kleinwindanlage aufstellen? Welche Anlagen sind geeignet, was ist genehmigungspflichtig, und wann lohnt es sich?",
        metaTitle: "Kleinwindanlage Einfamilienhaus 2026 – Genehmigung, Kosten & Eignung | WSP",
        metaDescription: "Kleinwindanlage für Einfamilienhaus: Was ist erlaubt, was kostet es, und lohnt es sich? Alles Wichtige für Hausbesitzer.",
        content: `## Kleinwindanlage für das Einfamilienhaus

### Welche Anlage passt?

- **SkyWind NG 1kW:** Ideal für Einfamilienhäuser mit mittlerem Energiebedarf
- **SkyWind NG 2kW:** Für größere Grundstücke und höheren Strombedarf (E-Auto, Wärmepumpe)

### Montagemöglichkeiten

1. **Freistehender Mast** (häufigste Lösung) – Flanschmast 3–6 m auf Betonfundament
2. **Dachmontage** – Möglich, Statikprüfung erforderlich
3. **Fassadenmontage** – Für SkyWind NG nicht vorgesehen

### Genehmigung

Häufig genehmigungsfrei bis 10 m Masthöhe außerhalb von Schutzgebieten. Bayernund BW: oft Baugenehmigung nötig. Wir klären das kostenlos für Ihren Standort.

### Typisches Beispiel

- Haus 150 m², 5.000 kWh/Jahr Verbrauch
- SkyWind NG 1kW → ca. 1.800 kWh/Jahr (deckt ~36 % ab)
- Einsparung: ca. 360 €/Jahr
- Kombination mit [Solarzaun](/solarzaun) empfohlen

➜ [Kostenlos beraten lassen](/kontakt) | [SkyWind NG entdecken](/skywind-ng)`,
      },
      {
        locale: "en",
        title: "Small Wind Turbine for Single-Family Homes – What Works and What Doesn't",
        excerpt: "Can I install a small wind turbine as a homeowner? Which turbines suit single-family homes, what requires permits, and when is it worth it?",
        metaTitle: "Small Wind Turbine Single-Family Home 2026 – Permit & Cost | WSP",
        metaDescription: "Small wind turbine for single-family home: what is permitted, costs and suitability. Everything homeowners need to know.",
        content: `## Small Wind Turbine for the Single-Family Home

The **SkyWind NG 1kW** suits average-sized plots; the **2kW** model is for larger properties.

**Most common installation:** Free-standing flange mast 3–6 m. Often permit-free up to 10 m mast height (varies by state).

**Typical example:** 150 m² home, 5,000 kWh/year consumption → SkyWind NG 1kW yields ~1,800 kWh/year, saving ~€360/year.

Combine with a [solar fence](/solarzaun) for higher self-sufficiency.

[Request a free consultation](/kontakt) | [Discover SkyWind NG](/skywind-ng)`,
      },
      {
        locale: "es",
        title: "Pequeño Aerogenerador para Casa Unifamiliar – Qué Funciona y Qué No",
        excerpt: "¿Puedo instalar un aerogenerador como propietario? Qué turbinas son adecuadas, qué requiere permisos y cuándo vale la pena.",
        metaTitle: "Aerogenerador Casa Unifamiliar 2026 – Permisos y Costes | WSP",
        metaDescription: "Pequeño aerogenerador para casa unifamiliar: qué está permitido, costes y idoneidad para propietarios.",
        content: `## Pequeño Aerogenerador para Casa Unifamiliar

El **SkyWind NG 1kW** es ideal para parcelas de tamaño medio; el modelo **2kW** para propiedades más grandes.

**Instalación más común:** Mástil de brida independiente de 3–6 m. Frecuentemente sin permiso hasta 10 m de altura de mástil (varía por comunidad autónoma/estado).

**Ejemplo típico:** Casa de 150 m², consumo anual de 5.000 kWh → SkyWind NG 1kW produce ~1.800 kWh/año, ahorrando ~360 €/año.

Combina con una [valla solar](/solarzaun) para mayor autosuficiencia.

[Solicita una consulta gratuita](/kontakt) | [Descubre el SkyWind NG](/skywind-ng)`,
      },
    ],
  });

  console.log("\n✅ Alle 5 Artikel erfolgreich deployed!");
}

main()
  .catch((e) => { console.error("\n❌ Fehler:", e.message); process.exit(1); });
