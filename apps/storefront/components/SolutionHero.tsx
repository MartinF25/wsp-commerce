import Image from "next/image";
import { Link } from "@/i18n/navigation";

type Props = {
  breadcrumbHome: string;
  breadcrumbLabel: string;
  eyebrow: string;
  h1Line1: string;
  h1Line2: string;
  subline: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
  image: {
    src: string;
    alt: string;
  };
  imageLabel: string;
};

export function SolutionHero({
  breadcrumbHome,
  breadcrumbLabel,
  eyebrow,
  h1Line1,
  h1Line2,
  subline,
  primaryCta,
  primaryHref,
  secondaryCta,
  secondaryHref,
  image,
  imageLabel,
}: Props) {
  return (
    <section className="overflow-hidden border-b border-gray-100 bg-white py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.88fr)] lg:px-8">
        <div>
          <nav className="mb-10 flex items-center gap-2 text-xs text-brand-muted">
            <Link href="/" className="transition-colors duration-150 hover:text-brand-text">
              {breadcrumbHome}
            </Link>
            <span>/</span>
            <span className="text-brand-text">{breadcrumbLabel}</span>
          </nav>
          <p className="mb-5 text-xs font-medium uppercase tracking-widest text-brand-accent">
            {eyebrow}
          </p>
          <h1 className="mb-6 font-display text-5xl font-bold leading-tight text-brand-text sm:text-6xl">
            {h1Line1}
            <br />
            <span className="text-brand-accent">{h1Line2}</span>
          </h1>
          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-brand-muted">{subline}</p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href={primaryHref}
              className="inline-block rounded-xl bg-brand-accent px-9 py-3.5 text-center font-semibold text-white transition-colors duration-150 hover:bg-green-600"
            >
              {primaryCta}
            </Link>
            <Link
              href={secondaryHref}
              className="inline-block rounded-xl border border-gray-200 px-9 py-3.5 text-center font-semibold text-brand-text transition-colors duration-150 hover:border-brand-accent hover:text-brand-accent"
            >
              {secondaryCta}
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-2xl shadow-gray-900/10">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 44vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-6">
              <p className="max-w-sm text-sm font-medium leading-relaxed text-white">{imageLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
