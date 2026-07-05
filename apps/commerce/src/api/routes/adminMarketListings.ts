import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { getPrismaClient } from "../../lib/prisma";
import { analyzeMarketListingDeal } from "../../services/marketDealAnalyzer";
import { generateMarketProductDraft } from "../../services/marketProductDraftGenerator";
import { extractListingKnowledge, extractCoreFields } from "../../services/marketKnowledgeExtractor";
import { requireAdminKey } from "../middleware/requireAdminKey";

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

adminMarketListingRoutes.use("*", requireAdminKey);

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function buildUniqueProductSlug(baseSlug: string) {
  const prisma = getPrismaClient();
  const normalized = slugify(baseSlug || "marktangebot");

  const existing = await prisma.product.findUnique({
    where: { slug: normalized },
    select: { id: true },
  });

  if (!existing) return normalized;

  for (let index = 2; index < 200; index += 1) {
    const candidate = `${normalized}-${index}`;
    const conflict = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!conflict) return candidate;
  }

  return `${normalized}-${Date.now()}`;
}

function resolveDraftProductType(listing: {
  productCategory: string | null;
  keyword: string;
  price_cents: number | null;
  price_negotiable: boolean;
}) {
  const category = (listing.productCategory ?? listing.keyword).toLowerCase();

  if (!listing.price_cents || listing.price_negotiable) {
    return "inquiry_only" as const;
  }

  if (category === "solarspeicher") {
    return "configurable" as const;
  }

  return "inquiry_only" as const;
}

type DraftLocale = "de" | "en" | "es";

const DRAFT_LEGAL_NOTES: Record<DraftLocale, string> = {
  de: "Verfügbarkeit und Zustand werden vor Angebotsbestätigung geprüft.",
  en: "Availability and condition will be verified before order confirmation.",
  es: "La disponibilidad y condición serán verificadas antes de la confirmación del pedido.",
};

const DRAFT_VARIANT_NAMES: Record<DraftLocale, string> = {
  de: "Standard",
  en: "Standard",
  es: "Estándar",
};

const DRAFT_PROJECT_NOTES: Record<string, Record<DraftLocale, string>> = {
  solarzaun: {
    de: "Als Projekt- und Anfrageprodukt angelegt. Bauliche Voraussetzungen, Abmessungen und Zustand werden vor Angebotsbestätigung individuell geprüft.",
    en: "Listed as a project and inquiry product. Structural requirements, dimensions and condition will be individually assessed before order confirmation.",
    es: "Listado como producto de proyecto y consulta. Los requisitos estructurales, dimensiones y condición serán evaluados individualmente antes de la confirmación.",
  },
  solaranlage: {
    de: "Als Set- und Projektangebot angelegt. Auslegung, Komponentenstand und Einsatzort werden vor Angebotsbestätigung geprüft.",
    en: "Listed as a system and project offer. Configuration, component status and installation site will be verified before order confirmation.",
    es: "Listado como oferta de sistema y proyecto. La configuración, estado de los componentes y lugar de instalación serán verificados antes de la confirmación.",
  },
  solarspeicher: {
    de: "Kompatibilität mit Wechselrichter, Batteriesystem und Schutzkonzept vor Angebotsbestätigung prüfen.",
    en: "Compatibility with inverter, battery system and protection concept must be verified before order confirmation.",
    es: "La compatibilidad con el inversor, el sistema de baterías y el concepto de protección deben verificarse antes de la confirmación.",
  },
  skywind: {
    de: "Niedrige Priorität – bereits bestehende SkyWind-Produkte vorhanden. Entwurf zur Weiterbearbeitung.",
    en: "Low priority – existing SkyWind products already available. Draft created for further processing.",
    es: "Baja prioridad – ya existen productos SkyWind. Borrador creado para procesamiento adicional.",
  },
};

const DEFAULT_DRAFT_PROJECT_NOTE: Record<DraftLocale, string> = {
  de: "Produktentwurf für interne Qualifizierung angelegt.",
  en: "Product draft created for internal qualification.",
  es: "Borrador de producto creado para calificación interna.",
};

