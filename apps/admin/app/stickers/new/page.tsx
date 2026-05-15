import { api, type Category } from "@/lib/api";
import { StickerForm } from "@/components/StickerForm";

export const dynamic = "force-dynamic";

export default async function NewStickerPage() {
  let categories: Category[] = [];
  try {
    categories = await api.categories.list();
  } catch {
    // Kategorien nicht verfügbar – Formular zeigt leere Liste
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Neuer Sticker</h1>
        <p className="text-sm text-gray-500 mt-1">Sticker anlegen und Zuweisungsregeln definieren</p>
      </div>
      <StickerForm categories={categories} />
    </div>
  );
}
