import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { fetchProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import type { ProductSummary } from "@wsp/types";

const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://webshop.wsp-solarenergie.de";
const MAIN_SITE = "https://www.wsp-solarenergie.de";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const isDE = params.locale === "de";
  const localePrefix = isDE ? "" : `/${params.locale}`;
  const canonicalUrl = `${BASE}${localePrefix}/skywind-ng`;

  const title = "SkyWind NG Kleinwindanlage kaufen – Technische Daten, Preis & Erfahrungen | WSP Solarenergie";
  const description =
    "SkyWind NG Kleinwindanlage: Technische Daten, Preis, Erfahrungen, Ertrag und Genehmigung auf einen Blick. Jetzt SkyWind NG 1kW oder 2kW kaufen oder kostenlos beraten lassen.";

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
      siteName: "Solarzaun & SkyWind – WSP Solarenergie",
      type: "website",
      images: [{ url: `${BASE}/images/skywind-hero.png`, width: 1200, height: 630, alt: "SkyWind NG Kleinwindanlage" }],
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

const FAQ_ITEMS = [
  {
    q: "Was ist die SkyWind NG Kleinwindanlage?",
    a: "Die SkyWind NG ist eine kompakte Kleinwindanlage für private und gewerbliche Standorte. Sie ist in zwei Leistungsklassen erhältlich: SkyWind NG 1kW und SkyWind NG 2kW. Die Anlage erzeugt auch bei niedrigen Windgeschwindigkeiten Strom und eignet sich besonders als Ergänzung zu einer Photovoltaik-Anlage.",
  },
  {
    q: "Wie viel Strom erzeugt die SkyWind NG?",
    a: "Der Ertrag hängt stark vom Standort ab. Bei einer mittleren Windgeschwindigkeit von 5 m/s kann die SkyWind NG 1kW rund 1.500–2.000 kWh pro Jahr erzeugen, die 2kW-Variante entsprechend mehr. Wir führen vor einem Kauf immer eine individuelle Standortprüfung durch.",
  },
  {
    q: "Ab welcher Windgeschwindigkeit läuft die SkyWind NG an?",
    a: "Die SkyWind NG beginnt ab einer Windgeschwindigkeit von ca. 2,5 m/s mit der Stromerzeugung (Cut-in-Speed). Die Nennleistung wird bei etwa 10–12 m/s erreicht. Die Anlage arbeitet geräuscharm und vibrationsarm.",
  },
  {
    q: "Brauche ich eine Genehmigung für die SkyWind NG?",
    a: "Das hängt von Bundesland und Gemeinde ab. In vielen Fällen gilt die SkyWind NG als verfahrensfreies Vorhaben, wenn sie eine bestimmte Höhe nicht überschreitet. In Bebauungsplan-Gebieten kann eine Baugenehmigung erforderlich sein. Wir unterstützen Sie dabei, die Genehmigungspflicht für Ihren Standort zu klären.",
  },
  {
    q: "Wie laut ist die SkyWind NG?",
    a: "Die SkyWind NG arbeitet sehr geräuscharm. Bei Nennwindgeschwindigkeit liegt der Schallpegel bei ca. 45 dB(A) in 10 m Entfernung – vergleichbar mit einem leisen Gespräch. Sie ist damit für Wohngebiete geeignet.",
  },
  {
    q: "Kann ich die SkyWind NG mit einer Solaranlage kombinieren?",
    a: "Ja – das ist sogar der empfohlene Betrieb. Solar und Wind ergänzen sich saisonal ideal: Im Winter und bei bewölktem Himmel liefert Wind mehr Energie, im Sommer übernimmt die Photovoltaik. Zusammen mit einem Speicher erreichen Sie deutlich höhere Autarkiequoten. Auf unserer Seite zu Kombilösungen finden Sie mehr Informationen.",
  },
  {
    q: "Was kostet die SkyWind NG inklusive Montage?",
    a: "Der Preis der SkyWind NG hängt von der Leistungsklasse (1kW oder 2kW), dem benötigten Mast und den Montagekosten ab. Aktuelle Preise finden Sie direkt in unserem Shop. Für eine vollständige Projektkalkulation inklusive Montage beraten wir Sie kostenlos und unverbindlich.",
  },
  {
    q: "Welchen Mast brauche ich für die SkyWind NG?",
    a: "Die SkyWind NG wird an einem Flanschmast montiert. Wir bieten Mastvarianten ab 3 m Länge an – die optimale Masthöhe hängt von Ihrer Gebäudestruktur und Hindernissen in der Umgebung ab. Der Mast ist separat erhältlich und wird passend zur Anlage geliefert.",
  },
  {
    q: "Gibt es Fördermittel für die SkyWind NG?",
    a: "Je nach Bundesland und Anlagentyp gibt es verschiedene Fördermöglichkeiten über KfW, Landesförderbanken oder kommunale Programme. Außerdem kann die Einspeisung ins Netz über das EEG vergütet werden. Wir informieren Sie im Beratungsgespräch über aktuell verfügbare Programme für Ihren Standort.",
  },
  {
    q: "Wo wird die SkyWind NG montiert?",
    a: "Die SkyWind NG kann auf dem Dach, an der Fassade oder auf einem freistehenden Mast auf dem Grundstück installiert werden. Die Dach- oder Mastmontage hängt von Ihren baulichen Gegebenheiten und der optimalen Windausbeute ab.",
  },
  {
    q: "Ist die SkyWind NG netzgekoppelt oder inselbetriebsfähig?",
    a: "Die SkyWind NG ist sowohl für den netzgekoppelten Betrieb (Einspeisung oder Eigenverbrauch) als auch für den Inselbetrieb mit Batteriespeicher geeignet. Die genaue Konfiguration wird im Beratungsgespräch auf Ihren Bedarf abgestimmt.",
  },
];

const SPECS = [
  { label: "Modelle", value: "SkyWind NG 1kW · SkyWind NG 2kW" },
  { label: "Nennleistung", value: "1.000 W / 2.000 W" },
  { label: "Rotordurchmesser", value: "1,8 m / 2,5 m" },
  { label: "Cut-in-Speed", value: "ca. 2,5 m/s" },
  { label: "Nennwindgeschwindigkeit", value: "ca. 10–12 m/s" },
  { label: "Schallpegel", value: "ca. 45 dB(A) @ 10 m" },
  { label: "Mastkompatibilität", value: "Flanschmast ab 3 m" },
  { label: "Anschluss", value: "230 V / 50 Hz" },
  { label: "Betriebstemperatur", value: "−20 °C bis +50 °C" },
  { label: "Garantie", value: "2 Jahre Herstellergarantie" },
];

export default async function SkywindNgPage({ params }: Props) {
  let products: ProductSummary[] = [];
  try {
    const result = await fetchProducts({ locale: params.locale as "de" | "en" | "es", category: "skywind", limit: 6 });
    products = result.items;
  } catch {
    products = [];
  }

  const canonicalUrl = `${BASE}${params.locale === "de" ? "" : `/${params.locale}`}/skywind-ng`;

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
              { "@type": "ListItem", position: 1, name: "Start", item: BASE },
              { "@type": "ListItem", position: 2, name: "SkyWind", item: `${BASE}/skywind` },
              { "@type": "ListItem", position: 3, name: "SkyWind NG", item: `${BASE}/skywind-ng` },
            ],
          }),
        }}
      />

      {/* ── Schema: FAQPage ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />

      {/* ── Schema: Product (generisch für SkyWind NG) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "SkyWind NG Kleinwindanlage",
            description:
              "Die SkyWind NG ist eine kompakte Kleinwindkraftanlage für Eigenheim und Gewerbe. Verfügbar als NG 1kW und NG 2kW. Ideal zur Kombination mit Photovoltaik.",
            brand: { "@type": "Brand", name: "SkyWind" },
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
              url: `${BASE}/skywind-ng`,
              seller: { "@type": "Organization", name: "WSP Solarenergie", url: BASE },
            },
            url: `${BASE}/skywind-ng`,
            image: `${BASE}/images/skywind-hero.png`,
          }),
        }}
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[55vh] sm:min-h-[75vh] flex items-center">
        <Image
          src="/images/skywind-hero.png"
          alt="SkyWind NG Kleinwindanlage auf modernem Grundstück"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/20" />
        <div className="relative w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-white/60 mb-6">
              <Link href="/" className="hover:text-white transition-colors duration-150">Start</Link>
              <span>/</span>
              <Link href="/skywind" className="hover:text-white transition-colors duration-150">SkyWind</Link>
              <span>/</span>
              <span className="text-white/90">SkyWind NG</span>
            </nav>

            <div className="max-w-2xl">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">
                SkyWind NG · Kleinwindanlage
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white leading-tight mb-5">
                SkyWind NG:<br />
                <span className="text-brand-accent">Windstrom für Eigenheim</span><br />
                und Gewerbe.
              </h1>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8 max-w-xl">
                Die SkyWind NG Kleinwindkraftanlage erzeugt Strom auch bei bewölktem Himmel –
                kompakt, geräuscharm und ideal zur Kombination mit Photovoltaik. Verfügbar als
                NG&nbsp;1&nbsp;kW und NG&nbsp;2&nbsp;kW.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/kontakt"
                  className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150 text-center"
                >
                  Beratung anfragen
                </Link>
                <a
                  href="#produkte"
                  className="inline-block border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:border-white hover:bg-white/10 transition-colors duration-150 text-center"
                >
                  Produkte ansehen
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
              { number: "2,5 m/s", label: "Anlaufwindgeschwindigkeit" },
              { number: "45 dB", label: "Schallpegel @ 10 m" },
              { number: "1–2 kW", label: "Nennleistung (NG)" },
              { number: "2 Jahre", label: "Herstellergarantie" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-2xl font-bold text-brand-accent">{s.number}</p>
                <p className="text-xs text-brand-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Was ist die SkyWind NG? ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Produktübersicht</p>
              <h2 className="font-display text-3xl font-bold text-brand-text mb-5 leading-snug">
                Was ist die SkyWind NG Kleinwindanlage?
              </h2>
              <p className="text-brand-muted leading-relaxed mb-4">
                Die <strong>SkyWind NG</strong> ist eine moderne Kleinwindkraftanlage, die speziell für den Einsatz
                auf privaten Grundstücken, Gewerbeflächen und landwirtschaftlichen Betrieben entwickelt wurde.
                Sie ist in zwei Leistungsklassen erhältlich: <strong>SkyWind NG 1kW</strong> und <strong>SkyWind NG 2kW</strong>.
              </p>
              <p className="text-brand-muted leading-relaxed mb-4">
                Im Unterschied zu klassischen Dachsolaranlagen erzeugt die SkyWind NG auch dann Strom,
                wenn die Sonne nicht scheint – an bewölkten Tagen, in der Nacht und in den Wintermonaten,
                wenn die Winderträge typischerweise am höchsten sind.
              </p>
              <p className="text-brand-muted leading-relaxed mb-6">
                Als autorisiierter Händler und Installationspartner bieten wir die SkyWind NG inklusive
                individueller Standortprüfung, Beratung, Lieferung und optionaler Montage an.
                Weitere Informationen zu unserem Unternehmen finden Sie auf{" "}
                <a
                  href={MAIN_SITE}
                  target="_blank"
                  rel="noopener"
                  className="text-brand-accent hover:underline font-medium"
                >
                  wsp-solarenergie.de
                </a>
                .
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/kontakt"
                  className="inline-block bg-brand-accent text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150 text-center text-sm"
                >
                  Standort prüfen lassen
                </Link>
                <Link
                  href="/kombiloesungen"
                  className="inline-block border border-gray-200 text-brand-text font-semibold px-6 py-3 rounded-xl hover:border-brand-accent hover:text-brand-accent transition-colors duration-150 text-center text-sm"
                >
                  Solar + Wind kombinieren
                </Link>
              </div>
            </div>

            <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/skywind-rooftop.png"
                alt="SkyWind NG auf Hausdach mit Photovoltaik"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Technische Daten ── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Technische Daten</p>
            <h2 className="font-display text-3xl font-bold text-brand-text">
              SkyWind NG – Technische Spezifikationen
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-w-3xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider">Merkmal</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider">Wert</th>
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
            Technische Daten können je nach Konfiguration und Modellgeneration abweichen. Verbindliche
            Angaben finden Sie im jeweiligen{" "}
            <Link href="/products" className="text-brand-accent hover:underline">
              Produktdatenblatt
            </Link>{" "}
            oder auf{" "}
            <a
              href={`${MAIN_SITE}/skywind`}
              target="_blank"
              rel="noopener"
              className="text-brand-accent hover:underline"
            >
              wsp-solarenergie.de/skywind
            </a>
            .
          </p>
        </div>
      </section>

      {/* ── Modelle: NG 1kW vs 2kW ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Modellvergleich</p>
            <h2 className="font-display text-3xl font-bold text-brand-text">
              SkyWind NG 1kW oder 2kW – welches Modell passt zu Ihnen?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            {[
              {
                model: "SkyWind NG 1kW",
                ideal: "Eigenheim, Kleingrundstück, Ergänzung zur PV",
                leistung: "1.000 W",
                rotor: "ca. 1,8 m",
                ertrag: "ca. 1.500–2.500 kWh/Jahr*",
                highlight: false,
              },
              {
                model: "SkyWind NG 2kW",
                ideal: "Gewerbe, Landwirtschaft, größere Anlage",
                leistung: "2.000 W",
                rotor: "ca. 2,5 m",
                ertrag: "ca. 3.000–5.000 kWh/Jahr*",
                highlight: true,
              },
            ].map((m) => (
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
                    Empfohlen
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-brand-text">{m.model}</h3>
                <ul className="space-y-2 text-sm text-brand-muted">
                  <li><span className="font-medium text-brand-text">Ideal für:</span> {m.ideal}</li>
                  <li><span className="font-medium text-brand-text">Nennleistung:</span> {m.leistung}</li>
                  <li><span className="font-medium text-brand-text">Rotordurchmesser:</span> {m.rotor}</li>
                  <li><span className="font-medium text-brand-text">Typischer Jahresertrag:</span> {m.ertrag}</li>
                </ul>
                <Link
                  href="/kontakt"
                  className={`mt-auto inline-block text-center font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors duration-150 ${
                    m.highlight
                      ? "bg-brand-accent text-white hover:bg-green-600"
                      : "border border-gray-200 text-brand-text hover:border-brand-accent hover:text-brand-accent"
                  }`}
                >
                  Beratung anfragen
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-brand-muted">
            * Jahresertrag ist standortabhängig und basiert auf einer mittleren Windgeschwindigkeit von 5–6 m/s.
            Individuelle Ertragsprognose erfolgt im Beratungsgespräch.
          </p>
        </div>
      </section>

      {/* ── Produkte ── */}
      {products.length > 0 && (
        <section id="produkte" className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Direkt kaufen</p>
              <h2 className="font-display text-3xl font-bold text-brand-text">
                SkyWind NG jetzt kaufen oder konfigurieren
              </h2>
              <p className="text-brand-muted mt-2 max-w-xl">
                Alle SkyWind NG Produkte inklusive Masten, Zubehör und Komplettpaketen – direkt bestellbar
                oder auf Anfrage konfigurierbar.
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
                Alle Produkte ansehen →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Ertrag & Wirtschaftlichkeit ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Wirtschaftlichkeit</p>
              <h2 className="font-display text-3xl font-bold text-brand-text mb-5">
                Lohnt sich die SkyWind NG – Ertrag und Amortisation
              </h2>
              <p className="text-brand-muted leading-relaxed mb-4">
                Die Wirtschaftlichkeit der SkyWind NG hängt primär vom Windpotenzial Ihres Standorts ab.
                Mit einer mittleren Windgeschwindigkeit von 5 m/s kann die <strong>SkyWind NG 1kW</strong> rund
                1.500 bis 2.500 kWh pro Jahr erzeugen – genug, um einen Haushalt zu einem erheblichen
                Teil mit Eigenstrom zu versorgen.
              </p>
              <p className="text-brand-muted leading-relaxed mb-4">
                Bei einem Strompreis von 0,30 €/kWh entspricht das einer jährlichen Einsparung von
                450–750 € allein durch Eigenverbrauch. Hinzu kommt die Einspeisevergütung nach EEG
                für nicht verbrauchten Strom.
              </p>
              <p className="text-brand-muted leading-relaxed mb-6">
                Amortisationszeiträume von 8–12 Jahren sind bei geeigneten Standorten realistisch.
                Bei Kombination mit einer Photovoltaik-Anlage und einem Batteriespeicher können
                Autarkiequoten von über 70 % erreicht werden.
              </p>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">Windpotenzial prüfen</p>
                <p className="text-sm text-brand-muted mb-4">
                  Den Windatlas Deutschland des Deutschen Wetterdienstes (DWD) können Sie nutzen,
                  um das Windpotenzial Ihres Standorts vorab einzuschätzen.
                </p>
                <a
                  href="https://www.dwd.de/DE/klimaumwelt/klimaatlas/klimaatlas_node.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-semibold text-brand-accent hover:underline"
                >
                  DWD Klimaatlas öffnen →
                </a>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: "Standort optimal (> 6 m/s)", ertrag: "3.000–5.000 kWh/Jahr", saving: "900–1.500 €/Jahr", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                { label: "Standort gut (4–6 m/s)", ertrag: "1.500–3.000 kWh/Jahr", saving: "450–900 €/Jahr", color: "text-brand-accent bg-green-50 border-green-200" },
                { label: "Standort bedingt (3–4 m/s)", ertrag: "500–1.500 kWh/Jahr", saving: "150–450 €/Jahr", color: "text-amber-600 bg-amber-50 border-amber-200" },
                { label: "Standort ungeeignet (< 3 m/s)", ertrag: "Wirtschaftlichkeit fraglich", saving: "Wir empfehlen PV", color: "text-red-600 bg-red-50 border-red-200" },
              ].map((row) => (
                <div key={row.label} className={`rounded-xl border p-5 ${row.color}`}>
                  <p className="font-semibold text-sm mb-1">{row.label}</p>
                  <p className="text-xs">Ertrag (NG 2kW): {row.ertrag}</p>
                  <p className="text-xs">Einsparung: {row.saving}</p>
                </div>
              ))}
              <p className="text-xs text-brand-muted pt-2">
                Alle Werte sind Richtwerte basierend auf typischen Standortbedingungen. Die individuelle
                Standortprüfung ist Grundlage jedes Angebots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SkyWind NG + Solar = Kombilösung ── */}
      <section className="bg-brand-text py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">Kombilösung</p>
              <h2 className="font-display text-3xl font-bold text-white mb-5 leading-snug">
                SkyWind NG + Solarzaun:<br />
                Die optimale Hybridlösung.
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Solar und Wind ergänzen sich nach Jahreszeit und Tageszeit ideal. Während Photovoltaik
                im Sommer und bei Sonnenschein am meisten produziert, liefert die SkyWind NG besonders
                in den Wintermonaten und bei bewölktem Himmel zuverlässig Strom.
              </p>
              <p className="text-gray-300 leading-relaxed mb-6">
                Kombiniert mit einem Batteriespeicher erreichen Hybridanlagen aus SkyWind NG und
                Photovoltaik Eigenversorgungsquoten von deutlich über 70 % – für nahezu vollständige
                Unabhängigkeit vom Stromnetz.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/kombiloesungen"
                  className="inline-block bg-brand-accent text-white font-semibold px-7 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150 text-center text-sm"
                >
                  Kombilösungen entdecken
                </Link>
                <Link
                  href="/solarzaun"
                  className="inline-block border border-gray-600 text-white font-semibold px-7 py-3 rounded-xl hover:border-gray-400 transition-colors duration-150 text-center text-sm"
                >
                  Solarzaun ansehen
                </Link>
              </div>
            </div>
            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden">
              <Image
                src="/images/skywind-rooftop.png"
                alt="SkyWind NG und Solarzaun als Kombilösung"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Genehmigung ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Genehmigung</p>
            <h2 className="font-display text-3xl font-bold text-brand-text mb-5">
              SkyWind NG Genehmigung – Was Sie wissen müssen
            </h2>
            <p className="text-brand-muted leading-relaxed mb-4">
              Die Genehmigungspflicht für eine SkyWind NG Kleinwindanlage ist in Deutschland
              Ländersache und hängt von Faktoren wie Anlagenhöhe, Standort und kommunalem Bebauungsplan ab.
              In vielen Bundesländern gilt die SkyWind NG als <strong>verfahrensfreies Vorhaben</strong>,
              wenn sie bestimmte Größenkriterien einhält.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { region: "Nord- & Ostdeutschland", note: "Häufig genehmigungsfrei bei Masthöhe < 10 m", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                { region: "Süd- & Westdeutschland", note: "Baugenehmigung bei Höhe > 10 m oft erforderlich", color: "border-amber-200 bg-amber-50 text-amber-700" },
                { region: "Alle Bundesländer", note: "Bebauungsplan und Abstandsflächen immer prüfen", color: "border-gray-200 bg-gray-50 text-brand-muted" },
              ].map((r) => (
                <div key={r.region} className={`rounded-xl border p-4 ${r.color}`}>
                  <p className="font-semibold text-sm mb-1">{r.region}</p>
                  <p className="text-xs">{r.note}</p>
                </div>
              ))}
            </div>
            <p className="text-brand-muted leading-relaxed">
              Wir unterstützen Sie dabei, die Genehmigungsanforderungen für Ihren konkreten Standort
              frühzeitig zu klären – kostenfrei und unverbindlich.{" "}
              <Link href="/kontakt" className="text-brand-accent hover:underline font-medium">
                Jetzt Beratung anfragen →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="font-display text-3xl font-bold text-brand-text">
              Häufige Fragen zur SkyWind NG Kleinwindanlage
            </h2>
          </div>
          <div className="max-w-3xl divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="group bg-white">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 font-display font-semibold text-brand-text hover:text-brand-accent transition-colors duration-150 [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span className="mt-0.5 flex-shrink-0 text-brand-muted text-sm transition-transform duration-200 group-open:rotate-180">↓</span>
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-sm text-brand-muted leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/faq"
              className="inline-block text-sm font-semibold text-brand-text border border-gray-200 rounded-xl px-5 py-2.5 hover:border-brand-accent hover:text-brand-accent transition-colors duration-150"
            >
              Alle FAQ ansehen →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Über WSP Solarenergie ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Ihr Partner</p>
            <h2 className="font-display text-2xl font-bold text-brand-text mb-4">
              Warum WSP Solarenergie?
            </h2>
            <p className="text-brand-muted leading-relaxed mb-4">
              Wir sind spezialisiert auf nachhaltige Energielösungen für Eigenheim, Gewerbe und
              Landwirtschaft. Neben der SkyWind NG führen wir{" "}
              <Link href="/solarzaun" className="text-brand-accent hover:underline">Solarzaunanlagen</Link>{" "}
              und{" "}
              <Link href="/kombiloesungen" className="text-brand-accent hover:underline">Kombilösungen</Link>{" "}
              aus Solar und Wind.
            </p>
            <p className="text-brand-muted leading-relaxed mb-6">
              Jede Beratung beginnt mit einer ehrlichen Standortanalyse. Wir empfehlen die SkyWind NG
              nur dann, wenn sie an Ihrem Standort wirtschaftlich sinnvoll ist. Wenn nicht, sagen wir
              das – und zeigen Ihnen Alternativen.
            </p>
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
                Beratungsgespräch buchen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Abschluss CTA ── */}
      <section className="bg-brand-text py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-5">Nächster Schritt</p>
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            Ist die SkyWind NG die richtige Lösung<br />für Ihren Standort?
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Schildern Sie uns Ihren Standort und Ihre Ziele. Wir prüfen das Windpotenzial und
            geben Ihnen innerhalb von zwei Werktagen eine ehrliche, kostenfreie Einschätzung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/kontakt"
              className="inline-block bg-brand-accent text-white font-semibold px-9 py-3.5 rounded-xl hover:bg-green-600 transition-colors duration-150"
            >
              Beratung anfragen
            </Link>
            <Link
              href="/products"
              className="inline-block border border-gray-600 text-white font-semibold px-9 py-3.5 rounded-xl hover:border-gray-400 transition-colors duration-150"
            >
              Produkte ansehen
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
