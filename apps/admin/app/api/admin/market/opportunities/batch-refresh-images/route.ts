import { NextRequest } from "next/server";

const BASE_URL = (process.env.COMMERCE_API_URL ?? "http://localhost:3000").trim().replace(/\/$/, "");
const ADMIN_KEY = (process.env.ADMIN_API_KEY ?? "").trim();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${BASE_URL}/api/admin/market-opportunities/batch-refresh-images`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
    body: body || "{}",
    cache: "no-store",
    // DALL-E HD kann 10-30s pro Bild dauern – großzügiger Timeout
    signal: AbortSignal.timeout(600000),
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
