import type { MarketListing } from "@prisma/client";

interface OpenAIImageResponse {
  data?: Array<{ url?: string }>;
}

const BRAND_DOMAINS: Record<string, string> = {
  goodwe: "https://en.goodwe.com",
  fronius: "https://www.fronius.com",
  sma: "https://www.sma.de",
  solaredge: "https://www.solaredge.com",
  huawei: "https://solar.huawei.com",
  sungrow: "https://www.sungrowpower.com",
  growatt: "https://www.growatt.com",
  victron: "https://www.victronenergy.com",
  enphase: "https://enphase.com",
  tigo: "https://www.tigoenergy.com",
  lg: "https://www.lgessbattery.com",
  byd: "https://www.bydbatterybox.com",
  pylontech: "https://www.pylontech.com.cn",
  anker: "https://www.anker.com",
  hoymiles: "https://www.hoymiles.com",
  deye: "https://www.deyeinverter.com",
  sofar: "https://www.sofarsolar.com",
  solax: "https://www.solaxpower.com",
  fox: "https://www.foxess.com",
  marstek: "https://www.marstek.com",
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
    huawei: () => `${domain}/en/products/commercial-pv`,
  };

  const handler = modelPatterns[brand];
  return handler ? handler(titleLower) : domain;
}

async function generateDallEImage(listing: MarketListing, category: string): Promise<string | null> {
  const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!apiKey) return null;

  const productName = (listing.title ?? "").trim().slice(0, 80);
  const categoryHint = {
    wechselrichter: "solar inverter",
    solarspeicher: "home battery storage unit",
    laderegler: "solar charge controller",
    optimizer: "solar power optimizer",
    halterung: "solar panel mounting bracket",
    solaranlage: "solar panel set",
    solarzaun: "solar fence panel",
    skywind: "small wind turbine",
  }[category] ?? "solar energy product";

  const prompt = `Professional product photography of a ${categoryHint}, white background, studio lighting, high resolution, photorealistic, no text, no logo overlay. Product: ${productName}`;

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024", quality: "standard" }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as OpenAIImageResponse;
    return data.data?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

export async function resolveProductImage(
  listing: MarketListing,
  category: string,
  options: { useDallE?: boolean } = {},
): Promise<string | null> {
  const brand = detectBrand(listing);

  if (brand) {
    const pageUrl = buildProductPageUrl(brand, listing);
    if (pageUrl) {
      const ogImage = await tryFetchOgImage(pageUrl);
      if (ogImage) return ogImage;
    }
  }

  if (options.useDallE !== false) {
    const generated = await generateDallEImage(listing, category);
    if (generated) return generated;
  }

  return null;
}
