import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en", "es"],
  defaultLocale: "de",
  localePrefix: "as-needed", // /de wird zu /, /en bleibt /en, /es bleibt /es
});

export type Locale = (typeof routing.locales)[number];
