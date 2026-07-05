import type { MarketListing } from "@prisma/client";

interface OpenAIImageResponse {
  data?: Array<{ url?: string }>;
  error?: { message?: string; code?: string };
}

// ─── Hersteller-Domains ───────────────────────────────────────────────────────

const BRAND_DOMAINS: Record<string, string> = {
  goodwe:    "https://en.goodwe.com",
  fronius:   "https://www.fronius.com",
  sma:       "https://www.sma.de",
  solaredge: "https://www.solaredge.com",
  huawei:    "https://solar.huawei.com",
  sungrow:   "https://en.sungrowpower.com",
  growatt:   "https://www.growatt.com",
  victron:   "https://www.victronenergy.com",
  enphase:   "https://enphase.com",
  tigo:      "https://www.tigoenergy.com",
  byd:       "https://www.bydbatterybox.com",
  pylontech: "https://www.pylontech.com.cn",
  anker:     "https://www.anker.com",
  hoymiles:  "https://www.hoymiles.com",
  deye:      "https://www.deyeinverter.com",
  sofar:     "https://www.sofarsolar.com",
  solax:     "https://www.solaxpower.com",
  fox:       "https://www.foxess.com",
  marstek:   "https://www.marstek.com",
};

function detectBrand(listing: MarketListing): string | null {
  const stored = (listing.brand ?? "").toLowerCase().trim();
  if (stored && BRAND_DOMAINS[stored]) return stored;

  const text = `${listing.title ?? ""} ${listing.description ?? ""}`.toLowerCase();
  for (const brand of Object.keys(BRAND_DOMAINS)) {
    if (text.includes(brand)) return brand;
  }
  return null;
}

// ─── Hersteller-Produktseite aufrufen ────────────────────────────────────────

function buildProductPageUrls(brand: string, listing: MarketListing): string[] {
  const domain = BRAND_DOMAINS[brand];
  if (!domain) return [];

  const model = (listing.model ?? "").trim();
  const modelSlug = model.toLowerCase().replace(/\s+/g, "-");
  const titleLower = (listing.title ?? "").toLowerCase();

  const candidates: string[] = [];

  if (model) {
    candidates.push(
      `${domain}/product/${modelSlug}`,
      `${domain}/products/${modelSlug}`,
      `${domain}/en/products/${modelSlug}`,
      `${domain}/de/produkte/${modelSlug}`,
    );
  }

  // Brand-spezifische Patterns
  switch (brand) {
    case "goodwe": {
      const m = titleLower.match(/gw[\d]+-[a-z0-9]+/i);
      if (m) candidates.push(`${domain}/product/${m[0].toLowerCase()}`);
      candidates.push(`${domain}/inverter`);
      break;
    }
    case "fronius":
      if (titleLower.includes("symo")) candidates.push(`${domain}/en/products/inverters/symo`);
      else if (titleLower.includes("primo")) candidates.push(`${domain}/en/products/inverters/primo`);
      else candidates.push(`${domain}/en/products/inverters`);
      break;
    case "sma":
      if (titleLower.includes("tripower")) candidates.push(`${domain}/en/products/sma-product-range/inverters/string-inverters/sunny-tripower`);
      else if (titleLower.includes("sunny boy")) candidates.push(`${domain}/en/products/sma-product-range/inverters/string-inverters/sunny-boy`);
      else candidates.push(`${domain}/en/products`);
      break;
    case "sungrow":
      candidates.push(`${domain}/product/list`);
      break;
    case "hoymiles":
      candidates.push(`${domain}/products`);
      break;
    default:
      candidates.push(domain);
  }

  return [...new Set(candidates)];
}

async function tryFetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WSP-Bot/1.0)" },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    return ogMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

async function tryManufacturerImage(brand: string, listing: MarketListing): Promise<string | null> {
  const urls = buildProductPageUrls(brand, listing);
  for (const url of urls.slice(0, 3)) {
    const img = await tryFetchOgImage(url);
    if (img) return img;
  }
  return null;
}

// ─── DALL-E Prompt Builder ────────────────────────────────────────────────────

interface CategoryArtDirection {
  subject: (brand: string | null, model: string | null, productType: string | null) => string;
  setting: string;
  detail: string;
}

const CATEGORY_ART: Record<string, CategoryArtDirection> = {
  wechselrichter: {
    subject: (brand, model, pt) =>
      brand && model ? `${brand} ${model} solar string inverter`
        : pt ? `${pt}` : "solar string inverter",
    setting: "wall-mounted in a clean technical room",
    detail: "white or light grey rectangular enclosure, LED status display, cable connections at bottom, wall mounting bracket visible",
  },
  solarspeicher: {
    subject: (brand, model, pt) =>
      brand && model ? `${brand} ${model} home battery storage system`
        : pt ? `${pt}` : "home battery energy storage cabinet",
    setting: "installed in a modern garage or technical utility room",
    detail: "tall white or anthracite cabinet, battery management system display, ventilation grilles, power connections",
  },
  laderegler: {
    subject: (brand, model, _) =>
      brand && model ? `${brand} ${model} MPPT solar charge controller`
        : "MPPT solar charge controller",
    setting: "mounted on a white panel",
    detail: "compact electronic device with LCD display showing voltage and current, DIN rail mounting or wall mounting, LED indicators",
  },
  optimizer: {
    subject: (brand, model, _) =>
      brand && model ? `${brand} ${model} solar power optimizer`
        : "solar power optimizer module",
    setting: "isolated product shot",
    detail: "small rectangular black electronic module, MC4 connectors, heat sink fins, product label visible",
  },
  halterung: {
    subject: (_, __, ___) => "solar panel aluminum mounting bracket system",
    setting: "clean white background, component layout view",
    detail: "anodized aluminium profiles, mounting rails, clamps and bolts, professional technical product presentation",
  },
  solaranlage: {
    subject: (brand, model, _) =>
      brand && model ? `${brand} ${model} photovoltaic solar system`
        : "residential rooftop photovoltaic solar system",
    setting: "installed on a modern single-family house, blue sky in background",
    detail: "black monocrystalline solar panels in neat rows, professional installation, sunny day",
  },
  solarzaun: {
    subject: (_, __, ___) => "solar fence with integrated photovoltaic panels",
    setting: "modern residential property garden boundary",
    detail: "elegant fence posts with solar glass panels integrated, professional installation, green garden in background",
  },
  skywind: {
    subject: (brand, model, _) =>
      brand && model ? `${brand} ${model} small wind turbine`
        : "small vertical axis wind turbine",
    setting: "installed on a rooftop or open land, clear blue sky",
    detail: "modern compact wind turbine design, rotating blades, professional installation, open landscape",
  },
};