function buildDraftDeliveryNote(availabilityNote: string, locale: DraftLocale): string {
  const legal = DRAFT_LEGAL_NOTES[locale];
  return availabilityNote.includes(legal) ? availabilityNote : `${availabilityNote} ${legal}`.trim();
}

function resolveProjectNote(category: string | null, tags: string[], locale: DraftLocale = "de"): string {
  const tagLabel = locale === "de" ? "Interne Tags" : locale === "en" ? "Internal tags" : "Etiquetas internas";
  const tagLine = tags.length > 0 ? ` ${tagLabel}: ${tags.join(", ")}.` : "";
  const notes = DRAFT_PROJECT_NOTES[(category ?? "").toLowerCase()] ?? DEFAULT_DRAFT_PROJECT_NOTE;
  return `${notes[locale]}${tagLine}`;
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

const VALID_KEYWORDS = ["skywind", "solarzaun", "solaranlage", "solarspeicher", "wechselrichter", "laderegler", "optimizer", "halterung"];

// Begriffe, die das Hauptprodukt einer Anzeige als für uns irrelevant kennzeichnen
const IRRELEVANT_TITLE_TERMS = [
  "wohnmobil", "wohnwagen", "camper", "caravan", "kastenwagen",
  "wohnhaus", "einfamilienhaus", "doppelhaus", "reihenhaus", "bungalow", "mehrfamilienhaus",
  "grundstück", "baugrundstück", "immobilie", "eigentumswohnung", "mietwohnung",
  "motorrad", "oldtimer", "pkw", "anhänger", "trailer",
  "möbel", "küche", "sofa", "schrank",
];

// Falls der Titel dennoch Solar/Wind erwähnt, behalten wir das Listing
const SOLAR_WIND_INDICATORS = [
  "solar", "pv", "photovoltaik", "wechselrichter", "speicher", "akku",
  "batterie", "windkraft", "windanlage", "skywind", "solarzaun", "laderegler",
];

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

  // Step 3: Inhaltlich irrelevante Listings löschen (Wohnmobile, Häuser, etc.)
  // Nur Listings ohne verknüpften Produktentwurf werden gelöscht.
  const remaining = await prisma.marketListing.findMany({
    where: { productDraftId: null },
    select: { id: true, title: true },
  });

  const irrelevantIds = remaining
    .filter(({ title }) => {
      const lower = title.toLowerCase();
      const hasIrrelevant = IRRELEVANT_TITLE_TERMS.some((t) => lower.includes(t));
      if (!hasIrrelevant) return false;
      const hasSolar = SOLAR_WIND_INDICATORS.some((s) => lower.includes(s));
      return !hasSolar;
    })
    .map(({ id }) => id);

  const { count: irrelevantDeleted } = await prisma.marketListing.deleteMany({
    where: { id: { in: irrelevantIds } },
  });

  return c.json({
    ok: true,
    deleted: invalidDeleted + falsePositivesDeleted + irrelevantDeleted,
    reclassified: toReclassify.length,
    irrelevantDeleted,
  });
});

// ─── DELETE / ────────────────────────────────────────────────────────────────

adminMarketListingRoutes.post("/analyze-deal", async (c) => {
  const prisma = getPrismaClient();
  const body = await c.req.json().catch(() => null) as { marketItemId?: string } | null;
  const marketItemId = body?.marketItemId?.trim();

  if (!marketItemId) {
    return c.json({
      error: { code: "INVALID_BODY", message: "marketItemId ist erforderlich." },
    }, 422);
  }

  const listing = await prisma.marketListing.findUnique({
    where: { id: marketItemId },
  });

  if (!listing) {
    return c.json({
      error: { code: "NOT_FOUND", message: "Market-Anzeige nicht gefunden." },
    }, 404);
  }

  const analysis = await analyzeMarketListingDeal(listing);

  const updated = await prisma.marketListing.update({
    where: { id: listing.id },
    data: {
      dealScore: analysis.dealScore,
      recommendation: analysis.recommendation,
      riskLevel: analysis.riskLevel,
      productCategory: analysis.productCategory,
      estimatedMargin: analysis.estimatedMargin,
      seoPotential: analysis.seoPotential,
      aiComment: analysis.aiComment,
      analyzedAt: new Date(),
    },
  });

  return c.json({ data: updated });
});

