"use client";

export default function IntelligenceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 32, fontFamily: "system-ui" }}>
      <h2 style={{ color: "#991b1b", marginBottom: 12 }}>Fehler in Intelligence</h2>
      <pre
        style={{
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          borderRadius: 8,
          padding: 16,
          fontSize: 13,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          marginBottom: 16,
        }}
      >
        {error.message}
        {"\n\n"}
        {error.stack}
      </pre>
      <button
        onClick={reset}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "8px 16px",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        Erneut versuchen
      </button>
    </div>
  );
}
