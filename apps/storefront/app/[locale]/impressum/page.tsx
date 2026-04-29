/**
 * Impressum – Anbieterkennzeichnung nach § 5 TMG
 *
 * Server Component. Schlichtes, gut lesbares Layout ohne Marketing-UX.
 */

import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "Impressum – Solarzaun & SkyWind",
  description: "Anbieterkennzeichnung gemäß § 5 TMG.",
  robots: { index: false },
};

// ─── Seite ────────────────────────────────────────────────────────────────────

export default function ImpressumPage() {
  return (
    <main className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-brand-muted mb-10">
          <Link href="/" className="hover:text-brand-text transition-colors duration-150">
            Start
          </Link>
          <span>/</span>
          <span className="text-brand-text">Impressum</span>
        </nav>

        <div className="max-w-3xl">
          {/* Seitentitel */}
          <h1 className="font-display text-4xl font-bold text-brand-text mb-2">
            Impressum
          </h1>
          <p className="text-sm text-brand-muted mb-12">
            Anbieterkennzeichnung gemäß § 5 Telemediengesetz (TMG)
          </p>

          {/* ── Angaben zum Unternehmen ─────────────────────────────────────── */}
          <Section title="Angaben gemäß § 5 TMG">
            <p className="text-sm text-brand-text font-medium leading-relaxed">
              WSP-Solarenergie
            </p>
            <p className="text-sm text-brand-muted leading-relaxed">
              Einzelunternehmen<br />
              Inhaber: M. Fauerbach<br />
              Zur Zuckerfabrik 7<br />
              61169 Friedberg (Hessen)<br />
              Deutschland
            </p>
          </Section>

          {/* ── Kontakt ─────────────────────────────────────────────────────── */}
          <Section title="Kontakt">
            <p className="text-sm text-brand-muted leading-relaxed">
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

          {/* ── Vertretungsberechtigte ──────────────────────────────────────── */}
          <Section title="Vertretungsberechtigte Person">
            <p className="text-sm text-brand-muted leading-relaxed">
              M. Fauerbach (Inhaber)
            </p>
          </Section>

          {/* ── Umsatzsteuer ────────────────────────────────────────────────── */}
          <Section title="Umsatzsteuer-Identifikationsnummer">
            <p className="text-sm text-brand-muted leading-relaxed">
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
            </p>
            <p className="text-sm text-brand-text font-medium mt-1">
              DE271884326
            </p>
          </Section>

          {/* ── VerpackG ────────────────────────────────────────────────────── */}
          <Section title="Registrierung gemäß § 9 VerpackG">
            <p className="text-sm text-brand-muted leading-relaxed">
              WSP-Solarenergie ist im Verpackungsregister LUCID registriert:
            </p>
            <p className="text-sm text-brand-text font-medium mt-1">
              DE4388938388847
            </p>
          </Section>

          {/* ── Verantwortlicher für Inhalte ─────────────────────────────────── */}
          <Section title="Verantwortlicher für den Inhalt (§ 18 Abs. 2 MStV)">
            <p className="text-sm text-brand-muted leading-relaxed">
              M. Fauerbach<br />
              Zur Zuckerfabrik 7<br />
              61169 Friedberg (Hessen)
            </p>
          </Section>

          {/* ── Streitbeilegung ─────────────────────────────────────────────── */}
          <Section title="Streitbeilegung">
            <p className="text-sm text-brand-muted leading-relaxed mb-3">
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-text underline underline-offset-2 hover:text-brand-accent transition-colors duration-150"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="text-sm text-brand-muted leading-relaxed">
              Wir sind nicht bereit oder verpflichtet, an
              Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </Section>

          {/* ── Haftungshinweis ─────────────────────────────────────────────── */}
          <Section title="Haftungshinweis">
            <p className="text-sm text-brand-muted leading-relaxed mb-3">
              <strong className="text-brand-text font-medium">Haftung für Inhalte:</strong>{" "}
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene
              Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
              verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
              Diensteanbieter jedoch nicht verpflichtet, übermittelte oder
              gespeicherte fremde Informationen zu überwachen oder nach
              Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
              hinweisen.
            </p>
            <p className="text-sm text-brand-muted leading-relaxed">
              <strong className="text-brand-text font-medium">Haftung für Links:</strong>{" "}
              Unser Angebot enthält Links zu externen Websites Dritter, auf
              deren Inhalte wir keinen Einfluss haben. Deshalb können wir für
              diese fremden Inhalte auch keine Gewähr übernehmen. Für die
              Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
              oder Betreiber der Seiten verantwortlich.
            </p>
          </Section>

          {/* ── Urheberrecht ────────────────────────────────────────────────── */}
          <Section title="Urheberrecht">
            <p className="text-sm text-brand-muted leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
              diesen Seiten unterliegen dem deutschen Urheberrecht. Die
              Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
              Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
              schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

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
