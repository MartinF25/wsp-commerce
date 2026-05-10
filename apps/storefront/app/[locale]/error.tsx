"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center py-24 px-4">
      <div className="text-center max-w-md">
        <p className="text-5xl font-bold text-brand-accent mb-4">!</p>
        <h1 className="text-2xl font-semibold text-brand-text mb-3">
          Etwas ist schiefgelaufen
        </h1>
        <p className="text-brand-muted mb-8">
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-brand-accent hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors duration-150"
          >
            Erneut versuchen
          </button>
          <Link
            href="/"
            className="border border-gray-200 hover:border-gray-300 text-brand-text font-semibold px-5 py-2.5 rounded-lg transition-colors duration-150"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </main>
  );
}
