import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center py-24 px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-[#22C55E] mb-4">404</p>
        <h1 className="text-2xl font-semibold text-[#1C1C1E] mb-3">
          Seite nicht gefunden
        </h1>
        <p className="text-[#6B7280] mb-8">
          Die aufgerufene Seite existiert nicht oder wurde verschoben.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#22C55E] hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-150"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  );
}
