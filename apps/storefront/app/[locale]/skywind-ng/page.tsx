import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchProducts, fetchCategory } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { FaqSection } from "@/components/FaqSection";
import { SKYWIND_FAQ_ITEMS, SKYWIND_FAQ_ITEMS_DE } from "@/lib/skywindFaq";
import type { ProductSummary } from "@wsp/types";

const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://webshop.wsp-solarenergie.de";
const MAIN_SITE = "https://www.wsp-solarenergie.de";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "skywind_ng" });
  const isDE = params.locale === "de";
  const localePrefix = isDE ? "" : `/${params.locale}`;
  const canonicalUrl = `${BASE}${localePrefix}/skywind-ng`;

  const title = t("meta_title");
  const description = t("meta_desc");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "x-default": `${BASE}/skywind-ng`,
        de: `${BASE}/skywind-ng`,
        en: `${BASE}/en/skywind-ng`,
        es: `${BASE}/es/skywind-ng`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "SkyWind NG Kleinwindanlage – WSP Solarenergie",
      type: "website",
      images: [
        {
          url: `${BASE}/images/skywind-hero.png`,
          width: 1200,
          height: 630,
          alt: "SkyWind NG Kleinwindanlage auf Wohnhausdach montiert",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@WSPSolarenergie",
      title,
      description,
      images: [`${BASE}/images/skywind-hero.png`],
    },
  };
}

const SPECS_DE = [
  { label: "Modelle", value: "SkyWind NG 1kW · SkyWind NG 2kW" },
  { label: "Nennleistung", value: "1.000 W / 2.000 W" },
  { label: "Rotordurchmesser", value: "1,8 m / 2,5 m" },
  { label: "Anlaufwindgeschwindigkeit", value: "ca. 2,5 m/s (9 km/h)" },
  { label: "Nennwindgeschwindigkeit", value: "ca. 10–12 m/s" },
  { label: "Geräuschpegel", value: "≤ 45 dB(A) bei 10 m" },
  { label: "Mastkompatibilität", value: "Flanschmast ab 3 m" },
  { label: "Ausgang", value: "230 V / 50 Hz oder DC-Batterieladung" },
  { label: "Betriebstemperatur", value: "−20 °C bis +50 °C" },
  { label: "Garantie", value: "2 Jahre Herstellergarantie" },
  { label: "Montage", value: "Dach · Freistehender Mast · Fassade" },
  { label: "Netz / Inselbetrieb", value: "Netzgekoppelt & inselbetriebsfähig" },
];

const SPECS_EN = [
  { label: "Models", value: "SkyWind NG 1kW · SkyWind NG 2kW" },
  { label: "Rated Power", value: "1,000 W / 2,000 W" },
  { label: "Rotor Diameter", value: "1.8 m / 2.5 m" },
  { label: "Cut-in Wind Speed", value: "approx. 2.5 m/s (9 km/h)" },
  { label: "Rated Wind Speed", value: "approx. 10–12 m/s" },
  { label: "Noise Level", value: "≤ 45 dB(A) at 10 m" },
  { label: "Mast Compatibility", value: "Flange mast from 3 m" },
  { label: "Output", value: "230 V / 50 Hz or DC battery charging" },
  { label: "Operating Temperature", value: "−20 °C to +50 °C" },
  { label: "Warranty", value: "2-year manufacturer warranty" },
  { label: "Installation", value: "Rooftop · Freestanding mast · Facade" },
  { label: "Grid / Off-Grid", value: "Grid-tied & off-grid compatible" },
];

const USE_CASES_DE = [
  {
    icon: "⚡",
    title: "Batterie-Insellösung",
    desc: "12V–48V Akkus netzunabhängig laden. Ideal für entlegene Grundstücke, Hütten und energieautarke Häuser.",
    href: "/off-grid-wind-turbine",
  },
  {
    icon: "🏠",
    title: "Kleinwindanlage für Zuhause",
    desc: "Stromkosten senken und Autarkie erhöhen. Die kompakte NG 1kW passt auf Wohngrundstücke und schwachwindige Standorte.",
    href: "/small-wind-turbine-for-home",
  },
  {
    icon: "🏗",
    title: "Dach-Windanlage",
    desc: "Direkt auf dem Dach mit Flanschmast montierbar. Geringe Vibrationen und flüsterleiser Betrieb für die Nutzung im Wohngebiet.",
    href: "/rooftop-wind-turbine",
  },
  {
    icon: "☀",
    title: "Hybrides Solar-Wind-System",
    desc: "Mit Photovoltaik kombinieren für ganzjährige Stromerzeugung. Wind schließt Winterlücken; Solar übernimmt den Sommer. Maximale Autarkie.",
    href: "/hybrid-solar-wind-system",
  },
  {
    icon: "🌿",
    title: "Landwirtschaft & Höfe",
    desc: "Nebengebäude, Bewässerungspumpen und Stallanlagen mit Strom versorgen. Skalierbar von 1kW bis zu Mehranlagenfeldern auf offenem Ackerland.",
    href: "/kontakt",
  },
  {
    icon: "🏭",
    title: "Gewerbe & Industrie",
    desc: "Gewerbliche Energiekosten senken und Nachhaltigkeitsziele erfüllen. Mehrere Anlagen können für höhere Leistung kombiniert werden.",
    href: "/gewerbe-b2b",
  },
];

