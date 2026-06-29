import { NextRequest } from "next/server";

const BASE_URL = (process.env.COMMERCE_API_URL ?? "http://localhost:3000").trim().replace(/\/$/, "");
const ADMIN_KEY = (process.env.ADMIN_API_KEY ?? "").trim();

function headers() {
  return { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY };
}

export async function GET(req: NextRequest) {
  const keyword = new URL(req.url).searchParams.get("keyword");
  const qs = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
  const res = await fetch(`${BASE_URL}/api/admin/market-reference-prices${qs}`, {
    headers: headers(),
    cache: "no-store",
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${BASE_URL}/api/admin/market-reference-prices`, {
    method: "POST",
    headers: headers(),
    body,
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
