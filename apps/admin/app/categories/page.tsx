import Link from "next/link";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof api.categories.list>> = [];
  let error: string | null = null;

  try {
    categories = await api.categories.list();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <>
      <div className="page-header">
        <h1>Kategorien</h1>
        <Link href="/categories/new" className="btn btn-primary">+ Neue Kategorie</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Aktiv</th>
              <th>Produkte</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={5} className="empty">Keine Kategorien vorhanden.</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <Link href={`/categories/${cat.id}`}>{cat.name}</Link>
                    {cat.description && (
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{cat.description}</div>
                    )}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{cat.slug}</td>
                  <td>
                    <span className={`badge ${cat.is_active ? "badge-active" : "badge-inactive"}`}>
                      {cat.is_active ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td>{cat.productCount ?? 0}</td>
                  <td>
                    <Link href={`/categories/${cat.id}`} className="btn btn-secondary btn-sm">Bearbeiten</Link>
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