const USE_CASES_EN = [
  {
    icon: "⚡",
    title: "Off-Grid Battery Charging",
    desc: "Charge 12V–48V battery banks independently of the grid. Ideal for remote properties, cabins, and energy-independent homes.",
    href: "/off-grid-wind-turbine",
  },
  {
    icon: "🏠",
    title: "Small Wind Turbine for Home",
    desc: "Reduce electricity bills and increase self-sufficiency. The compact NG 1kW fits residential lots and low-wind locations.",
    href: "/small-wind-turbine-for-home",
  },
  {
    icon: "🏗",
    title: "Rooftop Wind Turbine",
    desc: "Mount directly on your roof with a flange mast. Low vibration and whisper-quiet operation for neighbourhood use.",
    href: "/rooftop-wind-turbine",
  },
  {
    icon: "☀",
    title: "Hybrid Solar Wind System",
    desc: "Pair with solar PV for year-round generation. Wind covers winter gaps; solar covers summer. Maximum self-sufficiency.",
    href: "/hybrid-solar-wind-system",
  },
  {
    icon: "🌿",
    title: "Agricultural & Farm Use",
    desc: "Power outbuildings, irrigation pumps, and livestock facilities. Scales from 1kW to multi-unit arrays on open farmland.",
    href: "/kontakt",
  },
  {
    icon: "🏭",
    title: "Commercial & Industrial",
    desc: "Reduce commercial energy costs and meet sustainability targets. Multiple units can be combined for higher output.",
    href: "/gewerbe-b2b",
  },
];

