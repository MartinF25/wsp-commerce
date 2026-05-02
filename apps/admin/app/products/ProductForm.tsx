"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductDetail, Locale, ProductType, ProductStatus, Variant, ProductImage, ProductDocument } from "@/lib/api";
import UploadButton from "@/components/UploadButton";

// ─── Typen ────────────────────────────────────────────────────────────────────

interface TranslationFields {
  name: string;
  short_description: string;
  description: string;
  delivery_note: string;
  features: string; // JSON-Array als String
  meta_title: string;
  meta_description: string;
  mounting_note: string;
  project_note: string;
}

const EMPTY_TRANSLATION: TranslationFields = {
  name: "",
  short_description: "",
  description: "",
  delivery_note: "",
  features: "[]",
  meta_title: "",
  meta_description: "",
  mounting_note: "",
  project_note: "",
};

function translationFromApi(t: ProductDetail["translations"][number] | undefined): TranslationFields {
  if (!t) return EMPTY_TRANSLATION;
  return {
    name: t.name ?? "",
    short_description: t.short_description ?? "",
    description: t.description ?? "",
    delivery_note: t.delivery_note ?? "",
    features: JSON.stringify(Array.isArray(t.features) ? t.features : [], null, 2),
    meta_title: t.meta_title ?? "",
    meta_description: t.meta_description ?? "",
    mounting_note: t.mounting_note ?? "",
    project_note: t.project_note ?? "",
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  product?: ProductDetail;
  categories: { id: string; name: string }[];
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const isNew = !product;

  // ── Basis-Felder
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [productType, setProductType] = useState<ProductType>(product?.product_type ?? "inquiry_only");
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "draft");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [paypalUrl, setPaypalUrl] = useState(product?.paypal_url ?? "");
  const [stripeUrl, setStripeUrl] = useState(product?.stripe_url ?? "");

  // ── Übersetzungen
  const [activeLocale, setActiveLocale] = useState<Locale>("de");
  const [translations, setTranslations] = useState<Record<Locale, TranslationFields>>({
    de: translationFromApi(product?.translations.find((t) => t.locale === "de")),
    en: translationFromApi(product?.translations.find((t) => t.locale === "en")),
    es: translationFromApi(product?.translations.find((t) => t.locale === "es")),
  });

  // ── Startpreis (nur beim Anlegen)
  const [initSku, setInitSku] = useState("");
  const [initPrice, setInitPrice] = useState("");

  // ── Varianten (lokaler State)
  const [variants, setVariants] = useState<Variant[]>(product?.variants ?? []);
  const [newVariant, setNewVariant] = useState({
    sku: "", price_cents: "", currency: "EUR", stock_quantity: "0", is_active: true,
  });

  // ── Bilder
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [newImage, setNewImage] = useState({ url: "", alt: "", sort_order: "0" });
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [editingAltValue, setEditingAltValue] = useState("");

  // ── Dokumente
  const [documents, setDocuments] = useState<ProductDocument[]>(product?.documents ?? []);
  const [newDocument, setNewDocument] = useState({ name: "", url: "", type: "datasheet", sort_order: "0" });

  // ── UI-State
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ─── Hilfsfunktionen ────────────────────────────────────────────────────────

  function updateTranslation(locale: Locale, field: keyof TranslationFields, value: string) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }));
  }

  function buildTranslationsPayload() {
    const payload: Record<string, Record<string, unknown>> = {};
    for (const locale of ["de", "en", "es"] as Locale[]) {
      const t = translations[locale];
      if (!t.name.trim()) continue;
      let features: unknown[] = [];
      try { features = JSON.parse(t.features); } catch { features = []; }
      payload[locale] = {
        name: t.name.trim(),
        short_description: t.short_description.trim() || null,
        description: t.description.trim() || null,
        delivery_note: t.delivery_note.trim() || null,
        features,
        meta_title: t.meta_title.trim() || null,
        meta_description: t.meta_description.trim() || null,
        mounting_note: t.mounting_note.trim() || null,
        project_note: t.project_note.trim() || null,
      };
    }
    return payload;
  }

  // ─── Produkt speichern ───────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!translations.de.name.trim()) {
      setError("Name (DE) ist ein Pflichtfeld.");
      setSaving(false);
      return;
    }

    try {
      const body = {
        slug: slug.trim() || undefined,
        product_type: productType,
        status,
        category_id: categoryId || null,
        paypal_url: paypalUrl.trim() || null,
        stripe_url: stripeUrl.trim() || null,
        translations: buildTranslationsPayload(),
      };

      const res = await fetch(
        isNew ? "/api/admin-proxy/products" : `/api/admin-proxy/products/${product!.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);

      if (isNew) {
        const productId = json.id ?? json.data?.id;

        // Startvariante anlegen falls Preis oder SKU angegeben
        if (initPrice.trim() || initSku.trim()) {
          const priceCents = initPrice.trim()
            ? Math.round(parseFloat(initPrice.replace(",", ".")) * 100)
            : null;
          const sku = initSku.trim() || `${(json.data?.slug ?? productId).slice(0, 40)}-001`;
          await fetch(`/api/admin-proxy/products/${productId}/variants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sku, price_cents: priceCents, currency: "EUR", stock_quantity: 0, is_active: true }),
          });
        }

        router.push(`/products/${productId}`);
        router.refresh();
      } else {
        setSuccess("Gespeichert.");
        router.refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ─── Produkt löschen ─────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!product) return;
    if (!confirm(`Produkt "${product.slug}" wirklich löschen?`)) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin-proxy/products/${product.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);
      }
      router.push("/products");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Variante hinzufügen ──────────────────────────────────────────────────────

  async function handleAddVariant() {
    if (!product || !newVariant.sku.trim()) return;
    setError(null);

    try {
      const priceCents = newVariant.price_cents !== ""
        ? Math.round(parseFloat(newVariant.price_cents.replace(",", ".")) * 100)
        : null;

      const res = await fetch(`/api/admin-proxy/products/${product.id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: newVariant.sku.trim(),
          price_cents: priceCents,
          currency: newVariant.currency,
          stock_quantity: parseInt(newVariant.stock_quantity, 10) || 0,
          is_active: newVariant.is_active,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);

      setVariants((prev) => [...prev, json.data]);
      setNewVariant({ sku: "", price_cents: "", currency: "EUR", stock_quantity: "0", is_active: true });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDeleteVariant(varId: string) {
    if (!confirm("Variante löschen?")) return;
    try {
      const res = await fetch(`/api/admin-proxy/variants/${varId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);
      }
      setVariants((prev) => prev.filter((v) => v.id !== varId));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // ─── Bild hinzufügen ──────────────────────────────────────────────────────────

  async function handleAddImage(directUrl?: string) {
    const urlToUse = directUrl ?? newImage.url;
    if (!product || !urlToUse.trim()) return;
    setError(null);

    try {
      const res = await fetch(`/api/admin-proxy/products/${product.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlToUse.trim(),
          alt: newImage.alt.trim() || "Produktbild",
          sort_order: parseInt(newImage.sort_order, 10) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);

      setImages((prev) => [...prev, json.data]);
      setNewImage({ url: "", alt: "", sort_order: "0" });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDeleteImage(imgId: string) {
    if (!confirm("Bild entfernen?")) return;
    try {
      const res = await fetch(`/api/admin-proxy/images/${imgId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);
      }
      setImages((prev) => prev.filter((i) => i.id !== imgId));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleUpdateImageAlt(imgId: string) {
    const altToSave = editingAltValue.trim() || "Produktbild";
    setError(null);
    try {
      const res = await fetch(`/api/admin-proxy/images/${imgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: altToSave }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);
      setImages((prev) => prev.map((i) => i.id === imgId ? { ...i, alt: json.data.alt } : i));
      setEditingAltId(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // ─── Dokument hinzufügen ──────────────────────────────────────────────────────

  async function handleAddDocument() {
    if (!product || !newDocument.name.trim() || !newDocument.url.trim()) return;
    setError(null);

    try {
      const res = await fetch(`/api/admin-proxy/products/${product.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDocument.name.trim(),
          url: newDocument.url.trim(),
          type: newDocument.type,
          sort_order: parseInt(newDocument.sort_order, 10) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);

      setDocuments((prev) => [...prev, json.data]);
      setNewDocument({ name: "", url: "", type: "datasheet", sort_order: "0" });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDeleteDocument(docId: string) {
    if (!confirm("Dokument entfernen?")) return;
    try {
      const res = await fetch(`/api/admin-proxy/documents/${docId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);
      }
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const t = translations[activeLocale];

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Basis ── */}
      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Allgemein</div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="form-row form-row-3">
          <div>
            <label>Produkttyp <span className="req">*</span></label>
            <select value={productType} onChange={(e) => setProductType(e.target.value as ProductType)}>
              <option value="inquiry_only">Nur Anfrage</option>
              <option value="direct_purchase">Direktkauf</option>
              <option value="configurable">Konfigurierbar</option>
            </select>
          </div>
          <div>
            <label>Status <span className="req">*</span></label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)}>
              <option value="draft">Entwurf</option>
              <option value="active">Aktiv</option>
              <option value="archived">Archiviert</option>
            </select>
          </div>
          <div>
            <label>Kategorie <span className="opt">(optional)</span></label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— keine —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Slug <span className="opt">(automatisch aus DE-Name)</span></label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="wird-generiert"
            />
          </div>
        </div>
      </div>

      {/* ── Zahlung ── */}
      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Zahlungslinks</div>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
          Hinterlege direkte Zahlungslinks für PayPal und Stripe. Diese werden auf der Produktdetailseite als Kauf-Buttons angezeigt.
        </p>

        <div className="form-row form-row-2">
          <div>
            <label>PayPal-Link <span className="opt">(optional)</span></label>
            <input
              type="url"
              value={paypalUrl}
              onChange={(e) => setPaypalUrl(e.target.value)}
              placeholder="https://www.paypal.com/paypalme/... oder https://www.paypal.com/checkout/..."
            />
          </div>
          <div>
            <label>Stripe-Link <span className="opt">(optional)</span></label>
            <input
              type="url"
              value={stripeUrl}
              onChange={(e) => setStripeUrl(e.target.value)}
              placeholder="https://buy.stripe.com/..."
            />
          </div>
        </div>
      </div>

      {/* ── Startpreis (nur beim Anlegen) ── */}
      {isNew && (
        <div className="form-card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginTop: 0 }}>Preis</div>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            Optionaler Startpreis. Nach dem Anlegen können weitere Varianten hinzugefügt werden.
          </p>
          <div className="form-row form-row-2">
            <div>
              <label>Preis in € <span className="opt">(z.B. 299,00)</span></label>
              <input
                type="text"
                value={initPrice}
                onChange={(e) => setInitPrice(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <label>SKU <span className="opt">(optional, wird automatisch generiert)</span></label>
              <input
                type="text"
                value={initSku}
                onChange={(e) => setInitSku(e.target.value)}
                placeholder="SKU-001"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Übersetzungen ── */}
      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Inhalte</div>

        <div className="tabs">
          {(["de", "en", "es"] as Locale[]).map((loc) => {
            const hasName = translations[loc].name.trim().length > 0;
            return (
              <button
                key={loc}
                type="button"
                className={`tab-btn${activeLocale === loc ? " active" : ""}${loc === "de" ? " tab-required" : ""}`}
                onClick={() => setActiveLocale(loc)}
              >
                {loc.toUpperCase()}
                {loc !== "de" && !hasName && (
                  <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 4 }}>leer</span>
                )}
              </button>
            );
          })}
        </div>

        {activeLocale === "de" && (
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            DE ist Pflichtsprache (Source of Truth). Fehlende EN/ES-Inhalte fallen auf DE zurück.
          </p>
        )}

        <div className="form-row">
          <div>
            <label>
              Name
              {activeLocale === "de" && <span className="req"> *</span>}
              {activeLocale !== "de" && <span className="opt"> (optional)</span>}
            </label>
            <input
              type="text"
              value={t.name}
              onChange={(e) => updateTranslation(activeLocale, "name", e.target.value)}
              required={activeLocale === "de"}
              placeholder={activeLocale === "de" ? "Produktname" : "Übersetzung…"}
            />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Kurzbeschreibung <span className="opt">(optional)</span></label>
            <textarea
              rows={2}
              value={t.short_description}
              onChange={(e) => updateTranslation(activeLocale, "short_description", e.target.value)}
              placeholder="Kurze Produktbeschreibung für Listen"
            />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Beschreibung <span className="opt">(optional)</span></label>
            <textarea
              rows={5}
              value={t.description}
              onChange={(e) => updateTranslation(activeLocale, "description", e.target.value)}
              placeholder="Ausführliche Produktbeschreibung"
            />
          </div>
        </div>

        <div className="form-row form-row-2">
          <div>
            <label>Lieferhinweis <span className="opt">(optional)</span></label>
            <input
              type="text"
              value={t.delivery_note}
              onChange={(e) => updateTranslation(activeLocale, "delivery_note", e.target.value)}
              placeholder="z.B. Lieferzeit 2–3 Wochen"
            />
          </div>
          <div>
            <label>Montagehinweis <span className="opt">(optional)</span></label>
            <input
              type="text"
              value={t.mounting_note}
              onChange={(e) => updateTranslation(activeLocale, "mounting_note", e.target.value)}
              placeholder="Montagehinweis"
            />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Projekthinweis <span className="opt">(optional)</span></label>
            <input
              type="text"
              value={t.project_note}
              onChange={(e) => updateTranslation(activeLocale, "project_note", e.target.value)}
              placeholder="Projekthinweis"
            />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Features <span className="opt">(JSON-Array, optional)</span></label>
            <textarea
              rows={4}
              value={t.features}
              onChange={(e) => updateTranslation(activeLocale, "features", e.target.value)}
              placeholder='["Feature 1", "Feature 2"]'
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
          </div>
        </div>

        <hr />

        <div className="form-row form-row-2">
          <div>
            <label>Meta-Titel <span className="opt">(optional)</span></label>
            <input
              type="text"
              value={t.meta_title}
              onChange={(e) => updateTranslation(activeLocale, "meta_title", e.target.value)}
              placeholder="SEO-Titel"
            />
          </div>
          <div>
            <label>Meta-Beschreibung <span className="opt">(optional)</span></label>
            <input
              type="text"
              value={t.meta_description}
              onChange={(e) => updateTranslation(activeLocale, "meta_description", e.target.value)}
              placeholder="SEO-Beschreibung"
            />
          </div>
        </div>
      </div>

      {/* ── Bilder ── */}
      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Bilder</div>

        {isNew ? (
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
            Bilder können erst nach dem Anlegen des Produkts hinzugefügt werden.
          </p>
        ) : (
          <>
            {images.length > 0 && (
              <div className="sub-table-wrapper" style={{ marginBottom: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 56 }}>Vorschau</th>
                      <th>URL</th>
                      <th>Alt-Text</th>
                      <th>Reihenfolge</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {images.map((img) => (
                      <tr key={img.id}>
                        <td>
                          <img
                            src={img.url}
                            alt={img.alt ?? ""}
                            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4, background: "#f1f5f9" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </td>
                        <td>
                          <a href={img.url} target="_blank" rel="noreferrer"
                             style={{ fontFamily: "monospace", fontSize: 12 }}>
                            {img.url.length > 55 ? img.url.slice(0, 55) + "…" : img.url}
                          </a>
                        </td>
                        <td>
                          {editingAltId === img.id ? (
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <input
                                type="text"
                                value={editingAltValue}
                                onChange={(e) => setEditingAltValue(e.target.value)}
                                style={{ width: 130 }}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleUpdateImageAlt(img.id);
                                  if (e.key === "Escape") setEditingAltId(null);
                                }}
                              />
                              <button type="button" className="btn btn-primary btn-sm" onClick={() => handleUpdateImageAlt(img.id)}>✓</button>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingAltId(null)}>✕</button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <span>{img.alt || <span style={{ color: "#9ca3af" }}>—</span>}</span>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => { setEditingAltId(img.id); setEditingAltValue(img.alt ?? ""); }}
                              >
                                Bearbeiten
                              </button>
                            </div>
                          )}
                        </td>
                        <td>{img.sort_order}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteImage(img.id)}
                          >
                            Entfernen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginBottom: 8 }}>
              <UploadButton
                folder="images"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                label="Bild hochladen"
                onUploaded={(url) => {
                  setNewImage((prev) => ({ ...prev, url }));
                  if (product) handleAddImage(url);
                }}
              />
              {!product && (
                <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>
                  Produkt zuerst speichern, dann Bilder hochladen
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 80px auto", gap: 8, alignItems: "end" }}>
              <div>
                <label>Bild-URL <span className="req">*</span></label>
                <input
                  type="url"
                  value={newImage.url}
                  onChange={(e) => setNewImage({ ...newImage, url: e.target.value })}
                  placeholder="https://…/bild.jpg"
                />
              </div>
              <div>
                <label>Alt-Text</label>
                <input
                  type="text"
                  value={newImage.alt}
                  onChange={(e) => setNewImage({ ...newImage, alt: e.target.value })}
                  placeholder="Bildbeschreibung"
                />
              </div>
              <div>
                <label>Reihenfolge</label>
                <input
                  type="number"
                  value={newImage.sort_order}
                  onChange={(e) => setNewImage({ ...newImage, sort_order: e.target.value })}
                />
              </div>
              <div>
                <label>&nbsp;</label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleAddImage()}
                  disabled={!newImage.url.trim()}
                >
                  + Bild
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Varianten ── */}
      {!isNew && (
        <div className="form-card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginTop: 0 }}>Varianten</div>

          {variants.length > 0 && (
            <div className="sub-table-wrapper" style={{ marginBottom: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Preis</th>
                    <th>Währung</th>
                    <th>Lagerbestand</th>
                    <th>Aktiv</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id}>
                      <td style={{ fontFamily: "monospace" }}>{v.sku}</td>
                      <td>{v.price_cents != null ? `${(v.price_cents / 100).toFixed(2).replace(".", ",")} €` : <span style={{ color: "#9ca3af" }}>—</span>}</td>
                      <td>{v.currency}</td>
                      <td>{v.stock_quantity}</td>
                      <td>
                        <span className={`badge ${v.is_active ? "badge-active" : "badge-inactive"}`}>
                          {v.is_active ? "Ja" : "Nein"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteVariant(v.id)}
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "140px 120px 80px 100px 80px auto", gap: 8, alignItems: "end" }}>
            <div>
              <label>SKU <span className="req">*</span></label>
              <input
                type="text"
                value={newVariant.sku}
                onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                placeholder="SKU-001"
              />
            </div>
            <div>
              <label>Preis <span className="opt">(z.B. 12,99)</span></label>
              <input
                type="text"
                value={newVariant.price_cents}
                onChange={(e) => setNewVariant({ ...newVariant, price_cents: e.target.value })}
                placeholder="12,99"
              />
            </div>
            <div>
              <label>Währung</label>
              <input
                type="text"
                value={newVariant.currency}
                onChange={(e) => setNewVariant({ ...newVariant, currency: e.target.value })}
              />
            </div>
            <div>
              <label>Lagerbestand</label>
              <input
                type="number"
                value={newVariant.stock_quantity}
                onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: e.target.value })}
              />
            </div>
            <div style={{ paddingTop: 20 }}>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={newVariant.is_active}
                  onChange={(e) => setNewVariant({ ...newVariant, is_active: e.target.checked })}
                />
                Aktiv
              </label>
            </div>
            <div>
              <label>&nbsp;</label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddVariant}
                disabled={!newVariant.sku.trim()}
              >
                + Variante
              </button>
            </div>
          </div>

          {isNew && (
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
              Varianten können erst nach dem Anlegen des Produkts hinzugefügt werden.
            </p>
          )}
        </div>
      )}

      {/* ── Dokumente ── */}
      {!isNew && (
        <div className="form-card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginTop: 0 }}>Dokumente</div>

          {documents.length > 0 && (
            <div className="sub-table-wrapper" style={{ marginBottom: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Typ</th>
                    <th>URL</th>
                    <th>Reihenfolge</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.name}</td>
                      <td>
                        <span className="badge badge-type">{doc.type}</span>
                      </td>
                      <td>
                        <a href={doc.url} target="_blank" rel="noreferrer"
                           style={{ fontFamily: "monospace", fontSize: 12 }}>
                          {doc.url.length > 50 ? doc.url.slice(0, 50) + "…" : doc.url}
                        </a>
                      </td>
                      <td>{doc.sort_order}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          Entfernen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr 80px auto", gap: 8, alignItems: "end" }}>
            <div>
              <label>Name <span className="req">*</span></label>
              <input
                type="text"
                value={newDocument.name}
                onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                placeholder="z.B. Datenblatt, Montageanleitung"
              />
            </div>
            <div>
              <label>Typ</label>
              <select
                value={newDocument.type}
                onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
              >
                <option value="datasheet">Datenblatt</option>
                <option value="manual">Anleitung</option>
                <option value="certificate">Zertifikat</option>
                <option value="other">Sonstiges</option>
              </select>
            </div>
            <div>
              <label>URL <span className="req">*</span></label>
              <div style={{ marginBottom: 4 }}>
                <UploadButton
                  folder="documents"
                  accept="application/pdf"
                  label="PDF hochladen"
                  onUploaded={(url) => setNewDocument((prev) => ({ ...prev, url }))}
                />
              </div>
              <input
                type="url"
                value={newDocument.url}
                onChange={(e) => setNewDocument({ ...newDocument, url: e.target.value })}
                placeholder="https://…/dokument.pdf"
              />
            </div>
            <div>
              <label>Reihenfolge</label>
              <input
                type="number"
                value={newDocument.sort_order}
                onChange={(e) => setNewDocument({ ...newDocument, sort_order: e.target.value })}
              />
            </div>
            <div>
              <label>&nbsp;</label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddDocument}
                disabled={!newDocument.name.trim() || !newDocument.url.trim()}
              >
                + Dokument
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Speichern ── */}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Speichern…" : isNew ? "Produkt anlegen" : "Änderungen speichern"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => router.push("/products")}>
          Abbrechen
        </button>
        {!isNew && (
          <button
            type="button"
            className="btn btn-danger"
            style={{ marginLeft: "auto" }}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Löschen…" : "Produkt löschen"}
          </button>
        )}
      </div>
    </form>
  );
}