function buildDallEPrompt(listing: MarketListing, category: string): string {
  const brand = listing.brand ?? null;
  const model = listing.model ?? null;
  const productType = listing.productType ?? null;
  const productSeries = listing.productSeries ?? null;

  const art = CATEGORY_ART[category];

  if (!art) {
    const fallbackSubject = brand && model
      ? `${brand} ${model} solar energy product`
      : productType ?? "solar energy device";
    return [
      "Commercial e-commerce product photograph:",
      `${fallbackSubject}.`,
      "Clean white studio background, professional studio lighting with soft shadows,",
      "photorealistic, sharp focus, 4K quality. No text overlays, no watermarks, no logos on background.",
    ].join(" ");
  }

  const subject = art.subject(brand, model, productType);
  const seriesHint = productSeries ? ` (${productSeries} series)` : "";

  return [
    `Commercial e-commerce product photograph: ${subject}${seriesHint},`,
    `${art.setting}.`,
    `${art.detail}.`,
    "Professional studio lighting with soft shadows, photorealistic render, sharp focus, 4K quality.",
    "Clean background appropriate for the setting. No text overlays, no watermarks.",
    "High-end commercial product photography suitable for a professional solar energy webshop.",
  ].join(" ");
}

// ─── Cloudinary Upload ────────────────────────────────────────────────────────

async function uploadToCloudinary(tempUrl: string): Promise<string | null> {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
  const preset = (process.env.CLOUDINARY_UPLOAD_PRESET ?? "").trim();
  if (!cloudName || !preset) return null;

  try {
    const form = new URLSearchParams();
    form.append("file", tempUrl);
    form.append("upload_preset", preset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { secure_url?: string };
    return data?.secure_url ?? null;
  } catch {
    return null;
  }
}

// ─── DALL-E Generierung ───────────────────────────────────────────────────────

async function generateDallEImage(
  listing: MarketListing,
  category: string,
): Promise<{ url: string | null; source: "dall-e-cloudinary" | "dall-e-temp"; error?: string }> {
  const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!apiKey) return { url: null, source: "dall-e-temp", error: "OPENAI_API_KEY nicht gesetzt" };

  const prompt = buildDallEPrompt(listing, category);

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
      }),
      signal: AbortSignal.timeout(120000),
    });

    const data = (await res.json()) as OpenAIImageResponse;

    if (!res.ok) {
      return { url: null, source: "dall-e-temp", error: `OpenAI ${res.status}: ${data?.error?.message ?? "unbekannter Fehler"}` };
    }

    const tempUrl = data.data?.[0]?.url;
    if (!tempUrl) return { url: null, source: "dall-e-temp", error: "Kein URL in OpenAI-Antwort" };

    // DALL-E URLs laufen nach ~1h ab → permanent in Cloudinary speichern
    const permanent = await uploadToCloudinary(tempUrl);
    if (permanent) return { url: permanent, source: "dall-e-cloudinary" };

    // Cloudinary nicht konfiguriert: temp URL als Fallback zurückgeben
    return { url: tempUrl, source: "dall-e-temp" };
  } catch (e) {
    return { url: null, source: "dall-e-temp", error: (e as Error).message };
  }
}

// ─── Kleinanzeigen URL Erkennung ──────────────────────────────────────────────

export function isKleinanzeigenUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.includes("kleinanzeigen.de") ||
    url.includes("ebay-kleinanzeigen.de") ||
    url.includes("img.kleinanzeigen") ||
    url.includes("i.ebayimg.com") ||
    url.includes("ebayimg.com")
  );
}

// ─── Öffentliche API ──────────────────────────────────────────────────────────

export async function resolveProductImage(
  listing: MarketListing,
  category: string,
): Promise<string | null> {
  // 1. Herstellerwebseite (nur wenn Brand + Model aus Knowledge Extraction bekannt)
  const brand = detectBrand(listing);
  if (brand && listing.model) {
    const mfImg = await tryManufacturerImage(brand, listing);
    if (mfImg) return mfImg;
  }

  // 2. DALL-E mit reichhaltigem Prompt → Cloudinary Upload
  const { url } = await generateDallEImage(listing, category);
  if (url) return url;

  // 3. Kein Bild (bewusste Entscheidung – kein KA-Bild, kein Unsplash-Fallback)
  return null;
}

export async function resolveProductImageWithDetails(
  listing: MarketListing,
  category: string,
): Promise<{ url: string | null; source: string; error?: string }> {
  const brand = detectBrand(listing);
  if (brand && listing.model) {
    const mfImg = await tryManufacturerImage(brand, listing);
    if (mfImg) return { url: mfImg, source: "manufacturer" };
  }

  const result = await generateDallEImage(listing, category);
  if (result.url) return { url: result.url, source: result.source };

  return { url: null, source: "none", error: result.error };
}
