/**
 * Proxy-Route: leitet Client-seitige Anfragen an die Commerce Admin API weiter.
 * Fügt den X-Admin-Key Header serverseitig hinzu – der Key bleibt im Browser unsichtbar.
 */

import { NextRequest } from "next/server";

const BASE_URL = (process.env.COMMERCE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ADMIN_KEY = process.env.ADMIN_API_KEY ?? "";

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const url = new URL(req.url);
  const upstream = `${BASE_URL}/api/admin/${path}${url.search}`;

  const body = req.method !== "GET" && req.method !== "DELETE"
    ? await req.text()
    : undefined;

  const res = await fetch(upstream, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_KEY,
    },
    body,
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
