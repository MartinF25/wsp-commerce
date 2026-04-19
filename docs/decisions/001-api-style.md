# ADR-001: API-Stil zwischen Storefront und Commerce API

**Status:** Accepted  
**Datum:** 2026-04-19  
**Bereich:** apps/storefront ↔ apps/commerce

---

## Kontext

Die Hybrid-Architektur verbindet vier Systeme miteinander:

- **Next.js Storefront** → liest Produktkatalog, sendet Bestellungen
- **Commerce API** → schreibt in PostgreSQL, empfängt Stripe-Webhooks
- **Firebase Functions** → empfängt Lead-Formulare, triggert n8n
- **n8n** → empfängt Webhooks von Firebase und Commerce API

Alle externen Integrationen (Stripe, n8n, Firebase) kommunizieren ausschließlich über HTTP/REST. Es muss entschieden werden, ob die interne Kommunikation zwischen Storefront und Commerce API ebenfalls REST ist oder ob tRPC eingesetzt wird.

---

## Entscheidung

**REST** für die gesamte Kommunikation zwischen Storefront, Commerce API und allen Integrationspartnern.

tRPC wird in diesem Projekt **nicht eingesetzt**.

---

## Begründung

**1. Alle externen Partner sprechen REST — kein gemischtes API-Layer.**  
Stripe-Webhooks, n8n-Webhooks und Firebase HTTP Functions sind REST. Würde die Commerce API intern tRPC verwenden, entstünde ein Split: tRPC für Storefront-Anfragen, REST für alle anderen. Zwei API-Layer in einem Service erhöhen die Komplexität ohne Gewinn.

**2. Die bestehende Dokumentation ist bereits REST.**  
`checkout-flow.md` definiert `POST /orders`, `payments.md` definiert `POST /payments/intent` und `POST /webhooks/stripe`, `n8n-webhooks.md` definiert `POST /webhook/lead`. Diese Endpunkte sind bereits als Verträge dokumentiert und würden bei tRPC-Einführung neu modelliert werden müssen.

**3. tRPC koppelt Commerce API an den TypeScript/Next.js-Stack.**  
Eine REST API kann von n8n, curl, Stripe, zukünftigen mobilen Clients und einem Admin-Tool konsumiert werden — ohne TypeScript-Overhead auf der Client-Seite. tRPC ist sinnvoll wenn beide Seiten dauerhaft TypeScript sind und keine externen Konsumenten existieren. Das ist hier nicht der Fall.

**4. Typsicherheit wird über `packages/contracts` erreicht, nicht über tRPC.**  
Zod-Schemas in `packages/contracts` definieren Request- und Response-Typen. Storefront und Commerce API importieren dieselben Schemas — damit ist End-to-End-Typsicherheit ohne tRPC erreichbar. Der Validierungscode ist nicht an einen RPC-Transport gebunden.

**5. REST ist das kleinste gemeinsame Vielfache der gesamten Integrations-Landschaft.**  
n8n baut Workflows über HTTP-Nodes. Stripe liefert Events via Webhooks. Firebase Functions exponieren HTTP-Endpoints. Alle drei Systeme erwarten REST-kompatible Endpunkte. REST als einheitlicher Standard reduziert kognitiven Overhead bei der Arbeit über Systemgrenzen hinweg.

---

## Konsequenzen

**Bewusst in Kauf genommene Nachteile:**

- Keine automatische tRPC-Router-Inferenz — API-Typen müssen manuell in `packages/contracts` gepflegt werden
- Kein automatisches Client-SDK-Generieren — Storefront nutzt `fetch` oder eine dünne HTTP-Client-Abstraktion
- Mehr Boilerplate pro Endpunkt als bei tRPC

**Gewonnene Vorteile:**

- Commerce API ist für jeden HTTP-Client konsumierbar (n8n, Stripe, mobile App, Admin)
- Endpunkt-Dokumentation (OpenAPI) ist direkt möglich
- Kein Framework-Lock durch tRPC auf dem Server

---

## API-Struktur für dieses Projekt

| Schnittstelle | Stil | Kommentar |
|---|---|---|
| Storefront → Commerce API | REST | `GET /products`, `POST /orders`, `POST /payments/intent` |
| Stripe → Commerce API | REST Webhook | `POST /webhooks/stripe` |
| Firebase Function → n8n | REST Webhook | `POST /webhook/lead` |
| Commerce API → n8n | REST Webhook | `POST /webhook/order` (optional, für Bestellbenachrichtigung) |
| Storefront → Firebase Auth | Firebase SDK | Kein REST, Firebase-eigenes Protokoll |
| Storefront → Firebase Storage | Firebase SDK | Kein REST, Firebase-eigenes Protokoll |

---

## Verworfene Alternative: tRPC

tRPC wurde erwogen und aus folgenden Gründen abgelehnt:

- Erfordert TypeScript auf beiden Seiten des Transports — schließt n8n und Stripe aus
- Kein sinnvolles Muster für Webhook-Empfang (Stripe, n8n senden kein tRPC)
- Mischt zwei API-Stile in einem Service sobald externe Webhooks hinzukommen
- Overhead nicht gerechtfertigt für ein Projekt mit klarer Integrations-Landschaft

---

## Betroffene Folgedokumente

- `docs/architecture.md` — "REST / tRPC" wird auf "REST" korrigiert
- `packages/contracts` — Zod-Schemas als gemeinsame Typdefinitionen (kein tRPC-Router)
- `.claude/skills/postgres-commerce-core/SKILL.md` — API-Stil konkretisieren
