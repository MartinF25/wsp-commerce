import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "faq" });
  const canonicalUrl = params.locale === "de" ? `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://webshop.wsp-solarenergie.de"}/faq` : `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://webshop.wsp-solarenergie.de"}/${params.locale}/faq`;
  const base = process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://webshop.wsp-solarenergie.de";
  const ogImage = `${base}/images/hero-bg.png`;
  return {
    title: t("meta_title"),
    description: t("meta_desc"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        de: `${base}/faq`,
        en: `${base}/en/faq`,
        es: `${base}/es/faq`,
      },
    },
    openGraph: {
      title: t("meta_title"),
      description: t("meta_desc"),
      url: canonicalUrl,
      siteName: "Solarzaun & SkyWind",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: t("meta_title") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta_title"),
      description: t("meta_desc"),
      images: [ogImage],
    },
  };
}

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node !== null && typeof node === "object" && "props" in node) {
    const children = (node as { props?: { children?: ReactNode } }).props?.children;
    if (children !== undefined) return extractText(children);
  }
  return "";
}

export default async function FAQPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "faq" });

  const locale = params.locale;
  const sections = locale === "en" ? FAQ_SECTIONS_EN : locale === "es" ? FAQ_SECTIONS_ES : FAQ_SECTIONS;
  const categories = locale === "en" ? CATEGORIES_EN : locale === "es" ? CATEGORIES_ES : CATEGORIES;

  const faqJsonLd = sections.flatMap((section) =>
    section.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: typeof item.answer === "string" ? item.answer : extractText(item.answer),
      },
    }))
  );

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqJsonLd,
          }),
        }}
      />

      {/* ── Hero ── */}
      <section className="py-20 sm:py-24 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-brand-muted mb-10">
            <Link href="/" className="hover:text-brand-text transition-colors duration-150">{t("breadcrumb_home")}</Link>
            <span>/</span>
            <span className="text-brand-text">FAQ</span>
          </nav>
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-5">{t("eyebrow")}</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-text leading-tight mb-5">
              {t("h1_line1")}<br />{t("h1_line2")}
            </h1>
            <p className="text-lg text-brand-muted leading-relaxed">
              {t("sub_pre")}{" "}
              <Link
                href="/kontakt"
                className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150"
              >
                {t("contact_link")}
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ-Inhalte ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-16">
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-2">
                <p className="text-xs font-medium text-brand-muted uppercase tracking-widest mb-4">{t("topics_label")}</p>
                {categories.map((cat) => (
                  <a
                    key={cat.id}
                    href={`#${cat.id}`}
                    className="block text-sm text-brand-muted hover:text-brand-text transition-colors duration-150 py-1"
                  >
                    {cat.label}
                  </a>
                ))}
              </div>
            </aside>
            <div className="lg:col-span-3 space-y-14">
              {sections.map((section) => (
                <FAQBlock key={section.id} {...section} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Abschluss-CTA ── */}
      <section className="bg-brand-text py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-5">{t("cta_eyebrow")}</p>
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            {t("cta_h2_line1")}<br />{t("cta_h2_line2")}
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">{t("cta_sub")}</p>
          <Link
            href="/kontakt"
            className="inline-block bg-brand-accent text-white font-semibold px-9 py-3.5 rounded-xl hover:bg-green-600 transition-colors duration-150"
          >
            {t("cta_primary")}
          </Link>
        </div>
      </section>
    </main>
  );
}

// ─── Locale-aware static data ─────────────────────────────────────────────────

const CATEGORIES = [
  { id: "allgemein", label: "Allgemein" },
  { id: "solarzaun", label: "Solarzaun" },
  { id: "skywind", label: "SkyWind" },
  { id: "kombilösungen", label: "Kombilösungen" },
  { id: "beratung", label: "Beratung & Ablauf" },
] as const;

