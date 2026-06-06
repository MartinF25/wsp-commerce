import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FaqSection } from "@/components/FaqSection";

const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://webshop.wsp-solarenergie.de";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "off_grid_wind_turbine" });
  const isDE = params.locale === "de";
  const localePrefix = isDE ? "" : `/${params.locale}`;
  const canonicalUrl = `${BASE}${localePrefix}/off-grid-wind-turbine`;

  const title = t("meta_title");
  const description = t("meta_desc");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "x-default": `${BASE}/off-grid-wind-turbine`,
        de: `${BASE}/off-grid-wind-turbine`,
        en: `${BASE}/en/off-grid-wind-turbine`,
        es: `${BASE}/es/off-grid-wind-turbine`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Solarzaun & SkyWind – WSP Solarenergie",
      type: "website",
      images: [{ url: `${BASE}/images/skywind-hero.png`, width: 1200, height: 630, alt: "Off grid wind turbine SkyWind NG with battery storage system" }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const FAQ_ITEMS = [
  {
    q: "What is an off-grid wind turbine system?",
    a: "An off-grid wind turbine system generates electricity from wind and stores it in batteries, operating independently from the public electricity grid. The SkyWind NG is fully compatible with off-grid configurations, either as a standalone wind system or combined with solar panels for a hybrid off-grid setup.",
  },
  {
    q: "What battery capacity do I need for an off-grid wind turbine?",
    a: "Battery sizing depends on your energy consumption, desired autonomy days and local wind patterns. A typical off-grid setup with a SkyWind NG 2kW turbine might pair with 5–15 kWh of battery capacity. We calculate the optimal system size based on your specific location and energy goals.",
  },
  {
    q: "Can I use a wind turbine for battery charging?",
    a: "Absolutely — wind turbines are excellent for battery charging. The SkyWind NG connects to a charge controller that regulates power into your battery bank, preventing overcharge and maximising battery life. This makes it ideal for remote cabins, off-grid homes and backup power systems.",
  },
  {
    q: "How reliable is an off-grid wind system for continuous power supply?",
    a: "Wind is variable, so a single-source wind system cannot guarantee continuous power. The most reliable off-grid systems combine wind with solar and sufficient battery storage to bridge calm periods. A well-designed hybrid system can achieve 95%+ energy self-sufficiency in most locations.",
  },
  {
    q: "Is an off-grid wind turbine suitable for a remote cabin or holiday home?",
    a: "Yes — off-grid wind turbines are ideal for remote properties without grid access. A SkyWind NG paired with a battery bank can provide reliable electricity for lighting, appliances and communication equipment at locations where grid connection would be prohibitively expensive.",
  },
  {
    q: "What happens when the wind stops in an off-grid system?",
    a: "Your battery storage acts as the buffer during calm periods. A well-designed system includes enough battery capacity to cover your needs during the longest expected calm spells. Adding solar panels dramatically reduces the risk of running out of stored energy, as wind and solar calm periods rarely coincide.",
  },
  {
    q: "Can I add a generator as backup to my off-grid wind system?",
    a: "Yes — a diesel or propane generator can serve as a reliable backup for extended low-wind, low-sun periods. Modern off-grid energy management systems automatically start the backup generator when battery levels fall below a set threshold, providing seamless power continuity.",
  },
];

export default async function OffGridWindTurbinePage({ params }: Props) {
  const isDE = params.locale === "de";
  const localePrefix = isDE ? "" : `/${params.locale}`;
  const canonicalUrl = `${BASE}${localePrefix}/off-grid-wind-turbine`;

  return (
    <main>
      {/* Schema: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: BASE },
              { "@type": "ListItem", position: 2, name: "SkyWind", item: `${BASE}/skywind` },
              { "@type": "ListItem", position: 3, name: "Off Grid Wind Turbine", item: canonicalUrl },
            ],
          }),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[55vh] sm:min-h-[75vh] flex items-center">
        <Image
          src="/images/skywind-hero.png"
          alt="Off grid wind turbine SkyWind NG powering a remote property with battery storage"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/20" />
        <div className="relative w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
            <nav className="flex items-center gap-2 text-xs text-white/60 mb-6">
              <Link href="/" className="hover:text-white transition-colors duration-150">Home</Link>
              <span>/</span>
              <Link href="/skywind" className="hover:text-white transition-colors duration-150">SkyWind</Link>
              <span>/</span>
              <span className="text-white/90">Off Grid Wind Turbine</span>
            </nav>
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">
                SkyWind NG · Off-Grid Energy Independence
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white leading-tight mb-5">
                Off Grid Wind Turbine –<br />
                <span className="text-brand-accent">Complete Energy Independence.</span>
              </h1>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8 max-w-xl">
                The SkyWind NG off-grid wind turbine system gives you reliable electricity
                without depending on the public grid. Combined with battery storage and
                optional solar panels, it delivers 24/7 clean energy — wherever you are.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/kontakt"
                  className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150 text-center"
                >
                  Design My Off-Grid System
                </Link>
                <Link
                  href="/skywind-ng"
                  className="inline-block border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:border-white hover:bg-white/10 transition-colors duration-150 text-center"
                >
                  SkyWind NG Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Off-Grid Works */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">System Overview</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                How an Off-Grid Wind Turbine System Works
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                An off-grid wind turbine system captures kinetic energy from moving air and converts
                it into electrical energy. The SkyWind NG turbine generates AC electricity, which
                is converted and regulated before flowing into a battery bank for storage.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Your battery stores the generated electricity and releases it on demand — powering
                lights, appliances, heating systems and anything else that runs on electricity in
                your home or property. An inverter converts the stored DC battery power back into
                standard AC electricity for use with conventional appliances.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                The key to a reliable off-grid system is combining multiple sources. Pairing the
                SkyWind NG with solar panels creates a hybrid system where wind covers the periods
                solar cannot — winter months, overcast days and night-time — giving you
                continuous, sustainable power throughout the year.
              </p>
              <div className="space-y-3">
                {[
                  { title: "Wind Turbine", desc: "SkyWind NG 1kW or 2kW generates electricity from wind" },
                  { title: "Charge Controller", desc: "Regulates power flow and protects battery from overcharge" },
                  { title: "Battery Bank", desc: "Stores generated electricity for on-demand use" },
                  { title: "Inverter", desc: "Converts stored DC power to AC for home appliances" },
                  { title: "Optional Solar", desc: "PV panels supplement wind for year-round reliability" },
                ].map((c) => (
                  <div key={c.title} className="flex gap-3 items-start">
                    <span className="w-2 h-2 rounded-full bg-brand-accent flex-shrink-0 mt-1.5" />
                    <div>
                      <span className="font-semibold text-gray-900 text-sm">{c.title}:</span>
                      <span className="text-gray-600 text-sm ml-1">{c.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="/images/skywind-hero.png"
                alt="Off-grid wind turbine system diagram showing SkyWind NG, battery storage and solar panel combination"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Applications</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              Who Benefits from an Off-Grid Wind Turbine?
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
              Off-grid wind systems deliver value in a wide range of scenarios — from remote rural
              properties to urban homes seeking energy independence.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Remote Rural Properties",
                desc: "Farms, cottages and holiday properties beyond the reach of affordable grid connection benefit most from off-grid wind. A SkyWind NG with battery storage provides reliable electricity without costly infrastructure.",
              },
              {
                title: "Energy-Independent Homes",
                desc: "Homeowners who want to minimise or eliminate their electricity bills and reduce dependence on grid energy can use an off-grid or near-off-grid system combining wind, solar and battery storage.",
              },
              {
                title: "Emergency and Backup Power",
                desc: "An off-grid wind and battery system serves as resilient backup power during grid outages — keeping critical systems running even when the mains fails. Ideal for properties in areas prone to power cuts.",
              },
              {
                title: "Agricultural Self-Sufficiency",
                desc: "Farms with high energy demand for irrigation, refrigeration and equipment benefit from on-site wind generation. Reducing bought-in electricity directly improves farm profitability.",
              },
              {
                title: "Remote Workspaces",
                desc: "Workshops, studios or commercial premises in off-grid locations can power tools, lighting and communication equipment with a compact off-grid wind turbine system.",
              },
              {
                title: "Eco-Resorts and Glamping",
                desc: "Sustainable tourism businesses operating in remote locations can power accommodation units and communal facilities with off-grid wind and solar — an authentic green credential for eco-conscious guests.",
              },
            ].map((u) => (
              <div key={u.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">{u.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Design */}
      <section className="py-16 sm:py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Our Approach</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              We Design Your Off-Grid System from Scratch
            </h2>
            <p className="text-white/60 mt-4 max-w-2xl mx-auto">
              No two off-grid situations are the same. We analyse your energy needs, wind
              resource and site conditions to design a system that truly delivers.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Energy Audit", text: "We review your consumption patterns and identify which loads to cover." },
              { step: "02", title: "Wind & Site Analysis", text: "We assess wind data, site exposure and optimal turbine positioning." },
              { step: "03", title: "System Sizing", text: "We calculate the right turbine, battery and solar combination for your needs." },
              { step: "04", title: "Installation & Commissioning", text: "Certified partners install and commission your complete off-grid system." },
            ].map((s) => (
              <div key={s.step} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="font-display text-3xl font-bold text-white/20 mb-2">{s.step}</div>
                <div className="font-semibold text-white mb-1">{s.title}</div>
                <div className="text-sm text-white/60">{s.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqSection items={FAQ_ITEMS} title="Off-Grid Wind Turbine – Questions Answered" bg="white" />

      {/* Internal Links */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Related Topics</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: "/skywind-ng", label: "SkyWind NG Products", desc: "Technical specs and pricing" },
              { href: "/hybrid-solar-wind-system", label: "Hybrid Solar Wind System", desc: "Combine solar and wind for maximum output" },
              { href: "/micro-wind-turbine", label: "Micro Wind Turbine Guide", desc: "Small turbine technology overview" },
              { href: "/small-wind-turbine-for-home", label: "Small Wind Turbine for Home", desc: "Residential wind energy guide" },
              { href: "/rooftop-wind-turbine", label: "Rooftop Wind Turbine", desc: "Compact roof-mounted wind power" },
              { href: "/kombiloesungen", label: "Combined Energy Solutions", desc: "Solar, wind and storage systems" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-brand-accent hover:shadow-sm transition-all duration-150">
                <div className="font-semibold text-gray-900 text-sm mb-1">{l.label}</div>
                <div className="text-xs text-gray-500">{l.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Next Step</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Go Off-Grid with Wind Power?
          </h2>
          <p className="text-gray-500 leading-relaxed mb-8">
            Tell us about your location and energy requirements. We design your complete
            off-grid system — wind turbine, battery storage and optional solar — and give
            you a free quote with no obligation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/kontakt" className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150">
              Get Free System Design
            </Link>
            <Link href="/skywind-ng" className="inline-block border border-gray-200 text-gray-900 font-semibold px-8 py-3 rounded-xl hover:border-gray-400 transition-colors duration-150">
              View SkyWind NG →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
