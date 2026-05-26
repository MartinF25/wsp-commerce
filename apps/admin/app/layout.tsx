import Link from "next/link";

const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; color: #111; background: #f5f5f5; line-height: 1.5; }
a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }
.layout { display: flex; min-height: 100vh; }
.sidebar { width: 200px; background: #1e293b; color: #cbd5e1; padding: 24px 0; flex-shrink: 0; }
.sidebar-title { font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; padding: 0 16px 16px; border-bottom: 1px solid #334155; margin-bottom: 8px; }
.sidebar nav a { display: block; padding: 8px 16px; color: #cbd5e1; border-left: 3px solid transparent; }
.sidebar nav a:hover, .sidebar nav a.active { background: #334155; color: #f1f5f9; border-left-color: #3b82f6; text-decoration: none; }
.main { flex: 1; padding: 32px; overflow-y: auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h1 { font-size: 20px; font-weight: 600; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: background 0.15s; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary { background: #e2e8f0; color: #334155; }
.btn-secondary:hover { background: #cbd5e1; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
.btn-sm { padding: 4px 10px; font-size: 12px; }
.table-wrapper { background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
thead { background: #f8fafc; }
th { padding: 10px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #f8fafc; }
.badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.badge-active { background: #dcfce7; color: #166534; }
.badge-draft { background: #fef9c3; color: #854d0e; }
.badge-archived { background: #f1f5f9; color: #64748b; }
.badge-inactive { background: #fee2e2; color: #991b1b; }
.badge-type { background: #ede9fe; color: #5b21b6; }
.form-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; max-width: 860px; }
.form-row { display: grid; gap: 16px; margin-bottom: 16px; }
.form-row-2 { grid-template-columns: 1fr 1fr; }
.form-row-3 { grid-template-columns: 1fr 1fr 1fr; }
label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; }
label .req { color: #ef4444; margin-left: 2px; }
label .opt { color: #9ca3af; font-weight: 400; margin-left: 4px; }
input[type="text"], input[type="number"], input[type="url"], select, textarea { width: 100%; padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #111; background: #fff; outline: none; transition: border-color 0.15s; }
input:focus, select:focus, textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px #bfdbfe; }
textarea { min-height: 80px; resize: vertical; }
.checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.checkbox-row input { width: auto; }
.tabs { display: flex; gap: 0; border-bottom: 2px solid #e2e8f0; margin-bottom: 20px; }
.tab-btn { padding: 8px 20px; font-size: 13px; font-weight: 500; color: #64748b; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; transition: color 0.15s; }
.tab-btn:hover { color: #111; }
.tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; }
.tab-required::after { content: " *"; color: #ef4444; }
.tab-optional { color: #9ca3af; }
.section-title { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
.sub-table-wrapper { border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-bottom: 8px; }
.sub-table-wrapper table th { background: #f8fafc; }
.alert { padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; }
.alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
.alert-success { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
.actions-row { display: flex; gap: 8px; align-items: center; }
.empty { color: #9ca3af; font-size: 13px; padding: 32px; text-align: center; }
hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
.form-actions { display: flex; gap: 8px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
.page-subtitle { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.tab-badge { margin-left: 6px; font-size: 11px; background: #e2e8f0; color: #64748b; border-radius: 999px; padding: 1px 7px; font-weight: 600; }
.kpi-grid { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
.kpi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; min-width: 110px; }
.kpi-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.kpi-value { font-size: 22px; font-weight: 700; color: #111; line-height: 1; }
.kpi-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.table-toolbar-meta { font-size: 12px; color: #94a3b8; }
.table-toolbar-legend { font-size: 12px; color: #94a3b8; display: flex; gap: 16px; }
.legend-item { display: flex; align-items: center; gap: 5px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.listing-img { width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; display: block; }
.listing-img-placeholder { width: 44px; height: 44px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
.listing-title { font-weight: 500; color: #111; margin-bottom: 2px; }
.listing-meta { font-size: 12px; color: #94a3b8; }
.modal-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,0.35); }
.modal-content { width: 100%; max-width: 400px; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.modal-img-row { display: flex; gap: 12px; margin-bottom: 20px; }
.modal-img { width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; flex-shrink: 0; }
.modal-label { display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.modal-select { margin-bottom: 16px; }
.modal-actions { display: flex; gap: 8px; }
.modal-btn-flex { flex: 1; }
.empty-dashed { border: 1px dashed #e2e8f0; border-radius: 8px; }
.empty-sub { margin-top: 4px; font-size: 12px; }
.code-inline { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; }
`;

export const metadata = {
  title: "WSP Admin",
  description: "Interne Katalogpflege",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-title">WSP Admin</div>
            <nav>
              <Link href="/categories">Kategorien</Link>
              <Link href="/products">Produkte</Link>
              <Link href="/media">Medien</Link>
              <div style={{ padding: "12px 16px 4px", fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Blog</div>
              <Link href="/blog">Posts</Link>
              <Link href="/blog/categories">Kategorien</Link>
              <Link href="/blog/tags">Tags</Link>
              <div style={{ padding: "12px 16px 4px", fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Marketing</div>
              <Link href="/ticker">Live-Ticker</Link>
              <Link href="/bundles">Bundles</Link>
              <Link href="/stickers">Sticker &amp; Labels</Link>
              <div style={{ padding: "12px 16px 4px", fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Affiliate</div>
              <Link href="/affiliate">Klick-Statistiken</Link>
              <Link href="/import">Produkt-Import</Link>
              <div style={{ padding: "12px 16px 4px", fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Feature Visuals</div>
              <Link href="/feature-definitions">Definitionen</Link>
              <Link href="/feature-visuals">Visuals</Link>
              <Link href="/feature-visuals/settings">Einstellungen</Link>
              <div style={{ padding: "12px 16px 4px", fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Markt</div>
              <Link href="/market">SkyWind Markt</Link>
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
