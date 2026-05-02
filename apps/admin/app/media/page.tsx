import Link from "next/link";

interface ImageEntry {
  id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  product_id: string;
  product: { id: string; slug: string; name: string };
}

async function fetchAllImages(): Promise<ImageEntry[]> {
  const BASE_URL = (process.env.COMMERCE_API_URL ?? "").replace(/\/$/, "");
  const ADMIN_KEY = process.env.ADMIN_API_KEY ?? "";

  const res = await fetch(`${BASE_URL}/api/admin/images`, {
    headers: { "X-Admin-Key": ADMIN_KEY },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const json = await res.json();
  return json.data ?? [];
}

export default async function MediaPage() {
  const images = await fetchAllImages();

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Medienübersicht</h1>
        <Link href="/" style={{ fontSize: 13, color: "#6b7280" }}>← Zurück</Link>
      </div>

      {images.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#9ca3af" }}>
          Noch keine Bilder vorhanden. Bilder über die Produktbearbeitung hochladen.
        </div>
      ) : (
        <>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
            {images.length} Bild{images.length !== 1 ? "er" : ""} in{" "}
            {new Set(images.map((e) => e.product_id)).size} Produkt
            {new Set(images.map((e) => e.product_id)).size !== 1 ? "en" : ""}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {images.map((image) => (
              <div key={image.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                <div style={{ aspectRatio: "4/3", background: "#f9fafb", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt ?? image.product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <Link
                    href={`/products/${image.product.id}`}
                    style={{ fontSize: 12, fontWeight: 600, color: "#374151", textDecoration: "none" }}
                  >
                    {image.product.name}
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
