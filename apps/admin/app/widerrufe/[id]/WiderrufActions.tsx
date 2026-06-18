"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CancellationRequest, CancellationStatus } from "@/lib/api";

const STATUS_OPTIONS: { value: CancellationStatus; label: string }[] = [
  { value: "widerruf_beantragt",   label: "Beantragt" },
  { value: "widerruf_in_pruefung", label: "In Prüfung" },
  { value: "widerruf_akzeptiert",  label: "Akzeptiert" },
  { value: "widerruf_abgelehnt",   label: "Abgelehnt" },
];

export function WiderrufActions({ request }: { request: CancellationRequest }) {
  const router = useRouter();

  const [status, setStatus]       = useState<CancellationStatus>(request.status);
  const [notes, setNotes]         = useState(request.admin_notes ?? "");
  const [saving, setSaving]       = useState(false);
  const [resending, setResending] = useState(false);
  const [msg, setMsg]             = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function saveStatus() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin-proxy/cancellations/${request.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern");
      setMsg({ type: "success", text: "Status gespeichert." });
      router.refresh();
    } catch {
      setMsg({ type: "error", text: "Speichern fehlgeschlagen." });
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin-proxy/cancellations/${request.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: notes || null }),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern");
      setMsg({ type: "success", text: "Notizen gespeichert." });
    } catch {
      setMsg({ type: "error", text: "Speichern fehlgeschlagen." });
    } finally {
      setSaving(false);
    }
  }

  async function resendEmail() {
    setResending(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin-proxy/cancellations/${request.id}/resend-email`, {
        method: "POST",
      });
      const json = await res.json() as { data?: { sent: boolean } };
      if (json.data?.sent) {
        setMsg({ type: "success", text: "Kunden-E-Mail erfolgreich erneut gesendet." });
      } else {
        setMsg({ type: "error", text: "E-Mail konnte nicht gesendet werden (RESEND_API_KEY prüfen)." });
      }
    } catch {
      setMsg({ type: "error", text: "E-Mail-Versand fehlgeschlagen." });
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Status-Änderung */}
      <div className="form-card">
        <div className="section-title">Status ändern</div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as CancellationStatus)}
          style={{ width: "100%", marginBottom: 10 }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button onClick={saveStatus} disabled={saving} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          {saving ? "Speichern…" : "Status speichern"}
        </button>
      </div>

      {/* Admin-Notizen */}
      <div className="form-card">
        <div className="section-title">Interne Notizen</div>
        <textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Interne Notizen (nicht für den Kunden sichtbar) …"
          style={{ width: "100%", marginBottom: 10, resize: "vertical" }}
        />
        <button onClick={saveNotes} disabled={saving} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
          {saving ? "Speichern…" : "Notizen speichern"}
        </button>
      </div>

      {/* E-Mail erneut senden */}
      <div className="form-card">
        <div className="section-title">E-Mail</div>
        <button
          onClick={resendEmail}
          disabled={resending}
          className="btn btn-secondary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          {resending ? "Wird gesendet…" : "Kunden-E-Mail erneut senden"}
        </button>
      </div>

      {/* Feedback */}
      {msg && (
        <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
