"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductDetail, Locale, ProductType, ProductStatus, Variant, ProductImage, ProductDocument, AffiliateStats } from "@/lib/api";
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
  affiliateStats?: AffiliateStats | null;
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function ProductForm({ product, categories, affiliateStats }: Props) {
  const router = useRouter();
  const isNew = !product;

  // ── Basis-Felder
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [productType, setProductType] = useState<ProductType>(product?.product_type ?? "inquiry_only");
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "draft");
  const [availabilityStatus, setAvailabilityStatus] = useState<string>(
    (product as any)?.availability_status ?? "in_stock"
  );
  const [condition, setCondition] = useState<string>((product as any)?.condition ?? "new");
  const [vatRate, setVatRate] = useState<number>((product as any)?.vat_rate ?? 19);
  const [shippingType, setShippingType] = useState<string>((product as any)?.shipping_type ?? "freight");
  const [shippingCents, setShippingCents] = useState<string>(
    (product as any)?.shipping_cents != null ? String((product as any).shipping_cents / 100) : ""
  );
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [paypalUrl, setPaypalUrl] = useState(product?.paypal_url ?? "");
  const [stripeUrl, setStripeUrl] = useState(product?.stripe_url ?? "");

  // ── Affiliate
  const [affiliateProvider, setAffiliateProvider] = useState(product?.affiliate_provider ?? "amazon");
  const [affiliateUrl, setAffiliateUrl] = useState(product?.affiliate_url ?? "");
  const [affiliateAsin, setAffiliateAsin] = useState(product?.affiliate_asin ?? "");
  const [affiliateButtonLabel, setAffiliateButtonLabel] = useState(product?.affiliate_button_label ?? "");
  const [affiliateDisclosure, setAffiliateDisclosure] = useState(product?.affiliate_disclosure ?? "");
  const [affiliateEnabled, setAffiliateEnabled] = useState(product?.affiliate_enabled ?? false);

  // ── Angebot
  const [saleStartsAt, setSaleStartsAt] = useState(
    product?.sale_starts_at ? product.sale_starts_at.slice(0, 16) : ""
  );
  const [saleEndsAt, setSaleEndsAt] = useState(
    product?.sale_ends_at ? product.sale_ends_at.slice(0, 16) : ""
  );
  const [saleLabel, setSaleLabel] = useState(product?.sale_label ?? "");
  const [showCountdown, setShowCountdown] = useState(product?.show_countdown ?? false);

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
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingVariantPrice, setEditingVariantPrice] = useState("");
  const [editingSalePriceId, setEditingSalePriceId] = useState<string | null>(null);
  const [editingSalePrice, setEditingSalePrice] = useState("");
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState("");

  // ── Bilder
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [newImage, setNewImage] = useState({ url: "", alt: "", sort_order: "0" });
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [editingAltValue, setEditingAltValue] = useState("");
  const [confirmDeleteImageId, setConfirmDeleteImageId] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [confirmDeleteVariantId, setConfirmDeleteVariantId] = useState<string | null>(null);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);

  // ── Dokumente
  const [documents, setDocuments] = useState<ProductDocument[]>(product?.documents ?? []);
  const [newDocument, setNewDocument] = useState({ name: "", url: "", type: "datasheet", sort_order: "0" });

  // ── UI-State
  const [imageError, setImageError] = useState<string | null>(null);
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

    // Offene Inline-Edits erst speichern bevor das Produkt gespeichert wird
    if (editingStockId !== null) {
      await handleUpdateVariantStock(editingStockId);
      // handleUpdateVariantStock setzt editingStockId=null bei Erfolg oder error bei Fehler
    }

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
        availability_status: availabilityStatus,
        condition,
        vat_rate: vatRate,
        shipping_type: shippingType,
        shipping_cents: shippingType === "flat" && shippingCents.trim()
          ? Math.round(parseFloat(shippingCents.replace(",", ".")) * 100)
          : null,
        category_id: categoryId || null,
        paypal_url: paypalUrl.trim() || null,
        stripe_url: stripeUrl.trim() || null,
        sale_starts_at: saleStartsAt.trim() ? new Date(saleStartsAt).toISOString() : null,
        sale_ends_at: saleEndsAt.trim() ? new Date(saleEndsAt).toISOString() : null,
        sale_label: saleLabel.trim() || null,
        show_countdown: showCountdown && saleEndsAt.trim() !== "",
        affiliate_provider: affiliateProvider.trim() || null,
        affiliate_url: affiliateUrl.trim() || null,
        affiliate_asin: affiliateAsin.trim() || null,
        affiliate_button_label: affiliateButtonLabel.trim() || null,
        affiliate_disclosure: affiliateDisclosure.trim() || null,
        affiliate_enabled: affiliateEnabled,
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
    if (!confirm(
      `Produkt "${product.translations.find((t) => t.locale === "de")?.name ?? product.slug}" archivieren?\n\nDas Produkt wird aus dem Shop entfernt, bleibt aber in der Datenbank erhalten.`
    )) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin-proxy/products/${product.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (!res.ok) {
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

  async function handleUpdateVariantPrice(varId: string) {
    const raw = editingVariantPrice.trim();
    const parsed = raw === "" ? null : parseFloat(raw.replace(",", "."));
    if (raw !== "" && (isNaN(parsed!) || parsed! < 0)) {
      setError("Ungültiger Preis. Bitte eine Zahl eingeben (z.B. 1299,00).");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/admin-proxy/variants/${varId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_cents: parsed === null ? null : Math.round(parsed * 100) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);
      setVariants((prev) => prev.map((v) => v.id === varId ? { ...v, price_cents: json.data.price_cents } : v));
      setEditingVariantId(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleUpdateVariantSalePrice(varId: string) {
    const raw = editingSalePrice.trim();
    const parsed = raw === "" ? null : parseFloat(raw.replace(",", "."));
    if (raw !== "" && (isNaN(parsed!) || parsed! < 0)) {
      setError("Ungültiger Angebotspreis. Bitte eine Zahl eingeben oder leer lassen.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/admin-proxy/variants/${varId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sale_price_cents: parsed === null ? null : Math.round(parsed * 100) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);
      setVariants((prev) => prev.map((v) => v.id === varId ? { ...v, sale_price_cents: json.data.sale_price_cents } : v));
      setEditingSalePriceId(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleUpdateVariantStock(varId: string) {
    const raw = editingStockValue.trim();
    const parsed = parseInt(raw, 10);
    if (raw !== "" && (isNaN(parsed) || parsed < 0)) {
      setError("Ungültiger Lagerbestand. Bitte eine ganze Zahl eingeben (z.B. 5).");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/admin-proxy/variants/${varId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock_quantity: raw === "" ? 0 : parsed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? json.error ?? `HTTP ${res.status}`);
      setVariants((prev) => prev.map((v) => v.id === varId ? { ...v, stock_quantity: json.data.stock_quantity } : v));
      setEditingStockId(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleAddVariant() {
    if (!product || !newVariant.sku.trim()) return;
    setError(null);

    try {
      const rawPrice = newVariant.price_cents.trim();
      const parsedPrice = rawPrice !== "" ? parseFloat(rawPrice.replace(",", ".")) : null;
      if (rawPrice !== "" && (isNaN(parsedPrice!) || parsedPrice! < 0)) {
        setError("Ungültiger Preis. Bitte eine Zahl eingeben (z.B. 1299,00).");
        return;
      }
      const priceCents = parsedPrice !== null ? Math.round(parsedPrice * 100) : null;

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
    setConfirmDeleteVariantId(null);
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
          sort_order: images.length,
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
    setDeletingImageId(imgId);
    setConfirmDeleteImageId(null);
    setImageError(null);
    try {
      const res = await fetch(`/api/admin-proxy/images/${imgId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const text = await res.text().catch(() => "");
        let msg = `HTTP ${res.status}`;
        try { const j = JSON.parse(text); msg = j.error?.message ?? j.error ?? msg; } catch {}
        throw new Error(msg);
      }
      setImages((prev) => prev.filter((i) => i.id !== imgId));
    } catch (e) {
      setImageError((e as Error).message);
    } finally {
      setDeletingImageId(null);
    }
  }

  async function handleMoveImage(imgId: string, direction: "up" | "down") {
    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((i) => i.id === imgId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const normalized = sorted.map((img, i) => ({ ...img, sort_order: i }));
    const tmpOrder = normalized[idx].sort_order;
    normalized[idx] = { ...normalized[idx], sort_order: normalized[swapIdx].sort_order };
    normalized[swapIdx] = { ...normalized[swapIdx], sort_order: tmpOrder };
    setImages(normalized);
    setError(null);
    try {
      await Promise.all([
        fetch(`/api/admin-proxy/images/${normalized[idx].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: normalized[idx].sort_order }),
        }),
        fetch(`/api/admin-proxy/images/${normalized[swapIdx].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: normalized[swapIdx].sort_order }),
        }),
      ]);
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
    setConfirmDeleteDocId(null);
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
              <option value="affiliate_external">Affiliate (extern)</option>
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
            <label>Verfügbarkeit</label>
            <select value={availabilityStatus} onChange={(e) => setAvailabilityStatus(e.target.value)}>
              <option value="in_stock">Auf Lager</option>
              <option value="out_of_stock">Ausverkauft (Warteliste)</option>
              <option value="preorder">Vorbestellung</option>
              <option value="on_request">Auf Anfrage</option>
              <option value="discontinued">Eingestellt</option>
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

        <div className="form-row" style={{ maxWidth: 280 }}>
          <div>
            <label>Produktzustand</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="new">Neu</option>
              <option value="like_new">Neuwertig</option>
              <option value="used">Gebraucht</option>
            </select>
          </div>
        </div>

        <div className="form-row form-row-3">
          <div>
            <label>Mehrwertsteuer</label>
            <select value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))}>
              <option value={19}>19% MwSt. (Regelsteuersatz)</option>
              <option value={0}>0% MwSt. (Nullsteuersatz §12 Abs. 3 UStG)</option>
              <option value={7}>7% MwSt. (ermäßigt)</option>
            </select>
          </div>
          <div>
            <label>Versandart</label>
            <select value={shippingType} onChange={(e) => setShippingType(e.target.value)}>
              <option value="freight">Spedition – Kosten auf Anfrage</option>
              <option value="free">Kostenloser Versand</option>
              <option value="flat">Pauschalpreis</option>
              <option value="pickup">Nur Abholung</option>
            </select>
          </div>
          <div>
            <label>Versandkosten <span className="opt">(nur bei Pauschale)</span></label>
            <input
              type="text"
              value={shippingCents}
              onChange={(e) => setShippingCents(e.target.value)}
              placeholder="z.B. 9,90"
              disabled={shippingType !== "flat"}
              style={{ opacity: shippingType !== "flat" ? 0.4 : 1 }}
            />
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

      {/* ── Affiliate ── */}
      {productType === "affiliate_external" && (
        <div className="form-card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginTop: 0 }}>Affiliate-Link</div>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            Produkt wird mit einem externen Partnerlink angezeigt. Kein eigener Checkout.
            Der Link muss den korrekten Amazon-Partnertag enthalten.
          </p>

          {status === "active" && (!affiliateUrl.trim() || !affiliateEnabled) && (
            <div className="alert alert-error" style={{ marginBottom: 12 }}>
              Produkt ist aktiv, aber der Affiliate-Link ist leer oder deaktiviert.
              Bitte Link eintragen und aktivieren, oder Status auf Entwurf setzen.
            </div>
          )}

          <div className="form-row form-row-2">
            <div>
              <label>Affiliate-Link <span className="req">*</span></label>
              <input
                type="url"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://www.amazon.de/dp/...?tag=PARTNER-21"
              />
            </div>
            <div>
              <label>Anbieter <span className="opt">(optional)</span></label>
              <input
                type="text"
                value={affiliateProvider}
                onChange={(e) => setAffiliateProvider(e.target.value)}
                placeholder="amazon"
              />
            </div>
          </div>

          <div className="form-row form-row-2">
            <div>
              <label>ASIN <span className="opt">(optional, für spätere Statistiken)</span></label>
              <input
                type="text"
                value={affiliateAsin}
                onChange={(e) => setAffiliateAsin(e.target.value)}
                placeholder="B09XYZABC1"
              />
            </div>
            <div>
              <label>Button-Label <span className="opt">(optional)</span></label>
              <input
                type="text"
                value={affiliateButtonLabel}
                onChange={(e) => setAffiliateButtonLabel(e.target.value)}
                placeholder="Bei Amazon ansehen"
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Disclosure-Text <span className="opt">(optional, überschreibt Standard)</span></label>
              <input
                type="text"
                value={affiliateDisclosure}
                onChange={(e) => setAffiliateDisclosure(e.target.value)}
                placeholder="Partnerlink: Beim Kauf erhalten wir ggf. eine Provision."
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={affiliateEnabled}
                  onChange={(e) => setAffiliateEnabled(e.target.checked)}
                />
                Affiliate-Link aktiv (Produkt wird mit Partnerlink angezeigt)
              </label>
            </div>
          </div>

          {affiliateStats && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Klickstatistik
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{affiliateStats.clicksLast7Days}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Letzte 7 Tage</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{affiliateStats.clicksLast30Days}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Letzte 30 Tage</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{affiliateStats.totalClicks}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Gesamt</div>
                </div>
              </div>
              {affiliateStats.lastClickedAt && (
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 10, textAlign: "center" }}>
                  Letzter Klick: {new Date(affiliateStats.lastClickedAt).toLocaleString("de-DE")}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Angebot ── */}
      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Angebot</div>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
          Zeitraum und Label gelten produktweit. Angebotspreis wird pro Variante gesetzt.
          Countdown nur aktivierbar wenn ein Enddatum gesetzt ist.
        </p>

        <div className="form-row form-row-2">
          <div>
            <label>Angebot ab <span className="opt">(optional, leer = sofort)</span></label>
            <input
              type="datetime-local"
              value={saleStartsAt}
              onChange={(e) => setSaleStartsAt(e.target.value)}
            />
          </div>
          <div>
            <label>Angebot bis <span className="opt">(optional, leer = kein Ablauf)</span></label>
            <input
              type="datetime-local"
              value={saleEndsAt}
              onChange={(e) => {
                setSaleEndsAt(e.target.value);
                if (!e.target.value) setShowCountdown(false);
              }}
            />
          </div>
        </div>

        <div className="form-row form-row-2">
          <div>
            <label>Angebots-Label <span className="opt">(optional, z.B. "Frühjahrsangebot")</span></label>
            <input
              type="text"
              value={saleLabel}
              onChange={(e) => setSaleLabel(e.target.value)}
              placeholder='Standard: "Angebot"'
            />
          </div>
          <div style={{ paddingTop: 24 }}>
            <label className="checkbox-row" style={{ opacity: saleEndsAt.trim() ? 1 : 0.4 }}>
              <input
                type="checkbox"
                checked={showCountdown}
                disabled={!saleEndsAt.trim()}
                onChange={(e) => setShowCountdown(e.target.checked)}
              />
              Countdown anzeigen
            </label>
            {!saleEndsAt.trim() && (
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                Kein Countdown ohne Enddatum.
              </p>
            )}
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

        {imageError && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            Fehler beim Löschen: {imageError}
          </div>
        )}

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
                    {[...images].sort((a, b) => a.sort_order - b.sort_order).map((img, idx, sorted) => (
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
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ minWidth: 18, textAlign: "center", fontSize: 12, color: "#6b7280" }}>
                              {idx + 1}
                            </span>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleMoveImage(img.id, "up")}
                              disabled={idx === 0}
                              title="Nach oben"
                              style={{ padding: "2px 6px" }}
                            >↑</button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleMoveImage(img.id, "down")}
                              disabled={idx === sorted.length - 1}
                              title="Nach unten"
                              style={{ padding: "2px 6px" }}
                            >↓</button>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          {confirmDeleteImageId === img.id ? (
                            <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                              <span style={{ fontSize: 12, color: "#ef4444", marginRight: 4 }}>Sicher?</span>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                disabled={deletingImageId === img.id}
                                onClick={() => handleDeleteImage(img.id)}
                              >
                                {deletingImageId === img.id ? "…" : "Ja, löschen"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setConfirmDeleteImageId(null)}
                              >
                                Abbrechen
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setConfirmDeleteImageId(img.id)}
                            >
                              Löschen
                            </button>
                          )}
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px auto", gap: 8, alignItems: "end" }}>
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
                    <th>Angebotspreis</th>
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
                      <td>
                        {editingVariantId === v.id ? (
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <input
                              type="text"
                              value={editingVariantPrice}
                              onChange={(e) => setEditingVariantPrice(e.target.value)}
                              style={{ width: 90 }}
                              placeholder="z.B. 1299,00"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); handleUpdateVariantPrice(v.id); }
                                if (e.key === "Escape") setEditingVariantId(null);
                              }}
                            />
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => handleUpdateVariantPrice(v.id)}>✓</button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingVariantId(null)}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span>{v.price_cents != null ? `${(v.price_cents / 100).toFixed(2).replace(".", ",")} €` : <span style={{ color: "#ef4444", fontWeight: 600 }}>kein Preis!</span>}</span>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingVariantId(v.id);
                                setEditingVariantPrice(v.price_cents != null ? (v.price_cents / 100).toFixed(2).replace(".", ",") : "");
                              }}
                            >
                              Bearbeiten
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {editingSalePriceId === v.id ? (
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <input
                              type="text"
                              value={editingSalePrice}
                              onChange={(e) => setEditingSalePrice(e.target.value)}
                              style={{ width: 90 }}
                              placeholder="leer = kein Angebot"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); handleUpdateVariantSalePrice(v.id); }
                                if (e.key === "Escape") setEditingSalePriceId(null);
                              }}
                            />
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => handleUpdateVariantSalePrice(v.id)}>✓</button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingSalePriceId(null)}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ color: v.sale_price_cents != null ? "#ea580c" : "#9ca3af" }}>
                              {v.sale_price_cents != null ? `${(v.sale_price_cents / 100).toFixed(2).replace(".", ",")} €` : "—"}
                            </span>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingSalePriceId(v.id);
                                setEditingSalePrice(v.sale_price_cents != null ? (v.sale_price_cents / 100).toFixed(2).replace(".", ",") : "");
                              }}
                            >
                              Setzen
                            </button>
                          </div>
                        )}
                      </td>
                      <td>{v.currency}</td>
                      <td>
                        {editingStockId === v.id ? (
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <input
                              type="number"
                              min="0"
                              value={editingStockValue}
                              onChange={(e) => setEditingStockValue(e.target.value)}
                              style={{ width: 70 }}
                              placeholder="0"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); handleUpdateVariantStock(v.id); }
                                if (e.key === "Escape") setEditingStockId(null);
                              }}
                            />
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => handleUpdateVariantStock(v.id)}>✓</button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingStockId(null)}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ color: (v.stock_quantity ?? 0) === 0 ? "#ef4444" : undefined, fontWeight: (v.stock_quantity ?? 0) === 0 ? 600 : undefined }}>
                              {v.stock_quantity ?? 0}
                            </span>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingStockId(v.id);
                                setEditingStockValue(String(v.stock_quantity ?? 0));
                              }}
                            >
                              Ändern
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${v.is_active ? "badge-active" : "badge-inactive"}`}>
                          {v.is_active ? "Ja" : "Nein"}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {confirmDeleteVariantId === v.id ? (
                          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#ef4444", marginRight: 4 }}>Sicher?</span>
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteVariant(v.id)}>Ja</button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmDeleteVariantId(null)}>Nein</button>
                          </span>
                        ) : (
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmDeleteVariantId(v.id)}>Löschen</button>
                        )}
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
                      <td style={{ whiteSpace: "nowrap" }}>
                        {confirmDeleteDocId === doc.id ? (
                          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#ef4444", marginRight: 4 }}>Sicher?</span>
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteDocument(doc.id)}>Ja</button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmDeleteDocId(null)}>Nein</button>
                          </span>
                        ) : (
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmDeleteDocId(doc.id)}>Entfernen</button>
                        )}
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
        {!isNew && product?.slug && (
          <a
            href={`https://webshop.wsp-solarenergie.de/products/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            🔗 Live ansehen
          </a>
        )}
        {!isNew && product?.sourceListing?.listing_url && (
          <a
            href={product.sourceListing.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            📋 Kleinanzeige
          </a>
        )}
        {!isNew && product?.status !== "archived" && (
          <button
            type="button"
            className="btn btn-danger"
            style={{ marginLeft: "auto" }}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Wird archiviert…" : "Archivieren"}
          </button>
        )}
        {!isNew && product?.status === "archived" && (
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#64748b", alignSelf: "center" }}>
            ✓ Archiviert – nicht mehr im Shop sichtbar
          </span>
        )}
      </div>
    </form>
  );
}
