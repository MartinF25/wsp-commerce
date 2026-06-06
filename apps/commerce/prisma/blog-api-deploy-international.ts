/**
 * Blog Deploy: Internationale Kategorien + 2 Artikel
 * Nutzt die Commerce Admin-API (kein direkter DB-Zugriff nötig).
 *
 * Lauf: cd apps/commerce && pnpm ts-node prisma/blog-api-deploy-international.ts
 * Idempotent: bestehende Kategorien/Tags/Artikel werden übersprungen (409).
 */

// Load .env manually (no dotenv dependency needed)
import { readFileSync } from "fs";
import { resolve } from "path";
try {
  const envFile = readFileSync(resolve(__dirname, "../.env"), "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
} catch { /* .env optional */ }

const API = "https://commerce-api-production-614e.up.railway.app";
const ADMIN_KEY = process.env.ADMIN_SECRET ?? "";
const BASE_IMG = "https://webshop.wsp-solarenergie.de/images";

const headers = {
  "Content-Type": "application/json",
  "X-Admin-Key": ADMIN_KEY,
};

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

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
    if (res.status === 409) return null; // already exists → ok
    const msg = (json as { error?: { message?: string } })?.error?.message ?? text;
    throw new Error(`${method} ${path} → ${res.status}: ${msg}`);
  }
  return (json as { data?: unknown })?.data ?? json;
}

// ─── Category upsert ──────────────────────────────────────────────────────────

async function upsertCategory(slug: string, translations: { locale: string; name: string; description?: string }[]) {
  const list = await api("GET", "/blog/categories") as { slug: string; id: string }[] | null;
  if (Array.isArray(list)) {
    const existing = list.find((c) => c.slug === slug);
    if (existing) { console.log(`  → '${slug}' existiert bereits`); return existing.id; }
  }
  const result = await api("POST", "/blog/categories", { slug, translations }) as { id: string } | null;
  if (!result) throw new Error(`Kategorie '${slug}' konnte nicht angelegt werden`);
  console.log(`  ✓ Kategorie '${slug}' angelegt`);
  return (result as { id: string }).id;
}

// ─── Tag upsert ───────────────────────────────────────────────────────────────

async function upsertTag(slug: string, name: string): Promise<string> {
  const list = await api("GET", "/blog/tags") as { slug: string; id: string }[] | null;
  if (Array.isArray(list)) {
    const existing = list.find((t) => t.slug === slug);
    if (existing) return existing.id;
  }
  const result = await api("POST", "/blog/tags", { slug, name }) as { id: string } | null;
  if (!result) throw new Error(`Tag '${slug}' konnte nicht angelegt werden`);
  console.log(`  ✓ Tag '${slug}'`);
  return (result as { id: string }).id;
}

// ─── Post create (skip if exists) ────────────────────────────────────────────

