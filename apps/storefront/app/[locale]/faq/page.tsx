import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "faq" });
  return { title: t("meta_title"), description: t("meta_desc") };
}

export default async function FAQPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "faq" });

  return (
    <main>
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
                {CATEGORIES.map((cat) => (
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
              {FAQ_SECTIONS.map((section) => (
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

// ─── Statische Daten (Deutsch – JSX-Antworten nicht übersetzbar via JSON) ──────

const CATEGORIES = [
  { id: "allgemein", label: "Allgemein" },
  { id: "solarzaun", label: "Solarzaun" },
  { id: "skywind", label: "SkyWind" },
  { id: "kombilösungen", label: "Kombilösungen" },
  { id: "beratung", label: "Beratung & Ablauf" },
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
