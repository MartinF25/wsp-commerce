"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStickerAction } from "@/app/stickers/actions";

export function DeleteStickerButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`Sticker „${name}" wirklich löschen? Alle Regeln und Overrides werden entfernt.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteStickerAction(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/stickers");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors"
      >
        {isPending ? "Löschen…" : "Löschen"}
      </button>
      {error && (
        <p className="text-sm text-red-600">Fehler: {error}</p>
      )}
    </div>
  );
}
