# Bundle Feature – Cross-Sell Bundle Products

Technische Dokumentation für die Bundle-Erweiterung des wsp-commerce Webshops.

---

## Übersicht

Das Bundle-Feature ermöglicht es, Produkte als thematische Pakete (Bundles) anzubieten und Cross-Selling zu betreiben. Bundles erscheinen auf Produktdetailseiten, Kategorienseiten und unterstützen flexible Rabattlogik.

**Kernfunktionen:**
- Bundles mit 1–n Produkten (required/optional, Mengen, Varianten)
- 4 Rabatttypen: none, percentage, fixed, per_item
- 3 Rabattmodi: all_items, min_count, any_item
- Zeitlich begrenzte Rabatte (valid_from_discount / valid_until_discount)
- Tabs-Gruppierung für mehrere Bundles je Produkt
- Cart-Integration: alle Bundle-Items in einem Klick hinzufügen
- Admin-Backoffice: vollständiges CRUD inkl. Produkt- und Kategoriezuweisungen
- Mehrsprachig (de/en/es via next-intl / locale-Fallback)

---

## Datenbankschema

### Neue Enums

```prisma
enum BundleStatus        { active; inactive }
enum BundleDiscountType  { none; percentage; fixed; per_item }
enum BundleDiscountMode  { all_items; min_count; any_item }
enum BundleDisplayMode   { card; list; slider; tabs }
```

### Neue Modelle

```
bundles
  id                    String           @id @default(uuid())
  status                BundleStatus     @default(active)
  sort_order            Int              @default(0)
  image_url             String?
  valid_from            DateTime?
  valid_until           DateTime?
  store_id              String?
  discount_type         BundleDiscountType @default(none)
  discount_percent      Decimal?         @db.Decimal(5,2)
  discount_cents        Int?
  discount_mode         BundleDiscountMode @default(all_items)
  min_items_for_discount Int             @default(1)
  valid_from_discount   DateTime?
  valid_until_discount  DateTime?
  display_mode          BundleDisplayMode @default(card)
  tab_group             String?
  created_at / updated_at

bundle_translations
  bundle_id + locale (@@unique)
  title, description?, tab_name?

bundle_items
  id, bundle_id, product_id (@@unique([bundle_id, product_id]))
  quantity, is_required, sort_order
  discount_percent?, discount_cents?   ← nur für per_item-Rabatt

bundle_product_assignments
  @@id([bundle_id, product_id])

bundle_category_assignments
  @@id([bundle_id, category_id])
```

### Migration

```bash
# Commerce-Server stoppen, dann:
pnpm --filter commerce db:generate   # Prisma-Client neu generieren
pnpm --filter commerce db:migrate    # Schema auf DB anwenden
```

---

## API-Endpunkte

