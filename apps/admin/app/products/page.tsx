import Link from "next/link";
import { api } from "@/lib/api";
import type { ProductStatus, ProductType } from "@/lib/api";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Entwurf",
  active: "Online",
  archived: "Archiviert",
};

const TYPE_LABELS: Record<ProductType, string> = {
  direct_purchase: "Direktkauf",
  configurable: "Konfigurierbar",
  inquiry_only: "Nur Anfrage",
  affiliate_external: "Affiliate (extern)",
};

const STATUS_ORDER: Record<ProductStatus, number> = {
  active: 0,
  draft: 1,
  archived: 2,
};

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof api.products.list>> = [];
  let error: string | null = null;

  try {
    products = await api.products.list();
  } catch (e) {
    error = (e as Error).message;
  }

  const sorted = [...products].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
  );

  const onlineCount = products.filter((p) => p.status === "active").length;

  return (
    <>
      <div className="page-header">
        <h1>
          Produkte
          {onlineCount > 0 && (
            <span style={{
              marginLeft: 12,
              fontSize: 13,
              fontWeight: 500,
              color: "#166534",
              background: "#dcfce7",
              borderRadius: 999,
              padding: "2px 10px",
            }}>
              {onlineCount} online
            </span>
          )}
        </h1>
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
            {sorted.length === 0 ? (
              <tr><td colSpan={6} className="empty">Keine Produkte vorhanden.</td></tr>
            ) : (
              sorted.map((p) => (
                <tr key={p.id} style={p.status === "archived" ? { opacity: 0.55 } : undefined}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {p.status === "active" && (
                        <span title="Online" style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: "#22c55e", flexShrink: 0, display: "inline-block",
                        }} />
                      )}
                      <div>
                        <Link href={`/products/${p.id}`}>{p.name}</Link>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, fontFamily: "monospace" }}>{p.slug}</div>
                      </div>
                    </div>
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