adminMarketListingRoutes.post("/create-product-draft", async (c) => {
  const prisma = getPrismaClient();
  const body = await c.req.json().catch(() => null) as { marketItemId?: string } | null;
  const marketItemId = body?.marketItemId?.trim();

  if (!marketItemId) {
    return c.json({
      error: { code: "INVALID_BODY", message: "marketItemId ist erforderlich." },
    }, 422);
  }

  const listing = await prisma.marketListing.findUnique({
    where: { id: marketItemId },
  });

  if (!listing) {
    return c.json({
      error: { code: "NOT_FOUND", message: "Market-Anzeige nicht gefunden." },
    }, 404);
  }

  if (listing.productDraftId) {
    const existingProduct = await prisma.product.findUnique({
      where: { id: listing.productDraftId },
      include: {
        category: true,
        translations: { orderBy: { locale: "asc" } },
        variants: { orderBy: { created_at: "asc" } },
        images: { orderBy: { sort_order: "asc" } },
      },
    });

    if (existingProduct) {
      return c.json({
        data: {
          listing,
          product: existingProduct,
          reused: true,
        },
      });
    }
  }

  const generatedDraft = await generateMarketProductDraft(listing);
  const category = await prisma.category.findUnique({
    where: { slug: generatedDraft.category },
    select: { id: true, slug: true },
  });

  const finalSlug = await buildUniqueProductSlug(generatedDraft.slug);
  const productType = resolveDraftProductType(listing);
  const draftLocales: DraftLocale[] = ["de", "en", "es"];

  const createdProduct = await prisma.product.create({
    data: {
      slug: finalSlug,
      product_type: productType,
      status: "draft",
      availability_status: "on_request",
      category_id: category?.id ?? null,
      translations: {
        create: draftLocales.map((locale) => {
          const t = generatedDraft.translations[locale];
          const deliveryNote = buildDraftDeliveryNote(t.availabilityNote, locale);
          return {
            locale,
            name: t.name,
            short_description: t.shortDescription,
            description: t.description,
            delivery_note: deliveryNote,
            features: t.technicalData,
            meta_title: t.metaTitle,
            meta_description: t.metaDescription,
            mounting_note: deliveryNote,
            project_note: resolveProjectNote(listing.productCategory, generatedDraft.tags, locale),
          };
        }),
      },
    },
    include: {
      category: true,
      translations: { orderBy: { locale: "asc" } },
      variants: { orderBy: { created_at: "asc" } },
      images: { orderBy: { sort_order: "asc" } },
    },
  });

  if (generatedDraft.priceSuggestion > 0) {
    const variant = await prisma.productVariant.create({
      data: {
        product_id: createdProduct.id,
        sku: `${finalSlug.slice(0, 32)}-${createdProduct.id.slice(0, 8)}`,
        price_cents: generatedDraft.priceSuggestion,
        currency: "EUR",
        stock_quantity: 0,
        is_active: true,
      },
    });
    await prisma.productVariantTranslation.createMany({
      data: draftLocales.map((locale) => ({
        variant_id: variant.id,
        locale,
        name: DRAFT_VARIANT_NAMES[locale],
      })),
    });
  }

  const updatedListing = await prisma.marketListing.update({
    where: { id: listing.id },
    data: {
      productDraftId: createdProduct.id,
      productCreatedAt: new Date(),
      productStatus: "draft",
    },
  });

  const product = await prisma.product.findUnique({
    where: { id: createdProduct.id },
    include: {
      category: true,
      translations: { orderBy: { locale: "asc" } },
      variants: { orderBy: { created_at: "asc" } },
      images: { orderBy: { sort_order: "asc" } },
    },
  });

  return c.json({
    data: {
      listing: updatedListing,
      product,
      generatedDraft,
      reused: false,
    },
  }, 201);
});

