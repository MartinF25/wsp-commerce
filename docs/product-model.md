# Product Model

## Core Entities

### Product
- `id` (uuid)
- `slug` (unique, URL-safe)
- `name`
- `description` (rich text / markdown)
- `category_id`
- `product_type` (enum: `direct_purchase` | `configurable` | `inquiry_only`) — **Pflichtfeld, Kernsteuerung**
- `status` (draft | active | archived)
- `created_at`, `updated_at`

### ProductVariant
- `id`
- `product_id`
- `sku` (unique)
- `name` (e.g. "3m, Anthrazit")
- `price_cents` (integer, avoid float)
- `currency` (ISO 4217, default: EUR)
- `stock_quantity`
- `attributes` (JSONB — color, length, power output, etc.)

### Category
- `id`, `slug`, `name`, `parent_id`

### ProductImage
- `id`, `product_id`, `url`, `alt`, `sort_order`

## Notes
- Prices are stored in cents (integer) to avoid floating-point issues
- Variants carry all purchasable specifics; base product is a container
- `attributes` JSONB allows flexible product-specific metadata

---

## Product Types

`product_type` ist das zentrale Steuerungsfeld. Es bestimmt Storefront-CTA, Cart-Berechtigung, Backend-Flow und Lead-Pflicht. Es darf nicht optional sein und wird bei der Produktanlage immer explizit gesetzt.

---

### `direct_purchase`

**Fachliche Bedeutung:**  
Standardprodukte mit fixem Preis, sofort und ohne Beratung bestellbar. Preis ist verbindlich und in `price_cents` hinterlegt. Lagerbestand wird geführt.

**Typische Beispiele:**  
Montagematerial, Kabelverbinder, Ersatzteile, definierte Kleinsets (z.B. "Zubehörpaket Solarzaun Standard"), Wartungsprodukte.

**Erlaubte UX / CTA:**
- Primär-CTA: **„In den Warenkorb"**
- Kein Lead-Formular, keine Anfrage
- Preisanzeige: sichtbar, bindend

**Beziehung zu Cart / Checkout:**  
Vollständiger Checkout-Flow: Cart → Address → Payment → Confirmation. Stripe-Zahlung. Order in PostgreSQL.

**Beziehung zu Lead-Flow:**  
Keiner. Firebase und n8n werden nicht involviert.

---

### `configurable`

**Fachliche Bedeutung:**  
Produkte, die vor dem Kauf konfiguriert werden müssen (Länge, Farbe, Leistungsklasse, Anordnung). Der Preis ist kalkulierbar auf Basis der Konfigurationsoptionen. Nach abgeschlossener Konfiguration kann entweder direkt gekauft oder ein Angebot angefordert werden.

**Typische Beispiele:**  
Solarzaun-Sets in definierten Längen und Varianten (z.B. "Solarzaun Set, 10m, Anthrazit, 400W"), konfigurierbare SkyWind-Pakete mit Montageoptionen, Kombilösungen mit fixem Rahmen.

**Erlaubte UX / CTA:**
- Primär-CTA: **„Konfigurieren"** → öffnet Konfigurator
- Nach Konfiguration, wenn Preis berechenbar: **„In den Warenkorb"** (dann wie `direct_purchase`)
- Nach Konfiguration, wenn Preis nicht vollständig berechenbar (z.B. Installationsaufwand unklar): **„Angebot anfordern"** (dann wie `inquiry_only`)
- Preisanzeige: kalkuliert während Konfiguration, oder „ab €X.xxx" als Orientierung

**Beziehung zu Cart / Checkout:**  
Möglich — wenn die Konfiguration zu einem berechenbaren Preis führt. Die Konfiguration wird als `attributes`-Snapshot auf dem CartItem gespeichert.

**Beziehung zu Lead-Flow:**  
Bedingt — wenn der Konfigurationspfad zu „Angebot anfordern" führt, wird ein Lead erzeugt. Firebase / n8n werden dann wie bei `inquiry_only` involviert.

**Wichtige Regel:**  
Ein `configurable`-Produkt darf niemals unkonfiguriert in den Cart gelegt werden. Der Konfigurator-Schritt ist Pflicht.

---

### `inquiry_only`

