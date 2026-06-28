import type { MarketListing, MarketProductCategory } from "@prisma/client";
import { getPrismaClient } from "../lib/prisma";
import { analyzeMarketListingDeal } from "./marketDealAnalyzer";
import { generateMarketProductDraft } from "./marketProductDraftGenerator";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpportunityProfit {
  purchasePrice: number;
  markupPercent: number;
  suggestedSellingPrice: number;
  estimatedGrossProfit: number;
  pricingNote: string;
}

export interface OpportunityItem {
  listingId: string;
  title: string;
  category: string | null;
  dealScore: number;
  riskLevel: string | null;
  purchasePrice: number;
  suggestedSellingPrice: number;
  estimatedGrossProfit: number;
  pricingNote: string;
  sourceUrl: string | null;
  productDraftId: string | null;
  aiComment: string | null;
  location: string | null;
  draftCreated: boolean;
  draftError: string | null;
}

export interface DailyReportResult {
  date: string;
  totalAnalyzed: number;
  totalSkipped: number;
  draftsCreated: number;
  topOpportunities: OpportunityItem[];
  errors: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ELIGIBLE_CATEGORIES: MarketProductCategory[] = ["solarspeicher", "solarzaun", "solaranlage", "skywind"];
const MARKUP_PERCENT = 40;
const MIN_DEAL_SCORE = 55;

function calculateProfit(priceCents: number): OpportunityProfit {
  const suggestedSellingPrice = Math.round(priceCents * 1.4);
  const estimatedGrossProfit = suggestedSellingPrice - priceCents;

  return {
    purchasePrice: priceCents,
    markupPercent: MARKUP_PERCENT,
    suggestedSellingPrice,
    estimatedGrossProfit,
    pricingNote: `EK ${Math.round(priceCents / 100)} EUR + ${MARKUP_PERCENT}% Aufschlag = VK ${Math.round(suggestedSellingPrice / 100)} EUR`,
  };
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

async function buildUniqueProductSlug(baseSlug: string): Promise<string> {
  const prisma = getPrismaClient();
  const normalized = slugify(baseSlug || "marktangebot");

  const existing = await prisma.product.findUnique({
    where: { slug: normalized },
    select: { id: true },
  });
  if (!existing) return normalized;

  for (let i = 2; i < 200; i++) {
    const candidate = `${normalized}-${i}`;
    const conflict = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!conflict) return candidate;
  }
  return `${normalized}-${Date.now()}`;
}

function resolveDraftProductType(listing: Pick<MarketListing, "productCategory" | "keyword" | "price_cents" | "price_negotiable">) {
  if (!listing.price_cents || listing.price_negotiable) return "inquiry_only" as const;
  const category = (listing.productCategory ?? listing.keyword).toLowerCase();
  if (category === "solarspeicher") return "configurable" as const;
  return "inquiry_only" as const;
}

function resolveProjectNote(category: string | null, tags: string[]): string {
  const tagLine = tags.length > 0 ? ` Interne Tags: ${tags.join(", ")}.` : "";
  switch ((category ?? "").toLowerCase()) {
    case "solarzaun":
      return `Als Projekt- und Anfrageprodukt angelegt. Bauliche Voraussetzungen, Abmessungen und Zustand werden vor Angebotsbestaetigung individuell geprueft.${tagLine}`;
    case "solaranlage":
      return `Als Set- und Projektangebot angelegt. Auslegung, Komponentenstand und Einsatzort werden vor Angebotsbestaetigung geprueft.${tagLine}`;
    case "solarspeicher":
      return `Kompatibilitaet mit Wechselrichter, Batteriesystem und Schutzkonzept vor Angebotsbestaetigung pruefen.${tagLine}`;
    default:
      return `Produktentwurf fuer interne Qualifizierung angelegt.${tagLine}`;
  }
}

// ─── Core Agent Functions ─────────────────────────────────────────────────────

async function selectCandidates(limit: number): Promise<MarketListing[]> {
  const prisma = getPrismaClient();

  return prisma.marketListing.findMany({
    where: {
      dealScore: { gte: MIN_DEAL_SCORE },
      recommendation: { in: ["IMPORT", "REVIEW"] },
      productCategory: { in: ELIGIBLE_CATEGORIES },
      productDraftId: null,
      opportunityStatus: { not: "rejected" },
      sourceStatus: { not: "offline" },
    },
    orderBy: [
      { dealScore: "desc" },
      { listed_at: "desc" },
    ],
    take: limit,
  });
}

async function analyzeIfNeeded(listing: MarketListing): Promise<MarketListing> {
  if (listing.analyzedAt && listing.dealScore !== null) return listing;

  const prisma = getPrismaClient();
  const result = await analyzeMarketListingDeal(listing);

  return prisma.marketListing.update({
    where: { id: listing.id },
    data: {
      dealScore: result.dealScore,
      recommendation: result.recommendation,
      riskLevel: result.riskLevel,
      productCategory: result.productCategory,
      estimatedMargin: result.estimatedMargin,
      seoPotential: result.seoPotential,
      aiComment: result.aiComment,
      analyzedAt: new Date(),
    },
  });
}

async function createDraftForListing(
  listing: MarketListing,
  profit: OpportunityProfit,
): Promise<{ productDraftId: string }> {
  const prisma = getPrismaClient();

  const generatedDraft = await generateMarketProductDraft(listing);
  const category = await prisma.category.findUnique({
    where: { slug: generatedDraft.category },
    select: { id: true },
  });

  const finalSlug = await buildUniqueProductSlug(generatedDraft.slug);
  const productType = resolveDraftProductType(listing);
  const legalNote = "Verfuegbarkeit und Zustand werden vor Angebotsbestaetigung geprueft.";
  const deliveryNote = generatedDraft.availabilityNote.includes(legalNote)
    ? generatedDraft.availabilityNote
    : `${generatedDraft.availabilityNote} ${legalNote}`.trim();

  const createdProduct = await prisma.product.create({
    data: {
      slug: finalSlug,
      product_type: productType,
      status: "draft",
      availability_status: "on_request",
      category_id: category?.id ?? null,
      translations: {
        create: [
          {
            locale: "de",
            name: generatedDraft.name,
            short_description: generatedDraft.shortDescription,
            description: generatedDraft.description,
            delivery_note: deliveryNote,
            features: generatedDraft.technicalData,
            meta_title: generatedDraft.metaTitle,
            meta_description: generatedDraft.metaDescription,
            mounting_note: deliveryNote,
            project_note: resolveProjectNote(listing.productCategory, generatedDraft.tags),
          },
        ],
      },
    },
  });

  if (profit.suggestedSellingPrice > 0) {
    await prisma.productVariant.create({
      data: {
        product_id: createdProduct.id,
        sku: `${finalSlug.slice(0, 32)}-${createdProduct.id.slice(0, 8)}`,
        price_cents: profit.suggestedSellingPrice,
        currency: "EUR",
        stock_quantity: 0,
        is_active: true,
      },
    });
  }

  if (listing.image_url) {
    await prisma.productImage.create({
      data: {
        product_id: createdProduct.id,
        url: listing.image_url,
        alt: generatedDraft.name,
        sort_order: 0,
      },
    }).catch(() => null);
  }

  await prisma.marketListing.update({
    where: { id: listing.id },
    data: {
      productDraftId: createdProduct.id,
      productCreatedAt: new Date(),
      productStatus: "draft",
    },
  });

  return { productDraftId: createdProduct.id };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function runDailyReport(options: {
  limit?: number;
  createDrafts?: boolean;
}): Promise<DailyReportResult> {
  const { limit = 25, createDrafts = true } = options;
  const prisma = getPrismaClient();
  const now = new Date();
  const errors: string[] = [];
  const topOpportunities: OpportunityItem[] = [];
  let totalAnalyzed = 0;
  let totalSkipped = 0;
  let draftsCreated = 0;

  const candidates = await selectCandidates(limit);

  for (const rawListing of candidates) {
    try {
      let listing = rawListing;

      if (!listing.analyzedAt) {
        listing = await analyzeIfNeeded(listing);
        totalAnalyzed++;
      }

      const score = listing.dealScore ?? 0;
      if (score < MIN_DEAL_SCORE || !listing.recommendation || !["IMPORT", "REVIEW"].includes(listing.recommendation)) {
        totalSkipped++;
        continue;
      }

      if (!listing.price_cents || listing.price_negotiable) {
        totalSkipped++;
        continue;
      }

      const profit = calculateProfit(listing.price_cents);
      let productDraftId = listing.productDraftId;
      let draftCreated = false;
      let draftError: string | null = null;

      if (createDrafts && !productDraftId) {
        try {
          const result = await createDraftForListing(listing, profit);
          productDraftId = result.productDraftId;
          draftCreated = true;
          draftsCreated++;
          await new Promise((r) => setTimeout(r, 200));
        } catch (e) {
          draftError = (e as Error).message;
          errors.push(`Draft-Fehler für ${listing.id}: ${draftError}`);
        }
      }

      await prisma.marketListing.update({
        where: { id: listing.id },
        data: {
          purchasePrice: profit.purchasePrice,
          markupPercent: profit.markupPercent,
          suggestedSellingPrice: profit.suggestedSellingPrice,
          estimatedGrossProfit: profit.estimatedGrossProfit,
          pricingNote: profit.pricingNote,
          opportunityStatus: "prepared",
          dailyReportAt: now,
        },
      });

      topOpportunities.push({
        listingId: listing.id,
        title: listing.title,
        category: listing.productCategory,
        dealScore: score,
        riskLevel: listing.riskLevel,
        purchasePrice: profit.purchasePrice,
        suggestedSellingPrice: profit.suggestedSellingPrice,
        estimatedGrossProfit: profit.estimatedGrossProfit,
        pricingNote: profit.pricingNote,
        sourceUrl: listing.listing_url,
        productDraftId,
        aiComment: listing.aiComment,
        location: listing.location,
        draftCreated,
        draftError,
      });
    } catch (e) {
      errors.push(`Listing ${rawListing.id}: ${(e as Error).message}`);
    }
  }

  topOpportunities.sort((a, b) => b.dealScore - a.dealScore);

  return {
    date: now.toISOString().split("T")[0],
    totalAnalyzed,
    totalSkipped,
    draftsCreated,
    topOpportunities,
    errors,
  };
}

// ─── Mail Helper (Resend) ─────────────────────────────────────────────────────

export async function sendDailyReportMail(report: DailyReportResult): Promise<boolean> {
  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
  if (!apiKey) return false;

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const to = process.env.LEAD_TO_EMAIL ?? "verkauf@wsp-solarenergie.de";
  const date = new Date(report.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  const rows = report.topOpportunities.map((op) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${op.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${op.category ?? "–"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:700;color:${op.dealScore >= 80 ? "#166534" : "#92400e"}">${op.dealScore}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${Math.round(op.purchasePrice / 100).toLocaleString("de-DE")} €</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:600">${Math.round(op.suggestedSellingPrice / 100).toLocaleString("de-DE")} €</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#166534">+${Math.round(op.estimatedGrossProfit / 100).toLocaleString("de-DE")} €</td>
    </tr>`).join("");

  const html = `
<div style="font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;color:#111">
  <div style="background:#1e293b;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:18px;font-weight:700;color:#f1f5f9">WSP Market – Tageschancen ${date}</h1>
    <p style="margin:6px 0 0;font-size:13px;color:#94a3b8">${report.topOpportunities.length} Chancen · ${report.draftsCreated} Entwürfe erstellt</p>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:20px 24px">
    <div style="display:flex;gap:24px;margin-bottom:20px">
      <div><div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Chancen</div><div style="font-size:24px;font-weight:700">${report.topOpportunities.length}</div></div>
      <div><div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Entwürfe</div><div style="font-size:24px;font-weight:700">${report.draftsCreated}</div></div>
      <div><div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Analysiert</div><div style="font-size:24px;font-weight:700">${report.totalAnalyzed}</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Titel</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Kategorie</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Score</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">EK</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">VK (40%)</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Marge</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="6" style="padding:16px;text-align:center;color:#94a3b8">Keine Chancen gefunden</td></tr>'}</tbody>
    </table>
    ${report.errors.length > 0 ? `<div style="margin-top:16px;padding:10px 14px;background:#fee2e2;border-radius:6px;font-size:12px;color:#991b1b">${report.errors.slice(0, 5).join("<br>")}</div>` : ""}
  </div>
</div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `WSP Markt – ${report.topOpportunities.length} Chancen am ${date}`,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
