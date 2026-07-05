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
  const [isApprovePending, startApproveTransition] = useTransition();
  const [isRejectPending, startRejectTransition] = useTransition();
  const [isImagePending, startImageTransition] = useTransition();
  const [isSeoPending, startSeoTransition] = useTransition();
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function handleApprove() {
    if (!confirm(`"${title.slice(0, 60)}" freigeben? Das Produkt wird auf active gesetzt.`)) return;
    setStatusMsg(null);
    startApproveTransition(async () => {
      try {
        const res = await fetch(`/api/admin/market/opportunities/${listingId}/approve`, {
          method: "PATCH",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
        setApproved(true);
        setStatusMsg({ text: "Freigegeben", ok: true });
        router.refresh();
      } catch (e) {
        setStatusMsg({ text: (e as Error).message, ok: false });
      }
    });
  }

  function handleReject() {
    if (!confirm(`"${title.slice(0, 60)}" ablehnen?`)) return;
    setStatusMsg(null);
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
        setStatusMsg({ text: (e as Error).message, ok: false });
      }
    });
  }

  function handleRefreshImage() {
    setStatusMsg(null);
    startImageTransition(async () => {
      try {
        const res = await fetch(`/api/admin/market/opportunities/${listingId}/refresh-image`, {
          method: "POST",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
        setStatusMsg({ text: body.ok ? "Bild aktualisiert" : (body.message ?? "Kein Bild gefunden"), ok: body.ok });
        if (body.ok) router.refresh();
      } catch (e) {
        setStatusMsg({ text: (e as Error).message, ok: false });
      }
    });
  }

  function handleRefreshSeo() {
    setStatusMsg(null);
    startSeoTransition(async () => {
      try {
        const res = await fetch(`/api/admin/market/opportunities/${listingId}/refresh-seo`, {
          method: "POST",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
        setStatusMsg({ text: "SEO-Texte aktualisiert", ok: true });
        router.refresh();
      } catch (e) {
        setStatusMsg({ text: (e as Error).message, ok: false });
      }
    });
  }

  if (rejected) {
    return <span style={{ fontSize: 12, color: "#991b1b" }}>Abgelehnt</span>;
  }

  if (approved) {
    return (
      <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>
        Freigegeben ✓{" "}
        <a href={`/products/${productDraftId}`} style={{ color: "#2563eb", textDecoration: "underline" }}>
          Produkt ansehen
        </a>
      </span>
    );
  }

  const anyPending = isApprovePending || isRejectPending || isImagePending || isSeoPending;

  return (
    <div className="actions-row" style={{ justifyContent: "flex-end", flexWrap: "wrap", gap: 4 }}>
      {statusMsg && (
        <span style={{ fontSize: 12, color: statusMsg.ok ? "#166534" : "#991b1b" }}>
          {statusMsg.text}
        </span>
      )}
      <button
        onClick={handleRefreshImage}
        disabled={anyPending}
        className="btn btn-secondary btn-sm"
        title="Herstellerbild suchen oder DALL-E Bild generieren"
      >
        {isImagePending ? "Bild sucht..." : "Bild"}
      </button>
      <button
        onClick={handleRefreshSeo}
        disabled={anyPending}
        className="btn btn-secondary btn-sm"
        title="SEO-Texte neu generieren (nutzt aktuelles Listing-Wissen)"
      >
        {isSeoPending ? "SEO läuft..." : "SEO"}
      </button>
      <a href={`/products/${productDraftId}`} className="btn btn-secondary btn-sm">
        Entwurf
      </a>
      <button
        onClick={handleApprove}
        disabled={anyPending}
        className="btn btn-primary btn-sm"
        style={{ background: "#166534", borderColor: "#166534" }}
      >
        {isApprovePending ? "..." : "Freigeben →"}
      </button>
      <button
        onClick={handleReject}
        disabled={anyPending}
        className="btn btn-sm"
        style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}
      >
        {isRejectPending ? "..." : "Ablehnen"}
      </button>
    </div>
  );
}