### Public Catalog (`/api/catalog/bundles`)

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/catalog/bundles?product_id=<uuid>&locale=de` | Bundles für ein Produkt (inkl. Kategorie-Bundles) |
| GET | `/api/catalog/bundles?category_id=<uuid>&locale=de` | Bundles für eine Kategorie |
| GET | `/api/catalog/bundles/:id` | Einzelnes Bundle |

**Response-Format (Bundle):**
```json
{
  "id": "uuid",
  "status": "active",
  "title": "Starter-Set",
  "description": "...",
  "displayMode": "card",
  "tabGroup": null,
  "tabName": null,
  "discountType": "percentage",
  "discountPercent": 10,
  "discountCents": null,
  "discountMode": "all_items",
  "minItemsForDiscount": 1,
  "validFromDiscount": null,
  "validUntilDiscount": null,
  "priceInfo": {
    "originalTotalCents": 30000,
    "discountedTotalCents": 27000,
    "savingsCents": 3000,
    "savingsPercent": 10.0,
    "hasDiscount": true,
    "isTimeLimitedDiscount": false,
    "discountEndsAt": null
  },
  "items": [
    {
      "id": "item-uuid",
      "productId": "...",
      "productName": "Solarzaun-Modul",
      "productSlug": "solarzaun-modul",
      "imageUrl": "...",
      "quantity": 1,
      "isRequired": true,
      "sortOrder": 0,
      "discountPercent": null,
      "discountCents": null,
      "variants": [...],
      "basePriceCents": 15000,
      "effectivePriceCents": 13500
    }
  ]
}
```

### Admin CRUD (`/api/admin/bundles`)

Alle Endpunkte erfordern den `X-Admin-Key`-Header (automatisch via admin-proxy).

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/admin/bundles` | Alle Bundles (inkl. inactive) |
| POST | `/api/admin/bundles` | Bundle erstellen |
| GET | `/api/admin/bundles/:id` | Bundle-Detail |
| PUT | `/api/admin/bundles/:id` | Bundle aktualisieren |
| DELETE | `/api/admin/bundles/:id` | Bundle löschen (cascade) |
| PATCH | `/api/admin/bundles/:id/status` | Status togglen |
| POST | `/api/admin/bundles/:id/items` | Item hinzufügen |
| PATCH | `/api/admin/bundles/:id/items/:itemId` | Item aktualisieren |
| DELETE | `/api/admin/bundles/:id/items/:itemId` | Item entfernen |
| POST | `/api/admin/bundles/:id/products/:productId` | Produkt zuweisen |
| DELETE | `/api/admin/bundles/:id/products/:productId` | Produktzuweisung entfernen |
| POST | `/api/admin/bundles/:id/categories/:categoryId` | Kategorie zuweisen |
| DELETE | `/api/admin/bundles/:id/categories/:categoryId` | Kategoriezuweisung entfernen |

---

## Architektur & Schichten

```
Commerce API
  src/api/routes/bundles.ts        ← Public-Endpunkte
  src/api/routes/adminBundles.ts   ← Admin-CRUD
  src/services/bundleService.ts    ← Prisma-Queries
  src/mappers/bundle.ts            ← DB → Contract-Typen, Locale-Fallback
  src/utils/bundleDiscount.ts      ← Rabattberechnungslogik (pure functions)

packages/contracts/src/bundle/
  bundle.ts                        ← Zod-Schemas + TypeScript-Typen

apps/storefront
  lib/bundles.ts                   ← fetchBundlesForProduct / fetchBundlesForCategory
  lib/cart.ts                      ← CartStore (localStorage + CustomEvent)
  contexts/CartContext.tsx          ← React Context + Provider
  components/bundle/
    BundleSection.tsx              ← Server Component (data fetching)
    BundleTabs.tsx                 ← Client Component (Tab-Gruppierung)
    BundleCard.tsx                 ← Client Component (Checkbox, Varianten, AddToCart)
    BundleItemRow.tsx              ← Client Component (Einzel-Item)
  components/cart/
    CartButton.tsx                 ← Header-Badge
    CartSidebar.tsx                ← Sliding-Sidebar

apps/admin
  app/bundles/page.tsx             ← Bundle-Liste
  app/bundles/new/page.tsx         ← Bundle erstellen
  app/bundles/[id]/page.tsx        ← Bundle bearbeiten
  components/BundleForm.tsx        ← Formular (CRUD + Items)
  lib/api.ts                       ← api.bundles.*
```

---

## Rabattlogik

Implementiert in `apps/commerce/src/utils/bundleDiscount.ts` (pure functions, getestet).

### `calculateItemPrice(basePriceCents, discountPercent, discountCents)`

- Wenn `basePriceCents` null → null
- Wenn `discountPercent` gesetzt → prozentualer Abzug (hat Vorrang)
- Sonst wenn `discountCents` gesetzt → fester Abzug
- Ergebnis wird auf min. 0 geclamped

### `isBundleDiscountActive(bundle)`

- `discount_type === "none"` → false
- Prüft `valid_from_discount` und `valid_until_discount` gegen `Date.now()`

### `isBundleValid(bundle)`

- `status !== "active"` → false
- Prüft `valid_from` und `valid_until`

