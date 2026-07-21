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

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  new:      { label: "Neu",       color: "#166534" },
  like_new: { label: "Neuwertig", color: "#1d4ed8" },
  used:     { label: "Gebraucht", color: "#92400e" },
};

const CONDITION_BG: Record<string, string> = {
  new:      "#dcfce7",
  like_new: "#dbeafe",
  used:     "#fef3c7",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { status?: string; availability?: string; q?: string; category?: string };
}) {
  // Fetch all products for KPI counts (no filter)
  let allProducts: Awaited<ReturnType<typeof api.products.list>> = [];
  // Fetch filtered products for table display
  let products: Awaited<ReturnType<typeof api.products.list>> = [];
  let error: string | null = null;

  const filterStatus = searchParams.status;
  const filterAvailability = searchParams.availability;
  const filterQ = searchParams.q?.trim() ?? "";

  try {
    // Always fetch all for KPI
    allProducts = await api.products.list();

    // Fetch filtered (backend handles status/availability/q/category)
    if (filterStatus || filterAvailability || filterQ || searchParams.category) {
      products = await api.products.list({
        status: filterStatus,
        availability: filterAvailability,
        q: filterQ || undefined,
        category: searchParams.category,
      });
    } else {
      products = allProducts;
    }
  } catch (e) {
    error = (e as Error).message;
  }

  // KPI counts from all products
  const kpiOnline     = allProducts.filter((p) => p.status === "active").length;
  const kpiDraft      = allProducts.filter((p) => p.status === "draft").length;
  const kpiArchived   = allProducts.filter((p) => p.status === "archived").length;
  const kpiSold       = allProducts.filter((p) => p.availability_status === "discontinued").length;
  const kpiReserved   = allProducts.filter((p) => p.availability_status === "out_of_stock").length;
  const kpiKA         = allProducts.filter((p) => p.product_type === "affiliate_external").length;

  const isFiltered = !!(filterStatus || filterAvailability || filterQ || searchParams.category);
  const total = products.length;

  // Current active tab key
  const activeTab =
    filterAvailability === "discontinued" ? "sold"
    : filterAvailability === "out_of_stock" ? "reserved"
    : filterStatus === "active" ? "online"
    : filterStatus === "draft" ? "draft"
    : filterStatus === "archived" ? "archived"
    : "all";

  return (
    <>
      <div className="page-header">
        <h1>
          Produkte
          {isFiltered && total > 0 && (
            <span style={{
              marginLeft: 10, fontSize: 13, fontWeight: 500,
              color: "#4b5563", background: "#f3f4f6",
              borderRadius: 999, padding: "2px 10px",
            }}>
              {total} Ergebnisse
            </span>
          )}
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/products/kleinanzeigen" className="btn btn-secondary">Kleinanzeigen</Link>
          <Link href="/products/cleanup" className="btn btn-secondary">Bereinigung</Link>
          <Link href="/products/new" className="btn btn-primary">+ Neues Produkt</Link>
        </div>
      </div>

      {/* KPI-Zeile */}
      <div className="kpi-grid">
        <Link href="/products?status=active" style={{ textDecoration: "none" }}>
          <div className="kpi-card" style={{ borderTop: "3px solid #22c55e" }}>
            <div className="kpi-label">Online</div>
            <div className="kpi-value" style={{ color: "#166534" }}>{kpiOnline}</div>
          </div>
        </Link>
        <Link href="/products?status=draft" style={{ textDecoration: "none" }}>
          <div className="kpi-card" style={{ borderTop: "3px solid #eab308" }}>
            <div className="kpi-label">Entwurf</div>
            <div className="kpi-value" style={{ color: "#854d0e" }}>{kpiDraft}</div>
          </div>
        </Link>
        <Link href="/products?availability=discontinued" style={{ textDecoration: "none" }}>
          <div className="kpi-card" style={{ borderTop: "3px solid #ef4444" }}>
            <div className="kpi-label">Verkauft</div>
            <div className="kpi-value" style={{ color: "#991b1b" }}>{kpiSold}</div>
          </div>
        </Link>
        <Link href="/products?availability=out_of_stock" style={{ textDecoration: "none" }}>
          <div className="kpi-card" style={{ borderTop: "3px solid #f97316" }}>
            <div className="kpi-label">Reserviert</div>
            <div className="kpi-value" style={{ color: "#c2410c" }}>{kpiReserved}</div>
          </div>
        </Link>
        <Link href="/products?status=archived" style={{ textDecoration: "none" }}>
          <div className="kpi-card" style={{ borderTop: "3px solid #94a3b8" }}>
            <div className="kpi-label">Archiviert</div>
            <div className="kpi-value" style={{ color: "#475569" }}>{kpiArchived}</div>
          </div>
        </Link>
        {kpiKA > 0 && (
          <Link href="/products/kleinanzeigen" style={{ textDecoration: "none" }}>
            <div className="kpi-card" style={{ borderTop: "3px solid #a855f7" }}>
              <div className="kpi-label">Kleinanzeigen</div>
              <div className="kpi-value" style={{ color: "#6b21a8" }}>{kpiKA}</div>
            </div>
          </Link>
        )}
      </div>

      {/* Filter-Tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <Link href="/products" className={`tab-btn ${activeTab === "all" ? "active" : ""}`}>
            Alle <span className="tab-badge">{allProducts.length}</span>
          </Link>
          <Link href="/products?status=active" className={`tab-btn ${activeTab === "online" ? "active" : ""}`}>
            Online <span className="tab-badge">{kpiOnline}</span>
          </Link>
          <Link href="/products?status=draft" className={`tab-btn ${activeTab === "draft" ? "active" : ""}`}>
            Entwurf <span className="tab-badge">{kpiDraft}</span>
          </Link>
          <Link href="/products?availability=discontinued" className={`tab-btn ${activeTab === "sold" ? "active" : ""}`}>
            Verkauft <span className="tab-badge">{kpiSold}</span>
          </Link>
          <Link href="/products?availability=out_of_stock" className={`tab-btn ${activeTab === "reserved" ? "active" : ""}`}>
            Reserviert <span className="tab-badge">{kpiReserved}</span>
          </Link>
          <Link href="/products?status=archived" className={`tab-btn ${activeTab === "archived" ? "active" : ""}`}>
            Archiviert <span className="tab-badge">{kpiArchived}</span>
          </Link>
        </div>

        {/* Suchfeld */}
        <form method="GET" action="/products" style={{ display: "flex", gap: 6 }}>
          {filterStatus && <input type="hidden" name="status" value={filterStatus} />}
          {filterAvailability && <input type="hidden" name="availability" value={filterAvailability} />}
          <input
            type="text"
            name="q"
            defaultValue={filterQ}
            placeholder="Suche nach Name oder Slug…"
            style={{ width: 240, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: "6px 12px" }}>Suchen</button>
          {filterQ && (
            <Link href={`/products${filterStatus ? `?status=${filterStatus}` : filterAvailability ? `?availability=${filterAvailability}` : ""}`} className="btn btn-secondary" style={{ padding: "6px 12px" }}>
              ✕
            </Link>
          )}
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Zustand</th>
              <th>Typ</th>
              <th>Status</th>
              <th>Kategorie</th>
              <th>Varianten</th>
              <th>Lagerbestand</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={8} className="empty">Keine Produkte gefunden.</td></tr>
            ) : (
              products.map((p) => {
                const cond = CONDITION_LABELS[p.condition] ?? { label: p.condition, color: "#4b5563" };
                const condBg = CONDITION_BG[p.condition] ?? "#f3f4f6";
                return (
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
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px",
                        borderRadius: 999, background: condBg, color: cond.color,
                        border: `1px solid ${cond.color}22`,
                        whiteSpace: "nowrap",
                      }}>
                        {cond.label}
                      </span>
                    </td>
                    <td><span className="badge badge-type">{TYPE_LABELS[p.product_type]}</span></td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        <span className={`badge badge-${p.status}`}>{STATUS_LABELS[p.status]}</span>
                        {p.availability_status === "discontinued" && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 8px",
                            borderRadius: 999, background: "#fef2f2",
                            color: "#dc2626", border: "1px solid #fecaca",
                            whiteSpace: "nowrap",
                          }}>
                            🏷 Verkauft
                          </span>
                        )}
                        {p.availability_status === "out_of_stock" && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "2px 8px",
                            borderRadius: 999, background: "#fff7ed",
                            color: "#c2410c", border: "1px solid #fed7aa",
                            whiteSpace: "nowrap",
                          }}>
                            Reserviert
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{p.category?.name ?? <span style={{ color: "#9ca3af" }}>—</span>}</td>
                    <td>{p.variantCount}</td>
                    <td>
                      <span style={{ color: p.totalStock === 0 ? "#ef4444" : "#166534", fontWeight: 600 }}>
                        {p.totalStock}
                      </span>
                    </td>
                    <td>
                      <Link href={`/products/${p.id}`} className="btn btn-secondary btn-sm">Bearbeiten</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