adminMarketListingRoutes.patch("/:id/product-draft", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null) as { productDraftId?: string | null } | null;

  if (!id) {
    return c.json({
      error: { code: "INVALID_ID", message: "Listing-ID ist erforderlich." },
    }, 422);
  }

  const listing = await prisma.marketListing.findUnique({
    where: { id },
  });

  if (!listing) {
    return c.json({
      error: { code: "NOT_FOUND", message: "Market-Anzeige nicht gefunden." },
    }, 404);
  }

  const productDraftId =
    typeof body?.productDraftId === "string" && body.productDraftId.trim().length > 0
      ? body.productDraftId.trim()
      : null;

  const updated = await prisma.marketListing.update({
    where: { id },
    data: {
      productDraftId,
      productCreatedAt: productDraftId ? new Date() : null,
      productStatus: productDraftId ? "draft" : null,
    },
  });

  return c.json({ data: updated });
});

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

// ─── POST /check-availability ─────────────────────────────────────────────────

const AVAILABILITY_REQUEST_TIMEOUT_MS = 8000;

async function fetchListingAvailability(url: string): Promise<{
  isOnline: boolean;
  currentPriceCents: number | null;
  blocked: boolean;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AVAILABILITY_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; availability-check/1.0)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9",
      },
      redirect: "follow",
    });

    clearTimeout(timer);

    // Captcha / bot-block detection
    if (res.status === 403 || res.status === 429 || res.status === 503) {
      return { isOnline: false, currentPriceCents: null, blocked: true };
    }

    // 404 or 410 → definitively offline
    if (res.status === 404 || res.status === 410) {
      return { isOnline: false, currentPriceCents: null, blocked: false };
    }

    if (!res.ok) {
      return { isOnline: false, currentPriceCents: null, blocked: false };
    }

    const html = await res.text();

    // Kleinanzeigen specific offline signals
    const offlineSignals = [
      "Diese Anzeige wurde bereits",
      "Anzeige nicht mehr",
      "leider nicht mehr",
      "wurde gelöscht",
      "nicht gefunden",
      "404",
    ];
    const lowerHtml = html.toLowerCase();
    const isOffline = offlineSignals.some((signal) => lowerHtml.includes(signal.toLowerCase()));

    if (isOffline) {
      return { isOnline: false, currentPriceCents: null, blocked: false };
    }

    // Captcha detection
    const captchaSignals = ["captcha", "robot", "cloudflare", "challenge"];
    const isBlocked = captchaSignals.some((s) => lowerHtml.includes(s));
    if (isBlocked) {
      return { isOnline: false, currentPriceCents: null, blocked: true };
    }

    // Price extraction: look for patterns like "1.500 €" or "1500 EUR"
    const pricePatterns = [
      /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*€/,
      /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*EUR/i,
      /"price"[^"]*"[^"]*(\d+(?:[.,]\d+)?)"/i,
      /itemprop="price"[^>]*content="(\d+(?:\.\d+)?)"/i,
    ];

    let currentPriceCents: number | null = null;
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        const raw = match[1].replace(/\./g, "").replace(",", ".");
        const num = parseFloat(raw);
        if (!isNaN(num) && num > 0) {
          currentPriceCents = Math.round(num * 100);
          break;
        }
      }
    }

    return { isOnline: true, currentPriceCents, blocked: false };
  } catch (err: unknown) {
    clearTimeout(timer);
    const isAbort = err instanceof Error && err.name === "AbortError";
    return { isOnline: false, currentPriceCents: null, blocked: isAbort };
  }
}

