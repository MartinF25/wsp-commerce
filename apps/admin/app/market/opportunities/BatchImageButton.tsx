"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BatchResult {
  processed: number;
  updated: number;
  skipped: number;
  mode: string;
}

export function BatchImageButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"ka-images" | "no-image">("ka-images");

  async function handleRun() {
    if (!confirm(
      mode === "ka-images"
        ? "Alle KA-Bilder + bildlose Drafts mit DALL-E neu bebildern? (bis 10 Produkte, dauert mehrere Minuten)"
        : "Nur bildlose Drafts mit DALL-E bebildern? (bis 10 Produkte)"
    )) return;

    setRunning(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/market/opportunities/batch-refresh-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 10, mode }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      setResult(body);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as "ka-images" | "no-image")}
        disabled={running}
        style={{
          padding: "5px 8px",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          fontSize: 12,
          color: "#374151",
          background: "#fff",
        }}
      >
        <option value="ka-images">KA-Bilder ersetzen</option>
        <option value="no-image">Nur bildlose Drafts</option>
      </select>
      <button
        onClick={handleRun}
        disabled={running}
        className="btn btn-secondary btn-sm"
        style={{ whiteSpace: "nowrap" }}
        title="Generiert DALL-E HD Bilder für Produkt-Drafts mit Kleinanzeigen-Bildern oder ohne Bild"
      >
        {running ? "DALL-E läuft…" : "Bilder generieren"}
      </button>
      {result && !running && (
        <span style={{ fontSize: 12, color: "#166534" }}>
          ✓ {result.updated} generiert · {result.skipped} übersprungen
        </span>
      )}
      {error && !running && (
        <span style={{ fontSize: 12, color: "#991b1b" }}>{error}</span>
      )}
    </div>
  );
}
