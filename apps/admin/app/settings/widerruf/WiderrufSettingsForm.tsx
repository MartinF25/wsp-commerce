"use client";

import { useState } from "react";
import type { CancellationSettings, CancellationExcludedProduct, CancellationExcludedCategory } from "@/lib/api";

const MODE_LABELS = {
  always_submit:      "Modus 1 – Immer übermitteln (empfohlen)",
  plausibility_check: "Modus 2 – Plausibilitätsprüfung (Hinweis bei möglicher Fristüberschreitung)",
  auto_reject:        "Modus 3 – Automatische Ablehnung bei abgelaufener Frist ⚠",
};

export function WiderrufSettingsForm({
  settings,
  excludedProducts,
  excludedCategories,
}: {
  settings: CancellationSettings;
  excludedProducts: CancellationExcludedProduct[];
  excludedCategories: CancellationExcludedCategory[];
}) {
  const [form, setForm] = useState({ ...settings });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ type: "success" | "error"; text: string } | null>(null);

  function setField<K extends keyof CancellationSettings>(key: K, value: CancellationSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin-proxy/settings/cancellation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern");
      setMsg({ type: "success", text: "Einstellungen gespeichert." });
    } catch {
      setMsg({ type: "error", text: "Speichern fehlgeschlagen." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 860 }}>

      {/* Grundeinstellungen */}
      <div className="form-card" style={{ marginBottom: 20 }}>
        <div className="section-title">Grundeinstellungen</div>

        <div className="form-row">
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setField("is_active", e.target.checked)}
            />
            <label htmlFor="is_active" style={{ marginBottom: 0, fontWeight: 400 }}>
              Widerruf-Feature aktiv
            </label>
          </div>
        </div>

        <div className="form-row form-row-2">
          <div>
            <label htmlFor="deadline_days">Widerrufsfrist (Tage) <span className="req">*</span></label>
            <input
              id="deadline_days"
              type="number"
              min={1}
              max={365}
              value={form.deadline_days}
              onChange={(e) => setField("deadline_days", Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="delivery_buffer_days">Lieferpuffer (Tage)</label>
            <input
              id="delivery_buffer_days"
              type="number"
              min={0}
              max={30}
              value={form.delivery_buffer_days}
              onChange={(e) => setField("delivery_buffer_days", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label htmlFor="mode">Fristenmodus <span className="req">*</span></label>
            <select
              id="mode"
              value={form.mode}
              onChange={(e) => setField("mode", e.target.value as CancellationSettings["mode"])}
            >
              {Object.entries(MODE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            {form.mode === "auto_reject" && (
              <p style={{ fontSize: 12, color: "#b45309", marginTop: 4, background: "#fef3c7", padding: "6px 10px", borderRadius: 4 }}>
                ⚠ Automatische Ablehnung ist rechtlich sensibel. Stellen Sie sicher, dass der tatsächliche Warenerhalt korrekt erfasst wird, da EU-Recht grundsätzlich den nachweisbaren Warenerhalt als Fristbeginn vorsieht.
              </p>
            )}
          </div>
        </div>

        <div className="form-row">
          <div>
            <label htmlFor="admin_email">Admin-E-Mail (Empfänger für neue Anfragen)</label>
            <input
              id="admin_email"
              type="email"
              value={form.admin_email}
              onChange={(e) => setField("admin_email", e.target.value)}
              placeholder="verkauf@wsp-solarenergie.de"
            />
          </div>
        </div>
      </div>

      {/* Frontend-Integration */}
      <div className="form-card" style={{ marginBottom: 20 }}>
        <div className="section-title">Frontend-Integration</div>

        <div className="form-row">
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="show_footer_link"
              checked={form.show_footer_link}
              onChange={(e) => setField("show_footer_link", e.target.checked)}
            />
            <label htmlFor="show_footer_link" style={{ marginBottom: 0, fontWeight: 400 }}>
              Footer-Link anzeigen
            </label>
          </div>
        </div>

        <div className="form-row">
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="show_account_link"
              checked={form.show_account_link}
              onChange={(e) => setField("show_account_link", e.target.checked)}
            />
            <label htmlFor="show_account_link" style={{ marginBottom: 0, fontWeight: 400 }}>
              Kundenkonto-Link anzeigen
            </label>
          </div>
        </div>

        <div className="form-row form-row-2">
          <div>
            <label htmlFor="privacy_page_url">Datenschutz-URL</label>
            <input
              id="privacy_page_url"
              type="url"
              value={form.privacy_page_url ?? ""}
              onChange={(e) => setField("privacy_page_url", e.target.value || null)}
              placeholder="/datenschutz"
            />
          </div>
          <div>
            <label htmlFor="cancellation_policy_url">Widerrufsbelehrung-URL</label>
            <input
              id="cancellation_policy_url"
              type="url"
              value={form.cancellation_policy_url ?? ""}
              onChange={(e) => setField("cancellation_policy_url", e.target.value || null)}
              placeholder="/widerrufsbelehrung"
            />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="form-card" style={{ marginBottom: 20 }}>
        <div className="section-title">SEO</div>

        <div className="form-row">
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="noindex"
              checked={form.noindex}
              onChange={(e) => setField("noindex", e.target.checked)}
            />
            <label htmlFor="noindex" style={{ marginBottom: 0, fontWeight: 400 }}>
              noindex (Seite aus Suchmaschinen ausblenden)
            </label>
          </div>
        </div>

        {(["de", "en", "es"] as const).map((lang) => (
          <div key={lang}>
            <div className="section-title" style={{ marginTop: 16 }}>Sprache: {lang.toUpperCase()}</div>
            <div className="form-row">
              <div>
                <label>Meta Title ({lang})</label>
                <input
                  type="text"
                  value={(form[`meta_title_${lang}` as keyof CancellationSettings] as string) ?? ""}
                  onChange={(e) => setField(`meta_title_${lang}` as keyof CancellationSettings, e.target.value || null as never)}
                />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Meta Description ({lang})</label>
                <input
                  type="text"
                  value={(form[`meta_description_${lang}` as keyof CancellationSettings] as string) ?? ""}
                  onChange={(e) => setField(`meta_description_${lang}` as keyof CancellationSettings, e.target.value || null as never)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ausgeschlossene Produkte */}
      <div className="form-card" style={{ marginBottom: 20 }}>
        <div className="section-title">Ausgeschlossene Produkte</div>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          Anfragen mit diesen Produkten werden trotzdem übermittelt, aber mit einem Hinweis markiert.
        </p>
        {excludedProducts.length === 0 ? (
          <p className="empty" style={{ padding: "12px 0" }}>Keine Produkte ausgeschlossen.</p>
        ) : (
          <div className="sub-table-wrapper" style={{ marginBottom: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Slug</th>
                  <th>Grund</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {excludedProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.product_name}</td>
                    <td style={{ fontSize: 11, fontFamily: "monospace" }}>{p.product_slug}</td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{p.reason ?? "—"}</td>
                    <td>
                      <ExcludeDeleteButton
                        endpoint={`/api/admin-proxy/settings/cancellation/excluded-products/${p.id}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ fontSize: 12, color: "#6b7280" }}>
          Produkte können über die Commerce Admin API hinzugefügt werden:
          <code className="code-inline" style={{ marginLeft: 4 }}>POST /api/admin/settings/cancellation/excluded-products</code>
        </p>
      </div>

      {/* Ausgeschlossene Kategorien */}
      <div className="form-card" style={{ marginBottom: 20 }}>
        <div className="section-title">Ausgeschlossene Kategorien</div>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          Produkte aus diesen Kategorien werden mit einem Hinweis in der Widerrufsanfrage markiert.
        </p>
        {excludedCategories.length === 0 ? (
          <p className="empty" style={{ padding: "12px 0" }}>Keine Kategorien ausgeschlossen.</p>
        ) : (
          <div className="sub-table-wrapper" style={{ marginBottom: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>Kategorie</th>
                  <th>Slug</th>
                  <th>Grund</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {excludedCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.category_name}</td>
                    <td style={{ fontSize: 11, fontFamily: "monospace" }}>{cat.category_slug}</td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{cat.reason ?? "—"}</td>
                    <td>
                      <ExcludeDeleteButton
                        endpoint={`/api/admin-proxy/settings/cancellation/excluded-categories/${cat.id}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Speichern */}
      {msg && (
        <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: 12 }}>
          {msg.text}
        </div>
      )}

      <div className="form-actions">
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? "Speichern…" : "Einstellungen speichern"}
        </button>
      </div>
    </div>
  );
}

function ExcludeDeleteButton({ endpoint }: { endpoint: string }) {
  const [loading, setLoading] = useState(false);

  async function del() {
    if (!confirm("Ausschluss entfernen?")) return;
    setLoading(true);
    await fetch(endpoint, { method: "DELETE" }).catch(() => null);
    window.location.reload();
  }

  return (
    <button onClick={del} disabled={loading} className="btn btn-danger btn-sm">
      {loading ? "…" : "Entfernen"}
    </button>
  );
}
