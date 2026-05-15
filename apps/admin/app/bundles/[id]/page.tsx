import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { BundleForm } from "@/components/BundleForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function EditBundlePage({ params }: Props) {
  const [bundleResult, productsResult, categoriesResult] = await Promise.allSettled([
    api.bundles.get(params.id),
    api.products.list(),
    api.categories.list(),
  ]);

  if (bundleResult.status === "rejected") notFound();
  const bundle = bundleResult.value;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/bundles" className="text-sm text-gray-400 hover:text-gray-600">
              Bundles
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-600">{bundle.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bundle bearbeiten</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Status-Toggle */}
          <form action={`/api/admin-proxy/bundles/${params.id}/status`} method="PATCH">
            <button
              type="submit"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                bundle.status === "active"
                  ? "border-red-200 text-red-600 hover:bg-red-50"
                  : "border-green-200 text-green-600 hover:bg-green-50"
              }`}
            >
              {bundle.status === "active" ? "Deaktivieren" : "Aktivieren"}
            </button>
          </form>
        </div>
      </div>

      <BundleForm
        mode="edit"
        bundle={bundle}
        products={productsResult.status === "fulfilled" ? productsResult.value : []}
        categories={categoriesResult.status === "fulfilled" ? categoriesResult.value : []}
      />
    </div>
  );
}
