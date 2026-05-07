import Link from "next/link";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function BlogCategoriesPage() {
  let categories: Awaited<ReturnType<typeof api.blog.categories.list>> = [];
  let error: string | null = null;

  try {
    categories = await api.blog.categories.list();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <>
      <div className="page-header">
        <h1>Blog-Kategorien</h1>
        <Link href="/blog/categories/new" className="btn btn-primary">+ Neue Kategorie</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name (DE)</th>
              <th>Slug</th>
              <th>Aktiv</th>
              <th>Reihenfolge</th>
              <th>Beiträge</th>
              <th>Sprachen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={7} className="empty">Noch keine Kategorien vorhanden.</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <Link href={`/blog/categories/${cat.id}`} style={{ fontWeight: 500 }}>{cat.nameDe}</Link>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{cat.slug}</td>
                  <td>
                    <span className={`badge ${cat.isActive ? "badge-active" : "badge-inactive"}`}>
                      {cat.isActive ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td style={{ color: "#64748b" }}>{cat.sortOrder}</td>
                  <td style={{ color: "#64748b" }}>{cat.postCount}</td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>
                    {cat.availableLocales.map((l) => l.toUpperCase()).join(", ")}
                  </td>
                  <td>
                    <Link href={`/blog/categories/${cat.id}`} className="btn btn-secondary btn-sm">Bearbeiten</Link>
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
