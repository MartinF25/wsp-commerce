"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TickerMessage, TickerInput, LiveTickerStatus, LiveTickerType, LiveTickerScope } from "@/lib/api";

interface TickerFormProps {
  initial?: TickerMessage;
}

const LOCALES = ["de", "en", "es"] as const;
const LOCALE_LABELS: Record<string, string> = {
  de: "Deutsch (Pflicht)",
  en: "Englisch (optional – Fallback: DE)",
  es: "Spanisch (optional – Fallback: DE)",
};

async function proxyFetch(path: string, method: string, body?: unknown) {
  const res = await fetch(`/api/admin-proxy/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: { message?: string } }).error?.message ?? `Fehler ${res.status}`);
  }
  return res.json();
}

export function TickerForm({ initial }: TickerFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<LiveTickerType>(initial?.type ?? "info");
  const [scope, setScope] = useState<LiveTickerScope>(initial?.scope ?? "global");
  const [solutionSlug, setSolutionSlug] = useState(initial?.solution_slug ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? 0);
  const [startsAt, setStartsAt] = useState(
    initial?.starts_at ? initial.starts_at.slice(0, 16) : ""
  );
  const [endsAt, setEndsAt] = useState(
    initial?.ends_at ? initial.ends_at.slice(0, 16) : ""
  );
  const [linkHref, setLinkHref] = useState(initial?.link_href ?? "");
  const [status, setStatus] = useState<LiveTickerStatus>(initial?.status ?? "draft");

  const [translations, setTranslations] = useState<
    Record<string, { text: string; link_label: string }>
  >(
    Object.fromEntries(
      LOCALES.map((loc) => {
        const t = initial?.translations.find((x) => x.locale === loc);
        return [loc, { text: t?.text ?? "", link_label: t?.link_label ?? "" }];
      })
    )
  );

  function setTransField(locale: string, field: "text" | "link_label", value: string) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload: TickerInput = {
      type: type as TickerInput["type"],
      scope: scope as TickerInput["scope"],
      solution_slug: scope === "solution" && solutionSlug ? solutionSlug : null,
      priority,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      link_href: linkHref || null,
      translations: LOCALES.filter((loc) => translations[loc]?.text?.trim()).map((loc) => ({
        locale: loc,
        text: translations[loc].text.trim(),
        link_label: translations[loc].link_label?.trim() || null,
      })),
    };

    try {
      if (initial) {
        await proxyFetch(`ticker/${initial.id}`, "PUT", payload);
        if (status !== initial.status) {
          await proxyFetch(`ticker/${initial.id}/status`, "PATCH", { status });
        }
      } else {
        const created = await proxyFetch("ticker", "POST", payload) as { data: TickerMessage };
        if (status !== "draft") {
          await proxyFetch(`ticker/${created.data.id}/status`, "PATCH", { status });
        }
      }
      router.push("/ticker");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!confirm("Ticker-Nachricht wirklich löschen?")) return;
    setDeleting(true);
    try {
      await proxyFetch(`ticker/${initial.id}`, "DELETE");
      router.push("/ticker");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-card">
        <div className="section-title">Einstellungen</div>

        <div className="form-row form-row-2">
          <div>
            <label>Typ</label>
            <select value={type} onChange={(e) => setType(e.target.value as LiveTickerType)}>
              <option value="info">Hinweis</option>
              <option value="offer">Angebot</option>
              <option value="availability">Verfügbarkeit</option>
              <option value="blog">Ratgeber</option>
              <option value="product">Produkt</option>
              <option value="warning">Achtung</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as LiveTickerStatus)}>
              <option value="draft">Entwurf</option>
              <option value="active">Aktiv</option>
              <option value="archived">Archiviert</option>
            </select>
          </div>
        </div>

        <div className="form-row form-row-2">
          <div>
            <label>Scope</label>
            <select value={scope} onChange={(e) => setScope(e.target.value as LiveTickerScope)}>
              <option value="global">Alle Seiten</option>
              <option value="solution">Lösungsseite</option>
              <option value="category">Kategorie</option>
              <option value="product">Produkt</option>
            </select>
          </div>
          {scope === "solution" ? (
            <div>
              <label>Lösungs-Slug</label>
              <select value={solutionSlug} onChange={(e) => setSolutionSlug(e.target.value)}>
                <option value="">— auswählen —</option>
                <option value="solarzaun">solarzaun</option>
                <option value="skywind">skywind</option>
                <option value="kombiloesungen">kombiloesungen</option>
              </select>
            </div>
          ) : (
            <div>
              <label>Priorität <span style={{ color: "#9ca3af", fontWeight: 400 }}>(0–100, höher = oben)</span></label>
              <input
                type="number"
                min={0}
                max={100}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <div className="form-row form-row-2">
          <div>
            <label>Startet am <span style={{ color: "#9ca3af", fontWeight: 400 }}>(leer = sofort)</span></label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div>
            <label>Endet am <span style={{ color: "#9ca3af", fontWeight: 400 }}>(leer = kein Ablauf)</span></label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Link-URL <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
            <input
              type="url"
              placeholder="https://..."
              value={linkHref}
              onChange={(e) => setLinkHref(e.target.value)}
            />
          </div>
        </div>

        <div className="section-title" style={{ marginTop: 28 }}>Texte & Übersetzungen</div>

        {LOCALES.map((loc) => (
          <div key={loc} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {LOCALE_LABELS[loc]}
            </p>
            <div className="form-row form-row-2">
              <div>
                <label>Text{loc === "de" ? " *" : ""}</label>
                <input
                  type="text"
                  value={translations[loc]?.text ?? ""}
                  onChange={(e) => setTransField(loc, "text", e.target.value)}
                  required={loc === "de"}
                  placeholder={loc === "de" ? "Ticker-Text auf Deutsch" : "Leer lassen für DE-Fallback"}
                />
              </div>
              <div>
                <label>Link-Label <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  value={translations[loc]?.link_label ?? ""}
                  onChange={(e) => setTransField(loc, "link_label", e.target.value)}
                  placeholder="z.B. Mehr erfahren"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Wird gespeichert…" : "Speichern"}
          </button>
          {initial && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Wird gelöscht…" : "Löschen"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