### `calculateBundlePriceInfo(bundle, selectedCount?)`

| discount_type | Verhalten |
|---|---|
| `none` | Kein Rabatt; `hasDiscount = false` |
| `percentage` | `discount_percent` auf Gesamtsumme aller Items |
| `fixed` | `discount_cents` fest von Gesamtsumme abziehen |
| `per_item` | Pro Item: item.discount_percent / item.discount_cents |

| discount_mode | Verhalten |
|---|---|
| `all_items` | Rabatt immer aktiv (wenn discount aktiv) |
| `min_count` | Rabatt nur wenn `selectedCount >= min_items_for_discount` |
| `any_item` | Rabatt aktiv wenn ≥ 1 Item ausgewählt |

**Rückgabe:** `BundlePriceInfo` oder `null` (wenn kein Item kaufbar).

---

## Cart-Integration

### CartStore (`apps/storefront/lib/cart.ts`)

- Speichert Items in `localStorage` unter Key `wsp_cart_v1`
- Feuert `CustomEvent("wsp:cart:updated")` bei jeder Änderung
- `CartContext` lauscht auf dieses Event und triggert Re-Render

### CartItem-Felder

```typescript
interface CartItem {
  key: string           // `${productId}:${variantId}`
  productId: string
  variantId: string
  productSlug: string
  productName: string
  variantName: string
  imageUrl: string | null
  quantity: number
  unitPriceCents: number        // Originalpreis
  effectivePriceCents: number   // Nach Rabatt
  currency: string
  bundleId?: string
  bundleTitle?: string
}
```

### BundleCard → Cart-Flow

1. Benutzer wählt optionale Items per Checkbox
2. Bei mehreren Varianten: `<select>`-Dropdown
3. Klick auf „Bundle in den Warenkorb":
   - `validate()`: required Items müssen ausgewählt und verfügbar sein
   - `CartStore.add()` für jedes ausgewählte Item
   - `effectivePriceCents` wird clientseitig berechnet (spiegelt Backend-Logik)
4. Success-Flash für 3 Sekunden

---

## Frontend-Rendering (Storefront)

```
ProductDetailPage (Server Component)
  └─ BundleSection (Server Component)
       └─ BundleTabs (Client Component)
            ├─ [Tab-Buttons wenn tab_group vorhanden]
            └─ BundleCard (Client Component)
                 └─ BundleItemRow (Client Component) × n
```

**BundleSection** wird auf der Produktdetailseite zwischen Dokumenten und ähnlichen Produkten eingebunden:

```tsx
<div className="py-12 bg-gray-50/50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <BundleSection productId={p.id} locale={params.locale} />
  </div>
</div>
```

### Tab-Gruppierung

Bundles werden nach `tab_group`-Feld gruppiert:
- Kein `tab_group` → jedes Bundle bildet eine eigene Gruppe (kein Tab sichtbar wenn nur 1 Gruppe)
- Mit `tab_group` → Tab-Label = `tab_name` ?? `title` des ersten Bundles in der Gruppe
- Mehrere Gruppen → Tab-Leiste mit `role="tabpanel"`

---

## Admin-Backoffice

### Bundle-Liste (`/bundles`)

- Zeigt alle Bundles (inkl. inactive)
- Status-Badge (grün/grau), Rabatt-Badge, Artikel-Anzahl
- Links zu Edit und Delete

### Bundle erstellen/bearbeiten

**Formular-Felder:**
- Titel, Beschreibung, Tab-Name (DE, weitere Sprachen via API)
- Status (active/inactive), Sort-Order, Tab-Group
- Bild-URL, Display-Mode (card/list/slider/tabs)
- Gültigkeitszeitraum (valid_from, valid_until)
- Rabatttyp, Rabattprozent/-betrag, Rabattmodus, Min-Items
- Rabattzeitraum (valid_from_discount, valid_until_discount)
- Dynamische Item-Liste: Produkt auswählen, Menge, required/optional, Sort-Order, Discount

