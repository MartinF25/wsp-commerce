"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import type { MarketListing, MarketReferencePrice } from "@/lib/api";
import { createProductFromListing } from "./actions";

interface Props {
  listing: MarketListing;
  avgPriceCents: number | null;
  referencePrices?: MarketReferencePrice[];
}

function formatPrice(cents: number | null, negotiable: boolean): string {
  if (cents === null) return negotiable ? "VB" : "-";
  const euros = (cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${euros} EUR${negotiable ? " VB" : ""}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function priceColor(cents: number | null, avg: number | null): string {
  if (!cents || !avg) return "#374151";
  const ratio = cents / avg;
  if (ratio < 0.8) return "#166534";
  if (ratio > 1.2) return "#9a3412";
  return "#374151";
}

function badgeStyle(background: string, color = "#111827"): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background,
    color,
    border: "1px solid rgba(17,24,39,0.08)",
  };
}

function recommendationStyle(recommendation: MarketListing["recommendation"]): CSSProperties {
  switch (recommendation) {
    case "IMPORT":
      return badgeStyle("#dcfce7", "#166534");
    case "REVIEW":
      return badgeStyle("#fef3c7", "#92400e");
    case "IGNORE":
      return badgeStyle("#fee2e2", "#991b1b");
    default:
      return badgeStyle("#e5e7eb", "#374151");
  }
}

function riskStyle(riskLevel: MarketListing["riskLevel"]): CSSProperties {
  switch (riskLevel) {
    case "LOW":
      return badgeStyle("#dcfce7", "#166534");
    case "MEDIUM":
      return badgeStyle("#fef3c7", "#92400e");
    case "HIGH":
      return badgeStyle("#fee2e2", "#991b1b");
    default:
      return badgeStyle("#e5e7eb", "#374151");
  }
}

function scoreStyle(score: number | null | undefined): CSSProperties {
  if (typeof score !== "number") return badgeStyle("#e5e7eb", "#374151");
  if (score >= 80) return badgeStyle("#bbf7d0", "#14532d");
  if (score >= 60) return badgeStyle("#fde68a", "#78350f");
  return badgeStyle("#fecaca", "#7f1d1d");
}

function completenessStyle(score: number): CSSProperties {
  if (score >= 90) return badgeStyle("#dcfce7", "#166534");
  if (score >= 70) return badgeStyle("#dbeafe", "#1d4ed8");
  if (score >= 50) return badgeStyle("#fef3c7", "#92400e");
  return badgeStyle("#fee2e2", "#991b1b");
}

