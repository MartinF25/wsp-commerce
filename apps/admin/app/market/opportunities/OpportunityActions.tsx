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
  const [rejected, setRejected] = useState(false);
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

  if (rejected) {
    return <span style={{ fontSize: 12, color: "#991b1b" }}>Abgelehnt</span>;
  }

  return (
    <div className="actions-row" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
      {error && (
        <span style={{ fontSize: 12, color: "#991b1b" }}>{error}</span>
      )}
      <a
        href={`/products/${productDraftId}`}
        className="btn btn-secondary btn-sm"
      >
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