**Zuweisungen:** Über separate API-Calls nach dem Speichern (assignToProduct / assignToCategory).

---

## Mehrsprachigkeit

### Commerce API (Mapper)

`resolveBundleTranslation(translations, locale)`:
1. Suche exakte Locale-Übereinstimmung
2. Fallback auf `de`
3. Fallback auf erstes Element

### Storefront

`fetchBundlesForProduct(productId, locale)` übergibt `?locale=de` (oder `en`/`es`) an die Commerce API. Die Storefront-Komponenten verwenden `useLocale()` aus `next-intl`.

---

## Contracts & Typen

Definiert in `packages/contracts/src/bundle/bundle.ts`:

| Export | Beschreibung |
|---|---|
| `BundleSchema` | Zod-Schema für das vollständige Bundle |
| `BundleItemSchema` | Zod-Schema für ein Bundle-Item |
| `BundlePriceInfoSchema` | Zod-Schema für Preisinformationen |
| `BundleCreateInputSchema` | Input für POST /api/admin/bundles |
| `BundleUpdateInputSchema` | Input für PUT /api/admin/bundles/:id |
| `BundleItemInputSchema` | Input für POST /:id/items |
| `BundleStatusUpdateSchema` | Input für PATCH /:id/status |
| `type Bundle` | Inferierter TypeScript-Typ |
| `type BundleItem` | Inferierter TypeScript-Typ |
| `type BundlePriceInfo` | Inferierter TypeScript-Typ |

Re-exportiert via `packages/types/src/index.ts`.

---

## Tests

Testdatei: `apps/commerce/src/utils/__tests__/bundleDiscount.test.ts`

27 Tests mit `node:assert/strict` (kein Test-Framework nötig):

```bash
cd apps/commerce
npx ts-node src/utils/__tests__/bundleDiscount.test.ts
```

Abgedeckte Szenarien:
- `calculateItemPrice`: null-Basispreis, kein Rabatt, Prozent, Fix, Priorität, Floor
- `isBundleDiscountActive`: discount_type=none, kein Limit, future_from, past_until, future_until
- `isBundleValid`: active, inactive, expired, future
- `calculateBundlePriceInfo`: null-Items, kein Rabatt, percentage, fixed, per_item, none override, min_count (fail/pass), abgelaufen, Mengen-Multiplikation

---

## Deployment

### 1. Contracts neu bauen und installieren

```bash
cd packages/contracts
pnpm build
# Neue .tgz erzeugen und in apps/ ersetzen, dann:
pnpm install --force
```

### 2. Prisma-Migration

```bash
# Commerce-Server stoppen
pnpm --filter commerce db:generate
pnpm --filter commerce db:migrate
# Commerce-Server starten
pnpm --filter commerce dev
```

### 3. Railway (Staging/Prod)

Die `Dockerfile` in `apps/commerce` führt `pnpm db:migrate` beim Start aus – die Migration läuft automatisch beim nächsten Deploy.

### 4. Smoke-Test

Nach dem Deploy prüfen:
- `GET /api/catalog/bundles?product_id=<uuid>` → 200, leeres Array `[]` (noch keine Bundles)
- Admin: Bundle anlegen unter `/bundles/new`
- Produkt zuweisen, auf Produktdetailseite prüfen

---

## Bekannte Einschränkungen

- **Varianten-Auswahl im Bundle**: Nur erste Variante wird vorausgewählt; Nutzer muss manuell wählen wenn mehrere vorhanden
- **Admin: keine Mehrsprachigkeit im Formular**: Aktuell nur DE-Übersetzung; weitere Locales über direkte API-Calls
- **Storefront-Cart ist kein Server-State**: Cart lebt in localStorage; kein Sync mit Commerce-API beim Checkout – Lead/Beratungsanfrage bleibt primärer Conversion-Path
- **per_item-Rabatt mit discount_mode**: Bei `per_item` + `min_count` wird `selectedCount` geprüft, aber individuelle Item-Rabatte gelten unabhängig vom selectedCount für ausgewählte Items
