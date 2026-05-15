import { api } from "@/lib/api";
import { StickerForm } from "@/components/StickerForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DeleteStickerButton } from "./DeleteStickerButton";

export const dynamic = "force-dynamic";

export default async function EditStickerPage({ params }: { params: { id: string } }) {
  let sticker;
  let categories = [];

  try {
    [sticker, categories] = await Promise.all([
      api.stickers.get(params.id),
      api.categories.list(),
    ]);
  } catch {
    notFound();
  }

  if (!sticker) notFound();

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sticker bearbeiten</h1>
          <p className="text-sm text-gray-500 mt-1">{sticker.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/stickers"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Zurück
          </Link>
          <DeleteStickerButton id={sticker.id} name={sticker.name} />
        </div>
      </div>

      <StickerForm sticker={sticker} categories={categories} />
    </div>
  );
}
