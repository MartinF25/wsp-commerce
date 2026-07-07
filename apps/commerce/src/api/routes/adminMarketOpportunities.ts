import { Hono } from "hono";
import { getPrismaClient } from "../../lib/prisma";
import { runDailyReport, sendDailyReportMail } from "../../services/marketOpportunityAgent";
import { generateMarketProductDraft } from "../../services/marketProductDraftGenerator";
import { resolveProductImageWithDetails, isKleinanzeigenUrl } from "../../services/marketImageResolver";
import { requireAdminKey } from "../middleware/requireAdminKey";
import { computeOpportunityScore } from "../../utils/opportunityScoreUtils";

/**
 * Admin Market Opportunity Routes
 * Direkt in app.ts gemountet mit eigenem requireAdminKey.
 *
 *   POST /daily-report               → Tagesbericht generieren (Opportunities auswählen, bewerten, Drafts erstellen)
 *   GET  /prepared                   → Alle prepared Listings abrufen
 *   PATCH /:listingId/reject         → Listing ablehnen
 *   PATCH /:listingId/restore        → Abgelehntes Listing zurücksetzen
 */
export const adminMarketOpportunityRoutes = new Hono();

adminMarketOpportunityRoutes.use("*", requireAdminKey);

// ─── POST /daily-report ───────────────────────────────────────────────────────

adminMarketOpportunityRoutes.post("/daily-report", async (c) => {
  let body: Record<string, unknown> = {};
  try { body = await c.req.json(); } catch { /* optional body */ }

  const limit = typeof body.limit === "number" ? Math.min(body.limit, 50) : 25;
  const createDrafts = body.createDrafts !== false;
  const sendMail = body.sendMail === true;

  const report = await runDailyReport({ limit, createDrafts });

  if (sendMail) {
    const mailSent = await sendDailyReportMail(report);
    return c.json({ ok: true, data: report, mailSent });
  }

  return c.json({ ok: true, data: report });
});

// ─── GET /prepared ────────────────────────────────────────────────────────────

adminMarketOpportunityRoutes.get("/prepared", async (c) => {
  const prisma = getPrismaClient();

  const listings = await prisma.marketListing.findMany({
    where: {
      opportunityStatus: "prepared",
      productDraftId: { not: null },
    },
    orderBy: [
      { dealScore: "desc" },
      { dailyReportAt: "desc" },
    ],
    take: 100,
  });

  const productIds = listings.map((l) => l.productDraftId!).filter(Boolean);
  const productImages = await prisma.productImage.findMany({
    where: { product_id: { in: productIds }, sort_order: 0 },
    select: { product_id: true, url: true },
  });
  const productImageMap = new Map(productImages.map((img) => [img.product_id, img.url]));

  return c.json({
    data: listings.map((l) => ({
      id: l.id,
      title: l.title,
      keyword: l.keyword,
      productCategory: l.productCategory,
      dealScore: l.dealScore,
      opportunityScore: computeOpportunityScore(l.dealScore, l.dataCompletenessScore, l.price_cents, l.price_negotiable),
      dataCompletenessScore: l.dataCompletenessScore,
      enrichmentConfidence: l.enrichmentConfidence,
      riskLevel: l.riskLevel,
      recommendation: l.recommendation,
      aiComment: l.aiComment,
      brand: l.brand,
      model: l.model,
      purchasePrice: l.purchasePrice,
      markupPercent: l.markupPercent,
      suggestedSellingPrice: l.suggestedSellingPrice,
      estimatedGrossProfit: l.estimatedGrossProfit,
      pricingNote: l.pricingNote,
      opportunityStatus: l.opportunityStatus,
      dailyReportAt: l.dailyReportAt?.toISOString() ?? null,
      productDraftId: l.productDraftId,
      productStatus: l.productStatus,
      listing_url: l.listing_url,
      price_cents: l.price_cents,
      price_negotiable: l.price_negotiable,
      location: l.location,
      image_url: l.image_url,
      productImageUrl: productImageMap.get(l.productDraftId!) ?? null,
      listed_at: l.listed_at?.toISOString() ?? null,
      scraped_at: l.scraped_at.toISOString(),
      sourceStatus: l.sourceStatus,
    })),
    total: listings.length,
  });
});

// ─── POST /:listingId/refresh-image ──────────────────────────────────────────