const CATEGORIES_EN = [
  { id: "allgemein", label: "General" },
  { id: "solarzaun", label: "Solar Fence" },
  { id: "skywind", label: "SkyWind" },
  { id: "kombilösungen", label: "Combined Solutions" },
  { id: "beratung", label: "Advice & Process" },
] as const;

const CATEGORIES_ES = [
  { id: "allgemein", label: "General" },
  { id: "solarzaun", label: "Valla Solar" },
  { id: "skywind", label: "SkyWind" },
  { id: "kombilösungen", label: "Soluciones Combinadas" },
  { id: "beratung", label: "Consulta & Proceso" },
] as const;

interface FAQItemData {
  question: string;
  answer: ReactNode;
}

interface FAQSectionData {
  id: string;
  label: string;
  eyebrow: string;
  link?: { href: string; label: string };
  items: FAQItemData[];
}

const FAQ_SECTIONS: FAQSectionData[] = [
  {
    id: "allgemein",
    label: "Allgemein",
    eyebrow: "Allgemein",
    items: [
      {
        question: "Welche Lösungen bieten Sie an?",
        answer: (
          <>
            Wir bieten drei Produktlinien:{" "}
            <Link href="/solarzaun" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">
              Solarzaun
            </Link>{" "}
            (Einfriedung und Solaranlage in einem),{" "}
            <Link href="/skywind" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">
              SkyWind
            </Link>{" "}
            (Kleinwindanlagen für private und gewerbliche Standorte) und{" "}
            <Link href="/kombiloesungen" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">
              Kombilösungen
            </Link>{" "}
            (aufeinander abgestimmte Systeme aus Solar, Wind und Speicher). Alle
            drei Lösungen werden individuell geplant – kein Standardprodukt von
            der Stange.
          </>
        ),
      },
      {
        question: "Für wen sind Ihre Lösungen geeignet?",
        answer:
          "Unsere Lösungen richten sich an Privatkunden (Eigenheim, Garten, Grundstück), Gewerbetreibende (Betriebsgelände, Parkplätze, Logistikflächen), Landwirte und Hofbetreiber (große Freiflächen mit Einfriedungsbedarf) sowie Händler und Montagebetriebe, die als Partner zusammenarbeiten möchten. Welche Lösung zu Ihrer Situation passt, klären wir im Erstgespräch.",
      },
      {
        question: "Sind Ihre Produkte förderfähig?",
        answer:
          "Je nach Bundesland, Anlagentyp und Nutzung gibt es verschiedene Fördermöglichkeiten – über KfW, Landesförderbanken oder kommunale Programme. Wir informieren Sie im Beratungsgespräch über aktuelle Programme, die für Ihr konkretes Projekt relevant sind. Eine pauschale Aussage ist hier nicht seriös möglich.",
      },
    ],
  },
  {
    id: "solarzaun",
    label: "Solarzaun",
    eyebrow: "Solarzaun",
    link: { href: "/solarzaun", label: "Mehr zum Solarzaun" },
    items: [
      {
        question: "Was ist ein Solarzaun und wie funktioniert er?",
        answer:
          "Ein Solarzaun ist eine Einfriedungslösung, bei der Photovoltaik-Module in die Zaunstruktur integriert sind. Er erfüllt die Funktion eines herkömmlichen Zauns – Abgrenzung, Sichtschutz, Sicherheit – und erzeugt dabei Strom. Je nach Ausführung kann der Strom ins Netz eingespeist oder direkt genutzt werden. Es entsteht kein zusätzlicher Platzbedarf auf Ihrem Grundstück.",
      },
      {
        question: "Für welche Grundstücke eignet sich ein Solarzaun?",
        answer:
          "Grundsätzlich für jedes Grundstück mit Zaunbedarf. Besonders vorteilhaft ist ein Solarzaun bei längeren Zaunlinien mit günstiger Ausrichtung (Süd, Südost, Südwest). Ob sich der Solarzaun an Ihrem Standort lohnt, klären wir in einem unverbindlichen Erstgespräch.",
      },
      {
        question: "Wie unterscheidet sich der Solarzaun von einer Dach-PV-Anlage?",
        answer:
          "Der Solarzaun nutzt die Zaunfläche statt des Daches. Das ist besonders interessant, wenn das Dach bereits belegt, ungünstig ausgerichtet oder nicht verfügbar ist. Beide Systeme lassen sich auch kombinieren – der Solarzaun ergänzt dann eine bestehende Dachanlage.",
      },
      {
        question: "Brauche ich eine Baugenehmigung für einen Solarzaun?",
        answer:
          "Das hängt von der Gemeinde und den örtlichen Bauvorschriften ab. In vielen Fällen ist kein gesondertes Genehmigungsverfahren erforderlich. Wir unterstützen Sie dabei, die relevanten Voraussetzungen frühzeitig zu klären.",
      },
    ],
  },
  {
    id: "skywind",
    label: "SkyWind",
    eyebrow: "SkyWind",
    link: { href: "/skywind", label: "Mehr zu SkyWind" },
    items: [
      {
        question: "Für welche Standorte eignet sich SkyWind?",
        answer:
          "SkyWind eignet sich für Standorte mit ausreichendem und verlässlichem Windangebot. Offene Lagen, Küstennähe oder erhöhte Grundstücke sind in der Regel günstiger als windgeschützte Innenstadtlagen. Wir prüfen Ihren Standort konkret, bevor wir eine Empfehlung geben – SkyWind wird nicht empfohlen, wenn die Wirtschaftlichkeit nicht gegeben ist.",
      },
      {
        question: "Wie viel Strom erzeugt eine SkyWind-Anlage?",
        answer:
          "Das hängt von Standort, Windverhältnissen und Anlagengröße ab. In unserer Beratung ermitteln wir gemeinsam mit Ihnen die realistische Jahreserzeugung auf Basis Ihrer Standortdaten. Pauschale Kilowattstunden-Versprechen wären nicht seriös.",
      },
      {
        question: "Lässt sich SkyWind mit einer Solaranlage kombinieren?",
        answer: (
          <>
            Ja – das ist eine der häufigsten Konfigurationen. Solar und Wind
            ergänzen sich nach Jahres- und Tageszeit sinnvoll: Bei bewölktem
            Himmel weht oft Wind, und im Sommer liefert Solar mehr. Die
            Kombination erhöht den Eigenversorgungsanteil deutlich. Details dazu
            finden Sie auf unserer Seite zu{" "}
            <Link
              href="/kombiloesungen"
              className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150"
            >
              Kombilösungen
            </Link>
            .
          </>
        ),
      },
      {
        question: "Benötige ich eine Genehmigung für eine Kleinwindanlage?",
        answer:
          "Das hängt von der Anlagenhöhe, dem Standort und den kommunalen Vorschriften ab. In manchen Gemeinden ist eine Baugenehmigung erforderlich, in anderen nicht. Wir unterstützen Sie dabei, die Anforderungen frühzeitig zu klären.",
      },
    ],
  },
  {
    id: "kombilösungen",
    label: "Kombilösungen",
    eyebrow: "Kombilösungen",
    link: { href: "/kombiloesungen", label: "Mehr zu Kombilösungen" },
    items: [
      {
        question: "Was ist eine Kombilösung?",
        answer: (
          <>
            Eine Kombilösung ist kein einzelnes Produkt, sondern ein
            aufeinander abgestimmtes System – bestehend aus verschiedenen
            Komponenten wie{" "}
            <Link
              href="/solarzaun"
              className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150"
            >
              Solarzaun
            </Link>
            , Dach- oder Freiflächen-Photovoltaik,{" "}
            <Link
              href="/skywind"
              className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150"
            >
              SkyWind
            </Link>{" "}
            und Stromspeicher. Welche Komponenten sinnvoll sind, hängt von
            Standort, Fläche und Ziel ab.
          </>
        ),
      },
      {
        question: "Welche Komponenten gehören zu einer Kombilösung?",
        answer:
          "Eine Kombilösung kann Solarzaun, Dach- oder Freiflächen-Photovoltaik, eine SkyWind-Kleinwindanlage und einen Stromspeicher umfassen. Nicht jedes Projekt braucht alle Komponenten. Wir stellen ein System zusammen, das zu Ihrer Situation passt.",
      },
      {
        question: "Lohnt sich eine Kombilösung für mein Grundstück?",
        answer:
          "Das hängt von Ihrer verfügbaren Fläche, Ihrem Strombedarf und den lokalen Gegebenheiten ab. Eine Kombilösung lohnt sich besonders dort, wo mehrere Energiequellen nutzbar sind und ein hoher Eigenversorgungsanspruch besteht. In unserer Beratung analysieren wir Ihren konkreten Fall – manchmal ist eine Einzellösung sinnvoller.",
      },
      {
        question: "Kann ich eine Kombilösung schrittweise aufbauen?",
        answer:
          "Ja – viele Projekte beginnen mit einem Element, z. B. dem Solarzaun, und werden später um Speicher oder Windkraft erweitert. Wichtig ist, dass die erste Komponente so ausgelegt wird, dass eine Erweiterung technisch möglich bleibt. Das berücksichtigen wir in der Planung.",
      },
    ],
  },
  {
    id: "beratung",
    label: "Beratung & Ablauf",
    eyebrow: "Beratung & Ablauf",
    items: [
      {
        question: "Wie läuft eine Beratung ab?",
        answer:
          "Zunächst sprechen wir unverbindlich über Ihr Projekt, Ihre Fläche und Ihre Ziele. Auf dieser Basis erstellen wir einen ersten Konzeptvorschlag – ohne Standardangebote, ohne Druck. Danach entscheiden Sie, ob und wie Sie weitermachen möchten.",
      },
      {
        question: "Was kostet ein Erstgespräch?",
        answer:
          "Das Erstgespräch ist unverbindlich und für Sie kostenlos. Wir klären dabei gemeinsam, ob und welche Lösung für Ihr Projekt sinnvoll ist. Erst wenn Sie ein konkretes Konzept wünschen, besprechen wir die nächsten Schritte.",
      },
      {
        question: "Wie schnell erhalten wir eine erste Rückmeldung?",
        answer: (
          <>
            Wir melden uns innerhalb von zwei Werktagen nach Eingang Ihrer
            Anfrage – per E-Mail oder telefonisch, je nach Ihrer Angabe im{" "}
            <Link
              href="/kontakt"
              className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150"
            >
              Kontaktformular
            </Link>
            . Keine ungebetenen Folgeanrufe.
          </>
        ),
      },
      {
        question: "Kann ich eine Bestellung widerrufen?",
        answer: (
          <>
            Ja – als Verbraucher haben Sie gemäß § 355 BGB das Recht, einen
            Vertrag innerhalb von 14 Tagen ohne Angabe von Gründen zu widerrufen.
            Nutzen Sie dazu unser{" "}
            <Link
              href="/widerruf"
              className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150"
            >
              Online-Widerrufsformular
            </Link>
            {" "}– ohne Anmeldung, auch für Gastbestellungen.
          </>
        ),
      },
    ],
  },
];

