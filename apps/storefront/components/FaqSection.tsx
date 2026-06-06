import { Link } from "@/i18n/navigation";

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqSectionProps {
  items: FaqItem[];
  title: string;
  bg?: "white" | "gray";
  showViewAllLink?: boolean;
}

export function FaqSection({ items, title, bg = "white", showViewAllLink = true }: FaqSectionProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
      <section className={`py-16 sm:py-24 ${bg === "gray" ? "bg-gray-50" : "bg-white"}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-brand-accent uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">{title}</h2>
          </div>
          <div className="space-y-4">
            {items.map((item) => (
              <details key={item.q} className="group border border-gray-100 rounded-2xl p-6 bg-white">
                <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold text-gray-900 pr-4">{item.q}</span>
                  <span className="text-brand-accent flex-shrink-0 text-xl leading-none group-open:rotate-45 transition-transform duration-200">+</span>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed text-sm">{item.a}</p>
              </details>
            ))}
          </div>
          {showViewAllLink && (
            <div className="mt-8 text-center">
              <Link
                href="/faq"
                className="inline-block text-sm font-semibold text-gray-900 border border-gray-200 rounded-xl px-5 py-2.5 hover:border-brand-accent hover:text-brand-accent transition-colors duration-150"
              >
                View All FAQs →
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
