import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FaqSection } from "@/components/FaqSection";

const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://webshop.wsp-solarenergie.de";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "small_wind_turbine_home" });
  const isDE = params.locale === "de";
  const localePrefix = isDE ? "" : `/${params.locale}`;
  const canonicalUrl = `${BASE}${localePrefix}/small-wind-turbine-for-home`;

  const title = t("meta_title");
  const description = t("meta_desc");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "x-default": `${BASE}/small-wind-turbine-for-home`,
        de: `${BASE}/small-wind-turbine-for-home`,
        en: `${BASE}/en/small-wind-turbine-for-home`,
        es: `${BASE}/es/small-wind-turbine-for-home`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Solarzaun & SkyWind – WSP Solarenergie",
      type: "website",
      images: [{ url: `${BASE}/images/skywind-hero.png`, width: 1200, height: 630, alt: "Small wind turbine for home installed on residential property" }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const FAQ_ITEMS = [
  {
    q: "What size wind turbine do I need for my home?",
    a: "For most homes, a small wind turbine in the 1–2kW range is a good starting point. The SkyWind NG 1kW suits smaller households or those combining wind with solar; the 2kW model covers more of a typical family's demand. We calculate the optimal size based on your actual energy consumption and site wind data.",
  },
  {
    q: "How much does a small home wind turbine cost?",
    a: "The cost of a small wind turbine for home use depends on the model, mast type and installation requirements. The SkyWind NG is competitively priced in the small turbine market. Contact us for current pricing and a full system quote including installation.",
  },
  {
    q: "How much wind do I need for a home wind turbine?",
    a: "A minimum average wind speed of around 4–5 m/s is generally recommended for a worthwhile installation. The SkyWind NG starts producing at 2.5 m/s, meaning it generates power even in modest winds. We assess your site's wind resource before recommending a system.",
  },
  {
    q: "Can a small wind turbine run my home at night?",
    a: "Wind turbines generate power whenever the wind blows — day or night. Combined with a battery storage system, you can store wind energy generated during the night or at windy periods and use it on demand, reducing your reliance on grid electricity around the clock.",
  },
  {
    q: "How long does it take to install a home wind turbine?",
    a: "Installation of a SkyWind NG typically takes one to two days, depending on the mounting type (rooftop or mast) and site conditions. Our certified installation partners handle the full process — from structural assessment to grid connection.",
  },
  {
    q: "Will a home wind turbine reduce my electricity bill?",
    a: "Yes. Every unit of electricity your turbine produces is one you do not buy from the grid. A well-sited SkyWind NG 1kW can generate 1,500–2,500 kWh per year, which at typical residential electricity prices represents meaningful annual savings. Adding solar panels multiplies the benefit.",
  },
];

export default async function SmallWindTurbineHomePage({ params }: Props) {
  const isDE = params.locale === "de";
  const localePrefix = isDE ? "" : `/${params.locale}`;
  const canonicalUrl = `${BASE}${localePrefix}/small-wind-turbine-for-home`;

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
              { "@type": "ListItem", position: 3, name: "Small Wind Turbine for Home", item: canonicalUrl },
            ],
          }),
        }}
      />


      {/* Hero */}
      <section className="relative overflow-hidden min-h-[55vh] sm:min-h-[75vh] flex items-center">
        <Image
          src="/images/skywind-hero.png"
          alt="Small wind turbine for home use – SkyWind NG mounted on residential property"
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
              <span className="text-white/90">Small Wind Turbine for Home</span>
            </nav>
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-4">
                SkyWind NG · Residential Wind Energy
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white leading-tight mb-5">
                Small Wind Turbine<br />
                <span className="text-brand-accent">for Home.</span><br />
                Generate Your Own Power.
              </h1>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8 max-w-xl">
                The SkyWind NG is a compact, quiet small wind turbine designed for residential use.
                It generates electricity year-round — at night, in winter and on cloudy days when
                solar panels alone are not enough. Available in 1kW and 2kW versions.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/kontakt"
                  className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150 text-center"
                >
                  Get a Free Home Assessment
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

      {/* Trust Bar */}
      <div className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            {[
              { value: "1,500–4,000", unit: "kWh/year", label: "Typical annual output" },
              { value: "45 dB(A)", unit: "@ 10 m", label: "Noise level" },
              { value: "2.5 m/s", unit: "cut-in", label: "Starts in light winds" },
              { value: "2 years", unit: "warranty", label: "Manufacturer guarantee" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display text-xl font-bold text-gray-900">{s.value} <span className="text-sm font-normal text-gray-500">{s.unit}</span></div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Is it Right for Your Home */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Site Suitability</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Is a Small Wind Turbine Right for Your Home?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A small wind turbine for home use delivers real results — but only where the wind
                resource is adequate. Before investing, it is essential to assess your specific
                location. We carry out this assessment at no cost and without obligation.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Homes in semi-rural areas, coastal locations, hilltops or open countryside typically
                have the best wind exposure. Urban and suburban properties can also be suitable,
                particularly if the roofline is exposed and not surrounded by taller buildings or trees.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                The SkyWind NG is engineered to perform in a wide range of wind conditions, with
                a low cut-in speed of 2.5 m/s. If your site averages 4 m/s or more, a turbine
                installation is likely to be worthwhile.
              </p>
              <div className="space-y-3">
                {[
                  "Average wind speed above 4 m/s at roof height",
                  "Open or elevated position with minimal obstruction",
                  "Rooftop, garden mast or outbuilding mounting available",
                  "Interest in year-round renewable energy — not just summer solar",
                ].map((c) => (
                  <div key={c} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-brand-accent font-bold flex-shrink-0 mt-0.5">✓</span>
                    {c}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="/images/skywind-hero.png"
                alt="Small wind turbine for home – SkyWind NG installed beside a residential house with solar panels"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Solar + Wind Combination */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Combination</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              Wind + Solar: The Ideal Home Energy Mix
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
              Solar and wind are natural partners. Each compensates for the other's weaknesses,
              delivering more consistent energy production throughout the year.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Winter Energy Security",
                desc: "Solar output drops significantly in winter. A small wind turbine fills this gap — wind speeds are often highest in autumn and winter, precisely when solar needs backup.",
              },
              {
                title: "Night-time Generation",
                desc: "Solar panels produce nothing at night. Your wind turbine keeps generating whenever the wind blows — ensuring your battery stays topped up and your home draws less from the grid.",
              },
              {
                title: "Higher Self-Sufficiency",
                desc: "Homes combining solar panels with a small wind turbine typically achieve self-sufficiency rates 30–50% higher than those relying on solar alone, especially in northern latitudes.",
              },
              {
                title: "Battery Compatibility",
                desc: "Add a home battery and you can store surplus wind or solar energy for use during calm, cloudy periods. The combination of wind, solar and storage comes close to true energy independence.",
              },
              {
                title: "Solar Fence Integration",
                desc: "Our solar fence generates photovoltaic power from your garden boundary. Paired with a SkyWind NG, you cover both solar and wind energy from a compact residential setup.",
              },
              {
                title: "Single Point of Contact",
                desc: "We design and supply complete home energy systems — wind turbines, solar fences, PV panels and battery storage. One partner, one plan, one installation team.",
              },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">{c.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">Process</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              From Enquiry to Electricity in Four Steps
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Free Site Assessment", text: "We analyse wind data, your property layout and energy goals. No obligation, no cost." },
              { step: "02", title: "System Design", text: "We design your turbine setup — model, mast height, mounting type and any solar or storage integration." },
              { step: "03", title: "Permits & Planning", text: "We advise on planning requirements and help with applications where needed." },
              { step: "04", title: "Professional Installation", text: "Our certified partners install your system safely and commission it for immediate use." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-display font-bold text-brand-accent">{s.step}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqSection items={FAQ_ITEMS} title="Home Wind Turbine Questions Answered" bg="gray" />

      {/* Internal Links */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Explore Further</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: "/skywind-ng", label: "SkyWind NG Product Page", desc: "Specs, pricing and ordering" },
              { href: "/micro-wind-turbine", label: "Micro Wind Turbine Guide", desc: "Technical overview and site requirements" },
              { href: "/rooftop-wind-turbine", label: "Rooftop Wind Turbine", desc: "Roof-mounted installation guide" },
              { href: "/hybrid-solar-wind-system", label: "Hybrid Solar Wind System", desc: "Combine solar and wind at home" },
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
            Ready to Power Your Home with Wind?
          </h2>
          <p className="text-white/70 leading-relaxed mb-8">
            Share your location and energy goals. We will assess your wind resource and recommend
            the right system — at no cost and without any obligation to buy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/kontakt" className="inline-block bg-brand-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors duration-150">
              Get Your Free Assessment
            </Link>
            <Link href="/products" className="inline-block border border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:border-white hover:bg-white/10 transition-colors duration-150">
              Browse All Products →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