const FAQ_SECTIONS_EN: FAQSectionData[] = [
  {
    id: "allgemein",
    label: "General",
    eyebrow: "General",
    items: [
      {
        question: "What solutions do you offer?",
        answer: (
          <>
            We offer three product lines:{" "}
            <Link href="/solarzaun" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">Solar Fence</Link>{" "}
            (fencing and photovoltaic system in one),{" "}
            <Link href="/skywind" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">SkyWind</Link>{" "}
            (small wind turbines for private and commercial sites) and{" "}
            <Link href="/kombiloesungen" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">Combined Solutions</Link>{" "}
            (coordinated systems of solar, wind and storage). All three solutions are individually planned – no standard off-the-shelf products.
          </>
        ),
      },
      {
        question: "Who are your solutions suitable for?",
        answer: "Our solutions are aimed at private customers (residential properties, gardens, plots), commercial businesses (premises, car parks, logistics areas), farmers and rural operators (large open spaces with fencing requirements) and dealers and installation companies who wish to partner with us. The right solution for your situation is clarified in an initial consultation.",
      },
      {
        question: "Are your products eligible for subsidies?",
        answer: "Depending on the country, type of installation and use, there are various funding options – through national programmes, regional development banks or local schemes. We inform you in the consultation about currently available programmes relevant to your specific project.",
      },
    ],
  },
  {
    id: "solarzaun",
    label: "Solar Fence",
    eyebrow: "Solar Fence",
    link: { href: "/solarzaun", label: "More about Solar Fence" },
    items: [
      {
        question: "What is a solar fence and how does it work?",
        answer: "A solar fence is a fencing solution in which photovoltaic modules are integrated into the fence structure. It fulfils the function of a conventional fence – boundary, privacy, security – and generates electricity at the same time. Depending on the configuration, electricity can be fed into the grid or used directly. No additional space is required on your property.",
      },
      {
        question: "Which properties are suitable for a solar fence?",
        answer: "Basically any property that requires a fence. A solar fence is particularly advantageous with longer fence lines and a favourable orientation (south, south-east, south-west). Whether a solar fence is worthwhile at your site is clarified in a no-obligation initial consultation.",
      },
      {
        question: "How does a solar fence differ from a rooftop PV system?",
        answer: "The solar fence uses the fence area instead of the roof. This is particularly interesting when the roof is already occupied, unfavourably oriented or unavailable. Both systems can also be combined – the solar fence then supplements an existing rooftop system.",
      },
      {
        question: "Do I need planning permission for a solar fence?",
        answer: "This depends on the municipality and local building regulations. In many cases no separate approval process is required. We support you in clarifying the relevant requirements at an early stage.",
      },
    ],
  },
  {
    id: "skywind",
    label: "SkyWind",
    eyebrow: "SkyWind",
    link: { href: "/skywind", label: "More about SkyWind" },
    items: [
      {
        question: "Which sites are suitable for SkyWind?",
        answer: "SkyWind is suitable for sites with sufficient and reliable wind resources. Open locations, coastal areas or elevated properties are generally more favourable than sheltered inner-city positions. We assess your site specifically before making a recommendation – SkyWind is only recommended when it is economically viable.",
      },
      {
        question: "How much electricity does a SkyWind system produce?",
        answer: "This depends on the site, wind conditions and system size. In our consultation we determine the realistic annual output together based on your site data. Blanket kilowatt-hour promises are not credible here.",
      },
      {
        question: "Can SkyWind be combined with a solar system?",
        answer: (
          <>
            Yes – this is one of the most common configurations. Solar and wind complement each other across seasons and times of day: when cloudy skies reduce solar yields, wind often blows. The combination significantly increases self-sufficiency. Details can be found on our{" "}
            <Link href="/kombiloesungen" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">
              Combined Solutions
            </Link>{" "}
            page.
          </>
        ),
      },
      {
        question: "Do I need planning permission for a small wind turbine?",
        answer: "This depends on the height of the installation, the site and local regulations. In some municipalities planning permission is required, in others not. We support you in clarifying the relevant requirements at an early stage.",
      },
    ],
  },
  {
    id: "kombilösungen",
    label: "Combined Solutions",
    eyebrow: "Combined Solutions",
    link: { href: "/kombiloesungen", label: "More about Combined Solutions" },
    items: [
      {
        question: "What is a combined solution?",
        answer: (
          <>
            A combined solution is not a single product, but a coordinated system – consisting of different components such as{" "}
            <Link href="/solarzaun" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">Solar Fence</Link>
            , rooftop or open-area photovoltaics,{" "}
            <Link href="/skywind" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">SkyWind</Link>{" "}
            and electricity storage. Which components make sense depends on location, available area and goals.
          </>
        ),
      },
      {
        question: "Which components are part of a combined solution?",
        answer: "A combined solution can include a solar fence, rooftop or open-area photovoltaics, a SkyWind small wind turbine and electricity storage. Not every project needs all components. We put together a system that fits your situation.",
      },
      {
        question: "Is a combined solution worthwhile for my property?",
        answer: "This depends on your available space, energy needs and local conditions. A combined solution is particularly worthwhile where multiple energy sources are available and a high self-sufficiency target exists. In our consultation we analyse your specific case – sometimes a single solution makes more sense.",
      },
      {
        question: "Can I build a combined solution step by step?",
        answer: "Yes – many projects begin with one element, e.g. the solar fence, and are later expanded with storage or wind power. It is important that the first component is designed so that expansion remains technically possible. We take this into account in the planning.",
      },
    ],
  },
  {
    id: "beratung",
    label: "Advice & Process",
    eyebrow: "Advice & Process",
    items: [
      {
        question: "How does a consultation work?",
        answer: "First we talk informally about your project, your available space and your goals. On this basis we develop an initial concept proposal – without standard offers, without pressure. You then decide if and how you want to proceed.",
      },
      {
        question: "What does an initial consultation cost?",
        answer: "The initial consultation is non-binding and free of charge. We jointly clarify whether and which solution makes sense for your project. Only when you want a concrete concept do we discuss next steps.",
      },
      {
        question: "How quickly do we receive a first response?",
        answer: (
          <>
            We respond within two working days of receiving your enquiry – by email or phone, depending on your preference in the{" "}
            <Link href="/kontakt" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">
              contact form
            </Link>
            . No unsolicited follow-up calls.
          </>
        ),
      },
      {
        question: "Can I cancel an order?",
        answer: (
          <>
            Yes – as a consumer you have the right to withdraw from a contract within 14 days without giving any reason under EU consumer law.
            Please use our{" "}
            <Link
              href="/widerruf"
              className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150"
            >
              online cancellation form
            </Link>
            {" "}– no login required, also available for guest orders.
          </>
        ),
      },
    ],
  },
];