adminMarketOpportunityRoutes.post("/:listingId/refresh-image", async (c) => {
  const prisma = getPrismaClient();
  const listingId = c.req.param("listingId");

  const listing = await prisma.marketListing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return c.json({ error: { code: "NOT_FOUND", message: "Listing nicht gefunden." } }, 404);
  }
  if (!listing.productDraftId) {
    return c.json({ error: { code: "NO_PRODUCT", message: "Kein Produkt mit diesem Listing verknüpft." } }, 400);
  }

  // If product already has an AI-generated image (e.g. set by n8n), return it immediately.
  const alreadySet = await prisma.productImage.findFirst({
    where: { product_id: listing.productDraftId, sort_order: 0 },
    select: { url: true },
  });
  if (alreadySet) {
    return c.json({ ok: true, imageUrl: alreadySet.url, source: "existing" });
  }

  const category = listing.productCategory ?? listing.keyword ?? "solaranlage";
  const { url: resolved, source, error: imgError } = await resolveProductImageWithDetails(listing, category);

  console.log(`[refresh-image] listing=${listingId} category=${category} source=${source} url=${resolved} error=${imgError}`);

  if (!resolved) {
    return c.json({ ok: false, message: "Kein Bild gefunden.", error: imgError });
  }

  const existing = await prisma.productImage.findFirst({
    where: { product_id: listing.productDraftId, sort_order: 0 },
  });

  if (existing) {
    await prisma.productImage.update({
      where: { id: existing.id },
      data: { url: resolved },
    });
  } else {
    await prisma.productImage.create({
      data: {
        product_id: listing.productDraftId,
        url: resolved,
        alt: listing.title ?? "Produktbild",
        sort_order: 0,
      },
    });
  }

  if (listing.image_url && listing.image_url !== resolved) {
    const hasOriginal = await prisma.productImage.findFirst({
      where: { product_id: listing.productDraftId, sort_order: 1 },
    });
    if (!hasOriginal) {
      await prisma.productImage.create({
        data: {
          product_id: listing.productDraftId,
          url: listing.image_url,
          alt: `${listing.title ?? "Artikel"} – Originalangebot`,
          sort_order: 1,
        },
      }).catch(() => null);
    }
  }

  return c.json({ ok: true, imageUrl: resolved, source });
});

// ─── PATCH /:listingId/reject ─────────────────────────────────────────────────

adminMarketOpportunityRoutes.patch("/:listingId/reject", async (c) => {
  const prisma = getPrismaClient();
  const listingId = c.req.param("listingId");

  let body: Record<string, unknown> = {};
  try { body = await c.req.json(); } catch { /* optional reason */ }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : null;

  const existing = await prisma.marketListing.findUnique({
    where: { id: listingId },
    select: { id: true, opportunityStatus: true },
  });

  if (!existing) {
    return c.json({ error: { code: "NOT_FOUND", message: "Listing nicht gefunden." } }, 404);
  }

  const updated = await prisma.marketListing.update({
    where: { id: listingId },
    data: {
      opportunityStatus: "rejected",
      rejectedAt: new Date(),
      rejectedReason: reason,
    },
    select: {
      id: true,
      opportunityStatus: true,
      rejectedAt: true,
      rejectedReason: true,
    },
  });

  return c.json({ ok: true, data: updated });
});

// ─── PATCH /:listingId/approve ────────────────────────────────────────────────

adminMarketOpportunityRoutes.patch("/:listingId/approve", async (c) => {
  const prisma = getPrismaClient();
  const listingId = c.req.param("listingId");

  const listing = await prisma.marketListing.findUnique({
    where: { id: listingId },
    select: { id: true, productDraftId: true, opportunityStatus: true },
  });

  if (!listing) {
    return c.json({ error: { code: "NOT_FOUND", message: "Listing nicht gefunden." } }, 404);
  }
  if (!listing.productDraftId) {
    return c.json({ error: { code: "NO_PRODUCT", message: "Kein Produktentwurf mit diesem Listing verknüpft." } }, 400);
  }

  const product = await prisma.product.findUnique({
    where: { id: listing.productDraftId },
    select: { id: true, status: true },
  });

  if (!product) {
    return c.json({ error: { code: "PRODUCT_NOT_FOUND", message: "Produktentwurf wurde nicht gefunden." } }, 404);
  }

  await prisma.product.update({
    where: { id: product.id },
    data: { status: "active" },
  });

  await prisma.marketListing.update({
    where: { id: listingId },
    data: { productStatus: "active" },
  });

  return c.json({ ok: true, productId: product.id, productStatus: "active" });
});