async function createPost(post: {
  slug: string; status: string; featured?: boolean;
  publishedAt?: string; readingTimeMinutes?: number;
  authorName?: string; coverImageUrl?: string; coverImageAlt?: string;
  categoryId?: string; tagIds: string[];
  translations: { locale: string; title: string; excerpt: string; content: string; metaTitle?: string; metaDescription?: string; }[];
}) {
  const list = await api("GET", "/blog/posts?limit=200") as { data?: { slug: string }[] } | { slug: string }[] | null;
  const items = Array.isArray(list) ? list : (list as { data?: { slug: string }[] })?.data ?? [];
  if (items.some((p) => p.slug === post.slug)) {
    console.log(`  → '${post.slug}' existiert bereits, übersprungen`);
    return;
  }
  await api("POST", "/blog/posts", post);
  console.log(`  ✓ '${post.slug}' erstellt`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Blog-Deploy: Internationale Kategorien + Artikel startet …\n");

  // ── 1. Kategorien anlegen ──────────────────────────────────────────────────

  console.log("Kategorien anlegen …");
  const cats: Record<string, string> = {};

  cats["micro-wind-energy"] = await upsertCategory("micro-wind-energy", [
    { locale: "en", name: "Micro Wind Energy", description: "Guides, comparisons and technical deep-dives on micro wind turbines." },
    { locale: "de", name: "Micro Wind Energy", description: "Ratgeber, Vergleiche und Technik-Analysen zu Mikrowindkraftanlagen." },
    { locale: "es", name: "Micro Wind Energy", description: "Guías, comparativas y análisis técnicos sobre mini aerogeneradores." },
  ]);
  cats["off-grid-power"] = await upsertCategory("off-grid-power", [
    { locale: "en", name: "Off Grid Power", description: "Everything about off-grid energy systems: batteries, wind turbines and autonomous power supply." },
    { locale: "de", name: "Off Grid Power", description: "Alles zu autarken Energiesystemen: Batteriespeicher, Windkraft und netzunabhängige Stromversorgung." },
    { locale: "es", name: "Off Grid Power", description: "Todo sobre sistemas de energía autónomos: baterías, aerogeneradores y suministro eléctrico independiente." },
  ]);
  cats["hybrid-solar-wind-systems"] = await upsertCategory("hybrid-solar-wind-systems", [
    { locale: "en", name: "Hybrid Solar Wind Systems", description: "How to combine solar and wind into efficient hybrid energy systems." },
    { locale: "de", name: "Hybrid Solar Wind Systeme", description: "Wie Sie Solar und Wind zu effizienten Hybridsystemen kombinieren." },
    { locale: "es", name: "Sistemas Híbridos Solar-Eólico", description: "Cómo combinar solar y eólico en sistemas híbridos eficientes." },
  ]);
  cats["rooftop-wind-turbines"] = await upsertCategory("rooftop-wind-turbines", [
    { locale: "en", name: "Rooftop Wind Turbines", description: "Installation guides and performance data for rooftop-mounted wind turbines." },
    { locale: "de", name: "Dach-Windkraftanlagen", description: "Montageleitfäden und Ertragsdaten für Dach-Windkraftanlagen." },
    { locale: "es", name: "Aerogeneradores en Tejado", description: "Guías de instalación y datos de rendimiento para aerogeneradores en tejado." },
  ]);
  cats["energy-independence"] = await upsertCategory("energy-independence", [
    { locale: "en", name: "Energy Independence", description: "Strategies and step-by-step plans for achieving energy autarky." },
    { locale: "de", name: "Energieunabhängigkeit", description: "Strategien und Pläne für vollständige Energieautarkie." },
    { locale: "es", name: "Independencia Energética", description: "Estrategias y planes para lograr la autarquía energética." },
  ]);
  cats["battery-storage"] = await upsertCategory("battery-storage", [
    { locale: "en", name: "Battery Storage", description: "Battery storage systems for wind and solar: comparisons and sizing guides." },
    { locale: "de", name: "Batteriespeicher", description: "Batteriespeicher für Wind und Solar: Vergleich und Dimensionierungsratgeber." },
    { locale: "es", name: "Almacenamiento en Baterías", description: "Sistemas de almacenamiento en baterías para energía eólica y solar." },
  ]);

  console.log("\nTags anlegen …");
  const tags: Record<string, string> = {};
  for (const [slug, name] of [
    ["micro-wind-turbine", "Micro Wind Turbine"],
    ["energy-production", "Energy Production"],
    ["wind-energy", "Wind Energy"],
    ["skywind-ng", "SkyWind NG"],
    ["guide", "Guide"],
    ["review", "Review"],
  ] as [string, string][]) {
    tags[slug] = await upsertTag(slug, name);
  }

  // ── 2. Artikel 001 ─────────────────────────────────────────────────────────

  console.log("\nArtikel 001: How Much Energy Does a Micro Wind Turbine Produce? …");
  await createPost({
    slug: "how-much-energy-does-a-micro-wind-turbine-produce",
    status: "published",
    featured: true,
    publishedAt: "2026-06-06T10:00:00Z",
    readingTimeMinutes: 7,
    authorName: "WSP Solarenergie Editorial",
    coverImageUrl: `${BASE_IMG}/skywind-hero.png`,
    coverImageAlt: "SkyWind NG micro wind turbine generating energy",
    categoryId: cats["micro-wind-energy"],
    tagIds: [tags["micro-wind-turbine"], tags["energy-production"], tags["wind-energy"], tags["skywind-ng"], tags["guide"]],
    translations: [
      {
        locale: "en",
        title: "How Much Energy Does a Micro Wind Turbine Produce?",
        excerpt: "Concrete output numbers, the key variables that affect yield, and a clear picture of what to expect from a modern micro wind turbine — including the SkyWind NG 1kW and 2kW.",
        metaTitle: "How Much Energy Does a Micro Wind Turbine Produce? | WSP Blog",
        metaDescription: "Real output figures for micro wind turbines: annual kWh by wind speed, SkyWind NG 1kW vs 2kW, and how output compares to typical household consumption.",
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

At an average inland site with 5 m/s, the SkyWind NG 1kW produces approximately **1,500–2,000 kWh per year** — enough to cover a meaningful share of a household's electricity needs.

## How Does This Compare to Household Consumption?

For context:

- An average German or UK household uses approximately **3,500–4,500 kWh per year**
- Adding an electric vehicle raises consumption by roughly **2,000–3,000 kWh annually**
- A heat pump adds another **3,000–6,000 kWh per year**

At a good wind site (5 m/s average), the SkyWind NG 1kW covers roughly **40–55% of a typical household's base consumption**. For higher self-sufficiency, the 2kW model or a combination with a [solar fence](/solarzaun) or rooftop PV is recommended. A well-designed [hybrid solar-wind system](/hybrid-solar-wind-system) combining both typically achieves self-sufficiency rates of 65–80%.

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
      {
        locale: "de",
        title: "Wie viel Energie produziert eine Kleinwindanlage?",
        excerpt: "Konkrete Ertragszahlen, die wichtigsten Einflussfaktoren und realistische Erwartungen – auch für die SkyWind NG 1kW und 2kW.",
        metaTitle: "Wie viel Energie produziert eine Kleinwindanlage? | WSP Blog",
        metaDescription: "Reale Ertragszahlen für Kleinwindanlagen: jährliche kWh nach Windgeschwindigkeit, SkyWind NG 1kW vs. 2kW und Vergleich mit typischem Haushaltsverbrauch.",
        content: `## Wie viel Energie produziert eine Kleinwindanlage?

Die erste Frage, die fast alle potenziellen Betreiber stellen, lautet: Wie viel Strom erzeugt eine Kleinwindanlage wirklich?

**Windgeschwindigkeit** ist der wichtigste Faktor. Bei 5 m/s produziert die SkyWind NG 1kW ca. **1.500–2.000 kWh pro Jahr** – genug, um einen erheblichen Teil des Haushaltsstrombedarfs zu decken.

| Windgeschwindigkeit | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| 4 m/s | ~900–1.200 kWh | ~1.600–2.200 kWh |
| 5 m/s | ~1.500–2.000 kWh | ~2.800–3.600 kWh |
| 6 m/s | ~2.200–2.800 kWh | ~4.000–5.200 kWh |

An einem windreichen Standort deckt die [SkyWind NG](/skywind-ng) 1kW rund 40–55 % des Basisverbrauchs. In Kombination mit einem [Solar-Wind-Hybridsystem](/hybrid-solar-wind-system) sind 65–80 % Eigenversorgung realistisch.

**Häufige Fragen:** Bei 5 m/s produziert eine 1kW-Anlage ca. 4–6 kWh pro Tag. Mindestwindgeschwindigkeit für wirtschaftlichen Betrieb: 4 m/s Jahresmittel. Die SkyWind NG startet ab 2,5 m/s.

[Zur SkyWind NG Produktseite →](/skywind-ng) | [Beratung anfragen →](/kontakt)

*Weitere Ratgeber: [Micro Wind Energy Themenseite →](/blog/category/micro-wind-energy)*`,
      },
      {
        locale: "es",
        title: "¿Cuánta Energía Produce un Mini Aerogenerador?",
        excerpt: "Cifras reales de producción, los factores clave que afectan al rendimiento y expectativas realistas para el SkyWind NG 1kW y 2kW.",
        metaTitle: "¿Cuánta Energía Produce un Mini Aerogenerador? | WSP Blog",
        metaDescription: "Cifras reales de producción de mini aerogeneradores: kWh anuales según velocidad del viento, SkyWind NG 1kW vs 2kW y comparativa con el consumo doméstico.",
        content: `## ¿Cuánta Energía Produce un Mini Aerogenerador?

A 5 m/s de media, el [SkyWind NG](/skywind-ng) 1kW produce aproximadamente **1.500–2.000 kWh al año**.

| Velocidad Media | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| 4 m/s | ~900–1.200 kWh | ~1.600–2.200 kWh |
| 5 m/s | ~1.500–2.000 kWh | ~2.800–3.600 kWh |
| 6 m/s | ~2.200–2.800 kWh | ~4.000–5.200 kWh |

En combinación con un [sistema híbrido solar-eólico](/hybrid-solar-wind-system), las tasas de autosuficiencia del 65–80% son alcanzables.

[Ver SkyWind NG →](/skywind-ng) | [Solicitar consulta →](/kontakt)

*Más guías: [Centro Micro Wind Energy →](/blog/category/micro-wind-energy)*`,
      },
    ],
  });

  // ── 3. Artikel 002 ─────────────────────────────────────────────────────────

  console.log("\nArtikel 002: SkyWind NG Review …");
  await createPost({
    slug: "skywind-ng-micro-wind-turbine-review",
    status: "published",
    featured: true,
    publishedAt: "2026-06-10T10:00:00Z",
    readingTimeMinutes: 8,
    authorName: "WSP Solarenergie Editorial",
    coverImageUrl: `${BASE_IMG}/skywind-rooftop.png`,
    coverImageAlt: "SkyWind NG micro wind turbine installed on a residential property",
    categoryId: cats["micro-wind-energy"],
    tagIds: [tags["skywind-ng"], tags["micro-wind-turbine"], tags["review"], tags["guide"]],
    translations: [
      {
        locale: "en",
        title: "SkyWind NG Review: A Compact Micro Wind Turbine for Homes, Farms and Off-Grid Projects",
        excerpt: "An honest look at the SkyWind NG micro wind turbine: specifications, real-world performance, installation requirements and the sites where it genuinely earns its place.",
        metaTitle: "SkyWind NG Micro Wind Turbine: Honest Review 2026 | WSP",
        metaDescription: "An honest review of the SkyWind NG micro wind turbine: specifications, real-world performance, installation requirements and who it's actually right for.",
        content: `## SkyWind NG: A Compact Micro Wind Turbine for Homes, Farms and Off-Grid Projects

The SkyWind NG is designed for small-scale applications — residential properties, agricultural holdings, rural businesses and off-grid sites that need a reliable, independent power source without the infrastructure of a large commercial turbine.

## What Is the SkyWind NG?

The SkyWind NG is a compact micro wind turbine available in 1kW and 2kW configurations. Key features: variable-speed rotor, cut-in speed ~2.5 m/s, flanged mast system (3 m+), grid-tied and off-grid compatible.

For full specifications, see the [SkyWind NG product page](/skywind-ng).

## SkyWind NG 1kW vs. 2kW

| | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| Rated power | 1,000 W | 2,000 W |
| Rotor diameter | ~2.2 m | ~3.0 m |
| Annual yield at 5 m/s | 1,500–2,000 kWh | 2,800–3,600 kWh |
| Annual yield at 6 m/s | 2,200–2,800 kWh | 4,000–5,200 kWh |
| Best for | Single homes, cabins | Larger properties, businesses |

The **1kW model** covers roughly 40–55% of a typical household's consumption at 5 m/s. The **2kW model** suits sites with 6+ m/s average or higher self-sufficiency goals.

## Where Does the SkyWind NG Perform Best?

**Open rural properties.** Farmyards and rural homes with minimal wind obstruction within 100–200 m.

**Coastal and elevated locations.** Properties often exceeding 5 m/s annual average — the economic viability threshold.

**Off-grid cabins and remote sites.** With battery storage, the SkyWind NG operates fully autonomously. See our [off-grid wind turbine guide](/off-grid-wind-turbine).

**Hybrid solar-wind installations.** Wind and solar complement each other seasonally. A well-designed [hybrid solar-wind system](/hybrid-solar-wind-system) achieves 65–80% self-sufficiency.

## Installation: What to Expect

Standard installation: site assessment → foundation → mast + turbine mounting (half-day) → grid or battery connection. Recommended mast height: 5–6 m. We provide a free site check before any equipment is ordered.

## Frequently Asked Questions

**Is the SkyWind NG available outside Germany?**
Yes — EU delivery typically 5–10 business days. International orders on request via [contact form](/kontakt).

**What maintenance does the SkyWind NG require?**
Annual visual inspection; full service every 3–5 years. No gearbox = significantly reduced mechanical wear.

**Does the SkyWind NG qualify for subsidies?**
In Germany: KfW Program 270. Most EU states have equivalent programmes. We advise during consultation.

**How does it compare to solar panels?**
At 5 m/s: 1,500–2,000 kWh/year vs. ~900–1,100 kWh/year for 1 kWp solar in Central Europe — but at different times of year. See our [energy output comparison guide](/blog/how-much-energy-does-a-micro-wind-turbine-produce).

**Can it be roof-mounted?**
Yes, via flanged mast — requires a structural assessment. Ground mounting is usually simpler and delivers better wind access.

---

[See the SkyWind NG product page →](/skywind-ng) · [Request a free site consultation →](/kontakt)

*More guides: [Micro Wind Energy resource centre →](/blog/category/micro-wind-energy)*`,
      },
      {
        locale: "de",
        title: "SkyWind NG: Kompakte Kleinwindanlage für Eigenheim, Hof und Off-Grid-Projekte",
        excerpt: "Ein ehrlicher Blick auf die SkyWind NG Kleinwindanlage: Spezifikationen, reale Leistung, Installationsanforderungen und die Standorte, an denen sie wirklich überzeugt.",
        metaTitle: "SkyWind NG Kleinwindanlage: Erfahrungen & Test 2026 | WSP",
        metaDescription: "SkyWind NG ehrlich bewertet: Spezifikationen, reale Leistung, Installationsanforderungen und für wen sich die Anlage wirklich lohnt.",
        content: `## SkyWind NG: Kompakte Kleinwindanlage für Eigenheim, Hof und Off-Grid

Die [SkyWind NG](/skywind-ng) ist in 1kW und 2kW erhältlich und eignet sich für Eigenheime, Höfe, Gewerbebetriebe und netzferne Standorte.

| | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| Nennleistung | 1.000 W | 2.000 W |
| Jahresertrag bei 5 m/s | 1.500–2.000 kWh | 2.800–3.600 kWh |
| Jahresertrag bei 6 m/s | 2.200–2.800 kWh | 4.000–5.200 kWh |

**Beste Standorte:** Offene Lagen, Küstennähe, erhöhte Grundstücke. In Kombination mit einem [Solar-Wind-Hybridsystem](/hybrid-solar-wind-system) sind 65–80 % Eigenversorgung realistisch. Unser [Off-Grid-Ratgeber](/off-grid-wind-turbine) erklärt die Systemplanung.

**Montage:** Standortanalyse → Fundament → Mast + Turbine (halber Arbeitstag) → Anschluss. Empfohlene Masthöhe: 5–6 m. Kostenlose Standortprüfung vor dem Kauf inklusive.

[Zur SkyWind NG Produktseite →](/skywind-ng) | [Beratung anfragen →](/kontakt)

*Weitere Ratgeber: [Micro Wind Energy Themenseite →](/blog/category/micro-wind-energy)*`,
      },
      {
        locale: "es",
        title: "SkyWind NG: Mini Aerogenerador para Hogares, Granjas y Proyectos Off-Grid",
        excerpt: "Una evaluación honesta del SkyWind NG: especificaciones, rendimiento real, requisitos de instalación y para qué proyectos es realmente adecuado.",
        metaTitle: "SkyWind NG Mini Aerogenerador: Review Honesta 2026 | WSP",
        metaDescription: "Review del SkyWind NG: especificaciones, rendimiento real, requisitos de instalación y para quién es adecuado.",
        content: `## SkyWind NG: Mini Aerogenerador para Hogares, Granjas y Off-Grid

El [SkyWind NG](/skywind-ng) está disponible en 1kW y 2kW para propiedades residenciales, granjas y ubicaciones off-grid.

| | SkyWind NG 1kW | SkyWind NG 2kW |
|---|---|---|
| Potencia | 1.000 W | 2.000 W |
| Producción a 5 m/s | 1.500–2.000 kWh | 2.800–3.600 kWh |
| Producción a 6 m/s | 2.200–2.800 kWh | 4.000–5.200 kWh |

Funciona mejor en propiedades rurales abiertas, zonas costeras y ubicaciones off-grid. Combinado con un [sistema híbrido solar-eólico](/hybrid-solar-wind-system), alcanza 65–80% de autosuficiencia.

[Ver SkyWind NG →](/skywind-ng) | [Solicitar consulta →](/kontakt)

*Más guías: [Centro Micro Wind Energy →](/blog/category/micro-wind-energy)*`,
      },
    ],
  });

  console.log("\n✅ Deploy abgeschlossen.");
  console.log("   Kategorien: 6  |  Artikel: 2");
  console.log("\nBlog-URLs:");
  console.log("  /en/blog/how-much-energy-does-a-micro-wind-turbine-produce");
  console.log("  /en/blog/skywind-ng-micro-wind-turbine-review");
}

main().catch((e) => { console.error("\n❌ Fehler:", e.message); process.exit(1); });
