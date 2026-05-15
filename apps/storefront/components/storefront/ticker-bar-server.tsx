import { getTranslations } from "next-intl/server";
import { fetchTicker } from "@/lib/catalog";
import { TickerBarClient } from "./ticker-bar";

interface TickerBarServerProps {
  locale: string;
  scope?: "global" | "product" | "category" | "solution";
  slug?: string;
}

/**
 * Server Component: holt aktive Ticker-Nachrichten und übergibt sie an den Client.
 * Fallback auf statischen i18n-Text wenn keine Nachrichten vorhanden.
 * Fetch wird 60s gecacht (ISR) – kein Polling, kein WebSocket.
 */
export async function TickerBarServer({ locale, scope = "global", slug }: TickerBarServerProps) {
  const t = await getTranslations({ locale, namespace: "ticker" });
  const messages = await fetchTicker(scope, slug, locale);

  return (
    <TickerBarClient
      messages={messages}
      fallbackText={t("fallback")}
    />
  );
}
