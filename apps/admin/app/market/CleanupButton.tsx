"use client";

import { useState, useTransition } from "react";
import { cleanupListings } from "./actions";

export function CleanupButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ deleted: number; reclassified: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCleanup() {
    if (!confirm("Listings mit ungültigem Keyword löschen und restliche Listings neu klassifizieren?")) return;
    setResult(null);
    setError(null);
    startTransition(async () => {
      try {
        const r = await cleanupListings();
        setResult(r);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={handleCleanup} disabled={isPending} className="btn btn-secondary btn-sm">
        {isPending ? "Bereinige…" : "Bereinigen"}
      </button>
      {result && (
        <span className="listing-meta">
          {result.deleted} gelöscht · {result.reclassified} neu klassifiziert
        </span>
      )}
      {error && <span style={{ fontSize: 12, color: "#991b1b" }}>{error}</span>}
    </div>
  );
}
