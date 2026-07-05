import { NextRequest } from "next/server";

const BASE_URL = (process.env.COMMERCE_API_URL ?? "http://localhost:3000").trim().replace(/\/$/, "");
const ADMIN_KEY = (process.env.ADMIN_API_KEY ?? "").trim();

export async function POST(
  _req: NextRequest,
  { params }: { params: { listingId: string } }
) {
  const res = await fetch(`${BASE_URL}/api/admin/market-opportunities/${params.listingId}/refresh-seo`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
    cache: "no-store",
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