adminMarketListingRoutes.post("/check-availability", async (c) => {
  const prisma = getPrismaClient();
  const body = await c.req.json().catch(() => null) as { marketListingId?: string } | null;
  const marketListingId = body?.marketListingId?.trim();

  if (!marketListingId) {
    return c.json({
      error: { code: "INVALID_BODY", message: "marketListingId ist erforderlich." },
    }, 422);
  }

  const listing = await prisma.marketListing.findUnique({ where: { id: marketListingId } });

  if (!listing) {
    return c.json({ error: { code: "NOT_FOUND", message: "Market-Anzeige nicht gefunden." } }, 404);
  }

  if (!listing.listing_url) {
    const updated = await prisma.marketListing.update({
      where: { id: listing.id },
      data: {
        sourceStatus: "unknown",
        syncStatus: "needs_review",
        lastAvailabilityCheckAt: new Date(),
        availabilityNote: "Kein listing_url vorhanden – manuelle Prüfung erforderlich.",
      },
    });
    return c.json({ data: updated });
  }

  const { isOnline, currentPriceCents, blocked } = await fetchListingAvailability(listing.listing_url);

  const now = new Date();

  if (blocked) {
    const updated = await prisma.marketListing.update({
      where: { id: listing.id },
      data: {
        sourceStatus: "unknown",
        syncStatus: "needs_review",
        lastAvailabilityCheckAt: now,
        availabilityNote: "Abruf blockiert (Captcha / Rate-Limit). Manuelle Prüfung erforderlich.",
      },
    });
    return c.json({ data: updated });
  }

  if (!isOnline) {
    const updated = await prisma.marketListing.update({
      where: { id: listing.id },
      data: {
        sourceStatus: "offline",
        syncStatus: listing.productDraftId ? "needs_review" : "offline",
        lastAvailabilityCheckAt: now,
        availabilityNote: "Anzeige ist nicht mehr erreichbar oder wurde gelöscht.",
      },
    });
    return c.json({ data: updated });
  }

  // Online – check for price change
  let priceChanged = false;
  let priceChangeAmount: number | null = null;
  let syncStatus: "ok" | "needs_review" | "price_changed" = "ok";

  const referencePrice = listing.lastKnownPrice ?? listing.price_cents;
  if (currentPriceCents !== null && referencePrice !== null && currentPriceCents !== referencePrice) {
    priceChanged = true;
    priceChangeAmount = currentPriceCents - referencePrice;
    syncStatus = "price_changed";
  }

  const updated = await prisma.marketListing.update({
    where: { id: listing.id },
    data: {
      sourceStatus: "online",
      syncStatus,
      lastAvailabilityCheckAt: now,
      lastKnownPrice: referencePrice,
      currentPrice: currentPriceCents,
      priceChanged,
      priceChangeAmount: priceChanged ? priceChangeAmount : null,
      availabilityNote: priceChanged
        ? `Preisänderung erkannt: ${referencePrice ? Math.round(referencePrice / 100) : "?"} → ${currentPriceCents ? Math.round(currentPriceCents / 100) : "?"} EUR`
        : null,
    },
  });

  return c.json({ data: updated });
});

// ─── POST /check-availability-batch ──────────────────────────────────────────

