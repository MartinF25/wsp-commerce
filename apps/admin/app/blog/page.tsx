import Link from "next/link";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf",
  published: "Veröffentlicht",
  archived: "Archiviert",
};

const STATUS_BADGE: Record<string, string> = {
  draft: "badge-draft",
  published: "badge-active",
  archived: "badge-archived",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function BlogPostsPage() {
  let posts: Awaited<ReturnType<typeof api.blog.posts.list>> = [];
  let error: string | null = null;

  try {
    posts = await api.blog.posts.list({ limit: 100 });
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <>
      <div className="page-header">
        <h1>Blog-Posts</h1>
        <Link href="/blog/new" className="btn btn-primary">+ Neuer Beitrag</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Titel (DE)</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Kategorie</th>
              <th>Sprachen</th>
              <th>Veröffentlicht</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr><td colSpan={7} className="empty">Noch keine Beiträge vorhanden.</td></tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link href={`/blog/${post.id}`} style={{ fontWeight: 500 }}>
                      {post.featured && <span style={{ color: "#f59e0b", marginRight: 4 }}>★</span>}
                      {post.titleDe}
                    </Link>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{post.slug}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[post.status] ?? "badge-draft"}`}>
                      {STATUS_LABEL[post.status] ?? post.status}
                    </span>
                  </td>
                  <td style={{ color: "#64748b", fontSize: 12 }}>{post.category?.slug ?? "—"}</td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>
                    {post.availableLocales.map((l) => l.toUpperCase()).join(", ")}
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{formatDate(post.publishedAt)}</td>
                  <td>
                    <Link href={`/blog/${post.id}`} className="btn btn-secondary btn-sm">Bearbeiten</Link>
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
