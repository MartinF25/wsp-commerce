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
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
