import Link from "next/link";
import { api } from "@/lib/api";
import type { ProductStatus, ProductType } from "@/lib/api";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Entwurf",
  active: "Aktiv",
  archived: "Archiviert",
};

const TYPE_LABELS: Record<ProductType, string> = {
  direct_purchase: "Direktkauf",
  configurable: "Konfigurierbar",
  inquiry_only: "Nur Anfrage",
};

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof api.products.list>> = [];
  let error: string | null = null;

  try {
    products = await api.products.list();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <>
      <div className="page-header">
        <h1>Produkte</h1>
        <Link href="/products/new" className="btn btn-primary">+ Neues Produkt</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Typ</th>
              <th>Status</th>
              <th>Kategorie</th>
              <th>Varianten</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={6} className="empty">Keine Produkte vorhanden.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/products/${p.id}`}>{p.name}</Link>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, fontFamily: "monospace" }}>{p.slug}</div>
                  </td>
                  <td><span className="badge badge-type">{TYPE_LABELS[p.product_type]}</span></td>
                  <td>
                    <span className={`badge badge-${p.status}`}>{STATUS_LABELS[p.status]}</span>
                  </td>
                  <td>{p.category?.name ?? <span style={{ color: "#9ca3af" }}>—</span>}</td>
                  <td>{p.variantCount}</td>
                  <td>
                    <Link href={`/products/${p.id}`} className="btn btn-secondary btn-sm">Bearbeiten</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
