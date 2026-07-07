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

// ─── fal.ai Generierung ──────────────────────────────────────────────────────

async function generateFalImage(
  listing: MarketListing,
  category: string,
): Promise<{ url: string | null; source: "fal-cloudinary" | "fal-temp"; error?: string }> {
  const apiKey = (process.env.FAL_API_KEY ?? "").trim();
  if (!apiKey) return { url: null, source: "fal-temp", error: "FAL_API_KEY nicht gesetzt" };

  const prompt = buildDallEPrompt(listing, category);

  try {
    const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: false,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { url: null, source: "fal-temp", error: `fal.ai HTTP ${res.status}: ${txt}` };
    }

    const data = (await res.json()) as { images?: Array<{ url?: string }> };
    const tempUrl = data.images?.[0]?.url;
    if (!tempUrl) return { url: null, source: "fal-temp", error: "Kein Bild-URL in fal.ai-Antwort" };

    const permanent = await uploadToCloudinary(tempUrl);
    if (permanent) return { url: permanent, source: "fal-cloudinary" };
    return { url: tempUrl, source: "fal-temp" };
  } catch (e) {
    return { url: null, source: "fal-temp", error: (e as Error).message };
  }
}

// ─── Kling AI Generierung ─────────────────────────────────────────────────────

interface KlingTaskResponse {
  code?: number;
  message?: string;
  data?: {
    task_id?: string;
    task_status?: "submitted" | "processing" | "succeed" | "failed";
    task_result?: {
      images?: Array<{ url?: string }>;
    };
  };
}

async function generateKlingImage(
  listing: MarketListing,
  category: string,
): Promise<{ url: string | null; source: "kling-cloudinary" | "kling-temp"; error?: string }> {
  const apiKey = (process.env.KLING_API_KEY ?? "").trim();
  if (!apiKey) return { url: null, source: "kling-temp", error: "KLING_API_KEY nicht gesetzt" };

  const prompt = buildDallEPrompt(listing, category); // gleicher Prompt funktioniert gut

  try {
    // Schritt 1: Task einreichen
    const submitRes = await fetch("https://api.klingai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "kling-v1",
        prompt,
        n: 1,
        image_count: 1,
        aspect_ratio: "1:1",
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!submitRes.ok) {
      const txt = await submitRes.text().catch(() => "");
      return { url: null, source: "kling-temp", error: `Kling Submit HTTP ${submitRes.status}: ${txt}` };
    }

    const submitted = (await submitRes.json()) as KlingTaskResponse;
    if (submitted.code !== 0) {
      return { url: null, source: "kling-temp", error: `Kling API Fehler: ${submitted.message ?? "unbekannt"}` };
    }

    const taskId = submitted.data?.task_id;
    if (!taskId) return { url: null, source: "kling-temp", error: "Kein task_id in Kling-Antwort" };

    // Schritt 2: Pollen bis Ergebnis vorliegt (max 90s, alle 5s)
    for (let attempt = 0; attempt < 18; attempt++) {
      await new Promise((r) => setTimeout(r, 5000));

      const pollRes = await fetch(`https://api.klingai.com/v1/images/generations/${taskId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      });

      if (!pollRes.ok) continue;

      const poll = (await pollRes.json()) as KlingTaskResponse;
      const status = poll.data?.task_status;

      if (status === "succeed") {
        const tempUrl = poll.data?.task_result?.images?.[0]?.url;
        if (!tempUrl) return { url: null, source: "kling-temp", error: "Kling: succeed aber kein Bild-URL" };

        // Permanent in Cloudinary speichern
        const permanent = await uploadToCloudinary(tempUrl);
        if (permanent) return { url: permanent, source: "kling-cloudinary" };
        return { url: tempUrl, source: "kling-temp" };
      }

      if (status === "failed") {
        return { url: null, source: "kling-temp", error: "Kling: Task fehlgeschlagen" };
      }
      // submitted / processing → weiter pollen
    }

    return { url: null, source: "kling-temp", error: "Kling: Timeout nach 90s" };
  } catch (e) {
    return { url: null, source: "kling-temp", error: (e as Error).message };
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
  // 1. Herstellerwebseite (nur wenn Brand + Model bekannt)
  const brand = detectBrand(listing);
  if (brand && listing.model) {
    const mfImg = await tryManufacturerImage(brand, listing);
    if (mfImg) return mfImg;
  }

  // 2. fal.ai Flux Schnell → Cloudinary
  const falResult = await generateFalImage(listing, category);
  if (falResult.url) return falResult.url;

  // 3. Kling AI → Cloudinary
  const klingResult = await generateKlingImage(listing, category);
  if (klingResult.url) return klingResult.url;

  // 4. DALL-E HD als Fallback → Cloudinary
  const dalleResult = await generateDallEImage(listing, category);
  if (dalleResult.url) return dalleResult.url;

  // 5. Kein Bild
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

  // fal.ai (fast, cheap) – primary AI generator if FAL_API_KEY is set
  const falResult = await generateFalImage(listing, category);
  if (falResult.url) return { url: falResult.url, source: falResult.source };

  const klingResult = await generateKlingImage(listing, category);
  if (klingResult.url) return { url: klingResult.url, source: klingResult.source };

  const dalleResult = await generateDallEImage(listing, category);
  if (dalleResult.url) return { url: dalleResult.url, source: dalleResult.source };

  return { url: null, source: "none", error: falResult.error ?? klingResult.error ?? dalleResult.error };
}
