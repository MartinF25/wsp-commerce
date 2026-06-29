"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui", padding: 32 }}>
        <h2 style={{ color: "#991b1b", marginBottom: 12 }}>Global Error</h2>
        <pre
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            padding: 16,
            fontSize: 12,
            overflow: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {error?.name}: {error?.message}
          {"\n\n"}
          {error?.stack}
        </pre>
      </body>
    </html>
  );
}
