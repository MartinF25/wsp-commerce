/**
 * Proxy-Route: leitet Client-seitige Anfragen an die Commerce Admin API weiter.
 * Fügt den X-Admin-Key Header serverseitig hinzu – der Key bleibt im Browser unsichtbar.
 */

import { NextRequest } from "next/server";

const BASE_URL = (process.env.COMMERCE_API_URL ?? "http://localhost:3000").trim().replace(/\/$/, "");
const ADMIN_KEY = (process.env.ADMIN_API_KEY ?? "").trim();

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const url = new URL(req.url);
  const upstream = `${BASE_URL}/api/admin/${path}${url.search}`;

  const body = req.method !== "GET" && req.method !== "DELETE"
    ? await req.text()
    : undefined;

  let res: Response;
  try {
    res = await fetch(upstream, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": ADMIN_KEY,
      },
      body,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[admin-proxy] fetch failed: ${req.method} ${upstream}`, msg);
    return new Response(
      JSON.stringify({ error: { code: "PROXY_ERROR", message: `Commerce API nicht erreichbar: ${msg}`, status: 502 } }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const text = await res.text();
  // Wenn die Antwort kein JSON ist (z.B. Railway-Fehlerseite), als Fehler wrappen
  if (!text.startsWith("{") && !text.startsWith("[") && res.status >= 400) {
    console.error(`[admin-proxy] non-JSON error from upstream: ${res.status}`, text.slice(0, 200));
    return new Response(
      JSON.stringify({ error: { code: "UPSTREAM_ERROR", message: `Commerce API Fehler ${res.status}: ${text.slice(0, 100)}`, status: res.status } }),
      { status: res.status, headers: { "Content-Type": "application/json" } }
    );
  }
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