export default async function SkywindNgPage({ params }: Props) {
  const isDE = params.locale === "de";
  const SPECS = isDE ? SPECS_DE : SPECS_EN;
  const USE_CASES = isDE ? USE_CASES_DE : USE_CASES_EN;
  const faqItems = isDE ? SKYWIND_FAQ_ITEMS_DE : SKYWIND_FAQ_ITEMS;

  let products: ProductSummary[] = [];
  try {
    const result = await fetchProducts({ locale: params.locale as "de" | "en" | "es", category: "skywind", limit: 6 });
    products = result.items;
  } catch {
    products = [];
  }

  let skywindChildren: import("@wsp/types").CategorySummary[] = [];
  try {
    const skywindCat = await fetchCategory("skywind", params.locale);
    if (skywindCat) skywindChildren = skywindCat.children;
  } catch {
    skywindChildren = [];
  }

  const localePrefix = params.locale === "de" ? "" : `/${params.locale}`;
  const canonicalUrl = `${BASE}${localePrefix}/skywind-ng`;

  return (
    <main>
      {/* ── Schema: BreadcrumbList ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: isDE ? "Startseite" : "Home", item: BASE },
              { "@type": "ListItem", position: 2, name: "SkyWind", item: `${BASE}/skywind` },
              { "@type": "ListItem", position: 3, name: "SkyWind NG", item: canonicalUrl },
            ],
          }),
        }}
      />

      {/* ── Schema: Product ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "SkyWind NG Kleinwindanlage",
            description: isDE
              ? "Die SkyWind NG ist eine kompakte Kleinwindanlage für Privat-, Gewerbe- und Inselnetzbetrieb. Erhältlich als SkyWind NG 1kW und SkyWind NG 2kW. Ideal für hybride Solar-Wind-Systeme und Batterie-Inselnetze."
              : "The SkyWind NG is a compact micro wind turbine for residential, commercial, and off-grid use. Available as SkyWind NG 1kW and SkyWind NG 2kW. Ideal for hybrid solar wind systems and off-grid battery charging.",
            brand: { "@type": "Brand", name: "SkyWind" },
            category: isDE ? "Kleinwindanlage" : "Micro Wind Turbine",
            model: "SkyWind NG 1kW / SkyWind NG 2kW",
            image: `${BASE}/images/skywind-hero.png`,
            url: canonicalUrl,
            additionalProperty: [
              { "@type": "PropertyValue", name: "Rated Power", value: "1000–2000 W" },
              { "@type": "PropertyValue", name: "Cut-in Wind Speed", value: "2.5 m/s" },
              { "@type": "PropertyValue", name: "Rotor Diameter", value: "1.8–2.5 m" },
              { "@type": "PropertyValue", name: "Noise Level", value: "≤45 dB(A) at 10 m" },
              { "@type": "PropertyValue", name: "Operating Temperature", value: "-20°C to +50°C" },
              { "@type": "PropertyValue", name: "Grid Compatibility", value: "Grid-tied and off-grid" },
            ],
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
              url: `${BASE}/products`,
              seller: {
                "@type": "Organization",
                name: "WSP Solarenergie",
                url: BASE,
              },
            },
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: ["DE", "AT", "CH", "NL", "BE", "FR", "PL", "ES", "IT"],
              returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: 14,
            },
          }),
        }}
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[55vh] sm:min-h-[75vh] flex items-center">
        <Image
          src="/images/skywind-hero.png"
          alt={isDE
            ? "SkyWind NG Kleinwindanlage auf Wohnhausdach mit Solarmodulen montiert"
            : "SkyWind NG micro wind turbine installed on residential rooftop with solar panels"}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/20" />
        <div className="relative w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
            <nav className="flex items-center gap-2 text-xs text-white/60 mb-6">
              <Link href="/" className="hover:text-white transition-colors duration-150">
                {isDE ? "Startseite" : "Home"}
              </Link>
              <span>/</span>
              <Link href="/skywind" className="hover:text-white transition-colors duration-150">SkyWind</Link>
              <span>/</span>
              <span className="text-white/90">SkyWind NG</span>
            </nav>

            <div className="max-w-2xl">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">
                {isDE ? "SkyWind NG · Kleinwindanlage" : "SkyWind NG · Micro Wind Turbine"}
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white leading-tight mb-5">
                SkyWind NG:<br />
                <span className="text-brand-accent">
                  {isDE ? "Kleinwindanlage" : "Micro Wind Turbine"}
                </span><br />
                {isDE ? "für Zuhause & Inselnetz." : "for Home & Off-Grid."}
              </h1>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-6 max-w-xl">
                {isDE
                  ? "Die SkyWind NG ist eine kompakte Kleinwindanlage, die sauberen Strom auch bei Schwachwind erzeugt – Tag und Nacht, netzgekoppelt oder im Inselbetrieb. Erhältlich als NG 1 kW und NG 2 kW. Lieferung europaweit."
                  : "The SkyWind NG is a compact small wind turbine that generates clean electricity even in low winds — day and night, grid-tied or off-grid. Available as NG 1 kW and NG 2 kW. Ships across Europe."}
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-3 mb-8">
                {(isDE
                  ? ["EU-Versand", "2 Jahre Garantie", "Kostenloser Standort-Check", "Netz & Inselbetrieb"]
                  : ["EU Shipping", "2-Year Warranty", "Free Site Check", "Grid & Off-Grid"]
                ).map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 border border-white/20 text-white rounded-full px-3 py-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent flex-shrink-0" />
                    {badge}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/kontakt"
                  className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150 text-center"
                >
                  {isDE ? "Kostenlos beraten lassen" : "Request Free Consultation"}
                </Link>
                <a
                  href="#products"
                  className="inline-block border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:border-white hover:bg-white/10 transition-colors duration-150 text-center"
                >
                  {isDE ? "Produkte ansehen" : "View Products"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <div className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { number: "2,5 m/s", label: isDE ? "Anlaufwindgeschwindigkeit" : "Cut-in wind speed" },
              { number: "≤ 45 dB", label: isDE ? "Geräuschpegel bei 10 m" : "Noise level at 10 m" },
              { number: "1–2 kW", label: isDE ? "Nennleistung" : "Rated power output" },
              { number: isDE ? "2 Jahre" : "2 Years", label: isDE ? "Herstellergarantie" : "Manufacturer warranty" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-2xl font-bold text-brand-accent">{s.number}</p>
                <p className="text-xs text-brand-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Kategorien / Schnellnavigation ── */}
      {skywindChildren.length > 0 && (
        <section className="py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-7">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-2">
                {isDE ? "Kategorien" : "Categories"}
              </p>
              <h2 className="font-display text-2xl font-bold text-brand-text">
                {isDE ? "Direkt zur richtigen Kategorie" : "Jump to the Right Category"}
              </h2>
              <p className="text-sm text-brand-muted mt-1">
                {isDE
                  ? "Alle SkyWind NG Unterkategorien auf einen Blick – Komplettsets, Zubehör, Masten und mehr."
                  : "All SkyWind NG subcategories at a glance — complete sets, accessories, masts and more."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {skywindChildren.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}` as any}
                  className="group flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-brand-accent hover:shadow-md transition-all duration-150"
                >
                  {cat.imageUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center shrink-0 text-2xl group-hover:bg-green-100 transition-colors">
                      🌬️
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-brand-text text-sm group-hover:text-brand-accent transition-colors leading-snug mb-1">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-xs text-brand-muted leading-relaxed line-clamp-2">{cat.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      {cat.productCount > 0 && (
                        <span className="text-xs text-brand-muted">
                          {cat.productCount} {isDE ? "Produkte" : "products"}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-brand-accent ml-auto">
                        {isDE ? "Ansehen →" : "View →"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Was ist die SkyWind NG? ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">
                {isDE ? "Produktübersicht" : "Product Overview"}
              </p>
              <h2 className="font-display text-3xl font-bold text-brand-text mb-5 leading-snug">
                {isDE
                  ? "Was ist die SkyWind NG Kleinwindanlage?"
                  : "What Is the SkyWind NG Small Wind Turbine?"}
              </h2>
              <p className="text-brand-muted leading-relaxed mb-4">
                {isDE ? (
                  <>
                    Die <strong>SkyWind NG</strong> ist eine moderne Kleinwindanlage für private Grundstücke,
                    Gewerbeflächen und landwirtschaftliche Betriebe. Erhältlich in zwei Leistungsklassen:{" "}
                    <strong>SkyWind NG 1kW</strong> und <strong>SkyWind NG 2kW</strong>.
                  </>
                ) : (
                  <>
                    The <strong>SkyWind NG</strong> is a modern micro wind turbine engineered for private
                    properties, commercial premises, and agricultural operations. Available in two output
                    classes: <strong>SkyWind NG 1kW</strong> and <strong>SkyWind NG 2kW</strong>.
                  </>
                )}
              </p>
              <p className="text-brand-muted leading-relaxed mb-4">
                {isDE
                  ? "Anders als Solarmodule erzeugt die SkyWind NG rund um die Uhr Strom – an bewölkten Tagen, nachts und besonders in den Wintermonaten, wenn der Wind am stärksten weht. Damit ist sie die ideale Ergänzung zu jeder Photovoltaikanlage im hybriden Solar-Wind-System."
                  : "Unlike rooftop solar panels, the SkyWind NG generates electricity around the clock — on overcast days, at night, and especially during winter months when wind energy output is typically at its seasonal peak. This makes it the ideal complement to any solar PV system in a hybrid solar wind setup."}
              </p>
              <p className="text-brand-muted leading-relaxed mb-4">
                {isDE
                  ? "Die SkyWind NG eignet sich gleichermaßen für den Inselbetrieb zum Laden von Batterien und für den netzgekoppelten Betrieb. Ob Sie eine abgelegene Hütte versorgen, Ihre Stromrechnung senken oder nahezu vollständige Energieautarkie erreichen möchten – die SkyWind NG liefert ganzjährig zuverlässige und wartungsarme Leistung."
                  : "The SkyWind NG is equally suitable for off-grid battery charging and grid-tied operation. Whether you want to power a remote cabin, reduce your home energy bill, or achieve near-total energy independence — the SkyWind NG delivers reliable, low-maintenance output year-round."}
              </p>
              <p className="text-brand-muted leading-relaxed mb-6">
                {isDE ? (
                  <>
                    Als autorisierter Händler und Installationspartner bietet WSP Solarenergie die SkyWind NG
                    inklusive individueller Standortbewertung, europaweitem Versand und optionaler professioneller
                    Installation an. Mehr erfahren Sie unter{" "}
                    <a href={MAIN_SITE} target="_blank" rel="noopener" className="text-brand-accent hover:underline font-medium">
                      wsp-solarenergie.de
                    </a>
                    .
                  </>
                ) : (
                  <>
                    As authorised distributor and installation partner, WSP Solar provides the SkyWind NG
                    including individual site assessment, delivery across Europe, and optional professional
                    installation. Learn more at{" "}
                    <a href={MAIN_SITE} target="_blank" rel="noopener" className="text-brand-accent hover:underline font-medium">
                      wsp-solarenergie.de
                    </a>
                    .
                  </>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/kontakt"
                  className="inline-block bg-brand-accent text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150 text-center text-sm"
                >
                  {isDE ? "Kostenloser Standort-Check" : "Get a Free Site Assessment"}
                </Link>
                <Link
                  href="/hybrid-solar-wind-system"
                  className="inline-block border border-gray-200 text-brand-text font-semibold px-6 py-3 rounded-xl hover:border-brand-accent hover:text-brand-accent transition-colors duration-150 text-center text-sm"
                >
                  Hybrid Solar + Wind →
                </Link>
              </div>
            </div>

            <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/skywind-rooftop.png"
                alt={isDE
                  ? "SkyWind NG Kleinwindanlage auf Dach neben Solarmodulen – hybrides Solar-Wind-System"
                  : "SkyWind NG small wind turbine on rooftop alongside solar panels — hybrid solar wind system"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Einsatzbereiche / Use Cases ── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">
              {isDE ? "Einsatzbereiche" : "Applications"}
            </p>
            <h2 className="font-display text-3xl font-bold text-brand-text">
              {isDE ? "Wo die SkyWind NG ihren Strom liefert" : "Where the SkyWind NG Delivers"}
            </h2>
            <p className="text-brand-muted mt-2">
              {isDE
                ? "Von abgelegenen Hütten bis zu Gewerbedächern – die SkyWind NG passt sich jedem Standort und Einsatzzweck an."
                : "From off-grid cabins to commercial rooftops — the SkyWind NG adapts to every site and use case."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {USE_CASES.map((uc) => (
              <Link
                key={uc.title}
                href={uc.href as any}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3 hover:border-brand-accent hover:shadow-md transition-all duration-150"
              >
                <span className="text-2xl">{uc.icon}</span>
                <h3 className="font-display font-bold text-brand-text text-base group-hover:text-brand-accent transition-colors">{uc.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{uc.desc}</p>
                <span className="text-xs font-semibold text-brand-accent mt-auto">
                  {isDE ? "Mehr erfahren →" : "Learn more →"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technische Daten ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">
              {isDE ? "Technische Daten" : "Technical Data"}
            </p>
            <h2 className="font-display text-3xl font-bold text-brand-text">
              {isDE ? "SkyWind NG – Technische Daten" : "SkyWind NG – Technical Specifications"}
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-w-3xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider">
                    {isDE ? "Eigenschaft" : "Specification"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider">
                    {isDE ? "Wert" : "Value"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {SPECS.map((s) => (
                  <tr key={s.label} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-brand-text">{s.label}</td>
                    <td className="px-6 py-4 text-brand-muted">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-brand-muted max-w-3xl">
            {isDE ? (
              <>
                Technische Daten können je nach Konfiguration und Modellgeneration abweichen. Verbindliche
                Angaben finden Sie im jeweiligen{" "}
                <Link href="/products" className="text-brand-accent hover:underline">
                  Produktdatenblatt
                </Link>{" "}
                oder unter{" "}
                <a href={`${MAIN_SITE}/skywind`} target="_blank" rel="noopener" className="text-brand-accent hover:underline">
                  wsp-solarenergie.de/skywind
                </a>
                .
              </>
            ) : (
              <>
                Technical data may vary by configuration and model generation. Refer to the individual{" "}
                <Link href="/products" className="text-brand-accent hover:underline">
                  product datasheet
                </Link>{" "}
                or{" "}
                <a href={`${MAIN_SITE}/skywind`} target="_blank" rel="noopener" className="text-brand-accent hover:underline">
                  wsp-solarenergie.de/skywind
                </a>{" "}
                for binding specifications.
              </>
            )}
          </p>
        </div>
      </section>

      {/* ── Modellvergleich ── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">
              {isDE ? "Modellvergleich" : "Model Comparison"}
            </p>
            <h2 className="font-display text-3xl font-bold text-brand-text">
              {isDE
                ? "SkyWind NG 1kW oder 2kW – Welches Modell passt zu Ihrem Projekt?"
                : "SkyWind NG 1kW or 2kW – Which Model Fits Your Project?"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            {(isDE ? [
              {
                model: "SkyWind NG 1kW",
                ideal: "Haus, Wohngrundstück, PV-Ergänzung",
                power: "1.000 W",
                rotor: "ca. 1,8 m",
                yield: "ca. 1.500–2.500 kWh/Jahr*",
                bestFor: "Kleinwindanlage für Zuhause, Hütte im Inselbetrieb, Batterieladung",
                highlight: false,
              },
              {
                model: "SkyWind NG 2kW",
                ideal: "Gewerbe, Landwirtschaft, größere Anlagen",
                power: "2.000 W",
                rotor: "ca. 2,5 m",
                yield: "ca. 3.000–5.000 kWh/Jahr*",
                bestFor: "Dachwindanlage, Bauernhof, hybrides Solar-Wind-System",
                highlight: true,
              },
            ] : [
              {
                model: "SkyWind NG 1kW",
                ideal: "Home, residential lot, solar PV supplement",
                power: "1,000 W",
                rotor: "approx. 1.8 m",
                yield: "approx. 1,500–2,500 kWh/year*",
                bestFor: "Small wind turbine for home, off-grid cabin, battery charging",
                highlight: false,
              },
              {
                model: "SkyWind NG 2kW",
                ideal: "Commercial, agriculture, larger installations",
                power: "2,000 W",
                rotor: "approx. 2.5 m",
                yield: "approx. 3,000–5,000 kWh/year*",
                bestFor: "Rooftop wind turbine, farm, hybrid solar wind system",
                highlight: true,
              },
            ]).map((m) => (
              <div
                key={m.model}
                className={`rounded-2xl border p-8 flex flex-col gap-4 ${
                  m.highlight
                    ? "border-brand-accent bg-brand-accent/5 shadow-md"
                    : "border-gray-100 bg-white shadow-sm"
                }`}
              >
                {m.highlight && (
                  <span className="self-start text-xs font-semibold text-white bg-brand-accent px-2.5 py-1 rounded-full">
                    {isDE ? "Meistgekauft" : "Most Popular"}
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-brand-text">{m.model}</h3>
                <ul className="space-y-2 text-sm text-brand-muted">
                  <li><span className="font-medium text-brand-text">{isDE ? "Ideal für:" : "Ideal for:"}</span> {m.ideal}</li>
                  <li><span className="font-medium text-brand-text">{isDE ? "Nennleistung:" : "Rated Power:"}</span> {m.power}</li>
                  <li><span className="font-medium text-brand-text">{isDE ? "Rotordurchmesser:" : "Rotor Diameter:"}</span> {m.rotor}</li>
                  <li><span className="font-medium text-brand-text">{isDE ? "Jahresertrag:" : "Annual Yield:"}</span> {m.yield}</li>
                  <li><span className="font-medium text-brand-text">{isDE ? "Bester Einsatzzweck:" : "Best use case:"}</span> {m.bestFor}</li>
                </ul>
                <Link
                  href="/kontakt"
                  className={`mt-auto inline-block text-center font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors duration-150 ${
                    m.highlight
                      ? "bg-brand-accent text-white hover:bg-green-600"
                      : "border border-gray-200 text-brand-text hover:border-brand-accent hover:text-brand-accent"
                  }`}
                >
                  {isDE ? "Angebot anfragen" : "Request a Quote"}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-brand-muted">
            {isDE
              ? "* Jahresertrag standortabhängig, basierend auf einer durchschnittlichen Windgeschwindigkeit von 5–6 m/s. Individuelle Ertragsprognosen werden in Ihrer kostenlosen Beratung erstellt."
              : "* Annual yield is site-dependent and based on an average wind speed of 5–6 m/s. Individual yield forecasts are provided during your free consultation."}
          </p>
        </div>
      </section>

      {/* ── Produkte ── */}
      {products.length > 0 && (
        <section id="products" className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Shop</p>
              <h2 className="font-display text-3xl font-bold text-brand-text">
                {isDE ? "SkyWind NG kaufen – Direkt aus dem Lager" : "Buy the SkyWind NG – Direct from Stock"}
              </h2>
              <p className="text-brand-muted mt-2 max-w-xl">
                {isDE
                  ? "Alle SkyWind NG Modelle inklusive Masten, Zubehör und Komplett-Paketen – direkt bestellbar oder auf Anfrage konfigurierbar. EU-Versand inklusive."
                  : "All SkyWind NG models including masts, accessories, and complete packages — available to order directly or configurable on request. EU shipping included."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} showCategory />
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/products"
                className="inline-block border border-gray-200 text-brand-text font-semibold px-6 py-3 rounded-xl hover:border-brand-accent hover:text-brand-accent transition-colors duration-150 text-sm"
              >
                {isDE ? "Alle Produkte ansehen →" : "View All Products →"}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Ertrag & Amortisation ── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">
                {isDE ? "Rentabilität" : "Return on Investment"}
              </p>
              <h2 className="font-display text-3xl font-bold text-brand-text mb-5">
                {isDE
                  ? "Lohnt sich die SkyWind NG? Ertrag & Amortisation"
                  : "Is the SkyWind NG Worth It? Yield & Payback"}
              </h2>
              <p className="text-brand-muted leading-relaxed mb-4">
                {isDE ? (
                  <>
                    Die Wirtschaftlichkeit der SkyWind NG hängt in erster Linie von der Windressource Ihres
                    Standorts ab. Bei einer durchschnittlichen Windgeschwindigkeit von 5 m/s kann die{" "}
                    <strong>SkyWind NG 1kW</strong> jährlich 1.500–2.500 kWh erzeugen – genug, um einen
                    erheblichen Teil des typischen Haushaltsstrombedarfs zu decken.
                  </>
                ) : (
                  <>
                    The economics of the SkyWind NG depend primarily on your site&apos;s wind resource.
                    At an average wind speed of 5 m/s, the <strong>SkyWind NG 1kW</strong> can generate
                    1,500–2,500 kWh per year — enough to cover a significant share of a typical
                    household&apos;s electricity demand.
                  </>
                )}
              </p>
              <p className="text-brand-muted leading-relaxed mb-4">
                {isDE
                  ? "Bei 0,30 €/kWh entspricht das jährlichen Einsparungen von 450–750 € aus Eigenverbrauch allein – ohne Einspeisevergütung oder Förderungen. Amortisationszeiten von 8–12 Jahren sind an guten Windstandorten realistisch und verkürzen sich weiter bei Kombination mit Photovoltaik."
                  : "At €0.30/kWh, that translates to annual savings of €450–750 from self-consumption alone — before any feed-in revenue or subsidies. Payback periods of 8–12 years are realistic at good wind sites, dropping further when combined with solar PV."}
              </p>
              <p className="text-brand-muted leading-relaxed mb-6">
                {isDE
                  ? "In einem hybriden Solar-Wind-System mit Batteriespeicher sind Autarkiequoten über 70 % erreichbar – die Abhängigkeit vom Stromnetz und künftigen Preiserhöhungen nimmt deutlich ab."
                  : "In a hybrid solar wind system with battery storage, self-sufficiency rates above 70% are achievable — significantly reducing dependence on grid electricity and protecting against future price increases."}
              </p>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
                  {isDE ? "Windpotenzial an Ihrem Standort prüfen" : "Check Wind Potential at Your Site"}
                </p>
                <p className="text-sm text-brand-muted mb-4">
                  {isDE
                    ? "Nutzen Sie den Global Wind Atlas, um durchschnittliche Windgeschwindigkeiten für jeden Ort weltweit abzuschätzen, bevor Sie eine detaillierte Standortbewertung anfragen."
                    : "Use the Global Wind Atlas to estimate average wind speeds for any location worldwide before requesting a detailed site assessment."}
                </p>
                <a
                  href="https://globalwindatlas.info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-semibold text-brand-accent hover:underline"
                >
                  {isDE ? "Global Wind Atlas öffnen →" : "Open Global Wind Atlas →"}
                </a>
              </div>
            </div>

            <div className="space-y-4">
              {(isDE ? [
                { label: "Sehr guter Standort (> 6 m/s)", yield: "3.000–5.000 kWh/Jahr", saving: "900–1.500 €/Jahr", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                { label: "Guter Standort (4–6 m/s)", yield: "1.500–3.000 kWh/Jahr", saving: "450–900 €/Jahr", color: "text-brand-accent bg-green-50 border-green-200" },
                { label: "Mäßiger Standort (3–4 m/s)", yield: "500–1.500 kWh/Jahr", saving: "150–450 €/Jahr", color: "text-amber-600 bg-amber-50 border-amber-200" },
                { label: "Schwachwindstandort (< 3 m/s)", yield: "Wirtschaftlichkeit begrenzt", saving: "Wir empfehlen Photovoltaik", color: "text-red-600 bg-red-50 border-red-200" },
              ] : [
                { label: "Excellent site (> 6 m/s)", yield: "3,000–5,000 kWh/year", saving: "€900–1,500/year", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                { label: "Good site (4–6 m/s)", yield: "1,500–3,000 kWh/year", saving: "€450–900/year", color: "text-brand-accent bg-green-50 border-green-200" },
                { label: "Moderate site (3–4 m/s)", yield: "500–1,500 kWh/year", saving: "€150–450/year", color: "text-amber-600 bg-amber-50 border-amber-200" },
                { label: "Low wind site (< 3 m/s)", yield: "Limited economics", saving: "We recommend solar PV", color: "text-red-600 bg-red-50 border-red-200" },
              ]).map((row) => (
                <div key={row.label} className={`rounded-xl border p-5 ${row.color}`}>
                  <p className="font-semibold text-sm mb-1">{row.label}</p>
                  <p className="text-xs">{isDE ? "Ertrag (NG 2kW):" : "Yield (NG 2kW):"} {row.yield}</p>
                  <p className="text-xs">{isDE ? "Jährliche Einsparung:" : "Annual savings:"} {row.saving}</p>
                </div>
              ))}
              <p className="text-xs text-brand-muted pt-2">
                {isDE
                  ? "Werte sind Richtwerte basierend auf typischen Standortbedingungen. Eine kostenlose individuelle Standortbewertung ist Grundlage jedes Angebots."
                  : "Values are indicative based on typical site conditions. A free individual site assessment is the basis for every quotation."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hybrides Solar-Wind-System ── */}
      <section className="bg-brand-text py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">
                {isDE ? "Hybrides Solar-Wind-System" : "Hybrid Solar Wind System"}
              </p>
              <h2 className="font-display text-3xl font-bold text-white mb-5 leading-snug">
                {isDE ? (
                  <>SkyWind NG + Solarzaun:<br />Das optimale hybride Energiesystem.</>
                ) : (
                  <>SkyWind NG + Solar Fence:<br />The Optimal Hybrid Energy System.</>
                )}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {isDE
                  ? "Photovoltaik und Windkraftanlagen ergänzen sich von Natur aus. Solar erzeugt die meiste Energie an sonnigen Sommertagen; die SkyWind NG liefert zuverlässig im Winter, nachts und an bewölkten Tagen, wenn die Module schwächeln."
                  : "Solar PV and wind turbines are complementary by nature. Solar produces the most energy on sunny summer days; the SkyWind NG delivers reliably during winter, at night, and on overcast days when panels underperform."}
              </p>
              <p className="text-gray-300 leading-relaxed mb-6">
                {isDE
                  ? "Kombiniert mit Batteriespeicher erreicht ein hybrides Solar-Wind-System Autarkiequoten weit über 70 % – für echte Energieunabhängigkeit von Netzpreisschwankungen."
                  : "Combined with battery storage, a hybrid solar wind system achieves self-sufficiency rates well above 70% — delivering genuine energy independence from grid price fluctuations."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/hybrid-solar-wind-system"
                  className="inline-block bg-brand-accent text-white font-semibold px-7 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150 text-center text-sm"
                >
                  {isDE ? "Hybridlösungen →" : "Hybrid Systems →"}
                </Link>
                <Link
                  href="/solarzaun"
                  className="inline-block border border-gray-600 text-white font-semibold px-7 py-3 rounded-xl hover:border-gray-400 transition-colors duration-150 text-center text-sm"
                >
                  {isDE ? "Solarzaun" : "Solar Fence (Solarzaun)"}
                </Link>
              </div>
            </div>
            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden">
              <Image
                src="/images/skywind-rooftop.png"
                alt={isDE
                  ? "SkyWind NG Windanlage kombiniert mit Solarmodulen – hybrides Solar-Wind-Energiesystem"
                  : "SkyWind NG wind turbine combined with solar panels — hybrid solar wind energy system"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Versand & Lieferung ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">
              {isDE ? "Versand & Lieferung" : "Shipping & Delivery"}
            </p>
            <h2 className="font-display text-3xl font-bold text-brand-text mb-5">
              {isDE ? "SkyWind NG – Internationale Verfügbarkeit" : "SkyWind NG – International Availability"}
            </h2>
            <p className="text-brand-muted leading-relaxed mb-6">
              {isDE
                ? "WSP Solarenergie liefert die SkyWind NG an Kunden in ganz Europa. Für Ziele außerhalb der EU nehmen Sie direkt Kontakt auf für ein Frachtangebot. Professionelle Montageteams sind in Deutschland, Österreich und der Schweiz verfügbar; in anderen Ländern arbeiten wir mit zertifizierten lokalen Partnern zusammen."
                : "WSP Solar ships the SkyWind NG to customers across Europe. For destinations outside the EU, contact us directly for a freight quotation. Professional installation teams are available in Germany, Austria, and Switzerland; for other countries we work with certified local partners."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {(isDE ? [
                { region: "Deutschland, Österreich, Schweiz", note: "Lieferung 3–7 Werktage · Montage verfügbar", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                { region: "EU-Länder", note: "Lieferung 5–10 Werktage · Lokales Installateursnetzwerk", color: "border-brand-accent/30 bg-green-50 text-brand-accent" },
                { region: "International (Nicht-EU)", note: "Frachtangebot auf Anfrage · Dokumentation inklusive", color: "border-gray-200 bg-gray-50 text-brand-muted" },
              ] : [
                { region: "Germany, Austria, Switzerland", note: "Delivery 3–7 business days · Installation available", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                { region: "EU Countries", note: "Delivery 5–10 business days · Local installer network", color: "border-brand-accent/30 bg-green-50 text-brand-accent" },
                { region: "International (non-EU)", note: "Contact us for freight quote · Documentation included", color: "border-gray-200 bg-gray-50 text-brand-muted" },
              ]).map((r) => (
                <div key={r.region} className={`rounded-xl border p-4 ${r.color}`}>
                  <p className="font-semibold text-sm mb-1">{r.region}</p>
                  <p className="text-xs">{r.note}</p>
                </div>
              ))}
            </div>
            <p className="text-brand-muted leading-relaxed">
              {isDE ? (
                <>
                  Alle SkyWind NG Einheiten umfassen CE-Zertifizierung, Herstellerdokumentation und 2 Jahre
                  Garantie. Installationsanleitungen auf Deutsch, Englisch und Spanisch verfügbar.{" "}
                  <Link href="/kontakt" className="text-brand-accent hover:underline font-medium">
                    Kontakt für ein Versandangebot →
                  </Link>
                </>
              ) : (
                <>
                  All SkyWind NG units include CE certification, manufacturer documentation, and a 2-year
                  warranty. Installation manuals available in German, English, and Spanish.{" "}
                  <Link href="/kontakt" className="text-brand-accent hover:underline font-medium">
                    Contact us for a shipping quote →
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── Genehmigung & Montage ── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">
              {isDE ? "Montage & Genehmigung" : "Installation & Permits"}
            </p>
            <h2 className="font-display text-3xl font-bold text-brand-text mb-5">
              {isDE ? "Baugenehmigung – Was Sie wissen müssen" : "Planning Permission – What You Need to Know"}
            </h2>
            <p className="text-brand-muted leading-relaxed mb-4">
              {isDE ? (
                <>
                  Genehmigungsanforderungen für die SkyWind NG variieren je nach Land, Region und Montagetyp.
                  In Deutschland sind kleine Windkraftanlagen unterhalb einer definierten Höhenschwelle oft{" "}
                  <strong>genehmigungsfrei</strong> (verfahrensfreies Vorhaben). In anderen EU-Ländern
                  gelten lokale Bauvorschriften und Planungsrecht.
                </>
              ) : (
                <>
                  Permit requirements for the SkyWind NG vary by country, region, and installation type.
                  In Germany, small wind turbines below a defined height threshold are often{" "}
                  <strong>permit-free</strong> (verfahrensfreies Vorhaben). In other EU countries,
                  local building regulations and planning laws apply.
                </>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {(isDE ? [
                { region: "Norddeutschland / ländliche Gebiete", note: "Oft genehmigungsfrei bei Masthöhe < 10 m", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                { region: "Süd- / Westdeutschland", note: "Baugenehmigung ggf. ab 10 m erforderlich", color: "border-amber-200 bg-amber-50 text-amber-700" },
                { region: "EU / International", note: "Lokale Baubehördengenehmigung – wir beraten", color: "border-gray-200 bg-gray-50 text-brand-muted" },
              ] : [
                { region: "Northern Germany / rural areas", note: "Often permit-free for mast height < 10 m", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                { region: "Southern / Western Germany", note: "Building permit may be required above 10 m", color: "border-amber-200 bg-amber-50 text-amber-700" },
                { region: "EU / International", note: "Local planning authority approval — we advise", color: "border-gray-200 bg-gray-50 text-brand-muted" },
              ]).map((r) => (
                <div key={r.region} className={`rounded-xl border p-4 ${r.color}`}>
                  <p className="font-semibold text-sm mb-1">{r.region}</p>
                  <p className="text-xs">{r.note}</p>
                </div>
              ))}
            </div>
            <p className="text-brand-muted leading-relaxed">
              {isDE ? (
                <>
                  Wir helfen Ihnen kostenlos bei der Klärung der Genehmigungsanforderungen für Ihren
                  spezifischen Standort.{" "}
                  <Link href="/kontakt" className="text-brand-accent hover:underline font-medium">
                    Planungsberatung anfragen →
                  </Link>
                </>
              ) : (
                <>
                  We help you clarify permit requirements for your specific site at no cost.{" "}
                  <Link href="/kontakt" className="text-brand-accent hover:underline font-medium">
                    Request planning advice →
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FaqSection
        items={faqItems}
        title={
          isDE
            ? "Häufige Fragen – SkyWind NG Kleinwindanlage"
            : "Frequently Asked Questions – SkyWind NG Micro Wind Turbine"
        }
        bg="white"
      />

      {/* ── Verwandte Themen ── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-8">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">
              {isDE ? "Verwandte Themen" : "Related Topics"}
            </p>
            <h2 className="font-display text-2xl font-bold text-brand-text">
              {isDE ? "Weitere Windenergie-Ratgeber" : "Explore More Wind Energy Guides"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(isDE ? [
              { href: "/micro-wind-turbine", label: "Mikro-Windturbine", desc: "Technik, Daten und Einsatzbereiche für Kleinwindkraftanlagen." },
              { href: "/small-wind-turbine-for-home", label: "Kleinwindanlage für Zuhause", desc: "Die richtige Kleinwindanlage für Ihr Haus und Grundstück finden." },
              { href: "/rooftop-wind-turbine", label: "Dach-Windanlage", desc: "Montagemöglichkeiten, Halterungssysteme und Planungsleitfaden." },
              { href: "/off-grid-wind-turbine", label: "Off-Grid Windanlage", desc: "Batterieladung, Inselsysteme und Energieunabhängigkeit." },
              { href: "/hybrid-solar-wind-system", label: "Hybrides Solar-Wind-System", desc: "Photovoltaik und Wind kombinieren für maximale Autarkie." },
              { href: "/kombiloesungen", label: "Kombilösungen", desc: "Solarzaun und SkyWind NG als kombiniertes Energiesystem." },
              { href: "/blog/how-much-energy-does-a-micro-wind-turbine-produce", label: "Ertrag einer Kleinwindanlage", desc: "Reale Ertragsdaten – jährliche kWh nach Windgeschwindigkeit aus SkyWind NG Installationen." },
              { href: "/blog/category/micro-wind-energy", label: "Ratgeber Kleinwindenergie", desc: "Artikel, Vergleiche und Standort-Check-Tipps für Kleinwindanlagen." },
            ] : [
              { href: "/micro-wind-turbine", label: "Micro Wind Turbine", desc: "Technology, specs, and applications for micro-scale wind power." },
              { href: "/small-wind-turbine-for-home", label: "Small Wind Turbine for Home", desc: "Choosing the right small turbine for your home and property." },
              { href: "/rooftop-wind-turbine", label: "Rooftop Wind Turbine", desc: "Installation options, mounting systems, and planning guide." },
              { href: "/off-grid-wind-turbine", label: "Off-Grid Wind Turbine", desc: "Battery charging, off-grid systems, and energy independence." },
              { href: "/hybrid-solar-wind-system", label: "Hybrid Solar Wind System", desc: "Combining solar PV and wind for maximum self-sufficiency." },
              { href: "/kombiloesungen", label: "Combined Energy Solutions", desc: "Solarzaun and SkyWind NG combined energy solutions." },
              { href: "/blog/how-much-energy-does-a-micro-wind-turbine-produce", label: "Turbine Energy Output Guide", desc: "Real yield data — annual kWh by wind speed from actual SkyWind NG installations." },
              { href: "/blog/category/micro-wind-energy", label: "Micro Wind Energy Guides", desc: "Articles, comparisons and site-assessment tips for small wind turbines." },
            ]).map((link) => (
              <Link
                key={link.href}
                href={link.href as any}
                className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-brand-accent hover:shadow-sm transition-all duration-150"
              >
                <p className="font-display font-semibold text-brand-text text-sm mb-1 group-hover:text-brand-accent transition-colors">{link.label}</p>
                <p className="text-xs text-brand-muted">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Über WSP Solarenergie ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">
              {isDE ? "Ihr Partner" : "Your Partner"}
            </p>
            <h2 className="font-display text-2xl font-bold text-brand-text mb-4">
              {isDE ? "Warum WSP Solarenergie?" : "Why WSP Solar?"}
            </h2>
            <p className="text-brand-muted leading-relaxed mb-4">
              {isDE ? (
                <>
                  Wir sind spezialisiert auf nachhaltige Energiesysteme für Privathaushalte, Unternehmen und die
                  Landwirtschaft. Neben der SkyWind NG vertreiben wir{" "}
                  <Link href="/solarzaun" className="text-brand-accent hover:underline">Solarzaunsysteme</Link>{" "}
                  und{" "}
                  <Link href="/kombiloesungen" className="text-brand-accent hover:underline">hybride Solar-Wind-Lösungen</Link>
                  .
                </>
              ) : (
                <>
                  We specialise in sustainable energy systems for homes, businesses, and agriculture.
                  In addition to the SkyWind NG, we supply{" "}
                  <Link href="/solarzaun" className="text-brand-accent hover:underline">solar fence systems (Solarzaun)</Link>{" "}
                  and{" "}
                  <Link href="/kombiloesungen" className="text-brand-accent hover:underline">hybrid solar wind solutions</Link>
                  .
                </>
              )}
            </p>
            <p className="text-brand-muted leading-relaxed mb-4">
              {isDE
                ? "Jede Beratung beginnt mit einer ehrlichen Standortanalyse. Wir empfehlen die SkyWind NG nur dann, wenn sie für Ihren konkreten Standort wirtschaftlich sinnvoll ist. Wenn die Windressource nicht ausreicht, sagen wir es Ihnen – und zeigen Ihnen die beste Alternative."
                : "Every consultation starts with an honest site analysis. We only recommend the SkyWind NG when it makes economic sense for your specific location. If the wind resource is insufficient, we'll tell you — and show you the best alternative."}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {(isDE
                ? ["CE-Zertifiziert", "2 Jahre Garantie", "Kostenlose Bewertung", "EU-Versand"]
                : ["CE Certified", "2-Year Warranty", "Free Assessment", "EU Shipping"]
              ).map((trust) => (
                <div key={trust} className="flex items-center gap-2 text-sm text-brand-muted">
                  <span className="text-brand-accent font-bold">✓</span>
                  {trust}
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={MAIN_SITE}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent border border-brand-accent/30 rounded-xl px-5 py-2.5 hover:bg-brand-accent/5 transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                wsp-solarenergie.de
              </a>
              <Link
                href="/kontakt"
                className="inline-block text-sm font-semibold text-white bg-brand-accent rounded-xl px-5 py-2.5 hover:bg-green-600 transition-colors duration-150 text-center"
              >
                {isDE ? "Beratungsgespräch buchen" : "Book a Consultation"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Finaler CTA ── */}
      <section className="bg-brand-text py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-5">
            {isDE ? "Nächster Schritt" : "Next Step"}
          </p>
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            {isDE ? (
              <>Ist die SkyWind NG die richtige<br />Windanlage für Ihren Standort?</>
            ) : (
              <>Is the SkyWind NG the Right Wind Turbine<br />for Your Site?</>
            )}
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            {isDE
              ? "Teilen Sie uns Ihren Standort und Ihre Energieziele mit. Wir bewerten das Windpotenzial und liefern innerhalb von zwei Werktagen eine ehrliche, kostenlose Standortbewertung."
              : "Tell us about your location and energy goals. We assess the wind potential and provide an honest, no-cost site evaluation within two business days."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/kontakt"
              className="inline-block bg-brand-accent text-white font-semibold px-9 py-3.5 rounded-xl hover:bg-green-600 transition-colors duration-150"
            >
              {isDE ? "Kostenlos beraten lassen" : "Request Free Consultation"}
            </Link>
            <Link
              href="/products"
              className="inline-block border border-gray-600 text-white font-semibold px-9 py-3.5 rounded-xl hover:border-gray-400 transition-colors duration-150"
            >
              {isDE ? "Alle Produkte ansehen" : "View All Products"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