export function ListingCard({ listing, avgPriceCents, referencePrices = [] }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [productType, setProductType] = useState("inquiry_only");
  const [currentListing, setCurrentListing] = useState(listing);
  const [error, setError] = useState<string | null>(null);
  const [isCreatePending, startCreateTransition] = useTransition();
  const [isAnalyzePending, startAnalyzeTransition] = useTransition();
  const [isDraftPending, startDraftTransition] = useTransition();
  const [isAvailabilityPending, startAvailabilityTransition] = useTransition();
  const [isEnrichPending, startEnrichTransition] = useTransition();

  const priceDisplay = formatPrice(currentListing.price_cents, currentListing.price_negotiable);
  const color = priceColor(currentListing.price_cents, avgPriceCents);
  const highlightImport = currentListing.recommendation === "IMPORT";

  function closeModal() {
    setModalOpen(false);
    setError(null);
  }

  function handleCreate() {
    setError(null);
    startCreateTransition(async () => {
      try {
        await createProductFromListing(currentListing, productType);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function handleAnalyze() {
    setError(null);
    startAnalyzeTransition(async () => {
      try {
        const res = await fetch("/api/admin/market/analyze-deal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marketItemId: currentListing.id }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.error?.message ?? `Analyse fehlgeschlagen (HTTP ${res.status})`);
        }

        if (body?.data) {
          setCurrentListing(body.data as MarketListing);
        }

        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function handleCreateDraft() {
    setError(null);
    startDraftTransition(async () => {
      try {
        const res = await fetch("/api/admin/market/create-product-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marketItemId: currentListing.id }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.error?.message ?? `Produktentwurf fehlgeschlagen (HTTP ${res.status})`);
        }

        if (body?.data?.listing) {
          setCurrentListing(body.data.listing as MarketListing);
        }

        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function handleEnrich() {
    setError(null);
    startEnrichTransition(async () => {
      try {
        const res = await fetch("/api/admin/market/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: currentListing.id }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((body as { error?: { message?: string } })?.error?.message ?? `Anreicherung fehlgeschlagen (HTTP ${res.status})`);
        }
        if ((body as { data?: { listing?: typeof currentListing } }).data?.listing) {
          setCurrentListing((body as { data: { listing: typeof currentListing } }).data.listing);
        }
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function handleCheckAvailability() {
    setError(null);
    startAvailabilityTransition(async () => {
      try {
        const res = await fetch("/api/admin/market/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marketListingId: currentListing.id }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.error?.message ?? `Verfuegbarkeitspruefung fehlgeschlagen (HTTP )`);
        }

        if (body?.data) {
          setCurrentListing(body.data as MarketListing);
        }

        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <>
      <tr>
        <td style={{ width: 56 }}>
          {currentListing.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentListing.image_url} alt="" className="listing-img" />
          ) : (
            <div className="listing-img-placeholder">
              <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth={1.5} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </td>
        <td>
          <div className="listing-title">{currentListing.title}</div>
          <div className="listing-meta" style={{ marginBottom: 8 }}>
            {currentListing.location && (
              <span>
                {currentListing.location}
                {currentListing.plz ? ` · ${currentListing.plz}` : ""}
                {" · "}
              </span>
            )}
            <span>{formatDate(currentListing.listed_at)}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: currentListing.aiComment ? 8 : 0 }}>
            <span style={scoreStyle(currentListing.dealScore)}>
              Score {typeof currentListing.dealScore === "number" ? currentListing.dealScore : "offen"}
            </span>
            <span style={recommendationStyle(currentListing.recommendation)}>
              {currentListing.recommendation ?? "Ohne Analyse"}
            </span>
            <span style={riskStyle(currentListing.riskLevel)}>
              Risiko {currentListing.riskLevel ?? "offen"}
            </span>
            {currentListing.productCategory && (
              <span style={badgeStyle("#dbeafe", "#1d4ed8")}>
                {currentListing.productCategory}
              </span>
            )}
            {typeof currentListing.seoPotential === "number" && (
              <span style={badgeStyle("#ede9fe", "#5b21b6")}>SEO {currentListing.seoPotential}/10</span>
            )}
            {typeof currentListing.estimatedMargin === "number" && (
              <span style={badgeStyle("#ecfccb", "#3f6212")}>
                Marge ca. {currentListing.estimatedMargin.toLocaleString("de-DE")} EUR
              </span>
            )}
            {currentListing.productDraftId && (
              <span style={badgeStyle("#cffafe", "#155e75")}>Entwurf vorhanden</span>
            )}
            {currentListing.sourceStatus === "online" && (
              <span style={badgeStyle("#dcfce7", "#166534")}>ONLINE</span>
            )}
            {currentListing.sourceStatus === "offline" && (
              <span style={badgeStyle("#fee2e2", "#991b1b")}>OFFLINE</span>
            )}
            {currentListing.sourceStatus === "unknown" && (
              <span style={badgeStyle("#fef3c7", "#92400e")}>UNBEKANNT</span>
            )}
            {currentListing.syncStatus === "price_changed" && (
              <span style={badgeStyle("#fed7aa", "#9a3412")}>PREIS GEAENDERT</span>
            )}
          </div>
          {/* Knowledge Enrichment Badges */}
          {(currentListing.brand || currentListing.model || currentListing.productType || currentListing.dataCompletenessScore != null) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {currentListing.brand && (
                <span style={badgeStyle("#f0fdf4", "#15803d")}>
                  {currentListing.brand}
                  {currentListing.model ? ` · ${currentListing.model}` : ""}
                </span>
              )}
              {currentListing.productType && (
                <span style={badgeStyle("#f5f3ff", "#6d28d9")}>{currentListing.productType}</span>
              )}
              {currentListing.dataCompletenessScore != null && (
                <span style={completenessStyle(currentListing.dataCompletenessScore)}>
                  Vollständigkeit {currentListing.dataCompletenessScore}%
                </span>
              )}
              {typeof currentListing.enrichmentConfidence === "number" && (
                <span style={badgeStyle("#f8fafc", "#64748b")}>
                  Ø Confidence {Math.round(currentListing.enrichmentConfidence * 100)}%
                </span>
              )}
            </div>
          )}
          {currentListing.aiComment && (
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "#4b5563" }}>{currentListing.aiComment}</div>
          )}
          {referencePrices.length > 0 && (() => {
            const ekEur = currentListing.price_cents ? Math.round(currentListing.price_cents / 100) : null;
            const vkValues = referencePrices.map((r) => r.vk_eur);
            const minVk = Math.min(...vkValues);
            const maxVk = Math.max(...vkValues);
            const margeEur = ekEur !== null ? minVk - ekEur : null;
            const margePercent = ekEur && margeEur !== null && ekEur > 0 ? Math.round((margeEur / ekEur) * 100) : null;
            const marktpreisStr = minVk === maxVk
              ? `${minVk.toLocaleString("de-DE")} EUR`
              : `${minVk.toLocaleString("de-DE")}–${maxVk.toLocaleString("de-DE")} EUR`;
            return (
              <div style={{ marginTop: 8, padding: "7px 12px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, color: "#374151", display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span><span style={{ color: "#94a3b8" }}>EK</span> <strong>{ekEur !== null ? `${ekEur.toLocaleString("de-DE")} EUR` : "VB"}</strong></span>
                <span><span style={{ color: "#94a3b8" }}>Marktpreis</span> <strong>{marktpreisStr}</strong> <span style={{ color: "#94a3b8" }}>(neu)</span></span>
                {margeEur !== null && (
                  <span style={{ color: margeEur >= 0 ? "#166534" : "#991b1b", fontWeight: 700 }}>
                    Marge ca. {margeEur >= 0 ? "+" : ""}{margeEur.toLocaleString("de-DE")} EUR
                    {margePercent !== null ? ` (+${margePercent}%)` : ""}
                  </span>
                )}
              </div>
            );
          })()}
          {currentListing.productDraftId && (
            <div style={{ marginTop: 8 }}>
              <a
                href={`/products/${currentListing.productDraftId}`}
                className="btn btn-secondary btn-sm"
                style={{ display: "inline-flex" }}
              >
                Produktentwurf oeffnen
              </a>
            </div>
          )}
          {currentListing.sourceStatus === "offline" && currentListing.productDraftId && (
            <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#991b1b" }}>
              Produktentwurf pruefen – Quelle offline
            </div>
          )}
          {currentListing.priceChanged && currentListing.lastKnownPrice != null && currentListing.currentPrice != null && (
            <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6, background: "#fff7ed", border: "1px solid #fed7aa", fontSize: 13, color: "#9a3412" }}>
              Preis geaendert: {Math.round(currentListing.lastKnownPrice / 100).toLocaleString("de-DE")} EUR → {Math.round(currentListing.currentPrice / 100).toLocaleString("de-DE")} EUR
            </div>
          )}
          {error && (
            <div className="alert alert-error" style={{ marginTop: 10 }}>
              {error}
            </div>
          )}
        </td>
        <td style={{ textAlign: "right", width: 120, fontWeight: 600, color }}>
          {priceDisplay}
        </td>
        <td style={{ width: 260, textAlign: "right" }}>
          <div className="actions-row" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button
              onClick={handleEnrich}
              disabled={isEnrichPending}
              className="btn btn-secondary btn-sm"
              title={currentListing.enrichedAt ? `Zuletzt angereichert: ${new Date(currentListing.enrichedAt as string).toLocaleDateString("de-DE")}` : "Noch nicht angereichert"}
            >
              {isEnrichPending ? "Reichere an..." : currentListing.enrichedAt ? "Erneut anreichern" : "Anreichern"}
            </button>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzePending}
              className="btn btn-secondary btn-sm"
            >
              {isAnalyzePending ? "Analysiert..." : "Analysieren"}
            </button>
            <button
              onClick={handleCreateDraft}
              disabled={isDraftPending || Boolean(currentListing.productDraftId)}
              className="btn btn-secondary btn-sm"
              style={
                currentListing.productDraftId
                  ? { opacity: 0.7, cursor: "not-allowed" }
                  : highlightImport
                    ? { borderColor: "#166534", color: "#166534" }
                    : undefined
              }
            >
              {currentListing.productDraftId
                ? "Entwurf vorhanden"
                : isDraftPending
                  ? "Entwurf erstellt..."
                  : "Produktentwurf"}
            </button>
            <button
              onClick={handleCheckAvailability}
              disabled={isAvailabilityPending}
              className="btn btn-secondary btn-sm"
            >
              {isAvailabilityPending ? "Pruefe..." : "Verfuegbarkeit"}
            </button>
            {currentListing.listing_url && (
              <a
                href={currentListing.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                Anzeige -&gt;
              </a>
            )}
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={
                highlightImport
                  ? {
                      background: "#166534",
                      borderColor: "#166534",
                      boxShadow: "0 0 0 1px rgba(22,101,52,0.12), 0 10px 20px rgba(22,101,52,0.18)",
                    }
                  : undefined
              }
            >
              + Produkt
            </button>
          </div>
        </td>
      </tr>

      {modalOpen && (
        <tr>
          <td colSpan={4} style={{ padding: 0, border: "none" }}></td>
        </tr>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <div className="modal-img-row">
              {currentListing.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentListing.image_url} alt="" className="modal-img" />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, lineHeight: 1.4 }}>
                  {currentListing.title}
                </div>
                <div className="listing-meta">{priceDisplay} · DE/EN/ES vorausgefuellt</div>
                {currentListing.recommendation === "IMPORT" && (
                  <div style={{ marginTop: 8, ...recommendationStyle("IMPORT") }}>
                    KI empfiehlt Import
                  </div>
                )}
              </div>
            </div>

            <label className="modal-label">Produkttyp</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="modal-select"
            >
              <option value="inquiry_only">Nur Anfrage</option>
              <option value="direct_purchase">Direktkauf</option>
              <option value="configurable">Konfigurierbar</option>
            </select>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 12 }}>
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button
                onClick={closeModal}
                disabled={isCreatePending}
                className="btn btn-secondary modal-btn-flex"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreatePending}
                className="btn btn-primary modal-btn-flex"
                style={highlightImport ? { background: "#166534", borderColor: "#166534" } : undefined}
              >
                {isCreatePending ? "Wird angelegt..." : "Anlegen & Bearbeiten"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