const FAQ_SECTIONS_ES: FAQSectionData[] = [
  {
    id: "allgemein",
    label: "General",
    eyebrow: "General",
    items: [
      {
        question: "¿Qué soluciones ofrecéis?",
        answer: (
          <>
            Ofrecemos tres líneas de productos:{" "}
            <Link href="/solarzaun" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">Valla Solar</Link>{" "}
            (cerramiento y sistema fotovoltaico en uno),{" "}
            <Link href="/skywind" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">SkyWind</Link>{" "}
            (pequeñas turbinas eólicas para uso privado y comercial) y{" "}
            <Link href="/kombiloesungen" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">Soluciones Combinadas</Link>{" "}
            (sistemas coordinados de solar, eólico y almacenamiento). Las tres soluciones se planifican individualmente.
          </>
        ),
      },
      {
        question: "¿Para quién son adecuadas vuestras soluciones?",
        answer: "Nuestras soluciones están dirigidas a clientes privados (propiedades residenciales, jardines), empresas (instalaciones comerciales, aparcamientos), agricultores y operadores rurales, así como distribuidores e instaladores que deseen trabajar como socios.",
      },
      {
        question: "¿Son vuestros productos elegibles para subvenciones?",
        answer: "Dependiendo del país, tipo de instalación y uso, existen diversas opciones de financiación a través de programas nacionales, bancos de desarrollo regionales o programas locales. Te informamos en la consulta sobre los programas disponibles relevantes para tu proyecto.",
      },
    ],
  },
  {
    id: "solarzaun",
    label: "Valla Solar",
    eyebrow: "Valla Solar",
    link: { href: "/solarzaun", label: "Más sobre la Valla Solar" },
    items: [
      {
        question: "¿Qué es una valla solar y cómo funciona?",
        answer: "Una valla solar es una solución de cerramiento en la que los módulos fotovoltaicos están integrados en la estructura de la valla. Cumple la función de una valla convencional – delimitación, privacidad, seguridad – y genera electricidad al mismo tiempo. No se requiere espacio adicional en tu propiedad.",
      },
      {
        question: "¿Para qué propiedades es adecuada una valla solar?",
        answer: "Básicamente para cualquier propiedad que necesite una valla. Es especialmente ventajosa con líneas de valla más largas y orientación favorable. En una consulta inicial sin compromiso aclaramos si una valla solar es rentable en tu ubicación.",
      },
      {
        question: "¿Necesito permiso de obras para una valla solar?",
        answer: "Depende del municipio y las normativas locales de construcción. En muchos casos no se requiere un proceso de aprobación específico. Te apoyamos en aclarar los requisitos relevantes con antelación.",
      },
      {
        question: "¿En qué se diferencia la valla solar de un sistema fotovoltaico en tejado?",
        answer: "La valla solar utiliza la superficie de la valla en lugar del tejado. Ambos sistemas también pueden combinarse – la valla solar complementa una instalación existente en tejado.",
      },
    ],
  },
  {
    id: "skywind",
    label: "SkyWind",
    eyebrow: "SkyWind",
    link: { href: "/skywind", label: "Más sobre SkyWind" },
    items: [
      {
        question: "¿Para qué ubicaciones es adecuado SkyWind?",
        answer: "SkyWind es adecuado para ubicaciones con recursos eólicos suficientes y fiables. Las ubicaciones abiertas, zonas costeras o propiedades elevadas son generalmente más favorables. Evaluamos tu ubicación específicamente antes de hacer una recomendación.",
      },
      {
        question: "¿Cuánta electricidad produce un sistema SkyWind?",
        answer: "Depende de la ubicación, las condiciones eólicas y el tamaño del sistema. En nuestra consulta determinamos la producción anual realista basándonos en los datos de tu ubicación.",
      },
      {
        question: "¿Se puede combinar SkyWind con un sistema solar?",
        answer: (
          <>
            Sí – es una de las configuraciones más comunes. Solar y eólico se complementan entre sí en distintas estaciones y momentos del día. La combinación aumenta significativamente la autosuficiencia. Más detalles en nuestra página de{" "}
            <Link href="/kombiloesungen" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">
              Soluciones Combinadas
            </Link>
            .
          </>
        ),
      },
      {
        question: "¿Necesito permiso para una pequeña turbina eólica?",
        answer: "Depende de la altura de la instalación, la ubicación y las normativas locales. En algunos municipios se requiere permiso de obras, en otros no. Te apoyamos en aclarar los requisitos relevantes.",
      },
    ],
  },
  {
    id: "kombilösungen",
    label: "Soluciones Combinadas",
    eyebrow: "Soluciones Combinadas",
    link: { href: "/kombiloesungen", label: "Más sobre Soluciones Combinadas" },
    items: [
      {
        question: "¿Qué es una solución combinada?",
        answer: (
          <>
            Una solución combinada no es un producto único, sino un sistema coordinado que consiste en diferentes componentes como{" "}
            <Link href="/solarzaun" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">Valla Solar</Link>
            , fotovoltaica en tejado o superficie libre,{" "}
            <Link href="/skywind" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">SkyWind</Link>{" "}
            y almacenamiento. Qué componentes tienen sentido depende de la ubicación, el área disponible y los objetivos.
          </>
        ),
      },
      {
        question: "¿Qué componentes forman parte de una solución combinada?",
        answer: "Una solución combinada puede incluir valla solar, fotovoltaica, una pequeña turbina eólica SkyWind y almacenamiento de electricidad. No todos los proyectos necesitan todos los componentes. Diseñamos un sistema que se adapta a tu situación.",
      },
      {
        question: "¿Vale la pena una solución combinada para mi propiedad?",
        answer: "Depende de tu espacio disponible, necesidades energéticas y condiciones locales. En nuestra consulta analizamos tu caso específico.",
      },
      {
        question: "¿Puedo construir una solución combinada paso a paso?",
        answer: "Sí – muchos proyectos comienzan con un elemento, por ejemplo la valla solar, y se amplían más tarde con almacenamiento o energía eólica. Es importante que el primer componente se diseñe de manera que la ampliación posterior sea técnicamente posible.",
      },
    ],
  },
  {
    id: "beratung",
    label: "Consulta & Proceso",
    eyebrow: "Consulta & Proceso",
    items: [
      {
        question: "¿Cómo funciona una consulta?",
        answer: "Primero hablamos informalmente sobre tu proyecto, tu espacio disponible y tus objetivos. Sobre esta base desarrollamos una propuesta de concepto inicial – sin ofertas estándar, sin presión. Tú decides si y cómo quieres continuar.",
      },
      {
        question: "¿Qué cuesta una consulta inicial?",
        answer: "La consulta inicial es sin compromiso y gratuita. Aclaramos conjuntamente si y qué solución tiene sentido para tu proyecto. Solo cuando desees un concepto concreto discutimos los próximos pasos.",
      },
      {
        question: "¿Con qué rapidez recibimos una primera respuesta?",
        answer: (
          <>
            Respondemos en dos días hábiles tras recibir tu consulta – por correo electrónico o teléfono, según tu preferencia en el{" "}
            <Link href="/kontakt" className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150">
              formulario de contacto
            </Link>
            . Sin llamadas de seguimiento no solicitadas.
          </>
        ),
      },
      {
        question: "¿Puedo desistir de un pedido?",
        answer: (
          <>
            Sí – como consumidor tienes derecho a desistir de un contrato en un plazo de 14 días sin necesidad de indicar el motivo, conforme a la normativa de consumidores de la UE.
            Utiliza nuestro{" "}
            <Link
              href="/widerruf"
              className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150"
            >
              formulario de desistimiento en línea
            </Link>
            {" "}– sin necesidad de iniciar sesión, también disponible para pedidos de invitados.
          </>
        ),
      },
    ],
  },
];

