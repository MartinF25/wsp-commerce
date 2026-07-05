import type { MarketListing, MarketProductCategory } from "@prisma/client";
import { getPrismaClient } from "../lib/prisma";
import { analyzeMarketListingDeal } from "./marketDealAnalyzer";
import { generateMarketProductDraft } from "./marketProductDraftGenerator";
import { resolveProductImage } from "./marketImageResolver";
import { computeOpportunityScore } from "../utils/opportunityScoreUtils";
// resolveProductImage: manufacturer OG image (brand+model) → DALL-E HD → kein Fallback

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
  opportunityScore: number;
  dataCompletenessScore: number | null;
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

const ELIGIBLE_CATEGORIES: MarketProductCategory[] = ["solarspeicher", "solarzaun", "solaranlage", "skywind", "wechselrichter", "laderegler", "optimizer", "halterung"];
const MARKUP_PERCENT = 40;
const MIN_DEAL_SCORE = 40;

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
  // Fixed-price small products get configurable type for direct shop listing
  if (["solarspeicher", "wechselrichter", "laderegler", "optimizer", "halterung"].includes(category)) {
    return "configurable" as const;
  }
  return "inquiry_only" as const;
}

// ─── Mehrsprachige Hinweistexte ───────────────────────────────────────────────

const LEGAL_NOTES: Record<"de" | "en" | "es", string> = {
  de: "Verfügbarkeit und Zustand werden vor Angebotsbestätigung geprüft.",
  en: "Availability and condition will be verified before order confirmation.",
  es: "La disponibilidad y condición serán verificadas antes de la confirmación del pedido.",
};

const VARIANT_NAMES: Record<"de" | "en" | "es", string> = {
  de: "Standard",
  en: "Standard",
  es: "Estándar",
};

type Locale = "de" | "en" | "es";

function buildDeliveryNote(availabilityNote: string, locale: Locale): string {
  const legal = LEGAL_NOTES[locale];
  return availabilityNote.includes(legal)
    ? availabilityNote
    : `${availabilityNote} ${legal}`.trim();
}

const PROJECT_NOTES: Record<string, Record<Locale, string>> = {
  solarzaun: {
    de: "Als Projekt- und Anfrageprodukt angelegt. Bauliche Voraussetzungen, Abmessungen und Zustand werden vor Angebotsbestätigung individuell geprüft.",
    en: "Listed as a project and inquiry product. Structural requirements, dimensions and condition will be individually assessed before order confirmation.",
    es: "Listado como producto de proyecto y consulta. Los requisitos estructurales, dimensiones y condición serán evaluados individualmente antes de la confirmación del pedido.",
  },
  solaranlage: {
    de: "Als Set- und Projektangebot angelegt. Auslegung, Komponentenstand und Einsatzort werden vor Angebotsbestätigung geprüft.",
    en: "Listed as a system and project offer. Configuration, component status and installation site will be verified before order confirmation.",
    es: "Listado como oferta de sistema y proyecto. La configuración, estado de los componentes y lugar de instalación serán verificados antes de la confirmación.",
  },
  solarspeicher: {
    de: "Kompatibilität mit Wechselrichter, Batteriesystem und Schutzkonzept vor Angebotsbestätigung prüfen.",
    en: "Compatibility with inverter, battery system and protection concept must be verified before order confirmation.",
    es: "La compatibilidad con el inversor, el sistema de baterías y el concepto de protección deben verificarse antes de la confirmación del pedido.",
  },
  wechselrichter: {
    de: "Kompatibilität mit PV-Anlage, Netzanschluss und Einspeiseleistung vor Angebotsbestätigung prüfen.",
    en: "Compatibility with PV system, grid connection and feed-in capacity must be verified before order confirmation.",
    es: "La compatibilidad con el sistema fotovoltaico, la conexión a la red y la capacidad de inyección deben verificarse antes de la confirmación.",
  },
  laderegler: {
    de: "Kompatibilität mit Batterietyp, Modulspannung und Systemspannung prüfen.",
    en: "Compatibility with battery type, module voltage and system voltage must be verified.",
    es: "Debe verificarse la compatibilidad con el tipo de batería, la tensión del módulo y la tensión del sistema.",
  },
  optimizer: {
    de: "Kompatibilität mit Wechselrichter und Modultyp vor Angebotsbestätigung prüfen.",
    en: "Compatibility with inverter and module type must be verified before order confirmation.",
    es: "La compatibilidad con el inversor y el tipo de módulo debe verificarse antes de la confirmación del pedido.",
  },
  halterung: {
    de: "Passgenauigkeit für Modulgröße, Dachtyp und Montagesituation prüfen.",
    en: "Suitability for module size, roof type and mounting situation must be verified.",
    es: "Debe verificarse la idoneidad para el tamaño del módulo, el tipo de cubierta y la situación de montaje.",
  },
};

