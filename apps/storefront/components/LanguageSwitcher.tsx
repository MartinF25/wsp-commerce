"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  de: "DE",
  en: "EN",
  es: "ES",
};

const LOCALE_FLAGS: Record<string, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
  es: "🇪🇸",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(pathname, { locale: e.target.value });
  }

  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-2 text-sm" aria-hidden>
        {LOCALE_FLAGS[locale]}
      </span>
      <select
        value={locale}
        onChange={handleChange}
        className="appearance-none pl-7 pr-5 py-1 text-xs font-semibold text-brand-muted bg-transparent border border-gray-200 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent cursor-pointer transition-colors duration-150"
        aria-label="Sprache wechseln"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-1.5 text-gray-400 text-[10px]">▾</span>
    </div>
  );
}
