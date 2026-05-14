/**
 * Firebase Cloud Functions – wsp-commerce Lead- & Waitlist-Ingestion
 *
 * onLeadSubmit (HTTP Function)
 * ─────────────────────────────
 * Empfängt Payloads von der Storefront und routet nach payload.type:
 *   type "lead"                    → leads/{leadId}
 *   type "product.waitlist.created" → product_waitlist/{entryId}
 *
 * Beide Flows schreiben nach Firestore und triggern den n8n-Webhook.
 *
 * Firestore-Struktur: product_waitlist/{entryId}
 *   entryId      string    – UUID
 *   type         "product.waitlist.created"
 *   productId    string
 *   productSlug  string
 *   productName  string
 *   variantId    string | null
 *   variantSku   string | null
 *   email        string
 *   firstName    string | null
 *   locale       "de" | "en" | "es"
 *   consentAccepted boolean
 *   status       "pending"
 *   sourcePath   string
 *   submittedAt  string    – ISO 8601
 *   createdAt    Timestamp
 *   notifiedAt   Timestamp | null
 *   n8nStatus    "pending" | "sent" | "failed"
 *   n8nSentAt    Timestamp | null
 */

import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

// Firebase Admin einmalig initialisieren (idempotent)
initializeApp();

// ─── Typen ────────────────────────────────────────────────────────────────────

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

interface WaitlistPayload {
  type: "product.waitlist.created";
  productId: string;
  productSlug: string;
  productName: string;
  variantId?: string | null;
  variantSku?: string | null;
  email: string;
  firstName?: string | null;
  locale: "de" | "en" | "es";
  consentAccepted: true;
  sourcePath: string;
  submittedAt: string;
}

// ─── Validierung ──────────────────────────────────────────────────────────────

function isValidLeadPayload(body: unknown): body is LeadPayload {
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

function isValidWaitlistPayload(body: unknown): body is WaitlistPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    b["type"] === "product.waitlist.created" &&
    typeof b["productId"] === "string" && b["productId"].trim().length > 0 &&
    typeof b["productSlug"] === "string" && b["productSlug"].trim().length > 0 &&
    typeof b["productName"] === "string" && b["productName"].trim().length > 0 &&
    typeof b["email"] === "string" && b["email"].includes("@") &&
    (b["locale"] === "de" || b["locale"] === "en" || b["locale"] === "es") &&
    b["consentAccepted"] === true &&
    typeof b["sourcePath"] === "string" &&
    typeof b["submittedAt"] === "string"
  );
}

// ─── HTTP Function ────────────────────────────────────────────────────────────

export const onLeadSubmit = onRequest(
  {
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

    const payload = req.body as unknown;
    const n8nBaseUrl = process.env.N8N_WEBHOOK_URL;
    const db = getFirestore();

    // ── Router ───────────────────────────────────────────────────────────────
    if (isValidWaitlistPayload(payload)) {
      await handleWaitlist(payload, db, n8nBaseUrl ?? null, res);
      return;
    }

    if (isValidLeadPayload(payload)) {
      await handleLead(payload, db, n8nBaseUrl ?? null, res);
      return;
    }

    console.warn("[onLeadSubmit] Ungültiger Payload:", JSON.stringify(payload));
    res.status(400).json({ error: "Invalid payload: required fields missing or malformed." });
  }
);

// ─── Lead Handler ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleLead(
  payload: LeadPayload,
  db: ReturnType<typeof getFirestore>,
  n8nBaseUrl: string | null,
  res: any
) {
  const leadId = randomUUID();

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
    console.info(`[handleLead] Lead gespeichert: ${leadId} (${payload.email})`);
  } catch (err) {
    console.error("[handleLead] Firestore-Fehler:", err);
    res.status(500).json({ error: "Lead konnte nicht gespeichert werden." });
    return;
  }

  await triggerN8n(db, "leads", leadId, n8nBaseUrl, "/webhook/lead", payload, "Lead");

  res.status(200).json({ success: true, leadId });
}

// ─── Waitlist Handler ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleWaitlist(
  payload: WaitlistPayload,
  db: ReturnType<typeof getFirestore>,
  n8nBaseUrl: string | null,
  res: any
) {
  const email = payload.email.trim().toLowerCase();

  // Duplicate check: same email + productId already pending/notified
  try {
    const existing = await db
      .collection("product_waitlist")
      .where("email", "==", email)
      .where("productId", "==", payload.productId)
      .limit(1)
      .get();

    if (!existing.empty) {
      console.info(`[handleWaitlist] Duplikat: ${email} für Produkt ${payload.productId}`);
      res.status(409).json({ error: "Already on waitlist." });
      return;
    }
  } catch (err) {
    console.error("[handleWaitlist] Firestore-Duplikatprüfung fehlgeschlagen:", err);
    res.status(500).json({ error: "Waitlist-Prüfung fehlgeschlagen." });
    return;
  }

  const entryId = randomUUID();

  const entryDoc = {
    entryId,
    type: payload.type,
    productId: payload.productId,
    productSlug: payload.productSlug,
    productName: payload.productName,
    variantId: payload.variantId ?? null,
    variantSku: payload.variantSku ?? null,
    email,
    firstName: payload.firstName ?? null,
    locale: payload.locale,
    consentAccepted: true,
    status: "pending",
    sourcePath: payload.sourcePath,
    submittedAt: payload.submittedAt,
    createdAt: FieldValue.serverTimestamp(),
    notifiedAt: null as Timestamp | null,
    n8nStatus: "pending" as const,
    n8nSentAt: null as Timestamp | null,
  };

  try {
    await db.collection("product_waitlist").doc(entryId).set(entryDoc);
    console.info(`[handleWaitlist] Eintrag gespeichert: ${entryId} (${email}, Produkt: ${payload.productSlug})`);
  } catch (err) {
    console.error("[handleWaitlist] Firestore-Fehler:", err);
    res.status(500).json({ error: "Wartelisten-Eintrag konnte nicht gespeichert werden." });
    return;
  }

  await triggerN8n(db, "product_waitlist", entryId, n8nBaseUrl, "/webhook/waitlist", payload, "Waitlist");

  res.status(200).json({ success: true, entryId });
}

// ─── n8n-Hilfsfunktion ────────────────────────────────────────────────────────

async function triggerN8n(
  db: ReturnType<typeof getFirestore>,
  collection: string,
  docId: string,
  n8nBaseUrl: string | null,
  path: string,
  payload: unknown,
  label: string
) {
  if (!n8nBaseUrl) {
    console.warn(`[${label}] N8N_WEBHOOK_URL nicht gesetzt – n8n-Trigger übersprungen.`);
    await db.collection(collection).doc(docId).update({ n8nStatus: "failed" });
    return;
  }

  try {
    const n8nRes = await fetch(
      `${n8nBaseUrl.replace(/\/$/, "")}${path}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (n8nRes.ok) {
      await db.collection(collection).doc(docId).update({
        n8nStatus: "sent",
        n8nSentAt: FieldValue.serverTimestamp(),
      });
      console.info(`[${label}] n8n-Webhook gesendet für ${docId}`);
    } else {
      const body = await n8nRes.text().catch(() => "");
      console.warn(`[${label}] n8n antwortete mit ${n8nRes.status} für ${docId}:`, body);
      await db.collection(collection).doc(docId).update({ n8nStatus: "failed" });
    }
  } catch (err) {
    console.error(`[${label}] n8n-Webhook fehlgeschlagen für ${docId}:`, err);
    await db
      .collection(collection)
      .doc(docId)
      .update({ n8nStatus: "failed" })
      .catch(() => undefined);
  }
}
