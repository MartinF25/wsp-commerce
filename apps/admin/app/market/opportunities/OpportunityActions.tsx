"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  listingId: string;
  productDraftId: string;
  title: string;
}

export function OpportunityActions({ listingId, productDraftId, title }: Props) {
  const router = useRouter();
  const [isRejectPending, startRejectTransition] = useTransition();
  const [isImagePending, startImageTransition] = useTransition();
  const [rejected, setRejected] = useState(false);
  const [imageMsg, setImageMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleReject() {
    if (!confirm(`"${title.slice(0, 60)}" ablehnen?`)) return;
    setError(null);
    startRejectTransition(async () => {
      try {
        const res = await fetch(`/api/admin/market/opportunities/${listingId}/reject`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Manuell abgelehnt" }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
        setRejected(true);
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function handleRefreshImage() {
    setImageMsg(null);
    setError(null);
    startImageTransition(async () => {
      try {
        const res = await fetch(`/api/admin/market/opportunities/${listingId}/refresh-image`, {
          method: "POST",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
        if (body.ok) {
          setImageMsg("Bild aktualisiert");
          router.refresh();
        } else {
          setImageMsg(body.message ?? "Kein Bild gefunden");
        }
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  if (rejected) {
    return <span style={{ fontSize: 12, color: "#991b1b" }}>Abgelehnt</span>;
  }

  return (
    <div className="actions-row" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
      {error && <span style={{ fontSize: 12, color: "#991b1b" }}>{error}</span>}
      {imageMsg && <span style={{ fontSize: 12, color: "#166534" }}>{imageMsg}</span>}
      <button
        onClick={handleRefreshImage}
        disabled={isImagePending}
        className="btn btn-secondary btn-sm"
        title="Herstellerbild suchen oder DALL-E Bild generieren"
      >
        {isImagePending ? "Bild sucht..." : "Bild auffrischen"}
      </button>
      <a href={`/products/${productDraftId}`} className="btn btn-secondary btn-sm">
        Entwurf öffnen
      </a>
      <a
        href={`/products/${productDraftId}`}
        className="btn btn-primary btn-sm"
        style={{ background: "#166534", borderColor: "#166534" }}
      >
        Freigeben →
      </a>
      <button
        onClick={handleReject}
        disabled={isRejectPending}
        className="btn btn-sm"
        style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}
      >
        {isRejectPending ? "..." : "Ablehnen"}
      </button>
    </div>
  );
}
