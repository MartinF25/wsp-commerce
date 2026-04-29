/**
 * Datenschutzerklärung – DSGVO-konform
 *
 * Server Component. Schlichtes, gut lesbares Layout ohne Marketing-UX.
 *
 * Abgedeckte Verarbeitungstatbestände dieser Website:
 *   1. Kontaktformular → Firestore (Firebase) → n8n
 *   2. Hosting (Vercel Inc.)
 *   3. Schriftarten (next/font – lokal ausgeliefert, kein Google-Tracking)
 *   4. Keine Cookies / kein Tracking-Script aktuell eingebunden
 *
 * Nicht abgedeckt (ggf. bei späterer Einführung ergänzen):
 *   - Google Analytics / Matomo / Plausible
 *   - reCAPTCHA
 *   - Zahlungsdienstleister (Checkout)
 */

import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Solarzaun & SkyWind",
  description: "Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.",
  robots: { index: false },
};

// ─── Seite ────────────────────────────────────────────────────────────────────

export default function DatenschutzPage() {
  return (
    <main className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-brand-muted mb-10">
          <Link href="/" className="hover:text-brand-text transition-colors duration-150">
            Start
          </Link>
          <span>/</span>
          <span className="text-brand-text">Datenschutz</span>
        </nav>

        <div className="max-w-3xl">
          {/* Seitentitel */}
          <h1 className="font-display text-4xl font-bold text-brand-text mb-2">
            Datenschutzerklärung
          </h1>
          <p className="text-sm text-brand-muted mb-12">
            Informationen gemäß Art. 13 und 14 der Datenschutz-Grundverordnung
            (DSGVO) · Stand: April 2026
          </p>

          {/* ── 1. Verantwortliche Stelle ─────────────────────────────────────── */}
          <Section title="1. Verantwortliche Stelle">
            <p className="text-sm text-brand-muted leading-relaxed mb-2">
              Verantwortlich im Sinne der DSGVO für die Verarbeitung
              personenbezogener Daten auf dieser Website ist:
            </p>
            <p className="text-sm text-brand-muted leading-relaxed">
              <strong className="text-brand-text font-medium">WSP-Solarenergie</strong><br />
              Inhaber: M. Fauerbach<br />
              Zur Zuckerfabrik 7<br />
              61169 Friedberg (Hessen)<br />
              Deutschland<br />
              <br />
              Telefon / WhatsApp:{" "}
              <a
                href="tel:+4915736614561"
                className="text-brand-text hover:text-brand-accent transition-colors duration-150"
              >
                +49 157 366 145 61
              </a>
              <br />
              E-Mail:{" "}
              <a
                href="mailto:verkauf@wsp-solarenergie.de"
                className="text-brand-text hover:text-brand-accent transition-colors duration-150"
              >
                verkauf@wsp-solarenergie.de
              </a>
            </p>
          </Section>

          {/* ── 2. Datenschutzbeauftragter ───────────────────────────────────── */}
          <Section title="2. Datenschutzbeauftragter">
            <p className="text-sm text-brand-muted leading-relaxed mb-2">
              Für Fragen zum Datenschutz wenden Sie sich bitte an die oben
              genannte verantwortliche Stelle:
            </p>
            <p className="text-sm text-brand-muted leading-relaxed">
              M. Fauerbach<br />
              E-Mail:{" "}
              <a
                href="mailto:verkauf@wsp-solarenergie.de"
                className="text-brand-text hover:text-brand-accent transition-colors duration-150"
              >
                verkauf@wsp-solarenergie.de
              </a>
            </p>
          </Section>

          {/* ── 3. Allgemeines zur Datenverarbeitung ─────────────────────────── */}
          <Section title="3. Allgemeines zur Datenverarbeitung">
            <p className="text-sm text-brand-muted leading-relaxed mb-3">
              Wir verarbeiten personenbezogene Daten grundsätzlich nur, soweit
              dies zur Bereitstellung einer funktionsfähigen Website sowie
              unserer Inhalte und Leistungen erforderlich ist. Eine Verarbeitung
              personenbezogener Daten erfolgt nur nach Ihrer Einwilligung oder
              wenn die Verarbeitung durch gesetzliche Vorschriften gestattet
              ist.
            </p>
            <p className="text-sm text-brand-muted leading-relaxed">
              Personenbezogene Daten werden gelöscht oder gesperrt, sobald der
              Zweck der Speicherung entfällt und keine gesetzlichen
              Aufbewahrungspflichten entgegenstehen.
            </p>
          </Section>

          {/* ── 4. Kontaktformular ───────────────────────────────────────────── */}
          <Section title="4. Kontaktformular und Beratungsanfragen">
            <p className="text-sm text-brand-muted leading-relaxed mb-3">
              Wenn Sie über unser Kontaktformular eine Beratungsanfrage stellen,
              verarbeiten wir die von Ihnen eingegebenen Daten zur Bearbeitung
              Ihrer Anfrage.
            </p>

            <Subsection title="Verarbeitete Daten">
              <ul className="list-disc list-inside space-y-1 text-sm text-brand-muted">
                <li>Vorname und Nachname</li>
                <li>E-Mail-Adresse</li>
                <li>Telefonnummer (optional)</li>
                <li>Firma (optional)</li>
                <li>Anfrageart und Projektart</li>
                <li>Inhalt Ihrer Nachricht</li>
                <li>Zeitpunkt der Übermittlung</li>
              </ul>
            </Subsection>

            <Subsection title="Zweck der Verarbeitung">
              <p className="text-sm text-brand-muted leading-relaxed">
                Die Daten werden ausschließlich zur Bearbeitung und
                Beantwortung Ihrer Anfrage sowie zur Kontaktaufnahme durch uns
                verwendet. Eine Weitergabe an Dritte erfolgt nicht, sofern
                nachfolgend nicht anders beschrieben.
              </p>
            </Subsection>

            <Subsection title="Rechtsgrundlage">
              <p className="text-sm text-brand-muted leading-relaxed">
                Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) sowie
                Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
                Bearbeitung von Kundenanfragen).
              </p>
            </Subsection>

            <Subsection title="Technische Verarbeitung und Speicherung">
              <p className="text-sm text-brand-muted leading-relaxed mb-3">
                Ihre Anfragedaten werden nach Übermittlung in einer Datenbank
                bei Google Firebase (Cloud Firestore) gespeichert. Firebase
                wird von Google LLC, 1600 Amphitheatre Parkway, Mountain View,
                CA 94043, USA betrieben.
              </p>
              <p className="text-sm text-brand-muted leading-relaxed mb-3">
                Die Datenspeicherung erfolgt in der Google-Cloud-Region
                Europe-West (Belgien/Frankfurt), sodass die Daten innerhalb der
                Europäischen Union verbleiben. Zwischen dem Verantwortlichen und
                Google besteht ein Auftragsverarbeitungsvertrag (AVV) gemäß
                Art. 28 DSGVO.
              </p>
              <p className="text-sm text-brand-muted leading-relaxed">
                Zur internen Bearbeitung von Anfragen wird ein automatisiertes
                Workflow-System (n8n) eingesetzt. Dabei werden Ihre Daten
                innerhalb unserer Infrastruktur an das Bearbeitungssystem
                weitergegeben, jedoch nicht an Dritte außerhalb unserer
                Kontrollsphäre.
              </p>
            </Subsection>

            <Subsection title="Speicherdauer">
              <p className="text-sm text-brand-muted leading-relaxed">
                Anfragedaten werden nach abschließender Bearbeitung Ihrer
                Anfrage gelöscht, soweit keine gesetzlichen
                Aufbewahrungspflichten entgegenstehen. Bei Vertragsabschluss
                gelten die handels- und steuerrechtlichen
                Aufbewahrungsfristen (§ 257 HGB, § 147 AO) von bis zu
                10 Jahren.
              </p>
            </Subsection>
          </Section>

          {/* ── 5. Hosting ───────────────────────────────────────────────────── */}
          <Section title="5. Hosting">
            <p className="text-sm text-brand-muted leading-relaxed mb-3">
              Diese Website wird bei Vercel Inc. gehostet:
            </p>
            <p className="text-sm text-brand-muted leading-relaxed mb-3">
              Vercel Inc.<br />
              340 Pine Street, Suite 701<br />
              San Francisco, CA 94104, USA
            </p>
            <p className="text-sm text-brand-muted leading-relaxed mb-3">
              Beim Aufruf unserer Website werden durch Vercel automatisch
              technische Zugriffsdaten (z. B. IP-Adresse, Browser-Typ,
              Datum und Uhrzeit des Zugriffs) in Server-Logfiles erfasst.
              Diese Daten werden nicht mit anderen Datenquellen zusammengeführt.
            </p>
            <p className="text-sm text-brand-muted leading-relaxed">
              Der Einsatz von Vercel erfolgt auf Grundlage von Art. 6 Abs. 1
              lit. f DSGVO (berechtigtes Interesse an einer sicheren und
              effizienten Bereitstellung des Onlineangebots). Mit Vercel
              besteht ein Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO.
              Die Übermittlung in die USA erfolgt auf Grundlage des EU-US
              Data Privacy Framework (Art. 45 DSGVO).
            </p>
          </Section>

          {/* ── 6. Schriftarten ──────────────────────────────────────────────── */}
          <Section title="6. Schriftarten">
            <p className="text-sm text-brand-muted leading-relaxed">
              Diese Website verwendet die Schriftarten <em>Sora</em> und{" "}
              <em>Inter</em>. Die Schriftarten werden über das Next.js
              Font-System (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded">next/font/google</code>)
              eingebunden. Next.js lädt die Schriftdateien dabei beim Build
              herunter und liefert sie direkt vom eigenen Server aus. Es erfolgt{" "}
              <strong className="text-brand-text font-medium">kein</strong> Aufruf
              an Google-Server beim Laden der Seite. Es werden keine
              Schriftarten-Daten an Google übermittelt.
            </p>
          </Section>

          {/* ── 7. Cookies und Tracking ──────────────────────────────────────── */}
          <Section title="7. Cookies und Tracking">
            <p className="text-sm text-brand-muted leading-relaxed mb-3">
              Diese Website setzt derzeit{" "}
              <strong className="text-brand-text font-medium">
                keine Tracking-Cookies
              </strong>{" "}
              und verwendet keine Web-Analytics-Dienste (wie Google Analytics,
              Matomo o. Ä.). Es werden ausschließlich technisch notwendige
              Mechanismen eingesetzt, die für den Betrieb der Website
              erforderlich sind.
            </p>
            <p className="text-sm text-brand-muted leading-relaxed">
              Sollte zu einem späteren Zeitpunkt ein Analyse- oder
              Tracking-Dienst eingesetzt werden, wird diese Datenschutzerklärung
              entsprechend aktualisiert und ggf. ein Cookie-Consent-Banner
              implementiert.
            </p>
          </Section>

          {/* ── 8. Ihre Rechte ───────────────────────────────────────────────── */}
          <Section title="8. Ihre Rechte als betroffene Person">
            <p className="text-sm text-brand-muted leading-relaxed mb-5">
              Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie
              betreffenden personenbezogenen Daten:
            </p>

            <div className="space-y-4 mb-6">
              {RIGHTS.map(({ title, description }) => (
                <div key={title}>
                  <p className="text-sm font-semibold text-brand-text mb-1">
                    {title}
                  </p>
                  <p className="text-sm text-brand-muted leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-sm text-brand-muted leading-relaxed mb-3">
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{" "}
              <a
                href="mailto:verkauf@wsp-solarenergie.de"
                className="text-brand-text hover:text-brand-accent transition-colors duration-150"
              >
                verkauf@wsp-solarenergie.de
              </a>
            </p>

            <p className="text-sm text-brand-muted leading-relaxed">
              Sie haben außerdem das Recht, sich bei der zuständigen
              Datenschutzaufsichtsbehörde zu beschweren. Eine Liste der
              Datenschutzbeauftragten sowie deren Kontaktdaten entnehmen Sie
              dem{" "}
              <a
                href="https://www.bfdi.bund.de/DE/Infothek/Anschriften_Links/anschriften_links-node.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150"
              >
                Verzeichnis der Landesbehörden (BfDI)
              </a>
              .
            </p>
          </Section>

          {/* ── 9. Aktualität ────────────────────────────────────────────────── */}
          <Section title="9. Aktualität und Änderung dieser Datenschutzerklärung">
            <p className="text-sm text-brand-muted leading-relaxed">
              Diese Datenschutzerklärung ist aktuell gültig (Stand: April 2026).
              Durch die Weiterentwicklung unserer Website oder aufgrund geänderter
              gesetzlicher bzw. behördlicher Vorgaben kann es notwendig werden,
              diese Datenschutzerklärung zu ändern. Die jeweils aktuelle Version
              ist jederzeit auf dieser Seite abrufbar.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

// ─── Statische Daten ──────────────────────────────────────────────────────────

const RIGHTS = [
  {
    title: "Auskunftsrecht (Art. 15 DSGVO)",
    description:
      "Sie können Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten verlangen.",
  },
  {
    title: "Recht auf Berichtigung (Art. 16 DSGVO)",
    description:
      "Sie können die Berichtigung unrichtiger oder Vervollständigung unvollständiger Daten verlangen.",
  },
  {
    title: "Recht auf Löschung (Art. 17 DSGVO)",
    description:
      "Sie können die Löschung Ihrer Daten verlangen, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.",
  },
  {
    title: "Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)",
    description:
      "Sie können in bestimmten Situationen die Einschränkung der Verarbeitung Ihrer Daten verlangen.",
  },
  {
    title: "Recht auf Datenübertragbarkeit (Art. 20 DSGVO)",
    description:
      "Sie können verlangen, dass wir Ihnen oder einem anderen Verantwortlichen Ihre Daten in einem gängigen, maschinenlesbaren Format bereitstellen.",
  },
  {
    title: "Widerspruchsrecht (Art. 21 DSGVO)",
    description:
      "Sie können der Verarbeitung Ihrer Daten widersprechen, soweit diese auf Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) beruht.",
  },
  {
    title: "Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)",
    description:
      "Sofern die Verarbeitung auf einer Einwilligung beruht, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen.",
  },
] as const;

// ─── Hilfskomponenten ─────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 pb-10 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
      <h2 className="font-display text-lg font-semibold text-brand-text mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Subsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <h3 className="font-display font-medium text-sm text-brand-text mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}
