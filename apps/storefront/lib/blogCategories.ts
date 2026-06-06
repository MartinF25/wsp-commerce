import type { RelatedLink } from "@/components/blog/BlogRelatedLinks";

// ─── Category data ─────────────────────────────────────────────────────────────
// Single source of truth for the 6 international blog categories.
// Visual styles (Tailwind classes) are intentionally kept in the page template
// so the Tailwind content scanner can detect them.

export interface CategoryLocaleData {
  name: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
}

export interface CategoryMeta {
  slug: string;
  icon: string;
  sortOrder: number;
  relatedLinks: RelatedLink[];
  locales: Record<"de" | "en" | "es", CategoryLocaleData>;
}

export const BLOG_CATEGORIES: CategoryMeta[] = [
  {
    slug: "micro-wind-energy",
    icon: "🌬️",
    sortOrder: 1,
    relatedLinks: [
      { href: "/skywind-ng",               label: "SkyWind NG",               description: "Specs, models & pricing",       icon: "⚡" },
      { href: "/micro-wind-turbine",        label: "Micro Wind Turbine Guide", description: "Technology overview",           icon: "🌬️" },
      { href: "/small-wind-turbine-for-home", label: "Wind Turbine for Home", description: "Residential solutions",         icon: "🏠" },
    ],
    locales: {
      en: {
        name: "Micro Wind Energy",
        description: "Guides, comparisons and technical deep-dives on micro wind turbines for homes, farms and off-grid use.",
        metaTitle: "Micro Wind Energy – Guides, Reviews & Comparisons | WSP Blog",
        metaDescription: "Expert guides on micro wind turbines: sizing, installation, performance data and off-grid applications. Updated 2026.",
      },
      de: {
        name: "Micro Wind Energy",
        description: "Ratgeber, Vergleiche und Technik-Analysen zu Mikrowindkraftanlagen für Eigenheim, Hof und Off-Grid-Einsatz.",
        metaTitle: "Micro Wind Energy – Ratgeber & Vergleiche | WSP Blog",
        metaDescription: "Expertenwissen zu Mikrowindkraftanlagen: Dimensionierung, Montage, Ertragsdaten und Off-Grid-Einsatz. Aktualisiert 2026.",
      },
      es: {
        name: "Micro Wind Energy",
        description: "Guías, comparativas y análisis técnicos sobre mini aerogeneradores para hogares, granjas y uso off-grid.",
        metaTitle: "Micro Wind Energy – Guías y Comparativas | WSP Blog",
        metaDescription: "Guías expertas sobre mini aerogeneradores: dimensionamiento, instalación, rendimiento y aplicaciones off-grid. Actualizado 2026.",
      },
    },
  },

  {
    slug: "off-grid-power",
    icon: "🔋",
    sortOrder: 2,
    relatedLinks: [
      { href: "/off-grid-wind-turbine",     label: "Off-Grid Wind Turbine",    description: "Standalone turbine guide",      icon: "🌬️" },
      { href: "/skywind-ng",               label: "SkyWind NG",               description: "Best turbine for off-grid",     icon: "⚡" },
      { href: "/hybrid-solar-wind-system", label: "Hybrid Solar-Wind System", description: "Maximum off-grid independence", icon: "☀️" },
    ],
    locales: {
      en: {
        name: "Off Grid Power",
        description: "Everything about off-grid energy systems: batteries, wind turbines, solar panels and autonomous power supply.",
        metaTitle: "Off Grid Power – Wind, Solar & Battery Systems | WSP Blog",
        metaDescription: "Complete guides for off-grid power: wind turbine sizing, battery storage and hybrid solar systems for energy independence.",
      },
      de: {
        name: "Off Grid Power",
        description: "Alles zu autarken Energiesystemen: Batteriespeicher, Windkraft, Solar und netzunabhängige Stromversorgung.",
        metaTitle: "Off Grid Power – Wind, Solar & Batteriespeicher | WSP Blog",
        metaDescription: "Ratgeber zur Off-Grid-Energieversorgung: Windkraftanlagen, Batteriespeicher und Hybridsysteme für vollständige Autarkie.",
      },
      es: {
        name: "Off Grid Power",
        description: "Todo sobre sistemas de energía autónomos: baterías, aerogeneradores, paneles solares y suministro eléctrico independiente.",
        metaTitle: "Off Grid Power – Viento, Solar y Baterías | WSP Blog",
        metaDescription: "Guías completas para energía off-grid: dimensionamiento de aerogeneradores, almacenamiento en baterías y sistemas híbridos solares.",
      },
    },
  },

  {
    slug: "hybrid-solar-wind-systems",
    icon: "☀️",
    sortOrder: 3,
    relatedLinks: [
      { href: "/hybrid-solar-wind-system", label: "Hybrid Solar-Wind System", description: "Product & guide page",           icon: "☀️" },
      { href: "/skywind-ng",               label: "SkyWind NG",               description: "Wind component",               icon: "⚡" },
      { href: "/solarzaun",                label: "Solar Fence",              description: "Solar component",               icon: "🌿" },
    ],
    locales: {
      en: {
        name: "Hybrid Solar Wind Systems",
        description: "How to combine solar panels and wind turbines into efficient hybrid energy systems for year-round power.",
        metaTitle: "Hybrid Solar Wind Systems – Guides & Setup Tips | WSP Blog",
        metaDescription: "Learn how to build a hybrid solar-wind energy system: components, sizing, battery storage and year-round performance.",
      },
      de: {
        name: "Hybrid Solar Wind Systeme",
        description: "Wie Sie Solarmodule und Windkraftanlagen zu effizienten Hybridsystemen für ganzjährige Stromversorgung kombinieren.",
        metaTitle: "Hybrid Solar Wind Systeme – Ratgeber & Planung | WSP Blog",
        metaDescription: "So bauen Sie ein Solar-Wind-Hybridsystem: Komponenten, Dimensionierung, Batteriespeicher und Jahreserträge.",
      },
      es: {
        name: "Sistemas Híbridos Solar-Eólico",
        description: "Cómo combinar paneles solares y aerogeneradores en sistemas híbridos eficientes para suministro de energía todo el año.",
        metaTitle: "Sistemas Híbridos Solar-Eólico – Guías y Configuración | WSP Blog",
        metaDescription: "Aprende a construir un sistema híbrido solar-eólico: componentes, dimensionamiento, baterías y rendimiento anual.",
      },
    },
  },

  {
    slug: "rooftop-wind-turbines",
    icon: "🏗️",
    sortOrder: 4,
    relatedLinks: [
      { href: "/rooftop-wind-turbine",     label: "Rooftop Wind Turbine",     description: "Installation guide",           icon: "🏗️" },
      { href: "/skywind-ng",               label: "SkyWind NG",               description: "Recommended rooftop turbine",  icon: "⚡" },
      { href: "/micro-wind-turbine",        label: "Micro Wind Turbine Guide", description: "Turbine technology overview",  icon: "🌬️" },
    ],
    locales: {
      en: {
        name: "Rooftop Wind Turbines",
        description: "Installation guides, performance data and practical tips for mounting small wind turbines on residential and commercial rooftops.",
        metaTitle: "Rooftop Wind Turbines – Installation Guides & Tips | WSP Blog",
        metaDescription: "Expert guides on rooftop wind turbine installation: structural requirements, permits, performance expectations and maintenance.",
      },
      de: {
        name: "Dach-Windkraftanlagen",
        description: "Montageleitfäden, Ertragsdaten und praktische Tipps zur Installation von Kleinwindanlagen auf Wohn- und Gewerbedächern.",
        metaTitle: "Dach-Windkraftanlagen – Montageleitfaden & Tipps | WSP Blog",
        metaDescription: "Expertenwissen zur Dachmontage von Kleinwindanlagen: Statik, Genehmigung, Ertragserwartungen und Wartung.",
      },
      es: {
        name: "Aerogeneradores en Tejado",
        description: "Guías de instalación, datos de rendimiento y consejos prácticos para montar pequeños aerogeneradores en tejados residenciales y comerciales.",
        metaTitle: "Aerogeneradores en Tejado – Guías de Instalación | WSP Blog",
        metaDescription: "Guías expertas sobre instalación de aerogeneradores en tejado: requisitos estructurales, permisos, rendimiento esperado y mantenimiento.",
      },
    },
  },

  {
    slug: "energy-independence",
    icon: "⚡",
    sortOrder: 5,
    relatedLinks: [
      { href: "/hybrid-solar-wind-system", label: "Hybrid Solar-Wind System", description: "Maximum self-sufficiency",      icon: "☀️" },
      { href: "/off-grid-wind-turbine",     label: "Off-Grid Wind Turbine",    description: "Standalone energy",            icon: "🔋" },
      { href: "/skywind-ng",               label: "SkyWind NG",               description: "Start your energy independence", icon: "⚡" },
    ],
    locales: {
      en: {
        name: "Energy Independence",
        description: "Strategies, real-world examples and step-by-step plans for achieving energy autarky at home, on farms and in businesses.",
        metaTitle: "Energy Independence – Strategies & Real-World Guides | WSP Blog",
        metaDescription: "How to achieve energy independence: wind, solar and battery strategies for homes, farms and businesses. Practical, honest advice.",
      },
      de: {
        name: "Energieunabhängigkeit",
        description: "Strategien, Praxisbeispiele und Schritt-für-Schritt-Pläne für vollständige Energieautarkie – für Eigenheime, Höfe und Betriebe.",
        metaTitle: "Energieunabhängigkeit – Strategien & Praxisbeispiele | WSP Blog",
        metaDescription: "So erreichen Sie Energieautarkie: Wind-, Solar- und Batteriestrategien für Eigenheime, Höfe und Gewerbebetriebe.",
      },
      es: {
        name: "Independencia Energética",
        description: "Estrategias, ejemplos reales y planes paso a paso para lograr la autarquía energética en hogares, granjas y empresas.",
        metaTitle: "Independencia Energética – Estrategias y Guías Prácticas | WSP Blog",
        metaDescription: "Cómo lograr la independencia energética: estrategias eólicas, solares y de baterías para hogares, granjas y empresas.",
      },
    },
  },

  {
    slug: "battery-storage",
    icon: "🔌",
    sortOrder: 6,
    relatedLinks: [
      { href: "/off-grid-wind-turbine",     label: "Off-Grid Wind Turbine",    description: "Pair turbine with storage",    icon: "🌬️" },
      { href: "/hybrid-solar-wind-system", label: "Hybrid Solar-Wind System", description: "Hybrid + battery setup",        icon: "☀️" },
      { href: "/skywind-ng",               label: "SkyWind NG",               description: "Wind turbine for battery charging", icon: "⚡" },
    ],
    locales: {
      en: {
        name: "Battery Storage",
        description: "Battery storage systems for wind and solar energy: technology comparisons, sizing guides and installation tips for homes and businesses.",
        metaTitle: "Battery Storage for Wind & Solar – Guides & Comparisons | WSP Blog",
        metaDescription: "Everything about battery storage for renewable energy: lithium vs lead-acid, sizing for wind turbines and solar panels, installation tips.",
      },
      de: {
        name: "Batteriespeicher",
        description: "Batteriespeichersysteme für Wind- und Solarenergie: Technologievergleich, Dimensionierungsratgeber und Installationstipps.",
        metaTitle: "Batteriespeicher für Wind & Solar – Ratgeber & Vergleich | WSP Blog",
        metaDescription: "Alles zu Batteriespeichern für erneuerbare Energien: Lithium vs. Blei-Säure, Dimensionierung für Windkraft und Solar, Installationstipps.",
      },
      es: {
        name: "Almacenamiento en Baterías",
        description: "Sistemas de almacenamiento en baterías para energía eólica y solar: comparativas tecnológicas, guías de dimensionamiento e instalación.",
        metaTitle: "Almacenamiento en Baterías para Viento y Solar | WSP Blog",
        metaDescription: "Todo sobre almacenamiento en baterías para energías renovables: litio vs plomo-ácido, dimensionamiento para aerogeneradores y solar.",
      },
    },
  },
];

// ─── Lookup helper ─────────────────────────────────────────────────────────────

export function findCategory(slug: string): CategoryMeta | undefined {
  return BLOG_CATEGORIES.find((c) => c.slug === slug);
}

// ─── All slugs (for generateStaticParams) ─────────────────────────────────────

export const CATEGORY_SLUGS = BLOG_CATEGORIES.map((c) => c.slug);
