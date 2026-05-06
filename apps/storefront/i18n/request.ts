import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type SupportedLocale = (typeof routing.locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: SupportedLocale = routing.locales.includes(requested as SupportedLocale)
    ? (requested as SupportedLocale)
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