adminMarketListingRoutes.post("/check-availability-batch", async (c) => {
  const prisma = getPrismaClient();
  const body = await c.req.json().catch(() => ({})) as {
    limit?: number;
    category?: string;
  };

  const batchLimit = Math.min(Math.max(parseInt(String(body?.limit ?? 25)), 1), 100);
  const category = body?.category?.trim() ?? null;

  const recentThreshold = new Date();
  recentThreshold.setHours(recentThreshold.getHours() - 12);

  const listings = await prisma.marketListing.findMany({
    where: {
      listing_url: { not: null },
      ...(category ? { productCategory: category as never } : {}),
      OR: [
        { lastAvailabilityCheckAt: null },
        { lastAvailabilityCheckAt: { lt: recentThreshold } },
      ],
    },
    orderBy: [
      { dealScore: "desc" },
      { lastAvailabilityCheckAt: "asc" },
    ],
    take: batchLimit,
  });

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const listing of listings) {
    try {
      if (!listing.listing_url) continue;

      const { isOnline, currentPriceCents, blocked } = await fetchListingAvailability(listing.listing_url);
      const now = new Date();

      if (blocked) {
        await prisma.marketListing.update({
          where: { id: listing.id },
          data: {
            sourceStatus: "unknown",
            syncStatus: "needs_review",
            lastAvailabilityCheckAt: now,
            availabilityNote: "Abruf blockiert.",
          },
        });
        results.push({ id: listing.id, status: "blocked" });
      } else if (!isOnline) {
        await prisma.marketListing.update({
          where: { id: listing.id },
          data: {
            sourceStatus: "offline",
            syncStatus: listing.productDraftId ? "needs_review" : "offline",
            lastAvailabilityCheckAt: now,
            availabilityNote: "Anzeige nicht mehr verfügbar.",
          },
        });
        results.push({ id: listing.id, status: "offline" });
      } else {
        let priceChanged = false;
        let priceChangeAmount: number | null = null;
        let syncStatus: "ok" | "needs_review" | "price_changed" = "ok";
        const referencePrice = listing.lastKnownPrice ?? listing.price_cents;

        if (currentPriceCents !== null && referencePrice !== null && currentPriceCents !== referencePrice) {
          priceChanged = true;
          priceChangeAmount = currentPriceCents - referencePrice;
          syncStatus = "price_changed";
        }

        await prisma.marketListing.update({
          where: { id: listing.id },
          data: {
            sourceStatus: "online",
            syncStatus,
            lastAvailabilityCheckAt: now,
            lastKnownPrice: referencePrice,
            currentPrice: currentPriceCents,
            priceChanged,
            priceChangeAmount: priceChanged ? priceChangeAmount : null,
            availabilityNote: priceChanged
              ? `Preisänderung: ${referencePrice ? Math.round(referencePrice / 100) : "?"} → ${currentPriceCents ? Math.round(currentPriceCents / 100) : "?"} EUR`
              : null,
          },
        });
        results.push({ id: listing.id, status: priceChanged ? "price_changed" : "ok" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[check-availability-batch] Fehler bei ${listing.id}:`, message);
      results.push({ id: listing.id, status: "error", error: message });
    }

    // Defensiv: kurze Pause zwischen Requests
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  const summary = results.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return c.json({ ok: true, checked: results.length, summary, results });
});

// ─── POST /enrich ─────────────────────────────────────────────────────────────

adminMarketListingRoutes.post("/enrich", async (c) => {
  const prisma = getPrismaClient();
  const body = await c.req.json().catch(() => null) as { listingId?: string } | null;
  const listingId = body?.listingId?.trim();

  if (!listingId) {
    return c.json({ error: { code: "INVALID_BODY", message: "listingId ist erforderlich." } }, 422);
  }

  const listing = await prisma.marketListing.findUnique({ where: { id: listingId } });

  if (!listing) {
    return c.json({ error: { code: "NOT_FOUND", message: "Market-Anzeige nicht gefunden." } }, 404);
  }

  const extraction = await extractListingKnowledge(listing);
  const core = extractCoreFields(extraction);

  const updated = await prisma.marketListing.update({
    where: { id: listing.id },
    data: {
      brand:                core.brand,
      model:                core.model,
      productSeries:        core.productSeries,
      productType:          core.productType,
      subcategory:          core.subcategory,
      dataCompletenessScore: core.dataCompletenessScore,
      enrichmentConfidence: core.enrichmentConfidence,
      enrichedAt:           new Date(),
      enrichmentMetadata:   extraction as unknown as Prisma.InputJsonValue,
    },
  });

  return c.json({
    data: {
      listing: updated,
      extraction,
      dataCompletenessScore: extraction.dataCompletenessScore,
      dataCompletenessClass: extraction.dataCompletenessClass,
    },
  });
});

// ─── POST /analyze-batch ──────────────────────────────────────────────────────

const ANALYZE_BATCH_DELAY_MS = 300;

adminMarketListingRoutes.post("/analyze-batch", async (c) => {
  const prisma = getPrismaClient();
  const body = await c.req.json().catch(() => ({})) as {
    limit?: number;
    keyword?: string | null;
  };

  const batchLimit = Math.min(Math.max(parseInt(String(body?.limit ?? 50)), 1), 100);
  const keyword    = body?.keyword?.trim() ?? null;

  const where: Record<string, unknown> = {
    enrichedAt: { not: null },
    analyzedAt: null,
  };
  if (keyword) where.keyword = keyword;

  const listings = await prisma.marketListing.findMany({
    where,
    orderBy: [{ dataCompletenessScore: "desc" }, { scraped_at: "desc" }],
    take: batchLimit,
  });

  let succeeded = 0;
  let failed    = 0;
  const errors: Array<{ listingId: string; error: string }> = [];

  for (const listing of listings) {
    try {
      const analysis = await analyzeMarketListingDeal(listing);

      await prisma.marketListing.update({
        where: { id: listing.id },
        data: {
          dealScore:       analysis.dealScore,
          recommendation:  analysis.recommendation,
          riskLevel:       analysis.riskLevel,
          productCategory: analysis.productCategory,
          estimatedMargin: analysis.estimatedMargin,
          seoPotential:    analysis.seoPotential,
          aiComment:       analysis.aiComment,
          analyzedAt:      new Date(),
        },
      });

      succeeded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[analyze-batch] Fehler bei ${listing.id}:`, message);
      errors.push({ listingId: listing.id, error: message });
      failed++;
    }

    await new Promise((resolve) => setTimeout(resolve, ANALYZE_BATCH_DELAY_MS));
  }

  return c.json({
    data: {
      processed: listings.length,
      succeeded,
      failed,
      errors,
    },
  });
});

// ─── POST /enrich-batch ───────────────────────────────────────────────────────

const ENRICH_BATCH_DELAY_MS = 200;

adminMarketListingRoutes.post("/enrich-batch", async (c) => {
  const prisma = getPrismaClient();
  const body = await c.req.json().catch(() => ({})) as {
    limit?: number;
    onlyMissing?: boolean;
    minDataCompleteness?: number | null;
    keyword?: string | null;
  };

  const batchLimit     = Math.min(Math.max(parseInt(String(body?.limit ?? 50)), 1), 200);
  const onlyMissing    = body?.onlyMissing !== false;
  const keyword        = body?.keyword?.trim() ?? null;
  const minScore       = typeof body?.minDataCompleteness === "number" ? body.minDataCompleteness : null;

  // Kandidaten auswählen
  const where: Record<string, unknown> = {};
  if (keyword) where.keyword = keyword;

  if (onlyMissing) {
    where.enrichedAt = null;
  } else if (minScore !== null) {
    where.OR = [
      { enrichedAt: null },
      { dataCompletenessScore: { lt: minScore } },
    ];
  }

  const listings = await prisma.marketListing.findMany({
    where,
    orderBy: [{ dealScore: "desc" }, { scraped_at: "desc" }],
    take: batchLimit,
  });

  let succeeded = 0;
  let failed = 0;
  const errors: Array<{ listingId: string; error: string }> = [];
  const distribution = { complete: 0, good: 0, partial: 0, incomplete: 0 };
  let totalScore = 0;

  for (const listing of listings) {
    try {
      const extraction = await extractListingKnowledge(listing);
      const core = extractCoreFields(extraction);

      await prisma.marketListing.update({
        where: { id: listing.id },
        data: {
          brand:                core.brand,
          model:                core.model,
          productSeries:        core.productSeries,
          productType:          core.productType,
          subcategory:          core.subcategory,
          dataCompletenessScore: core.dataCompletenessScore,
          enrichmentConfidence: core.enrichmentConfidence,
          enrichedAt:           new Date(),
          enrichmentMetadata:   extraction as unknown as Prisma.InputJsonValue,
        },
      });

      succeeded++;
      totalScore += extraction.dataCompletenessScore;
      distribution[extraction.dataCompletenessClass]++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[enrich-batch] Fehler bei ${listing.id}:`, message);
      errors.push({ listingId: listing.id, error: message });
      failed++;
    }

    await new Promise((resolve) => setTimeout(resolve, ENRICH_BATCH_DELAY_MS));
  }

  return c.json({
    data: {
      processed:               listings.length,
      succeeded,
      failed,
      errors,
      avgDataCompletenessScore: succeeded > 0 ? Math.round(totalScore / succeeded) : 0,
      distribution,
    },
  });
});