const DEFAULT_PROJECT_NOTE: Record<Locale, string> = {
  de: "Produktentwurf für interne Qualifizierung angelegt.",
  en: "Product draft created for internal qualification.",
  es: "Borrador de producto creado para calificación interna.",
};

function resolveProjectNote(category: string | null, tags: string[], locale: Locale): string {
  const tagLine = tags.length > 0
    ? ` ${locale === "de" ? "Interne Tags" : locale === "en" ? "Internal tags" : "Etiquetas internas"}: ${tags.join(", ")}.`
    : "";
  const notes = PROJECT_NOTES[(category ?? "").toLowerCase()] ?? DEFAULT_PROJECT_NOTE;
  return `${notes[locale]}${tagLine}`;
}

// ─── Core Agent Functions ─────────────────────────────────────────────────────

async function selectCandidates(limit: number): Promise<MarketListing[]> {
  const prisma = getPrismaClient();

  return prisma.marketListing.findMany({
    where: {
      AND: [
        {
          OR: [
            { dealScore: { gte: MIN_DEAL_SCORE } },
            { analyzedAt: null },
          ],
        },
        { productDraftId: null },
        { OR: [{ opportunityStatus: null }, { opportunityStatus: { not: "rejected" } }] },
        { OR: [{ sourceStatus: null }, { sourceStatus: { not: "offline" } }] },
      ],
    },
    orderBy: [
      { dealScore: { sort: "desc", nulls: "last" } },
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

  const { de: tDe, en: tEn, es: tEs } = generatedDraft.translations;
  const locales = (["de", "en", "es"] as const);

  const createdProduct = await prisma.product.create({
    data: {
      slug: finalSlug,
      product_type: productType,
      status: "draft",
      availability_status: "on_request",
      category_id: category?.id ?? null,
      translations: {
        create: locales.map((locale) => {
          const t = locale === "de" ? tDe : locale === "en" ? tEn : tEs;
          const deliveryNote = buildDeliveryNote(t.availabilityNote, locale);
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
  });

  if (profit.suggestedSellingPrice > 0) {
    const variant = await prisma.productVariant.create({
      data: {
        product_id: createdProduct.id,
        sku: `${finalSlug.slice(0, 32)}-${createdProduct.id.slice(0, 8)}`,
        price_cents: profit.suggestedSellingPrice,
        currency: "EUR",
        stock_quantity: 0,
        is_active: true,
      },
    });
    await prisma.productVariantTranslation.createMany({
      data: locales.map((locale) => ({
        variant_id: variant.id,
        locale,
        name: VARIANT_NAMES[locale],
      })),
    });
  }

  // Kein Kleinanzeigen-Bild verwenden (Copyright). Nur generiertes Bild speichern.
  const resolvedImageUrl = await resolveProductImage(listing, generatedDraft.category).catch(() => null);
  if (resolvedImageUrl) {
    await prisma.productImage.create({
      data: {
        product_id: createdProduct.id,
        url: resolvedImageUrl,
        alt: tDe.name,
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
      if (score < MIN_DEAL_SCORE) {
        totalSkipped++;
        continue;
      }

      const profit = listing.price_cents && !listing.price_negotiable
        ? calculateProfit(listing.price_cents)
        : {
            purchasePrice: 0,
            markupPercent: 0,
            suggestedSellingPrice: 0,
            estimatedGrossProfit: 0,
            pricingNote: "VB – Preis wird individuell verhandelt",
          };
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

      const opportunityScore = computeOpportunityScore(
        listing.dealScore,
        listing.dataCompletenessScore,
        listing.price_cents,
        listing.price_negotiable,
      );

      topOpportunities.push({
        listingId: listing.id,
        title: listing.title,
        category: listing.productCategory,
        dealScore: score,
        opportunityScore,
        dataCompletenessScore: listing.dataCompletenessScore,
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

  topOpportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

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
