/**
 * Firebase Cloud Functions – wsp-commerce Lead-Ingestion
 *
 * onLeadSubmit (HTTP Function)
 * ─────────────────────────────
 * Empfängt einen validierten Lead-Payload von der Storefront Server Action,
 * speichert ihn in Firestore und triggert den n8n-Webhook.
 *
 * Aufruf-Pfad:
 *   Storefront Server Action (submitKontaktanfrage)
 *     → POST https://<region>-<project>.cloudfunctions.net/onLeadSubmit
 *     → Firestore: leads/{leadId}
 *     → n8n: POST {N8N_WEBHOOK_URL}/webhook/lead
 *
 * CORS:
 *   Kein CORS nötig. Der Aufruf kommt von der Next.js Server Action
 *   (Node.js Server-seitig), nicht aus dem Browser. Browser-CORS greift
 *   nur bei direkten Browser→Firebase-Requests.
 *
 * Umgebungsvariablen (Firebase Function Config / Secret Manager):
 *   N8N_WEBHOOK_URL – Basis-URL der n8n-Instanz (z. B. https://n8n.example.com)
 *
 * Firestore-Struktur: leads/{leadId}
 *   leadId          string    – zufällige UUID (auch als Dokument-ID)
 *   type            "lead"
 *   leadType        string    – "private" | "commercial" | ... (n8n-Wert)
 *   firstName       string
 *   lastName        string
 *   company         string | null
 *   email           string
 *   phone           string | null
 *   message         string
 *   productInterest string    – "solarzaun" | "skywind" | "kombi" | "consultation"
 *   region          null      – Platzhalter; n8n kann per Geo-Lookup befüllen
 *   submittedAt     string    – ISO 8601 (vom Client übergeben)
 *   status          "new"     – initiale Status; n8n setzt auf "processing"
 *   source          "kontakt-form"
 *   createdAt       Timestamp – Server-Timestamp (unveränderlich)
 *   n8nStatus       "pending" | "sent" | "failed"
 *   n8nSentAt       Timestamp | null
 */

import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

// Firebase Admin einmalig initialisieren (idempotent)
initializeApp();

// ─── Typen ────────────────────────────────────────────────────────────────────

/**
 * Payload-Shape, die die Storefront Server Action sendet.
 * Entspricht docs/n8n-webhooks.md §POST /webhook/lead.
 */
interface LeadPayload {
  type: "lead";
  leadType: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string;
  phone: string | null;
  message: string;
  productInterest: string;
  region: string | null;
  submittedAt: string;
}

// ─── Validierung ──────────────────────────────────────────────────────────────

function isValidPayload(body: unknown): body is LeadPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    b["type"] === "lead" &&
    typeof b["firstName"] === "string" && b["firstName"].trim().length > 0 &&
    typeof b["lastName"] === "string" && b["lastName"].trim().length > 0 &&
    typeof b["email"] === "string" && b["email"].includes("@") &&
    typeof b["leadType"] === "string" && b["leadType"].trim().length > 0 &&
    typeof b["message"] === "string" && b["message"].trim().length > 0 &&
    typeof b["submittedAt"] === "string"
  );
}

// ─── HTTP Function ────────────────────────────────────────────────────────────

export const onLeadSubmit = onRequest(
  {
    // Kein CORS: Aufruf kommt server-seitig aus der Next.js Server Action.
    // cors: false ist der sichere Default.
    timeoutSeconds: 30,
    memory: "256MiB",
    region: "europe-west1",
  },
  async (req, res) => {
    // ── Method Guard ─────────────────────────────────────────────────────────
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    // ── Payload validieren ───────────────────────────────────────────────────
    const payload = req.body as unknown;

    if (!isValidPayload(payload)) {
      console.warn("[onLeadSubmit] Ungültiger Payload:", JSON.stringify(payload));
      res.status(400).json({ error: "Invalid payload: required fields missing or malformed." });
      return;
    }

    const leadId = randomUUID();
    const db = getFirestore();

    // ── Firestore: Lead speichern ────────────────────────────────────────────
    const leadDoc = {
      leadId,
      type: payload.type,
      leadType: payload.leadType,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      company: payload.company ?? null,
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone ?? null,
      message: payload.message.trim(),
      productInterest: payload.productInterest,
      region: payload.region,
      submittedAt: payload.submittedAt,
      status: "new",
      source: "kontakt-form",
      createdAt: FieldValue.serverTimestamp(),
      n8nStatus: "pending" as const,
      n8nSentAt: null as Timestamp | null,
    };

    try {
      await db.collection("leads").doc(leadId).set(leadDoc);
      console.info(`[onLeadSubmit] Lead gespeichert: ${leadId} (${payload.email})`);
    } catch (err) {
      console.error("[onLeadSubmit] Firestore-Fehler:", err);
      res.status(500).json({ error: "Lead konnte nicht gespeichert werden." });
      return;
    }

    // ── n8n: Webhook triggern ────────────────────────────────────────────────
    const n8nBaseUrl = process.env.N8N_WEBHOOK_URL;

    if (n8nBaseUrl) {
      try {
        const n8nRes = await fetch(
          `${n8nBaseUrl.replace(/\/$/, "")}/webhook/lead`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (n8nRes.ok) {
          await db.collection("leads").doc(leadId).update({
            n8nStatus: "sent",
            n8nSentAt: FieldValue.serverTimestamp(),
          });
          console.info(`[onLeadSubmit] n8n-Webhook gesendet für Lead ${leadId}`);
        } else {
          const body = await n8nRes.text().catch(() => "");
          console.warn(
            `[onLeadSubmit] n8n antwortete mit ${n8nRes.status} für Lead ${leadId}:`,
            body
          );
          await db.collection("leads").doc(leadId).update({ n8nStatus: "failed" });
        }
      } catch (err) {
        // n8n-Fehler blockiert nicht die Antwort – Lead ist in Firestore gesichert.
        console.error(`[onLeadSubmit] n8n-Webhook fehlgeschlagen für Lead ${leadId}:`, err);
        await db
          .collection("leads")
          .doc(leadId)
          .update({ n8nStatus: "failed" })
          .catch(() => undefined); // ignorieren wenn update selbst fehlschlägt
      }
    } else {
      console.warn(
        "[onLeadSubmit] N8N_WEBHOOK_URL nicht gesetzt – n8n-Trigger übersprungen."
      );
      await db.collection("leads").doc(leadId).update({ n8nStatus: "failed" });
    }

    // ── Response ─────────────────────────────────────────────────────────────
    // Immer 200, wenn Firestore-Schreiben erfolgreich war.
    // n8n-Fehler sind intern (Retry-fähig) und werden nicht an den Aufrufer propagiert.
    res.status(200).json({ success: true, leadId });
  }
);
