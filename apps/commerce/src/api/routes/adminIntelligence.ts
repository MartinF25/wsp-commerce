import { Hono } from "hono";
import { getPrismaClient } from "../../lib/prisma";
import { requireAdminKey } from "../middleware/requireAdminKey";

export const adminIntelligenceRoutes = new Hono();

adminIntelligenceRoutes.use("*", requireAdminKey);

// ─── GET /overview ────────────────────────────────────────────────────────────

adminIntelligenceRoutes.get("/overview", async (c) => {
  const prisma = getPrismaClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalListings,
    newListingsToday,
    notEnriched,
    notAnalyzed,
    topOpportunities,
    preparedOpportunities,
    priceChanges,
    offlineListings,
    enriched,
    analyzed,
    inDailyReport,
    profitAggregate,
    avgScores,
    knownBrands,
    topBrands,
    withPricing,
    highMarginListings,
    lifecycleOnline,
    lifecycleOffline,
    lifecycleUnknown,
    lastCheck,
    draftProducts,
    activeProducts,
  ] = await Promise.all([
    prisma.marketListing.count(),
    prisma.marketListing.count({ where: { scraped_at: { gte: todayStart } } }),
    prisma.marketListing.count({ where: { enrichedAt: null } }),
    prisma.marketListing.count({ where: { analyzedAt: null } }),
    prisma.marketListing.count({
      where: { dealScore: { gte: 75 }, recommendation: "IMPORT" },
    }),
    prisma.marketListing.count({ where: { opportunityStatus: "prepared" } }),
    prisma.marketListing.count({ where: { priceChanged: true } }),
    prisma.marketListing.count({ where: { sourceStatus: "offline" } }),
    prisma.marketListing.count({ where: { enrichedAt: { not: null } } }),
    prisma.marketListing.count({ where: { analyzedAt: { not: null } } }),
    prisma.marketListing.count({ where: { dailyReportAt: { not: null } } }),
    prisma.marketListing.aggregate({
      _sum: { estimatedGrossProfit: true, suggestedSellingPrice: true },
      where: { estimatedGrossProfit: { not: null } },
    }),
    prisma.marketListing.aggregate({
      _avg: { dataCompletenessScore: true, enrichmentConfidence: true },
      where: { enrichedAt: { not: null } },
    }),
    prisma.marketListing.count({ where: { brand: { not: null } } }),
    prisma.marketListing.groupBy({
      by: ["brand"],
      where: { brand: { not: null } },
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
      take: 5,
    }),
    prisma.marketListing.count({
      where: { suggestedSellingPrice: { not: null } },
    }),
    prisma.marketListing.count({
      where: { estimatedGrossProfit: { gte: 5000 } },
    }),
    prisma.marketListing.count({ where: { sourceStatus: "online" } }),
    prisma.marketListing.count({ where: { sourceStatus: "offline" } }),
    prisma.marketListing.count({ where: { OR: [{ sourceStatus: "unknown" }, { sourceStatus: null }] } }),
    prisma.marketListing.findFirst({
      where: { lastAvailabilityCheckAt: { not: null } },
      orderBy: { lastAvailabilityCheckAt: "desc" },
      select: { lastAvailabilityCheckAt: true },
    }),
    prisma.product.count({ where: { status: "draft" } }),
    prisma.product.count({ where: { status: "active" } }),
  ]);

  const grossProfit = profitAggregate._sum.estimatedGrossProfit ?? 0;
  const totalVk = profitAggregate._sum.suggestedSellingPrice ?? 0;
  const avgMarginPercent =
    totalVk > 0 ? Math.round((grossProfit / totalVk) * 100) : 0;

  const unknownBrands = totalListings - knownBrands;

  // ─── Regelbasierte Empfehlungen ───────────────────────────────────────────

  type Recommendation = {
    level: "high" | "medium" | "low";
    title: string;
    message: string;
    actionLabel: string;
    href: string;
    apiPath?: string;
    apiBody?: Record<string, unknown>;
    apiLabel?: string;
  };

  const recommendations: Recommendation[] = [];

  if (topOpportunities > 0) {
    recommendations.push({
      level: "high",
      title: `${topOpportunities} Top ${topOpportunities === 1 ? "Opportunity" : "Opportunities"} bereit`,
      message: "Diese Listings sollten als Produktentwurf vorbereitet werden.",
      actionLabel: "Zu Opportunities",
      href: "/market/opportunities",
    });
  }

  if (draftProducts > 0) {
    recommendations.push({
      level: "high",
      title: `${draftProducts} ${draftProducts === 1 ? "Entwurf" : "Entwürfe"} zur Freigabe`,
      message: "Produktentwürfe prüfen und aktiv schalten.",
      actionLabel: "Zu Produkten",
      href: "/products",
    });
  }

  if (priceChanges > 0) {
    recommendations.push({
      level: "medium",
      title: `${priceChanges} Preisänderung${priceChanges === 1 ? "" : "en"} erkannt`,
      message: "Preisänderungen prüfen und Angebote neu bewerten.",
      actionLabel: "Markt öffnen",
      href: "/market/dashboard",
    });
  }

  if (notAnalyzed > 5) {
    recommendations.push({
      level: "medium",
      title: `${notAnalyzed} Listings ohne Deal-Score`,
      message: "Daily Report starten – analysiert Listings und erstellt neue Opportunities.",
      actionLabel: "Zu Listings",
      href: "/market",
      apiPath: "/api/admin/market/opportunities/daily-report",
      apiBody: { limit: 25, createDrafts: true },
      apiLabel: "Daily Report starten",
    });
  }

  if (notEnriched > 5) {
    recommendations.push({
      level: "low",
      title: `${notEnriched} Listings nicht angereichert`,
      message: "Knowledge Extractor ausführen – ergänzt Marke, Modell und Produktdaten.",
      actionLabel: "Zu Listings",
      href: "/market",
      apiPath: "/api/admin/market/enrich-batch",
      apiBody: { limit: 200, onlyMissing: true },
      apiLabel: "Jetzt anreichern",
    });
  }

  if (offlineListings > 0) {
    recommendations.push({
      level: "low",
      title: `${offlineListings} offline ${offlineListings === 1 ? "Listing" : "Listings"}`,
      message: "Angebote sind nicht mehr erreichbar. Prüfen und ggf. archivieren.",
      actionLabel: "Markt Dashboard",
      href: "/market/dashboard",
    });
  }

  return c.json({
    data: {
      business: {
        totalListings,
        newListingsToday,
        notEnriched,
        notAnalyzed,
        topOpportunities,
        preparedOpportunities,
        productDrafts: draftProducts,
        activeProducts,
        priceChanges,
        offlineListings,
        estimatedGrossProfit: grossProfit,
      },
      factory: {
        rawListings: totalListings,
        enriched,
        analyzed,
        opportunities: inDailyReport,
        drafts: draftProducts,
        readyForReview: preparedOpportunities,
        online: activeProducts,
      },
      knowledge: {
        avgDataCompletenessScore: Math.round(
          avgScores._avg.dataCompletenessScore ?? 0
        ),
        avgEnrichmentConfidence: Math.round(
          (avgScores._avg.enrichmentConfidence ?? 0) * 100
        ),
        knownBrands,
        unknownBrands,
        topBrands: topBrands.map((b) => ({
          brand: b.brand,
          count: b._count.brand,
        })),
      },
      pricing: {
        avgMarginPercent,
        highMarginListings,
        estimatedGrossProfit: grossProfit,
        withPricing,
        withoutPricing: totalListings - withPricing,
        priceChanges,
      },
      lifecycle: {
        online: lifecycleOnline,
        offline: lifecycleOffline,
        unknown: lifecycleUnknown,
        priceChanged: priceChanges,
        lastCheckAt: lastCheck?.lastAvailabilityCheckAt?.toISOString() ?? null,
      },
      recommendations,
    },
  });
});
