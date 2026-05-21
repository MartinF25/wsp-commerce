"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StickerProductOverride, ProductSummary } from "@/lib/api";
import { upsertOverrideAction, removeOverrideAction } from "@/app/stickers/actions";

interface Props {
  stickerId: string;
  stickerStatus: "active" | "inactive";
  overrides: StickerProductOverride[];
  products: ProductSummary[];
}

export function ProductOverridesSection({ stickerId, stickerStatus, overrides, products }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [mode, setMode] = useState<"enabled" | "excluded">("enabled");
  const [error, setError] = useState<string | null>(null);

  const overrideProductIds = new Set(overrides.map((o) => o.product_id));
  const available = products.filter((p) => !overrideProductIds.has(p.id));

  function handleAdd() {
    if (!selectedProductId) return;
    setError(null);
    startTransition(async () => {
      const result = await upsertOverrideAction(stickerId, {
        product_id: selectedProductId,
        enabled: mode === "enabled",
        excluded: mode === "excluded",
      });
      if (result.error) { setError(result.error); return; }
      setSelectedProductId("");
      router.refresh();
    });
  }

  function handleToggle(override: StickerProductOverride) {
    startTransition(async () => {
      await upsertOverrideAction(stickerId, {
        product_id: override.product_id,
        enabled: !override.enabled,
        excluded: override.excluded,
      });
      router.refresh();
    });
  }

  function handleRemove(productId: string) {
    startTransition(async () => {
      await removeOverrideAction(stickerId, productId);
      router.refresh();
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
        Manuelle Produkt-Zuordnung
      </h2>
      <p className="text-xs text-gray-400 mb-5">
        Ergänzt die automatischen Regeln oben. Aktiviert einen Sticker gezielt für einzelne Produkte,
        oder schließt Produkte explizit aus.
      </p>

      {stickerStatus === "inactive" && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <strong>Sticker ist inaktiv.</strong> Manuelle Zuordnungen haben keine Wirkung solange der Sticker auf
          &quot;Inaktiv&quot; steht – er wird im Storefront nicht angezeigt. Sticker oben auf &quot;Aktiv&quot; setzen.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Produkt hinzufügen ───────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          disabled={isPending}
        >
          <option value="">– Produkt wählen –</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "enabled" | "excluded")}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          disabled={isPending}
        >
          <option value="enabled">Aktivieren</option>
          <option value="excluded">Ausschließen</option>
        </select>

        <button
          onClick={handleAdd}
          disabled={!selectedProductId || isPending}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          + Hinzufügen
        </button>
      </div>

      {/* ── Übersicht ────────────────────────────────────────────────────── */}
      {overrides.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-xl">
          Noch keine manuellen Zuordnungen vorhanden.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {overrides.map((o) => (
            <div key={o.id} className="flex items-center justify-between py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    o.excluded
                      ? "bg-red-50 text-red-700"
                      : o.enabled
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {o.excluded ? "Ausgeschlossen" : o.enabled ? "Aktiviert" : "Deaktiviert"}
                </span>
                <span className="text-sm font-medium text-gray-900 truncate">{o.product.name}</span>
                <span className="text-xs text-gray-400 truncate hidden sm:block">{o.product.slug}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!o.excluded && (
                  <button
                    onClick={() => handleToggle(o)}
                    disabled={isPending}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {o.enabled ? "Deaktivieren" : "Aktivieren"}
                  </button>
                )}
                <button
                  onClick={() => handleRemove(o.product_id)}
                  disabled={isPending}
                  className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Entfernen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        <strong>Aktiviert:</strong> Sticker erscheint auf diesem Produkt unabhängig von Regeln. &nbsp;
        <strong>Ausgeschlossen:</strong> Sticker erscheint nie auf diesem Produkt, auch wenn eine Regel greift.
      </p>
    </div>
  );
}
