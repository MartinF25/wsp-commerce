import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="de">
      <body className="bg-white text-gray-900 font-sans antialiased min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-6xl font-bold text-green-500 mb-4">404</p>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Seite nicht gefunden
          </h1>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Die aufgerufene Seite existiert nicht oder wurde verschoben.
          </p>
          <Link
            href="/"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-150"
          >
            Zur Startseite
          </Link>
        </div>
      </body>
    </html>
  );
}