// ─── POST /:listingId/refresh-seo ─────────────────────────────────────────────

adminMarketOpportunityRoutes.post("/:listingId/refresh-seo", async (c) => {
  const prisma = getPrismaClient();
  const listingId = c.req.param("listingId");

  const listing = await prisma.marketListing.findUnique({ where: { id: listingId } });

  if (!listing) {
    return c.json({ error: { code: "NOT_FOUND", message: "Listing nicht gefunden." } }, 404);
  }
  if (!listing.productDraftId) {
    return c.json({ error: { code: "NO_PRODUCT", message: "Kein Produktentwurf mit diesem Listing verknüpft." } }, 400);
  }

  const draft = await generateMarketProductDraft(listing);

  const locales = ["de", "en", "es"] as const;
  const productId = listing.productDraftId;

  for (const locale of locales) {
    const t = draft.translations[locale];
    await prisma.productTranslation.upsert({
      where: { product_id_locale: { product_id: productId, locale } },
      update: {
        name: t.name,
        short_description: t.shortDescription,
        description: t.description,
        meta_title: t.metaTitle,
        meta_description: t.metaDescription,
        features: t.technicalData,
      },
      create: {
        product_id: productId,
        locale,
        name: t.name,
        short_description: t.shortDescription,
        description: t.description,
        meta_title: t.metaTitle,
        meta_description: t.metaDescription,
        features: t.technicalData,
        delivery_note: t.availabilityNote,
      },
    });
  }

  return c.json({
    ok: true,
    productId,
    localesUpdated: locales,
    updated: {
      name: draft.translations.de.name,
      metaTitle: draft.translations.de.metaTitle,
      metaDescription: draft.translations.de.metaDescription,
    },
  });
});

// ─── PATCH /:listingId/restore ────────────────────────────────────────────────

adminMarketOpportunityRoutes.patch("/:listingId/restore", async (c) => {
  const prisma = getPrismaClient();
  const listingId = c.req.param("listingId");

  const existing = await prisma.marketListing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });

  if (!existing) {
    return c.json({ error: { code: "NOT_FOUND", message: "Listing nicht gefunden." } }, 404);
  }

  const updated = await prisma.marketListing.update({
    where: { id: listingId },
    data: {
      opportunityStatus: null,
      rejectedAt: null,
      rejectedReason: null,
    },
    select: { id: true, opportunityStatus: true },
  });

  return c.json({ ok: true, data: updated });
});

// ─── POST /batch-refresh-images ───────────────────────────────────────────────
// Findet Produkt-Drafts mit Kleinanzeigen-Bildern oder ohne Bild.
// Generiert für jedes Produkt ein neues DALL-E HD Bild → Cloudinary.
// Limit: max 20 pro Lauf (~10–30 s pro Bild).

