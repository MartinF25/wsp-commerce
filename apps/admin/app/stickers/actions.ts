"use server";

import { api, type StickerInput } from "@/lib/api";

export async function createStickerAction(input: StickerInput) {
  return api.stickers.create(input);
}

export async function updateStickerAction(id: string, input: StickerInput) {
  return api.stickers.update(id, input);
}

export async function deleteStickerAction(id: string) {
  return api.stickers.delete(id);
}
