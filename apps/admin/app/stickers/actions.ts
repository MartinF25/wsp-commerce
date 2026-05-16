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

export async function deleteStickerAction(id: string) {
  return api.stickers.delete(id);
}
