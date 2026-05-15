"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BundleSummary, BundleInput, ProductSummary, Category, BundleItemInput } from "@/lib/api";

interface BundleFormProps {
  mode: "create" | "edit";
  bundle?: BundleSummary;
  products: ProductSummary[];
  categories: Category[];
}

const DISCOUNT_TYPES = [
  { value: "none", label: "Kein Rabatt (nur Cross-Sell-Anzeige)" },
  { value: "percentage", label: "Prozentualer Rabatt" },
  { value: "fixed", label: "Fester Rabattbetrag (€)" },
  { value: "per_item", label: "Rabatt pro Artikel" },
];

const DISCOUNT_MODES = [
  { value: "all_items", label: "Nur wenn alle Pflichtprodukte im Warenkorb" },
  { value: "min_count", label: "Ab Mindestanzahl ausgewählter Produkte" },
  { value: "any_item", label: "Bei jedem Kauf (mind. 1 Produkt)" },
];

const DISPLAY_MODES = [
  { value: "card", label: "Kartenlayout (Standard)" },
  { value: "list", label: "Listenlayout (kompakt)" },
  { value: "slider", label: "Slider/Karussell" },
  { value: "tabs", label: "Tab-Darstellung" },
];

export function BundleForm({ mode, bundle, products, categories }: BundleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Formularfelder
  const [titleDe, setTitleDe] = useState(bundle?.title ?? "");
  const [descDe, setDescDe] = useState(bundle?.description ?? "");
  const [tabNameDe, setTabNameDe] = useState(bundle?.tab_name ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(bundle?.status ?? "inactive");
  const [sortOrder, setSortOrder] = useState(bundle?.sort_order ?? 0);
  const [imageUrl, setImageUrl] = useState(bundle?.image_url ?? "");
  const [validFrom, setValidFrom] = useState(
    bundle?.valid_from ? new Date(bundle.valid_from).toISOString().slice(0, 16) : ""
  );
  const [validUntil, setValidUntil] = useState(
    bundle?.valid_until ? new Date(bundle.valid_until).toISOString().slice(0, 16) : ""
  );
  const [discountType, setDiscountType] = useState<BundleInput["discount_type"]>(
    bundle?.discount_type ?? "none"
  );
  const [discountPercent, setDiscountPercent] = useState<string>(
    bundle?.discount_percent?.toString() ?? ""
  );
  const [discountCents, setDiscountCents] = useState<string>(
    bundle?.discount_cents != null ? (bundle.discount_cents / 100).toFixed(2) : ""
  );
  const [discountMode, setDiscountMode] = useState<BundleInput["discount_mode"]>(
    bundle?.discount_mode ?? "all_items"
  );
  const [minItemsForDiscount, setMinItemsForDiscount] = useState(
    bundle?.min_items_for_discount ?? 1
  );
  const [displayMode, setDisplayMode] = useState<BundleInput["display_mode"]>(
    bundle?.display_mode ?? "card"
  );
  const [tabGroup, setTabGroup] = useState(bundle?.tab_group ?? "");

  // Bundle-Items state
  const [items, setItems] = useState<Array<{
    id?: string;
    productId: string;
    quantity: number;
    isRequired: boolean;
    sortOrder: number;
    discountPercent: string;
    discountCents: string;
  }>>(
    bundle?.items.map((item, i) => ({
      id: item.id,
      productId: item.product.id,
      quantity: item.quantity,
      isRequired: item.is_required,
      sortOrder: item.sort_order,
      discountPercent: item.discount_percent?.toString() ?? "",
      discountCents: item.discount_cents != null ? (item.discount_cents / 100).toFixed(2) : "",
    })) ?? []
  );

  const [newProductId, setNewProductId] = useState("");

  function addItem() {
    if (!newProductId) return;
    if (items.some((i) => i.productId === newProductId)) return;
    setItems((prev) => [
      ...prev,
      {
        productId: newProductId,
        quantity: 1,
        isRequired: true,
        sortOrder: prev.length,
        discountPercent: "",
        discountCents: "",
      },
    ]);
    setNewProductId("");
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, patch: Partial<(typeof items)[0]>) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!titleDe.trim()) {
      setError("Titel (DE) ist Pflichtfeld.");
      return;
    }
    if (items.length === 0) {
      setError("Das Bundle braucht mindestens ein Produkt.");
      return;
    }

    const payload: BundleInput = {
      status,
      sort_order: sortOrder,
      image_url: imageUrl.trim() || null,
      valid_from: validFrom ? new Date(validFrom).toISOString() : null,
      valid_until: validUntil ? new Date(validUntil).toISOString() : null,
      discount_type: discountType,
      discount_percent:
        discountType === "percentage" && discountPercent
          ? parseFloat(discountPercent)
          : null,
      discount_cents:
        discountType === "fixed" && discountCents
          ? Math.round(parseFloat(discountCents) * 100)
          : null,
      discount_mode: discountMode,
      min_items_for_discount: minItemsForDiscount,
      display_mode: displayMode,
      tab_group: tabGroup.trim() || null,
      translations: [
        {
          locale: "de",
          title: titleDe.trim(),
          description: descDe.trim() || null,
          tab_name: tabNameDe.trim() || null,
        },
      ],
    };

    try {
      let bundleId: string;

      if (mode === "create") {
        const res = await fetch("/api/admin-proxy/bundles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err?.error?.message ?? "Fehler beim Erstellen");
        }
        const data = await res.json();
        bundleId = data.data.id;

        // Bundle-Items hinzufügen
        for (const item of items) {
          const itemPayload: BundleItemInput = {
            product_id: item.productId,
            quantity: item.quantity,
            is_required: item.isRequired,
            sort_order: item.sortOrder,
            discount_percent:
              item.discountPercent ? parseFloat(item.discountPercent) : null,
            discount_cents:
              item.discountCents ? Math.round(parseFloat(item.discountCents) * 100) : null,
          };
          await fetch(`/api/admin-proxy/bundles/${bundleId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemPayload),
          });
        }
      } else {
        bundleId = bundle!.id;
        const res = await fetch(`/api/admin-proxy/bundles/${bundleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err?.error?.message ?? "Fehler beim Aktualisieren");
        }
      }

      startTransition(() => {
        router.push("/bundles");
        router.refresh();
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const availableProducts = products.filter(
    (p) => !items.some((i) => i.productId === p.id)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ─── Grunddaten ─────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Grunddaten</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Titel (DE) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titleDe}
              onChange={(e) => setTitleDe(e.target.value)}
              placeholder="z. B. Komplett-Set Solar & Wind"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tab-Name (DE)</label>
            <input
              type="text"
              value={tabNameDe}
              onChange={(e) => setTabNameDe(e.target.value)}
              placeholder="z. B. Zubehör, Häufig zusammen"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Beschreibung (DE)</label>
          <textarea
            value={descDe}
            onChange={(e) => setDescDe(e.target.value)}
            rows={2}
            placeholder="Kurze Bundle-Beschreibung..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="inactive">Inaktiv</option>
              <option value="active">Aktiv</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sortierung</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tab-Gruppe</label>
            <input
              type="text"
              value={tabGroup}
              onChange={(e) => setTabGroup(e.target.value)}
              placeholder="z. B. zubehoer"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bild-URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gültig ab</label>
            <input
              type="datetime-local"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gültig bis</label>
            <input
              type="datetime-local"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Darstellungsart</label>
          <select
            value={displayMode}
            onChange={(e) => setDisplayMode(e.target.value as typeof displayMode)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            {DISPLAY_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ─── Rabatt-Konfiguration ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Rabatt-Konfiguration</h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rabattart</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            {DISCOUNT_TYPES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {discountType === "percentage" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Rabatt in % (z. B. 10 für 10%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        )}

        {discountType === "fixed" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fester Rabatt in € (z. B. 29.90)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={discountCents}
              onChange={(e) => setDiscountCents(e.target.value)}
              className="w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        )}

        {discountType !== "none" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rabatt-Bedingung</label>
              <select
                value={discountMode}
                onChange={(e) => setDiscountMode(e.target.value as typeof discountMode)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {DISCOUNT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {discountMode === "min_count" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Mindestanzahl für Rabatt
                </label>
                <input
                  type="number"
                  min={1}
                  value={minItemsForDiscount}
                  onChange={(e) => setMinItemsForDiscount(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── Bundle-Produkte ──────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4 shadow-sm">
        <h2 className="font-semibold text-gray-900">
          Bundle-Produkte{" "}
          <span className="text-sm font-normal text-gray-400">({items.length} ausgewählt)</span>
        </h2>

        {/* Produkt hinzufügen */}
        <div className="flex gap-2">
          <select
            value={newProductId}
            onChange={(e) => setNewProductId(e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Produkt auswählen…</option>
            {availableProducts.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addItem}
            disabled={!newProductId}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            Hinzufügen
          </button>
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, idx) => {
              const product = products.find((p) => p.id === item.productId);
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product?.name ?? item.productId}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={item.isRequired}
                          onChange={(e) => updateItem(idx, { isRequired: e.target.checked })}
                          className="rounded"
                        />
                        Pflichtprodukt
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        Menge:
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                          className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-xs"
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        Rabatt %:
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.discountPercent}
                          onChange={(e) => updateItem(idx, { discountPercent: e.target.value })}
                          placeholder="–"
                          className="w-16 rounded border border-gray-200 px-1.5 py-0.5 text-xs"
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        Sortierung:
                        <input
                          type="number"
                          value={item.sortOrder}
                          onChange={(e) => updateItem(idx, { sortOrder: parseInt(e.target.value) || 0 })}
                          className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-xs"
                        />
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    aria-label="Produkt entfernen"
                    className="text-gray-400 hover:text-red-500 transition-colors mt-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Aktionen ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/bundles")}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isPending
            ? "Wird gespeichert…"
            : mode === "create"
            ? "Bundle erstellen"
            : "Änderungen speichern"}
        </button>
      </div>
    </form>
  );
}
