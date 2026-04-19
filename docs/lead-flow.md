# Lead Flow

## Overview

Lead capture is a first-class feature of wsp-commerce alongside the shop.
Solar/wind inquiries are routed through n8n for enrichment and CRM handoff.

## Flow

```
Storefront Contact Form
        │
        ▼
Firebase Function (onLeadSubmit)
        │
        ├─► Firestore: store raw lead
        │
        └─► n8n Webhook (POST /webhook/lead)
                │
                ├─► Enrich (geocode, company lookup)
                ├─► Route by type (private / commercial / partner)
                ├─► CRM upsert (HubSpot / Pipedrive / Sheets)
                └─► Notify sales team (email / Slack)
```

## Lead Types
- `private` — Privatprojekt
- `commercial` — Gewerbeprojekt
- `agriculture` — Landwirtschaft / Hof
- `partner` — Partnernfrage
- `dealer` — Händleranfrage
- `installer` — Montagepartnerschaft
- `general` — Allgemeine Beratung

## See Also
- [n8n Webhooks](./n8n-webhooks.md)
