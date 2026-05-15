import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { getPrismaClient } from "../../lib/prisma";
import type { TickerMessage } from "@wsp/contracts";

/**
 * Öffentliche Ticker-Routen
 *
 * GET /api/ticker
 *   Query-Parameter:
 *     scope    – "global" | "product" | "category" | "solution" (Default: "global")
 *     slug     – Produkt-Slug, Kategorie-Slug oder Solution-Slug (scope-abhängig)
 *     locale   – "de" | "en" | "es" (Default: "de")
 *
 * Gibt nur aktive Nachrichten zurück, die im aktuellen Zeitfenster liegen.
 * Locale-Fallback: EN/ES → DE wenn keine Übersetzung vorhanden.
 */
export const tickerRoutes = new Hono();

const VALID_SCOPES = ["global", "product", "category", "solution"] as const;
const VALID_LOCALES = ["de", "en", "es"] as const;

type ValidLocale = (typeof VALID_LOCALES)[number];

tickerRoutes.get("/", async (c) => {
  const prisma = getPrismaClient();
  const now = new Date();

  const rawScope = c.req.query("scope") ?? "global";
  const slug = c.req.query("slug") ?? undefined;
  const rawLocale = c.req.query("locale") ?? "de";

  const scope = VALID_SCOPES.includes(rawScope as (typeof VALID_SCOPES)[number])
    ? (rawScope as (typeof VALID_SCOPES)[number])
    : "global";

  const locale: ValidLocale = VALID_LOCALES.includes(rawLocale as ValidLocale)
    ? (rawLocale as ValidLocale)
    : "de";

  const baseWhere: Prisma.LiveTickerMessageWhereInput = {
    status: "active",
    scope,
    AND: [
      { OR: [{ starts_at: null }, { starts_at: { lte: now } }] },
      { OR: [{ ends_at: null }, { ends_at: { gte: now } }] },
    ],
  };

  if (scope === "product" && slug) {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (product) baseWhere.product_id = product.id;
  } else if (scope === "category" && slug) {
    const category = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
    if (category) baseWhere.category_id = category.id;
  } else if (scope === "solution" && slug) {
    baseWhere.solution_slug = slug;
  }

  const messages = await prisma.liveTickerMessage.findMany({
    where: baseWhere,
    orderBy: [{ priority: "desc" }, { created_at: "desc" }],
    include: { translations: true },
  });

  const resolved: TickerMessage[] = messages.map((msg) => {
    const translation =
      msg.translations.find((t) => t.locale === locale) ??
      msg.translations.find((t) => t.locale === "de");

    return {
      id: msg.id,
      type: msg.type,
      scope: msg.scope,
      product_id: msg.product_id,
      category_id: msg.category_id,
      solution_slug: msg.solution_slug,
      priority: msg.priority,
      starts_at: msg.starts_at?.toISOString() ?? null,
      ends_at: msg.ends_at?.toISOString() ?? null,
      link_href: msg.link_href,
      icon: msg.icon,
      text: translation?.text ?? "",
      link_label: translation?.link_label ?? null,
    };
  });

  return c.json({ data: resolved });
});