**Fachliche Bedeutung:**  
Projektprodukte, die eine individuelle Beratung, Standortprüfung oder maßgeschneiderte Planung erfordern. Kein Direktkauf möglich. Der Preis ist projektabhängig und wird im Angebotsprozess ermittelt.

**Typische Beispiele:**  
Solarzaun-Gesamtanlagen (Projektumfang), SkyWind NG-Installationen, Kombilösungen für Gewerbe und Landwirtschaft, alle B2B-Partneranfragen.

**Erlaubte UX / CTA:**
- Primär-CTA: **„Projekt anfragen"** oder **„Beratung anfragen"**
- Sekundär-CTA: **„Rückruf anfordern"** oder **„Angebot anfordern"**
- Kein „In den Warenkorb", kein Checkout
- Preisanzeige: „Preis auf Anfrage" oder indikativer Richtwert „ab €X.xxx" ohne Bindungswirkung

**Beziehung zu Cart / Checkout:**  
Keine. `inquiry_only`-Produkte dürfen nie in den Cart gelegt werden. Ein Versuch (z.B. direkte URL-Manipulation) wird serverseitig abgewiesen.

**Beziehung zu Lead-Flow:**  
Immer. Lead-Formular → Firebase Function → Firestore → n8n → CRM / Vertrieb. Das ist der einzige erlaubte Abschluss-Flow.

---

## Routing- und Entscheidungslogik

```
Nutzer auf Produktseite
        │
        ├── product_type === 'direct_purchase'
        │         └── CTA: „In den Warenkorb"
        │                   └── Cart → Checkout → Stripe → Order (PostgreSQL)
        │
        ├── product_type === 'configurable'
        │         └── CTA: „Konfigurieren"
        │                   └── Konfigurator
        │                             ├── Preis berechenbar?
        │                             │       └── Ja → CTA: „In den Warenkorb"
        │                             │                     └── Cart → Checkout (PostgreSQL)
        │                             └── Preis nicht vollständig berechenbar?
        │                                     └── CTA: „Angebot anfordern"
        │                                               └── Lead-Flow (Firebase → n8n)
        │
        └── product_type === 'inquiry_only'
                  └── CTA: „Projekt anfragen" / „Beratung anfragen"
                            └── Lead-Formular → Firebase Function
                                      └── Firestore (Lead gespeichert)
                                                └── n8n Webhook
                                                          └── CRM + Vertriebsbenachrichtigung
```

**Explizit verboten:**
- `inquiry_only`-Produkt in Cart legen — serverseitig zu verweigern
- `configurable`-Produkt ohne abgeschlossene Konfiguration kaufen
- Preis-Checkout für ein `inquiry_only`-Produkt, unabhängig von Client-seitigem State

---

## Backend-Zuständigkeit nach product_type

| | `direct_purchase` | `configurable` | `inquiry_only` |
|---|---|---|---|
| **PostgreSQL / Prisma** | Cart, Order, Payment | Cart + Konfig-Snapshot (wenn Kauf) | Nicht involviert |
| **Firebase Firestore** | Nicht involviert | Ggf. Lead (wenn Angebot-Pfad) | Lead-Speicher (immer) |
| **Firebase Storage** | Nicht involviert | Nicht involviert | Projekt-Uploads (optional) |
| **n8n** | Nicht involviert | Ggf. Lead-Routing (wenn Angebot-Pfad) | Lead-Routing (immer) |
| **Stripe** | Pflicht | Pflicht (wenn Kauf-Pfad) | Nicht involviert |
| **Price in `price_cents`** | Verbindlich | Kalkuliert / bindend nach Konfig | Optional, indikativ |
| **`stock_quantity`** | Relevant | Relevant (per Variant) | Irrelevant |

---

## Umschaltbarkeit zwischen Typen

Ein Produkt kann im Admin seinen `product_type` wechseln — mit folgenden Einschränkungen:

- `direct_purchase` → `inquiry_only`: jederzeit erlaubt (Cart wird geleert wenn Produkt drin ist)
- `inquiry_only` → `direct_purchase`: nur erlaubt wenn `price_cents` auf allen Varianten gesetzt ist
- `configurable` → `direct_purchase`: nur erlaubt wenn alle Pflicht-Konfig-Felder entfernt sind
- Typ-Wechsel eines Produkts mit offenen Orders: nicht erlaubt bis Orders abgeschlossen sind
