import { api } from "@/lib/api";
import type { StickerMatrixEntry } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StickerChip({ sticker }: { sticker: StickerMatrixEntry["stickers"][number] }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        color: sticker.text_color ?? "#fff",
        backgroundColor: sticker.bg_color ?? "#22c55e",
        borderRadius: sticker.border_radius ?? "999px",
      }}
      title={`${sticker.name} · ${sticker.source}`}
    >
      {sticker.text ?? sticker.name}
    </span>
  );
}

export default async function StickerProductsPage() {
  let matrix: StickerMatrixEntry[] = [];
  let error: string | null = null;

  try {
    matrix = await api.stickers.getProductMatrix();
  } catch (e) {
    error = (e as Error).message;
  }

  const withStickers = matrix.filter((p) => p.stickers.length > 0);
  const withoutStickers = matrix.filter((p) => p.stickers.length === 0);

  return (
    <div className="p-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Label-Übersicht nach Produkt</h1>
          <p className="text-sm text-gray-500 mt-1">
            {withStickers.length} Produkte mit Labels · {withoutStickers.length} ohne
          </p>
        </div>
        <Link
          href="/stickers"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Sticker-Liste
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          Fehler beim Laden: {error}
        </div>
      )}

      {/* ── Produkte mit Labels ─────────────────────────────────────────── */}
      {withStickers.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm mb-6">
          <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Produkte mit aktivem Label
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Produkt</th>
                <th className="px-5 py-3 text-left">Labels</th>
                <th className="px-5 py-3 text-left">Quelle</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {withStickers.map((entry) => (
                <tr key={entry.product_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{entry.product_name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{entry.product_slug}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {entry.stickers.map((s) => (
                        <StickerChip key={s.id} sticker={s} />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      {entry.stickers.map((s) => (
                        <span key={s.id} className="text-xs text-gray-500">
                          <span className="font-medium text-gray-700">{s.name}:</span> {s.source}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/products/${entry.product_id}`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Produkt
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Produkte ohne Labels ─────────────────────────────────────────── */}
      {withoutStickers.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Produkte ohne Label
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {withoutStickers.map((entry) => (
              <div
                key={entry.product_id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-gray-700">{entry.product_name}</span>
                  <span className="ml-2 text-xs text-gray-400">{entry.product_slug}</span>
                </div>
                <Link
                  href={`/products/${entry.product_id}`}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Produkt
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {matrix.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400">Keine aktiven Produkte gefunden.</p>
        </div>
      )}
    </div>
  );
}
