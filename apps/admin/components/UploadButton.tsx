"use client";

import { useRef, useState } from "react";

interface Props {
  folder: "images" | "documents";
  accept: string;
  onUploaded: (url: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function UploadButton({
  folder,
  accept,
  onUploaded,
  label = "Hochladen",
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

      onUploaded(json.url as string);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
        disabled={disabled || uploading}
      />
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        title={`Datei hochladen (${accept})`}
      >
        {uploading ? "↑ Lädt…" : `↑ ${label}`}
      </button>
      {error && (
        <span style={{ color: "#ef4444", fontSize: 11 }}>{error}</span>
      )}
    </span>
  );
}