adminMarketOpportunityRoutes.post("/batch-refresh-images", async (c) => {
  const prisma = getPrismaClient();

  let body: Record<string, unknown> = {};
  try { body = await c.req.json(); } catch { /* optional */ }

  const limit = typeof body.limit === "number" ? Math.min(body.limit, 20) : 10;
  // mode "ka-images": ersetze KA-Bilder + Produkte ohne Bild
  // mode "no-image": nur Produkte ohne Bild
  const mode = body.mode === "no-image" ? "no-image" : "ka-images";

  const listings = await prisma.marketListing.findMany({
    where: {
      productDraftId: { not: null },
      productStatus: "draft",
    },
    select: {
      id: true,
      productDraftId: true,
      productCategory: true,
      keyword: true,
      title: true,
      brand: true,
      model: true,
      productType: true,
      productSeries: true,
      description: true,
      price_cents: true,
      price_negotiable: true,
      listing_url: true,
      location: true,
      plz: true,
      dealScore: true,
      aiComment: true,
      dataCompletenessScore: true,
      enrichmentConfidence: true,
      enrichmentMetadata: true,
      analyzedAt: true,
      sourceStatus: true,
      scraped_at: true,
      created_at: true,
    },
    take: 200,
  });

  const results: Array<{
    listingId: string;
    productId: string;
    title: string;
    action: string;
    imageUrl: string | null;
    source: string;
    error?: string;
  }> = [];

  let processed = 0;

  for (const l of listings) {
    if (processed >= limit) break;

    const productId = l.productDraftId!;

    const images = await prisma.productImage.findMany({
      where: { product_id: productId },
      orderBy: { sort_order: "asc" },
    });

    const primaryImage = images.find((img) => img.sort_order === 0);
    const primaryUrl = primaryImage?.url ?? null;

    const needsRefresh =
      mode === "no-image"
        ? !primaryUrl
        : !primaryUrl || isKleinanzeigenUrl(primaryUrl);

    if (!needsRefresh) continue;

    processed++;

    const fullListing = {
      id: l.id,
      ad_id: l.id,
      source: "kleinanzeigen",
      keyword: l.keyword,
      title: l.title,
      price_raw: null,
      price_cents: l.price_cents,
      price_negotiable: l.price_negotiable,
      description: l.description ?? null,
      location: l.location ?? null,
      plz: l.plz ?? null,
      listing_url: l.listing_url ?? null,
      image_url: null,
      shipping: null,
      listed_at: null,
      dealScore: l.dealScore ?? null,
      recommendation: null,
      riskLevel: null,
      productCategory: l.productCategory ?? null,
      estimatedMargin: null,
      seoPotential: null,
      aiComment: l.aiComment ?? null,
      analyzedAt: l.analyzedAt ?? null,
      productDraftId: l.productDraftId ?? null,
      productCreatedAt: null,
      productStatus: null,
      sourceStatus: l.sourceStatus ?? null,
      lastAvailabilityCheckAt: null,
      lastKnownPrice: null,
      currentPrice: null,
      priceChanged: false,
      priceChangeAmount: null,
      availabilityNote: null,
      syncStatus: null,
      purchasePrice: null,
      markupPercent: null,
      suggestedSellingPrice: null,
      estimatedGrossProfit: null,
      pricingNote: null,
      opportunityStatus: null,
      dailyReportAt: null,
      rejectedAt: null,
      rejectedReason: null,
      scraped_at: l.scraped_at,
      created_at: l.created_at,
      brand: l.brand ?? null,
      model: l.model ?? null,
      productSeries: l.productSeries ?? null,
      productType: l.productType ?? null,
      subcategory: null,
      dataCompletenessScore: l.dataCompletenessScore ?? null,
      enrichmentConfidence: l.enrichmentConfidence ?? null,
      enrichedAt: null,
      enrichmentMetadata: l.enrichmentMetadata ?? null,
    } as Parameters<typeof resolveProductImageWithDetails>[0];

    const category = (l.productCategory ?? l.keyword ?? "solaranlage") as string;
    const { url, source, error } = await resolveProductImageWithDetails(fullListing, category);

    if (!url) {
      results.push({ listingId: l.id, productId, title: l.title, action: "skipped", imageUrl: null, source, error });
      continue;
    }

    if (primaryImage && isKleinanzeigenUrl(primaryImage.url)) {
      await prisma.productImage.update({ where: { id: primaryImage.id }, data: { url } });
    } else if (!primaryImage) {
      const translation = await prisma.productTranslation.findUnique({
        where: { product_id_locale: { product_id: productId, locale: "de" } },
        select: { name: true },
      });
      await prisma.productImage.create({
        data: { product_id: productId, url, alt: translation?.name ?? l.title, sort_order: 0 },
      });
    }

    // KA-Sekundärbild entfernen
    const secondaryKaImage = images.find((img) => img.sort_order > 0 && isKleinanzeigenUrl(img.url));
    if (secondaryKaImage) {
      await prisma.productImage.delete({ where: { id: secondaryKaImage.id } }).catch(() => null);
    }

    results.push({ listingId: l.id, productId, title: l.title, action: "updated", imageUrl: url, source });

    await new Promise((r) => setTimeout(r, 500));
  }

  return c.json({
    ok: true,
    mode,
    processed,
    updated: results.filter((r) => r.action === "updated").length,
    skipped: results.filter((r) => r.action === "skipped").length,
    results,
  });
});
