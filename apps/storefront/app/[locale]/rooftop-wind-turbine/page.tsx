import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FaqSection } from "@/components/FaqSection";

const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://webshop.wsp-solarenergie.de";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "rooftop_wind_turbine" });
  const isDE = params.locale === "de";
  const localePrefix = isDE ? "" : `/${params.locale}`;
  const canonicalUrl = `${BASE}${localePrefix}/rooftop-wind-turbine`;

  const title = t("meta_title");
  const description = t("meta_desc");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "x-default": `${BASE}/rooftop-wind-turbine`,
        de: `${BASE}/rooftop-wind-turbine`,
        en: `${BASE}/en/rooftop-wind-turbine`,
        es: `${BASE}/es/rooftop-wind-turbine`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Solarzaun & SkyWind – WSP Solarenergie",
      type: "website",
      images: [{ url: `${BASE}/images/skywind-hero.png`, width: 1200, height: 630, alt: "Rooftop wind turbine SkyWind NG mounted on building roof" }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const FAQ_ITEMS = [
  {
    q: "Can I install a wind turbine on my roof?",
    a: "Yes — roof-mounted wind turbines are a viable option for many properties. The SkyWind NG is specifically designed for building-mounted installation. Before proceeding, we assess your roof structure, height, wind exposure and local planning rules to ensure suitability.",
  },
  {
    q: "Does a rooftop wind turbine cause vibration or structural problems?",
    a: "A well-designed rooftop turbine like the SkyWind NG uses vibration-dampening mounting hardware that minimises structural transmission. Installation is carried out by certified engineers who assess your roof structure beforehand. Vibration and noise are kept within acceptable limits for residential use.",
  },
  {
    q: "How much wind is available on a typical rooftop?",
    a: "Rooftops — particularly ridge lines and flat roof edges — often experience wind speeds 20–30% higher than at ground level, as the building itself creates a wind acceleration effect. This can make rooftop mounting more productive than a ground mast in some locations.",
  },
  {
    q: "What permissions do I need for a rooftop wind turbine?",
    a: "Requirements vary by country and region. In many areas, small rooftop turbines below certain height limits qualify as permitted development without planning permission. We advise on local rules and support permit applications as part of our service.",
  },
  {
    q: "Can I combine a rooftop turbine with rooftop solar panels?",
    a: "Absolutely — this is one of the most effective residential energy combinations. Rooftop solar panels and a small rooftop wind turbine complement each other perfectly, with solar delivering most energy in summer and wind turbines contributing more in winter and on overcast days.",
  },
  {
    q: "How is a rooftop wind turbine connected to my home electricity supply?",
    a: "The SkyWind NG connects to your property's electrical system through an inverter, allowing the generated electricity to be used directly in your home, exported to the grid or stored in a home battery. Our installation team handles the full electrical integration.",
  },
];

export default async function RooftopWindTurbinePage({ params }: Props) {
  const isDE = params.locale === "de";
  const localePrefix = isDE ? "" : `/${params.locale}`;
  const canonicalUrl = `${BASE}${localePrefix}/rooftop-wind-turbine`;

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
              { "@type": "ListItem", position: 3, name: "Rooftop Wind Turbine", item: canonicalUrl },
            ],
          }),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[55vh] sm:min-h-[75vh] flex items-center">
        <Image
          src="/images/skywind-hero.png"
          alt="SkyWind NG rooftop wind turbine mounted on a residential building generating clean electricity"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/20" />
        <div className="relative w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
            <nav className="flex items-center gap-2 text-xs text-white/60 mb-6">
              <Link href="/" className="hover:text-white transition-colors duration-150">Home</Link>
              <span>/</span>
              <Link href="/skywind" className="hover:text-white transition-colors duration-150">SkyWind</Link>
              <span>/</span>
              <span className="text-white/90">Rooftop Wind Turbine</span>
            </nav>
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">
                SkyWind NG · Roof-Mounted Wind Power
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white leading-tight mb-5">
                Rooftop Wind Turbine –<br />
                <span className="text-brand-accent">Wind Power from Above.</span>
              </h1>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8 max-w-xl">
                Install a SkyWind NG on your rooftop and harness the wind that flows over your
                building every day. Compact, quiet and purpose-built for building-mounted
                installation — on pitched roofs, flat roofs and commercial structures.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/kontakt"
                  className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150 text-center"
                >
                  Check My Roof's Suitability
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

      {/* Why Rooftop */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Advantages</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Choose a Rooftop Wind Turbine?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Rooftops are often the most wind-exposed part of a property. Wind accelerates as it
                flows over and around buildings, creating higher average speeds at rooftop level than
                at ground level. This natural acceleration effect means rooftop turbines often out-perform
                equivalent ground-mounted systems.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                The SkyWind NG is engineered specifically for building-mounted use. Its compact
                rotor (1.8 m or 2.5 m diameter) and vibration-dampening mounting system make it
                suitable for residential and commercial rooftops alike. Installation is clean,
                fast and does not require significant structural modification.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Combining a rooftop wind turbine with rooftop solar panels creates a powerful
                dual-source renewable system that generates electricity in more conditions than
                either technology alone — maximising your energy independence and reducing your
                electricity bills throughout the year.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { metric: "+20–30%", label: "Higher wind speed at rooftop vs ground" },
                  { metric: "45 dB", label: "Low noise at 10 m distance" },
                  { metric: "1–2 kW", label: "Rated output options" },
                  { metric: "1–2 days", label: "Typical installation time" },
                ].map((m) => (
                  <div key={m.label} className="bg-gray-50 rounded-xl p-4">
                    <div className="font-display text-2xl font-bold text-brand-accent">{m.metric}</div>
                    <div className="text-xs text-gray-600 mt-1">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="/images/skywind-hero.png"
                alt="Rooftop wind turbine SkyWind NG on a modern residential building with solar panels alongside"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mounting Options */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Installation</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              Rooftop Mounting Options for the SkyWind NG
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
              The SkyWind NG can be installed on a wide range of building types. Our engineers
              assess your roof and recommend the optimal mounting approach.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Pitched Roof Ridge Mount",
                desc: "The ridge of a pitched roof is typically the most wind-exposed point. A ridge-mounted SkyWind NG captures consistent airflow from multiple directions. Suitable for tile, slate and metal roofing.",
              },
              {
                title: "Flat Roof Edge Mount",
                desc: "Flat commercial or residential roofs can host the SkyWind NG on a short ballast-mounted mast near the upwind edge. No roof penetration required in many configurations.",
              },
              {
                title: "Gable Wall Mount",
                desc: "Where the gable end of a building faces prevailing winds, a wall-mounted bracket system can position the turbine to capture maximum energy with minimal visual impact.",
              },
              {
                title: "Parapet or Chimney Mount",
                desc: "Structural parapets or disused chimney stacks can provide an excellent base for rooftop turbine installation, raising the rotor above surrounding obstacles.",
              },
              {
                title: "Commercial Rooftop Mast",
                desc: "For larger commercial buildings, a short freestanding mast anchored to the flat roof provides flexibility in positioning and can be optimised for the prevailing wind direction.",
              },
              {
                title: "Combined Solar + Wind Rooftop",
                desc: "We design integrated rooftop energy systems that position solar panels and a SkyWind NG turbine for maximum combined output — ensuring the turbine does not shade the panels and vice versa.",
              },
            ].map((o) => (
              <div key={o.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">{o.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planning & Permissions */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Planning</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
                Planning and Permissions
              </h2>
              <p className="text-gray-500 mt-4">
                Understanding local regulations is an important step before installing a rooftop
                wind turbine. Requirements vary significantly by country, region and building type.
              </p>
            </div>
            <div className="space-y-6">
              {[
                {
                  title: "Permitted Development",
                  text: "In many European countries, small wind turbines below certain height and noise thresholds qualify as permitted development — meaning no formal planning application is required. We advise you on whether this applies to your property.",
                },
                {
                  title: "Conservation Areas and Listed Buildings",
                  text: "Properties in conservation areas or with listed building status typically require explicit planning permission. We have experience navigating these applications and can guide you through the process.",
                },
                {
                  title: "Noise and Visual Impact",
                  text: "Planning assessments often consider noise levels and visual impact. The SkyWind NG's low noise profile (45 dB(A) at 10 m) and compact form typically make it straightforward to gain approval.",
                },
                {
                  title: "We Handle the Paperwork",
                  text: "Our team reviews local regulations for your specific address and helps prepare any required documentation. We manage the process so you don't have to.",
                },
              ].map((p) => (
                <div key={p.title} className="border-l-2 border-brand-accent pl-6">
                  <h3 className="font-semibold text-gray-900 mb-1">{p.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FaqSection items={FAQ_ITEMS} title="Rooftop Wind Turbine – Common Questions" bg="gray" />

      {/* Internal Links */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Related Pages</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: "/skywind-ng", label: "SkyWind NG Products", desc: "Technical specs and pricing" },
              { href: "/micro-wind-turbine", label: "Micro Wind Turbine", desc: "Compact wind turbine overview" },
              { href: "/small-wind-turbine-for-home", label: "Small Wind Turbine for Home", desc: "Residential wind energy guide" },
              { href: "/hybrid-solar-wind-system", label: "Hybrid Solar Wind System", desc: "Solar + wind combination systems" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="bg-gray-50 border border-gray-100 rounded-xl p-4 hover:border-brand-accent hover:shadow-sm transition-all duration-150">
                <div className="font-semibold text-gray-900 text-sm mb-1">{l.label}</div>
                <div className="text-xs text-gray-500">{l.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Next Step</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Is Your Roof Suitable for a Wind Turbine?
          </h2>
          <p className="text-white/70 leading-relaxed mb-8">
            Tell us about your property and location. We carry out a free rooftop assessment —
            covering wind exposure, structural suitability and planning requirements — and give
            you an honest recommendation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/kontakt" className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150">
              Request Free Roof Assessment
            </Link>
            <Link href="/skywind-ng" className="inline-block border border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:border-white hover:bg-white/10 transition-colors duration-150">
              View SkyWind NG →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
