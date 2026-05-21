"use server";

import { api, type StickerInput } from "@/lib/api";

export async function createStickerAction(input: StickerInput): Promise<{ error?: string }> {
  try {
    await api.stickers.create(input);
    return {};
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function updateStickerAction(id: string, input: StickerInput): Promise<{ error?: string }> {
  try {
    await api.stickers.update(id, input);
    return {};
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function deleteStickerAction(id: string): Promise<{ error?: string }> {
  try {
    await api.stickers.delete(id);
    return {};
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function upsertOverrideAction(
  stickerId: string,
  data: { product_id: string; enabled: boolean; excluded: boolean }
): Promise<{ error?: string }> {
  try {
    await api.stickers.upsertOverride(stickerId, data);
    return {};
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function removeOverrideAction(
  stickerId: string,
  productId: string
): Promise<{ error?: string }> {
  try {
    await api.stickers.removeOverride(stickerId, productId);
    return {};
  } catch (err) {
    return { error: (err as Error).message };
  }
}