// ─── Hilfskomponenten ─────────────────────────────────────────────────────────

function FAQBlock({ id, label, eyebrow, link, items }: FAQSectionData) {
  return (
    <div id={id}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-1">{eyebrow}</p>
          <h2 className="font-display text-2xl font-bold text-brand-text">{label}</h2>
        </div>
        {link && (
          <Link
            href={link.href}
            className="hidden sm:inline-block text-xs font-semibold text-brand-muted border border-gray-200 rounded-lg px-3 py-1.5 hover:border-brand-accent hover:text-brand-accent transition-colors duration-150 flex-shrink-0"
          >
            {link.label} →
          </Link>
        )}
      </div>
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
        {items.map((item) => (
          <FAQItem key={item.question} {...item} />
        ))}
      </div>
      {link && (
        <div className="mt-4 sm:hidden">
          <Link
            href={link.href}
            className="text-xs font-semibold text-brand-muted hover:text-brand-accent transition-colors duration-150"
          >
            {link.label} →
          </Link>
        </div>
      )}
    </div>
  );
}

function FAQItem({ question, answer }: FAQItemData) {
  return (
    <details className="group bg-white">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 font-display font-semibold text-brand-text hover:text-brand-accent transition-colors duration-150 [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <span className="mt-0.5 flex-shrink-0 text-brand-muted text-sm transition-transform duration-200 group-open:rotate-180">↓</span>
      </summary>
      <div className="px-6 pb-5">
        <p className="text-sm text-brand-muted leading-relaxed">{answer}</p>
      </div>
    </details>
  );
}
