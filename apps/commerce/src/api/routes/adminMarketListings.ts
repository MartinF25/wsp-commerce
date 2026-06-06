import { Hono } from "hono";
import { getPrismaClient } from "../../lib/prisma";

/**
 * Admin Market-Listing Routen – Kleinanzeigen Marktbeobachtung
 *
 * Alle Routen unter /api/admin/market-listings.
 * Geschützt durch X-Admin-Key Middleware in admin.ts.
 *
 *   GET  /          → Liste aller Listings + Preis-KPIs
 *   POST /bulk      → Batch-Upsert von n8n (upsert by ad_id)
 *   DELETE /        → Alle Listings älter als N Tage löschen
 */
export const adminMarketListingRoutes = new Hono();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePrice(raw: string | null | undefined): {
  price_cents: number | null;
  price_negotiable: boolean;
} {
  if (!raw || raw.trim() === "") return { price_cents: null, price_negotiable: false };

  const negotiable = /\bVB\b/i.test(raw);

  // "1.500 € VB" → remove thousands dots, strip non-numeric except comma/dot
  const cleaned = raw
    .replace(/\./g, "")   // Tausender-Punkt entfernen
    .replace(",", ".")    // Dezimal-Komma → Punkt
    .replace(/[^0-9.]/g, ""); // alles außer Ziffern und Punkt entfernen

  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return { price_cents: null, price_negotiable: negotiable };

  return { price_cents: Math.round(num * 100), price_negotiable: negotiable };
}

function parseListedAt(dateStr: string | null | undefined, now: Date): Date | null {
  if (!dateStr) return null;

  const lower = dateStr.toLowerCase().trim();
  const timeMatch = dateStr.match(/(\d{2}):(\d{2})/);

  if (lower.startsWith("heute")) {
    const d = new Date(now);
    if (timeMatch) d.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
    return d;
  }

  if (lower.startsWith("gestern")) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    if (timeMatch) d.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
    return d;
  }

  // "DD.MM.YYYY"
  const germanDate = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (germanDate) {
    return new Date(`${germanDate[3]}-${germanDate[2]}-${germanDate[1]}T12:00:00.000Z`);
  }

  // ISO fallback
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// ─── GET / ───────────────────────────────────────────────────────────────────

