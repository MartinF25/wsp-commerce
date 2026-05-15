import { api } from "@/lib/api";
import type { BundleSummary } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: BundleSummary["status"] }) {
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

function DiscountBadge({ type, percent, cents }: {
  type: BundleSummary["discount_type"];
  percent: number | null;
  cents: number | null;
}) {
  if (type === "none") return <span className="text-xs text-gray-400">Kein Rabatt</span>;
  if (type === "percentage") return <span className="text-xs text-brand-green font-medium">−{percent}%</span>;
  if (type === "fixed" && cents) return <span className="text-xs text-brand-green font-medium">−{(cents / 100).toFixed(2)} €</span>;
  if (type === "per_item") return <span className="text-xs text-brand-green font-medium">Pro Artikel</span>;
  return null;
}

export default async function BundlesPage() {
  let bundles: BundleSummary[] = [];
  let error: string | null = null;

  try {
    bundles = await api.bundles.list();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cross-Sell Bundles</h1>
          <p className="text-sm text-gray-500 mt-1">
            {bundles.length} Bundle{bundles.length !== 1 ? "s" : ""} gesamt
          </p>
        </div>
        <Link
          href="/bundles/new"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
        >
          + Neues Bundle
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          Fehler beim Laden: {error}
        </div>
      )}

      {bundles.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-4">Noch keine Bundles angelegt.</p>
          <Link
            href="/bundles/new"
            className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            Erstes Bundle erstellen
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Titel</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Produkte im Bundle</th>
                <th className="px-5 py-3 text-left">Rabatt</th>
                <th className="px-5 py-3 text-left">Anzeige</th>
                <th className="px-5 py-3 text-left">Gültig bis</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bundles.map((bundle) => (
                <tr key={bundle.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{bundle.title}</div>
                    {bundle.tab_group && (
                      <div className="text-xs text-gray-400 mt-0.5">Tab: {bundle.tab_group}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={bundle.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-700 font-medium">{bundle.items.length}</span>
                      <span className="text-gray-400">Produkt{bundle.items.length !== 1 ? "e" : ""}</span>
                    </div>
                    {bundle.priceInfo?.savingsCents ? (
                      <div className="text-xs text-green-600 mt-0.5">
                        Ersparnis: {(bundle.priceInfo.savingsCents / 100).toFixed(2)} €
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <DiscountBadge
                      type={bundle.discount_type}
                      percent={bundle.discount_percent}
                      cents={bundle.discount_cents}
                    />
                  </td>
                  <td className="px-5 py-4 text-gray-500 capitalize">{bundle.display_mode}</td>
                  <td className="px-5 py-4 text-gray-500">
                    {bundle.valid_until
                      ? new Date(bundle.valid_until).toLocaleDateString("de-DE")
                      : "–"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/bundles/${bundle.id}`}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        Bearbeiten
                      </Link>
                    </div>
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
