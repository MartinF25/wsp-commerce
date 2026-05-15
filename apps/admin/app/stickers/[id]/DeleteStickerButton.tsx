"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function DeleteStickerButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Sticker „${name}" wirklich löschen? Alle Regeln und Overrides werden entfernt.`)) return;
    startTransition(async () => {
      await api.stickers.delete(id);
      router.push("/stickers");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors"
    >
      {isPending ? "Löschen…" : "Löschen"}
    </button>
  );
}
