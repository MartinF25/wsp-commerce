import { Hono } from "hono";
import { getPrismaClient } from "../../lib/prisma";
import { runDailyReport, sendDailyReportMail } from "../../services/marketOpportunityAgent";
import { resolveProductImage } from "../../services/marketImageResolver";
import { requireAdminKey } from "../middleware/requireAdminKey";

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

  return c.json({
    data: listings.map((l) => ({
      id: l.id,
      title: l.title,
      keyword: l.keyword,
      productCategory: l.productCategory,
      dealScore: l.dealScore,
      riskLevel: l.riskLevel,
      recommendation: l.recommendation,
      aiComment: l.aiComment,
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
      listed_at: l.listed_at?.toISOString() ?? null,
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

  const category = listing.productCategory ?? listing.keyword ?? "solar-zubehoer";
  const resolved = await resolveProductImage(listing, category, { useDallE: true });
  if (!resolved) {
    return c.json({ ok: false, message: "Kein Herstellerbild gefunden, DALL-E fehlgeschlagen." });
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

  return c.json({ ok: true, imageUrl: resolved });
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
