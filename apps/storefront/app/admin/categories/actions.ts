"use server";

import { revalidatePath } from "next/cache";

const API = (process.env.COMMERCE_API_URL ?? "").replace(/\/$/, "");
const KEY = process.env.ADMIN_SECRET ?? "";

export type CategoryWithTranslations = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  productCount: number;
  translations?: {
    locale: string;
    name: string;
    description: string | null;
    meta_title: string | null;
    meta_description: string | null;
  }[];
};

export async function loadCategories(): Promise<CategoryWithTranslations[]> {
  const res = await fetch(`${API}/api/admin/categories`, {
    headers: { "X-Admin-Key": KEY },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Kategorien laden fehlgeschlagen: ${res.status}`);
  }

  const body = await res.json() as { data: CategoryWithTranslations[] };
  return body.data;
}

export async function saveTranslation(
  categoryId: string,
  locale: "de" | "en" | "es",
  data: { name: string; description: string; meta_title: string; meta_description: string }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API}/api/admin/categories/${categoryId}/translations/${locale}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Admin-Key": KEY },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
      return { ok: false, error: body?.error?.message ?? `HTTP ${res.status}` };
    }

    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}
