import Link from "next/link";
import { api } from "@/lib/api";
import type { Category } from "@/lib/api";

export const dynamic = "force-dynamic";

interface TreeNode {
  category: Category;
  children: TreeNode[];
  depth: number;
}

function buildTree(categories: Category[]): TreeNode[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const childrenMap = new Map<string | null, Category[]>();

  for (const cat of categories) {
    const key = cat.parent_id ?? null;
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(cat);
  }

  function buildNodes(parentId: string | null, depth: number): TreeNode[] {
    return (childrenMap.get(parentId) ?? []).map((cat) => ({
      category: cat,
      children: buildNodes(cat.id, depth + 1),
      depth,
    }));
  }

  return buildNodes(null, 0);
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  function walk(list: TreeNode[]) {
    for (const node of list) {
      result.push(node);
      walk(node.children);
    }
  }
  walk(nodes);
  return result;
}

function TreePrefix({ depth, isLast }: { depth: number; isLast: boolean }) {
  if (depth === 0) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
      {Array.from({ length: depth - 1 }).map((_, i) => (
        <span key={i} style={{ display: "inline-block", width: 20, borderLeft: "1px dashed #e2e8f0", height: 24, marginBottom: -6 }} />
      ))}
      <span style={{ display: "inline-block", width: 20, borderLeft: "1px dashed #e2e8f0", borderBottom: "1px dashed #e2e8f0", height: 12, marginBottom: 0, marginRight: 4, verticalAlign: "middle" }} />
    </span>
  );
}

export default async function CategoriesPage() {
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    categories = await api.categories.list();
  } catch (e) {
    error = (e as Error).message;
  }

  const tree = buildTree(categories);
  const flat = flattenTree(tree);

  const rootCount = tree.length;
  const withChildren = tree.filter((n) => n.children.length > 0).length;
  const totalChildren = categories.filter((c) => c.parent_id !== null).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Kategorien</h1>
          <div className="page-subtitle">
            {rootCount} Hauptkategorien · {withChildren} mit Unterkategorien · {totalChildren} Unterkategorien gesamt
          </div>
        </div>
        <Link href="/categories/new" className="btn btn-primary">+ Neue Kategorie</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Kategorie</th>
              <th>Slug</th>
              <th style={{ textAlign: "center" }}>Ebene</th>
              <th style={{ textAlign: "center" }}>Unterkategorien</th>
              <th style={{ textAlign: "center" }}>Produkte</th>
              <th style={{ textAlign: "center" }}>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {flat.length === 0 ? (
              <tr><td colSpan={8} className="empty">Keine Kategorien vorhanden.</td></tr>
            ) : (
              flat.map((node, idx) => {
                const cat = node.category;
                const isRoot = node.depth === 0;
                const hasChildren = node.children.length > 0;

                // determine if last child of its parent for tree lines
                const siblings = flat.filter((n) => n.category.parent_id === cat.parent_id);
                const isLast = siblings[siblings.length - 1]?.category.id === cat.id;

                return (
                  <tr
                    key={cat.id}
                    style={{
                      background: isRoot ? "#f8fafc" : "white",
                      borderTop: isRoot && idx > 0 ? "2px solid #e2e8f0" : undefined,
                    }}
                  >
                    {/* Expand/Collapse visual indicator */}
                    <td style={{ textAlign: "center", padding: "6px 4px" }}>
                      {isRoot ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 22, height: 22, borderRadius: 6,
                          background: hasChildren ? "#dbeafe" : "#f1f5f9",
                          color: hasChildren ? "#1d4ed8" : "#94a3b8",
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {hasChildren ? "▾" : "—"}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: 11 }}>
                          {node.children.length > 0 ? "▾" : "·"}
                        </span>
                      )}
                    </td>

                    {/* Name with tree indentation */}
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                        {/* Tree lines */}
                        {node.depth > 0 && (
                          <span style={{ display: "inline-flex", alignItems: "center", marginRight: 6, flexShrink: 0 }}>
                            {Array.from({ length: node.depth - 1 }).map((_, i) => (
                              <span key={i} style={{
                                display: "inline-block", width: 16,
                                borderLeft: "1px solid #e2e8f0",
                                height: 32, marginTop: -4,
                              }} />
                            ))}
                            <span style={{
                              display: "inline-block", width: 16,
                              borderLeft: "1px solid #e2e8f0",
                              borderBottom: "1px solid #e2e8f0",
                              height: 16, marginBottom: -8,
                            }} />
                          </span>
                        )}

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {isRoot && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: "1px 6px",
                                borderRadius: 4, background: "#1e293b", color: "#fff",
                                letterSpacing: "0.05em", flexShrink: 0,
                              }}>
                                ROOT
                              </span>
                            )}
                            <Link
                              href={`/categories/${cat.id}`}
                              style={{
                                fontWeight: isRoot ? 700 : node.depth === 1 ? 600 : 400,
                                fontSize: isRoot ? 14 : 13,
                                color: "#1e293b",
                                textDecoration: "none",
                              }}
                            >
                              {cat.name}
                            </Link>
                            {hasChildren && (
                              <span style={{
                                fontSize: 10, color: "#64748b",
                                background: "#f1f5f9", padding: "1px 5px", borderRadius: 4,
                              }}>
                                {node.children.length} Sub
                              </span>
                            )}
                          </div>
                          {cat.description && (
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, maxWidth: 340 }}>
                              {cat.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                      {cat.slug}
                    </td>

                    {/* Depth level */}
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
                        background: node.depth === 0 ? "#1e293b" : node.depth === 1 ? "#dbeafe" : "#f0fdf4",
                        color: node.depth === 0 ? "#fff" : node.depth === 1 ? "#1d4ed8" : "#166534",
                      }}>
                        {node.depth === 0 ? "Ebene 1" : node.depth === 1 ? "Ebene 2" : `Ebene ${node.depth + 1}`}
                      </span>
                    </td>

                    {/* Children count */}
                    <td style={{ textAlign: "center", fontSize: 13, color: hasChildren ? "#1e293b" : "#94a3b8", fontWeight: hasChildren ? 600 : 400 }}>
                      {hasChildren ? node.children.length : "–"}
                    </td>

                    {/* Product count */}
                    <td style={{ textAlign: "center", fontSize: 13 }}>
                      {cat.productCount ?? 0}
                    </td>

                    {/* Status */}
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge ${cat.is_active ? "badge-active" : "badge-inactive"}`}>
                        {cat.is_active ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <Link href={`/categories/${cat.id}`} className="btn btn-secondary btn-sm">
                        Bearbeiten
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#64748b" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "#1e293b", color: "#fff", fontSize: 10 }}>ROOT</span>
          Hauptkategorie (keine Elternkategorie)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "#dbeafe", color: "#1d4ed8", fontSize: 10 }}>Ebene 2</span>
          Direkte Unterkategorie
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ padding: "1px 5px", borderRadius: 4, background: "#f1f5f9", color: "#64748b", fontSize: 10 }}>3 Sub</span>
          Anzahl direkter Unterkategorien
        </span>
      </div>
    </>
  );
}
