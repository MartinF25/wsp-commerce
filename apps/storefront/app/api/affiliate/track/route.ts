import { NextRequest, NextResponse } from "next/server";

const COMMERCE_API_URL = (process.env.COMMERCE_API_URL ?? "").replace(/\/$/, "");

/**
 * Proxy-Route für Affiliate-Klick-Tracking.
 *
 * Der Browser (sendBeacon) ruft diese Route auf — sie leitet an die
 * Commerce API weiter und hält COMMERCE_API_URL intern (nicht im Client-Bundle).
 *
 * Antwortet immer 200 OK: Tracking ist nicht-kritisch, darf nie die Navigation blockieren.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!COMMERCE_API_URL) return NextResponse.json({}, { status: 200 });

  try {
    const body = await request.text();
    await fetch(`${COMMERCE_API_URL}/api/affiliate/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch {
    // fail silently — Tracking darf Navigation nie blockieren
  }

  return NextResponse.json({}, { status: 200 });
}