adminMarketListingRoutes.get("/", async (c) => {
  const prisma = getPrismaClient();

  const source = c.req.query("source") ?? "kleinanzeigen";
  const keyword = c.req.query("keyword") ?? "skywind";
  const limit = Math.min(parseInt(c.req.query("limit") ?? "200"), 500);

  const [listings, stats] = await Promise.all([
    prisma.marketListing.findMany({
      where: { source, keyword },
      orderBy: { listed_at: "desc" },
      take: limit,
    }),
    prisma.marketListing.aggregate({
      where: { source, keyword },
      _count: { id: true },
      _avg: { price_cents: true },
      _min: { price_cents: true },
      _max: { price_cents: true },
    }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newToday = listings.filter(
    (l) => l.listed_at && new Date(l.listed_at) >= today
  ).length;

  const withPrice = listings.filter((l) => l.price_cents !== null).length;

  return c.json({
    data: listings,
    stats: {
      total: stats._count.id,
      avg_price_cents: stats._avg.price_cents ? Math.round(stats._avg.price_cents) : null,
      min_price_cents: stats._min.price_cents,
      max_price_cents: stats._max.price_cents,
      new_today: newToday,
      with_price: withPrice,
    },
  });
});

// ─── POST /bulk ───────────────────────────────────────────────────────────────

adminMarketListingRoutes.post("/bulk", async (c) => {
  const prisma = getPrismaClient();

  const raw = await c.req.text().catch(() => "");

  let body: unknown = null;

  // First parse: handles normal JSON or double-encoded JSON string
  try { body = JSON.parse(raw); } catch { /* not valid JSON */ }

  // n8n double-encodes: JSON.parse gives a string like '={"listings":[...]}'
  if (typeof body === "string") {
    const inner = body.startsWith("=") ? body.slice(1) : body;
    try { body = JSON.parse(inner); } catch { body = null; }
  }

  // n8n raw mode may also send plain '={"listings":[...]}' without outer quotes
  if (body === null && raw.startsWith("=")) {
    try { body = JSON.parse(raw.slice(1)); } catch { /* not valid JSON */ }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = Array.isArray(body) ? body : (body as any)?.listings;
  if (!Array.isArray(listings)) {
    return c.json({ error: { code: "INVALID_BODY", message: 'Body muss { listings: [...] } enthalten.', received: raw.substring(0, 200) } }, 422);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const source: string = (Array.isArray(body) ? "kleinanzeigen" : ((body as any)?.source ?? "kleinanzeigen")).toLowerCase().trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keyword: string = (Array.isArray(body) ? "skywind" : ((body as any)?.keyword ?? "skywind")).toLowerCase().trim();

  const _listings = listings as Array<{
      adId?: string;
      id?: string;
      title?: string;
      price?: string;
      description?: string;
      location?: string;
      plz?: string | number;
      date?: string;
      url?: string;
      image?: string;
      shipping?: string;
    }>;

  const now = new Date();
  let upserted = 0;
  let skipped = 0;

  for (const item of _listings) {
    const adId = String(item.adId ?? item.id ?? "").trim();
    if (!adId || !item.title) { skipped++; continue; }

    const { price_cents, price_negotiable } = parsePrice(item.price);
    const listed_at = parseListedAt(item.date ?? null, now);

    await prisma.marketListing.upsert({
      where: { ad_id: adId },
      update: {
        source,
        keyword,
        title: item.title,
        price_raw: item.price ?? null,
        price_cents,
        price_negotiable,
        description: item.description ?? null,
        location: item.location ?? null,
        plz: item.plz != null ? String(item.plz) : null,
        listing_url: item.url ?? null,
        image_url: item.image ?? null,
        shipping: item.shipping ?? null,
        // listed_at only set if we have a value; keeps original date on re-scrape
        ...(listed_at !== null ? { listed_at } : {}),
        scraped_at: now,
      },
      create: {
        ad_id: adId,
        source,
        keyword,
        title: item.title,
        price_raw: item.price ?? null,
        price_cents,
        price_negotiable,
        description: item.description ?? null,
        location: item.location ?? null,
        plz: item.plz != null ? String(item.plz) : null,
        listing_url: item.url ?? null,
        image_url: item.image ?? null,
        shipping: item.shipping ?? null,
        listed_at,
        scraped_at: now,
      },
    });
    upserted++;
  }

  return c.json({ ok: true, upserted, skipped });
});

// ─── POST /cleanup ───────────────────────────────────────────────────────────

const VALID_KEYWORDS = ["skywind", "solarzaun", "solaranlage", "solarspeicher"];

adminMarketListingRoutes.post("/cleanup", async (c) => {
  const prisma = getPrismaClient();

  // 1. Delete listings whose keyword is not in the valid set
  const { count: invalidDeleted } = await prisma.marketListing.deleteMany({
    where: { keyword: { notIn: VALID_KEYWORDS } },
  });

  // 2. For remaining listings: check if the keyword appears in title or description.
  //    Brand-name keywords (e.g. "skywind") are often absent from titles on Kleinanzeigen,
  //    so we also check the description before treating a listing as a false positive.
  //    - keyword found in title or description → keep (correctly classified)
  //    - different valid keyword found in title → re-classify
  //    - no valid keyword found in title or description → delete (false positive)
  const all = await prisma.marketListing.findMany({
    select: { id: true, keyword: true, title: true, description: true },
  });

  const toDelete: string[] = [];
  const toReclassify: Array<{ id: string; keyword: string }> = [];

  for (const listing of all) {
    const lowerTitle = listing.title.toLowerCase();
    const lowerDesc = (listing.description ?? "").toLowerCase();
    const kw = listing.keyword.toLowerCase();

    if (lowerTitle.includes(kw) || lowerDesc.includes(kw)) continue; // correctly classified

    const matchInTitle = VALID_KEYWORDS.find((k) => lowerTitle.includes(k));
    if (matchInTitle) {
      toReclassify.push({ id: listing.id, keyword: matchInTitle });
    } else {
      toDelete.push(listing.id); // no valid keyword in title or description → false positive
    }
  }

  const { count: falsePositivesDeleted } = await prisma.marketListing.deleteMany({
    where: { id: { in: toDelete } },
  });

  for (const { id, keyword } of toReclassify) {
    await prisma.marketListing.update({ where: { id }, data: { keyword } });
  }

  return c.json({
    ok: true,
    deleted: invalidDeleted + falsePositivesDeleted,
    reclassified: toReclassify.length,
  });
});

// ─── DELETE / ────────────────────────────────────────────────────────────────

adminMarketListingRoutes.delete("/", async (c) => {
  const prisma = getPrismaClient();

  const olderThanDays = parseInt(c.req.query("olderThanDays") ?? "90");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { count } = await prisma.marketListing.deleteMany({
    where: { scraped_at: { lt: cutoff } },
  });

  return c.json({ ok: true, deleted: count });
});
