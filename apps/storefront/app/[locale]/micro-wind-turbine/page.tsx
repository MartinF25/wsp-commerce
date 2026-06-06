import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FaqSection } from "@/components/FaqSection";

const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://webshop.wsp-solarenergie.de";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "micro_wind_turbine" });
  const isDE = params.locale === "de";
  const localePrefix = isDE ? "" : `/${params.locale}`;
  const canonicalUrl = `${BASE}${localePrefix}/micro-wind-turbine`;

  const title = t("meta_title");
  const description = t("meta_desc");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "x-default": `${BASE}/micro-wind-turbine`,
        de: `${BASE}/micro-wind-turbine`,
        en: `${BASE}/en/micro-wind-turbine`,
        es: `${BASE}/es/micro-wind-turbine`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Solarzaun & SkyWind – WSP Solarenergie",
      type: "website",
      images: [{ url: `${BASE}/images/skywind-hero.png`, width: 1200, height: 630, alt: "SkyWind NG micro wind turbine installed on residential property" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const FAQ_ITEMS = [
  {
    q: "What is a micro wind turbine?",
    a: "A micro wind turbine is a small-scale wind energy system typically rated below 5kW. It generates electricity from wind for homes, farms or businesses. The SkyWind NG is available in 1kW and 2kW versions, making it an ideal micro wind turbine for residential and light commercial use.",
  },
  {
    q: "How much electricity does a micro wind turbine produce?",
    a: "Output depends on your site's average wind speed. A SkyWind NG 1kW turbine can produce approximately 1,500–2,500 kWh per year at a site with average wind speeds of 5–6 m/s. The 2kW model produces proportionally more. We always conduct a free site assessment before recommending a system.",
  },
  {
    q: "What wind speed does a micro turbine need to start?",
    a: "The SkyWind NG starts generating electricity from approximately 2.5 m/s (cut-in speed). It reaches rated power at around 10–12 m/s. This low cut-in speed means it can generate energy even in moderate wind conditions, making it effective in many residential locations.",
  },
  {
    q: "Can a micro wind turbine power a house?",
    a: "A single micro wind turbine typically supplements your energy supply rather than covering 100% of your demand. Paired with solar panels and a battery storage system, a micro turbine can significantly reduce your grid dependency. We design hybrid systems to maximise your self-sufficiency.",
  },
  {
    q: "Do I need planning permission for a micro wind turbine?",
    a: "Regulations vary by country and municipality. In many areas, micro wind turbines below certain height limits are permitted development. Our team helps you navigate local planning requirements and supports permit applications where needed.",
  },
  {
    q: "How noisy is a micro wind turbine?",
    a: "Modern micro wind turbines like the SkyWind NG are very quiet. At rated wind speed the sound level is approximately 45 dB(A) at 10 metres – comparable to a quiet conversation. This makes them suitable for residential areas.",
  },
  {
    q: "Can I combine a micro wind turbine with solar panels?",
    a: "Yes – this is highly recommended. Wind and solar complement each other seasonally: solar performs best in summer, while wind often peaks in winter and on overcast days. Together with battery storage, you can achieve very high self-sufficiency rates throughout the year.",
  },
];

export default async function MicroWindTurbinePage({ params }: Props) {
  const isDE = params.locale === "de";
  const localePrefix = isDE ? "" : `/${params.locale}`;
  const canonicalUrl = `${BASE}${localePrefix}/micro-wind-turbine`;

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
              { "@type": "ListItem", position: 3, name: "Micro Wind Turbine", item: canonicalUrl },
            ],
          }),
        }}
      />


      {/* Hero */}
      <section className="relative overflow-hidden min-h-[55vh] sm:min-h-[75vh] flex items-center">
        <Image
          src="/images/skywind-hero.png"
          alt="SkyWind NG micro wind turbine installed on a modern residential property"
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
              <span className="text-white/90">Micro Wind Turbine</span>
            </nav>
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">
                SkyWind NG · Micro Wind Turbine
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white leading-tight mb-5">
                Micro Wind Turbine<br />
                <span className="text-brand-accent">for Home and Business.</span>
              </h1>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8 max-w-xl">
                The SkyWind NG is a compact micro wind turbine engineered for residential and
                commercial sites. Available in 1kW and 2kW output, it generates clean electricity
                year-round — even on overcast days when solar panels produce little power.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/kontakt"
                  className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150 text-center"
                >
                  Request Free Site Assessment
                </Link>
                <Link
                  href="/skywind-ng"
                  className="inline-block border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:border-white hover:bg-white/10 transition-colors duration-150 text-center"
                >
                  View SkyWind NG Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <div className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { number: "2.5 m/s", label: "Cut-in wind speed" },
              { number: "45 dB", label: "Sound level at 10 m" },
              { number: "1–2 kW", label: "Rated output" },
              { number: "2 years", label: "Manufacturer warranty" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl font-bold text-gray-900">{s.number}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What is a Micro Wind Turbine */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Technology</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                What is a Micro Wind Turbine?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A micro wind turbine is a small-scale wind energy generator with a rated output typically
                between 500W and 5kW. Unlike large commercial wind turbines that require open farmland,
                micro turbines are designed for properties with limited space — gardens, rooftops,
                small farms and commercial premises.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                The SkyWind NG represents the next generation of micro wind technology. With a rotor
                diameter of just 1.8 m (1kW model) or 2.5 m (2kW model), it can be installed on a
                roof, a freestanding mast or a building facade. Its low cut-in speed of 2.5 m/s means
                it starts generating power in light winds — far earlier than older turbine designs.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Modern micro wind turbines are significantly quieter than their predecessors. The
                SkyWind NG operates at approximately 45 dB(A) at 10 metres — the level of a quiet
                conversation — making it suitable even in residential areas where noise restrictions apply.
              </p>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="/images/skywind-hero.png"
                alt="SkyWind NG micro wind turbine technical diagram showing rotor and mast dimensions"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Advantages</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              Why Choose a Micro Wind Turbine?
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
              Micro wind turbines fill the energy gap that solar panels leave — particularly in winter
              and on cloudy days. Here is why they make sense for your energy mix.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                number: "01",
                title: "Generates Power Around the Clock",
                desc: "Wind blows day and night, in winter and summer. Unlike solar, a micro wind turbine keeps producing electricity even when the sun is down or hidden behind clouds. This makes it an ideal complement to a photovoltaic system.",
              },
              {
                number: "02",
                title: "Compact Enough for Any Property",
                desc: "With a rotor diameter of just 1.8–2.5 metres, the SkyWind NG fits on residential rooftops, freestanding masts and commercial premises. No large plots of land needed — just a suitable exposed position with good wind exposure.",
              },
              {
                number: "03",
                title: "Low Noise, Low Impact",
                desc: "Modern micro wind turbines are built for residential environments. The SkyWind NG produces around 45 dB(A) at 10 metres — quieter than a normal conversation. Neighbours and local planning authorities will have little cause for concern.",
              },
              {
                number: "04",
                title: "Reduces Grid Dependency",
                desc: "Every kilowatt-hour generated by your micro turbine is one you do not buy from the grid. Over a year, a well-sited SkyWind NG can produce 1,500–4,000 kWh — covering a significant share of a typical household's electricity demand.",
              },
              {
                number: "05",
                title: "Compatible with Battery Storage",
                desc: "Pair your micro wind turbine with a battery storage system and you can use self-generated wind energy at any time of day or night. This is the foundation of a true off-grid or near-off-grid energy setup.",
              },
              {
                number: "06",
                title: "Scalable and Future-Proof",
                desc: "Start with a single SkyWind NG 1kW unit and upgrade later. Combine it with a solar fence, rooftop PV and storage to build a complete renewable energy system tailored to your growing needs.",
              },
            ].map((b) => (
              <div key={b.number} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="font-display text-3xl font-bold text-gray-100 mb-3">{b.number}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Specifications</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                SkyWind NG – Technical Data
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                The SkyWind NG is engineered for reliability in varied wind conditions. Its permanent
                magnet alternator requires minimal maintenance, and its aerodynamic blade design
                maximises energy capture even at low wind speeds.
              </p>
              <div className="space-y-3">
                {[
                  { label: "Models", value: "SkyWind NG 1kW · SkyWind NG 2kW" },
                  { label: "Rated power", value: "1,000 W / 2,000 W" },
                  { label: "Rotor diameter", value: "1.8 m / 2.5 m" },
                  { label: "Cut-in speed", value: "approx. 2.5 m/s" },
                  { label: "Rated wind speed", value: "approx. 10–12 m/s" },
                  { label: "Sound level", value: "approx. 45 dB(A) at 10 m" },
                  { label: "Mast compatibility", value: "Flange mast from 3 m" },
                  { label: "Output", value: "230 V / 50 Hz" },
                  { label: "Operating temp.", value: "−20 °C to +50 °C" },
                  { label: "Warranty", value: "2 years manufacturer warranty" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium text-gray-700">{s.label}</span>
                    <span className="text-sm text-gray-900 font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Ideal Installation Sites</h3>
              <ul className="space-y-4">
                {[
                  { title: "Residential rooftops", desc: "Low-profile mounting on pitched or flat roofs. Ideal for homes in semi-rural or coastal areas with consistent winds above 4 m/s average." },
                  { title: "Freestanding mast", desc: "Install the SkyWind NG on a ground-mounted mast in your garden or on open land. Mast height can be optimised to capture stronger winds above obstacles." },
                  { title: "Farm buildings", desc: "Agricultural premises often benefit from excellent wind exposure. A micro wind turbine on a barn or outbuilding can contribute meaningfully to farm energy supply." },
                  { title: "Commercial premises", desc: "Visible renewable energy generation is increasingly valuable for businesses. A SkyWind NG installation signals sustainability commitment alongside real energy savings." },
                ].map((i) => (
                  <li key={i.title} className="flex gap-3">
                    <span className="text-brand-accent font-bold mt-0.5">✓</span>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{i.title}</div>
                      <div className="text-sm text-gray-600 mt-0.5">{i.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Site Assessment */}
      <section className="py-16 sm:py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Our Approach</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              We Only Recommend Where It Makes Sense
            </h2>
            <p className="text-white/70 leading-relaxed mb-6">
              A micro wind turbine is only worthwhile where the wind resource is sufficient. Before
              recommending a system, we conduct a thorough site assessment — analysing your location,
              surrounding obstacles, average wind speeds and energy goals.
            </p>
            <p className="text-white/70 leading-relaxed mb-8">
              If your site is not suitable for a wind turbine, we will tell you honestly and suggest
              alternatives such as solar panels, a solar fence or battery storage. Our goal is the
              right solution for your situation — not just a sale.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              {[
                { step: "01", title: "Site Assessment", text: "We analyse wind data, obstacles and your energy goals." },
                { step: "02", title: "System Design", text: "We design the optimal micro wind setup for your site." },
                { step: "03", title: "Installation", text: "Professional installation by certified partners." },
              ].map((s) => (
                <div key={s.step} className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <div className="font-display text-3xl font-bold text-white/20 mb-2">{s.step}</div>
                  <div className="font-semibold text-white mb-1">{s.title}</div>
                  <div className="text-sm text-white/60">{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FaqSection items={FAQ_ITEMS} title="Frequently Asked Questions – Micro Wind Turbine" bg="white" />

      {/* Internal Links */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Related Topics</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: "/skywind-ng", label: "SkyWind NG – Product Page", desc: "Technical data, pricing and ordering" },
              { href: "/small-wind-turbine-for-home", label: "Small Wind Turbine for Home", desc: "Residential wind energy guide" },
              { href: "/rooftop-wind-turbine", label: "Rooftop Wind Turbine", desc: "Roof-mounted wind power installation" },
              { href: "/off-grid-wind-turbine", label: "Off Grid Wind Turbine", desc: "Energy independence with wind + battery" },
              { href: "/hybrid-solar-wind-system", label: "Hybrid Solar Wind System", desc: "Combine solar and wind for maximum output" },
              { href: "/blog/how-much-energy-does-a-micro-wind-turbine-produce", label: "How Much Energy Does a Micro Wind Turbine Produce?", desc: "Annual kWh by wind speed — real-world data from European installations." },
              { href: "/blog/category/micro-wind-energy", label: "Micro Wind Energy Guides", desc: "Practical articles, comparisons and installation advice." },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="bg-white border border-gray-100 rounded-xl p-4 hover:border-brand-accent hover:shadow-sm transition-all duration-150"
              >
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
            Is a Micro Wind Turbine Right for Your Site?
          </h2>
          <p className="text-gray-500 leading-relaxed mb-8">
            Tell us about your location and energy goals. We assess your wind resource and give you
            an honest recommendation — free of charge and without obligation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/kontakt"
              className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150"
            >
              Request Free Assessment
            </Link>
            <Link
              href="/skywind-ng"
              className="inline-block border border-gray-200 text-gray-900 font-semibold px-8 py-3 rounded-xl hover:border-gray-400 transition-colors duration-150"
            >
              View SkyWind NG Products →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
