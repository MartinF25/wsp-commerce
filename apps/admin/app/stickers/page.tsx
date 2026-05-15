import { api } from "@/lib/api";
import type { StickerAdmin } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: StickerAdmin["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status === "active"
          ? "bg-green-50 text-green-700 border border-green-100"
          : "bg-gray-50 text-gray-600 border border-gray-100"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
      {status === "active" ? "Aktiv" : "Inaktiv"}
    </span>
  );
}

function TypeBadge({ type }: { type: StickerAdmin["type"] }) {
  const labels: Record<StickerAdmin["type"], string> = {
    image: "Bild",
    text: "Text",
    css_badge: "CSS-Badge",
    tooltip: "Tooltip",
    combined: "Kombi",
  };
  return (
    <span className="inline-block text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
      {labels[type]}
    </span>
  );
}

function StickerPreview({ sticker }: { sticker: StickerAdmin }) {
  if (sticker.type === "image" && sticker.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={sticker.image_url} alt={sticker.name} className="h-7 w-auto rounded object-cover" />
    );
  }
  const text = sticker.translations.find((t) => t.locale === "de")?.text ?? sticker.name;
  return (
    <span
      className="inline-block text-xs font-semibold px-2 py-0.5 rounded"
      style={{
        color: sticker.text_color ?? "#fff",
        backgroundColor: sticker.bg_color ?? "#22c55e",
        borderRadius: sticker.border_radius ?? "4px",
        fontWeight: sticker.font_bold ? "bold" : undefined,
        fontStyle: sticker.font_italic ? "italic" : undefined,
        opacity: sticker.opacity ?? 1,
      }}
    >
      {text}
    </span>
  );
}

export default async function StickersPage() {
  let stickers: StickerAdmin[] = [];
  let error: string | null = null;

  try {
    stickers = await api.stickers.list();
  } catch (e) {
    error = (e as Error).message;
  }

  const activeCount = stickers.filter((s) => s.status === "active").length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sticker &amp; Labels</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stickers.length} Sticker gesamt · {activeCount} aktiv
          </p>
        </div>
        <Link
          href="/stickers/new"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
        >
          + Neuer Sticker
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          Fehler beim Laden: {error}
        </div>
      )}

      {stickers.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-4">Noch keine Sticker angelegt.</p>
          <Link
            href="/stickers/new"
            className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            Ersten Sticker erstellen
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Vorschau</th>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Typ</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Priorität</th>
                <th className="px-5 py-3 text-left">Regeln</th>
                <th className="px-5 py-3 text-left">Gültig bis</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stickers.map((sticker) => (
                <tr key={sticker.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <StickerPreview sticker={sticker} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{sticker.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Position: {sticker.position.replace("_", " ")}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <TypeBadge type={sticker.type} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={sticker.status} />
                  </td>
                  <td className="px-5 py-4 text-gray-500 tabular-nums">{sticker.priority}</td>
                  <td className="px-5 py-4">
                    {sticker.rules.length > 0 ? (
                      <span className="text-xs text-gray-700">
                        {sticker.rules.length} Regel{sticker.rules.length !== 1 ? "n" : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-orange-500">Keine Regeln</span>
                    )}
                    {sticker.override_count > 0 && (
                      <div className="text-xs text-blue-500 mt-0.5">
                        {sticker.override_count} Override{sticker.override_count !== 1 ? "s" : ""}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {sticker.valid_until
                      ? new Date(sticker.valid_until).toLocaleDateString("de-DE")
                      : "–"}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/stickers/${sticker.id}`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
