import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "WSP Admin",
  description: "Interne Katalogpflege",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
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
