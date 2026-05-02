import Link from "next/link";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  product_id: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  images: ProductImage[];
}

async function fetchAllImages(): Promise<{ product: Product; image: ProductImage }[]> {
  const BASE_URL = (process.env.COMMERCE_API_URL ?? "").replace(/\/$/, "");
  const ADMIN_KEY = process.env.ADMIN_API_KEY ?? "";

  const res = await fetch(`${BASE_URL}/api/admin/products?limit=200`, {
    headers: { "X-Admin-Key": ADMIN_KEY },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const json = await res.json();
  const products: Product[] = json.data ?? [];

  const result: { product: Product; image: ProductImage }[] = [];
  for (const product of products) {
    for (const image of product.images ?? []) {
      result.push({ product, image });
    }
  }
  return result;
}

export default async function MediaPage() {
  const entries = await fetchAllImages();

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Medienübersicht</h1>
        <Link href="/" style={{ fontSize: 13, color: "#6b7280" }}>← Zurück</Link>
      </div>

      {entries.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#9ca3af" }}>
          Noch keine Bilder vorhanden. Bilder über die Produktbearbeitung hochladen.
        </div>
      ) : (
        <>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
            {entries.length} Bild{entries.length !== 1 ? "er" : ""} in {new Set(entries.map(e => e.product.id)).size} Produkt{new Set(entries.map(e => e.product.id)).size !== 1 ? "en" : ""}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {entries.map(({ product, image }) => (
              <div key={image.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                <div style={{ aspectRatio: "4/3", background: "#f9fafb", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt ?? product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={undefined}
                  />
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <Link
                    href={`/products/${product.id}`}
                    style={{ fontSize: 12, fontWeight: 600, color: "#374151", textDecoration: "none" }}
                  >
                    {product.name}
                  </Link>
                  {image.alt && (
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {image.alt}
                    </p>
                  )}
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 10, color: "#6b7280", display: "block", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {image.url}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
