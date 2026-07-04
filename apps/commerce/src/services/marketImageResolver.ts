import type { MarketListing } from "@prisma/client";

interface OpenAIImageResponse {
  data?: Array<{ url?: string }>;
  error?: { message?: string; code?: string };
}

// Category fallback images from Unsplash (stable CDN URLs, no auth needed)
const CATEGORY_FALLBACKS: Record<string, string> = {
  wechselrichter:  "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
  solarspeicher:   "https://images.unsplash.com/photo-1584677626646-7c8f83690304?w=800&q=80",
  solaranlage:     "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80",
  solarzaun:       "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80",
  laderegler:      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
  optimizer:       "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
  halterung:       "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  skywind:         "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80",
};

const BRAND_DOMAINS: Record<string, string> = {
  goodwe:    "https://en.goodwe.com",
  fronius:   "https://www.fronius.com",
  sma:       "https://www.sma.de",
  solaredge: "https://www.solaredge.com",
  huawei:    "https://solar.huawei.com",
  sungrow:   "https://www.sungrowpower.com",
  growatt:   "https://www.growatt.com",
  victron:   "https://www.victronenergy.com",
  enphase:   "https://enphase.com",
  tigo:      "https://www.tigoenergy.com",
  lg:        "https://www.lgessbattery.com",
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
  const text = `${listing.title ?? ""} ${listing.description ?? ""}`.toLowerCase();
  for (const brand of Object.keys(BRAND_DOMAINS)) {
    if (text.includes(brand)) return brand;
  }
  return null;
}

async function tryFetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WSP-Bot/1.0)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function buildProductPageUrl(brand: string, listing: MarketListing): string | null {
  const domain = BRAND_DOMAINS[brand];
  if (!domain) return null;

  const titleLower = (listing.title ?? "").toLowerCase();
  const modelPatterns: Record<string, (title: string) => string | null> = {
    goodwe: (t) => {
      const m = t.match(/gw[\d]+-[a-z]+/i);
      return m ? `${domain}/product/${m[0].toLowerCase()}` : `${domain}/inverter`;
    },
    fronius: (t) => {
      if (t.includes("symo")) return `${domain}/en/products/inverters/symo`;
      if (t.includes("primo")) return `${domain}/en/products/inverters/primo`;
      if (t.includes("eco")) return `${domain}/en/products/inverters/eco`;
      return `${domain}/en/products/inverters`;
    },
    sma: (t) => {
      if (t.includes("sunny tripower")) return `${domain}/en/products/sma-product-range/inverters/string-inverters/sunny-tripower`;
      if (t.includes("sunny boy")) return `${domain}/en/products/sma-product-range/inverters/string-inverters/sunny-boy`;
      return `${domain}/en/products`;
    },
    solaredge: (t) => {
      if (t.includes("optimizer") || t.includes("optimirer")) return `${domain}/us/products/power-optimizer`;
      return `${domain}/us/products/inverters`;
    },
    growatt: () => `${domain}/solution/storage`,
    huawei:  () => `${domain}/en/products/commercial-pv`,
  };

  const handler = modelPatterns[brand];
  return handler ? handler(titleLower) : domain;
}

async function uploadToImgBB(tempUrl: string): Promise<string | null> {
  const apiKey = (process.env.IMGBB_API_KEY ?? "").trim();
  if (!apiKey) return null;

  try {
    const imgRes = await fetch(tempUrl, { signal: AbortSignal.timeout(30000) });
    if (!imgRes.ok) return null;

    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const form = new URLSearchParams();
    form.append("image", base64);

    const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(30000),
    });

    if (!uploadRes.ok) return null;
    const data = (await uploadRes.json()) as { data?: { url?: string } };
    return data?.data?.url ?? null;
  } catch {
    return null;
  }
}

async function generateDallEImage(listing: MarketListing, category: string): Promise<{ url: string | null; error?: string }> {
  const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!apiKey) return { url: null, error: "OPENAI_API_KEY nicht gesetzt" };

  const productName = (listing.title ?? "").trim().slice(0, 80);
  const categoryHint = ({
    wechselrichter: "solar inverter wall-mounted device, white box with display",
    solarspeicher:  "home battery storage unit, modern white cabinet",
    laderegler:     "solar charge controller, compact electronic device",
    optimizer:      "solar power optimizer, small black electronic module",
    halterung:      "solar panel aluminum mounting bracket system",
    solaranlage:    "solar panel array on rooftop",
    solarzaun:      "solar fence with integrated photovoltaic panels",
    skywind:        "small vertical axis wind turbine",
  } as Record<string, string>)[category] ?? "solar energy electronic device";

  const prompt = `Professional product photography of a ${categoryHint}. Clean white background, soft studio lighting, sharp focus, photorealistic. No text overlays, no logos. Product: ${productName}`;

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024", quality: "standard" }),
      signal: AbortSignal.timeout(90000),
    });

    const data = (await res.json()) as OpenAIImageResponse;

    if (!res.ok) {
      return { url: null, error: `OpenAI ${res.status}: ${data?.error?.message ?? "unbekannter Fehler"}` };
    }

    const tempUrl = data.data?.[0]?.url;
    if (!tempUrl) return { url: null, error: "Kein URL in OpenAI-Antwort" };

    // DALL-E URLs expire after 1h — upload to permanent storage
    const permanent = await uploadToImgBB(tempUrl);
    if (permanent) return { url: permanent };

    // Fallback: return temp URL anyway (valid for ~1h)
    return { url: tempUrl };
  } catch (e) {
    return { url: null, error: (e as Error).message };
  }
}

export async function resolveProductImage(
  listing: MarketListing,
  category: string,
  options: { useDallE?: boolean; useFallback?: boolean } = {},
): Promise<string | null> {
  // 1. Try manufacturer website OG image
  const brand = detectBrand(listing);
  if (brand) {
    const pageUrl = buildProductPageUrl(brand, listing);
    if (pageUrl) {
      const ogImage = await tryFetchOgImage(pageUrl);
      if (ogImage) return ogImage;
    }
  }

  // 2. Try DALL-E generation
  if (options.useDallE !== false) {
    const { url } = await generateDallEImage(listing, category);
    if (url) return url;
  }

  // 3. Category fallback (Unsplash, stable URLs)
  if (options.useFallback !== false) {
    const fallback = CATEGORY_FALLBACKS[category] ?? CATEGORY_FALLBACKS["solaranlage"];
    if (fallback) return fallback;
  }

  return null;
}

export async function resolveProductImageWithDetails(
  listing: MarketListing,
  category: string,
): Promise<{ url: string | null; source: string; error?: string }> {
  const brand = detectBrand(listing);
  if (brand) {
    const pageUrl = buildProductPageUrl(brand, listing);
    if (pageUrl) {
      const ogImage = await tryFetchOgImage(pageUrl);
      if (ogImage) return { url: ogImage, source: "manufacturer" };
    }
  }

  const dallE = await generateDallEImage(listing, category);
  if (dallE.url) return { url: dallE.url, source: "dall-e" };

  const fallback = CATEGORY_FALLBACKS[category] ?? CATEGORY_FALLBACKS["solaranlage"] ?? null;
  if (fallback) return { url: fallback, source: "fallback" };

  return { url: null, source: "none", error: dallE.error };
}
