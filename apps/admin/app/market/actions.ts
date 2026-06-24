"use server";

import { redirect } from "next/navigation";
import type { MarketListing } from "@/lib/api";

const BASE_URL = process.env.COMMERCE_API_URL!;
const ADMIN_KEY = process.env.ADMIN_API_KEY!;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

export async function cleanupListings(): Promise<{ deleted: number; reclassified: number }> {
  const res = await fetch(`${BASE_URL}/api/admin/market-listings/cleanup`, {
    method: "POST",
    headers: { "X-Admin-Key": ADMIN_KEY },
  });
  if (!res.ok) throw new Error(`Cleanup fehlgeschlagen (HTTP ${res.status})`);
  const body = await res.json();
  return { deleted: body.deleted ?? 0, reclassified: body.reclassified ?? 0 };
}

export async function createProductFromListing(listing: MarketListing, productType: string) {
  const translation = {
    name: listing.title,
    short_description: listing.description ? listing.description.substring(0, 500) : null,
    description: listing.description ?? null,
    delivery_note: null,
    meta_title: null,
    meta_description: null,
  };

  const createRes = await fetch(`${BASE_URL}/api/admin/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
    body: JSON.stringify({
      slug: slugify(listing.title),
      product_type: productType,
      status: "draft",
      category_id: null,
      translations: { de: translation, en: translation, es: translation },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Produkt-Erstellung fehlgeschlagen (HTTP ${createRes.status})`);
  }

  const body = await createRes.json();
  const productId: string = body?.data?.id ?? body?.id;

  if (!productId) throw new Error("Keine Produkt-ID in der API-Antwort");

  // Bild anlegen (non-fatal)
  if (listing.image_url) {
    await fetch(`${BASE_URL}/api/admin/products/${productId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
      body: JSON.stringify({ url: listing.image_url, alt: listing.title, sort_order: 0 }),
    }).catch(() => {});
  }

  await fetch(`${BASE_URL}/api/admin/market-listings/${listing.id}/product-draft`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
    body: JSON.stringify({ productDraftId: productId }),
  }).catch(() => {});

  redirect(`/products/${productId}`);
}
