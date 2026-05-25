# Feature Visual Engine

> **Enterprise-grade visual layer for product features.**
> Assigns icons, SVGs, images, and pictograms to product feature strings.
> Renders them across product pages, cards, quick-view modals, and faceted search filters.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Priority & Resolution Rules](#priority--resolution-rules)
4. [API Reference](#api-reference)
5. [Component Reference](#component-reference)
6. [Hook System](#hook-system)
7. [Display Modes](#display-modes)
8. [Admin UI Guide](#admin-ui-guide)
9. [Integration Examples](#integration-examples)
10. [Performance Strategy](#performance-strategy)
11. [Accessibility Checklist](#accessibility-checklist)
12. [Responsive Config](#responsive-config)
13. [Analytics & A/B Testing](#analytics--ab-testing)
14. [Caching Strategy](#caching-strategy)
15. [Migration Guide](#migration-guide)
16. [Future SaaS Extensions](#future-saas-extensions)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Feature Visual Engine                        │
├─────────────┬──────────────────────────────┬────────────────────────┤
│  Database   │         Service Layer         │    Render Layer        │
│             │                               │                        │
│ Prisma /    │  FeatureVisualService         │  FeatureVisuals.tsx    │
│ PostgreSQL  │  ─ listDefinitions()          │  FeatureGrid.tsx       │
│             │  ─ resolveProductFeatures()   │  FeatureBadge.tsx      │
│ feature_    │  ─ findBestVisual()           │  FeatureTooltip.tsx    │
│ definitions │  ─ resolveMiniatureVisuals()  │  FeatureMiniature      │
│             │                               │    Icons.tsx           │
│ feature_    │  In-memory cache              │  FeatureFilterIcons    │
│ visuals     │  (settings: 60s TTL           │    .tsx                │
│             │   defs: 30s TTL               │                        │
│ feature_    │   visuals: 15s TTL)           │  Hook System           │
│ visual_     │                               │  ─ afterProductGallery │
│ settings    │  Resolution Engine            │  ─ belowDescription    │
│             │  1. product scope             │  ─ productCard         │
│             │  2. category scope            │  ─ quickView           │
│             │  3. global scope              │  ─ facetFilter         │
│             │  → priority DESC              │                        │
└─────────────┴──────────────────────────────┴────────────────────────┘
```

### Data Flow (Product Page)

```
page.tsx
  │
  ├── fetchProduct()               → ProductDetail (features: string[])
  ├── fetchFeatureVisualSettings() → cached, revalidate 300s
  └── resolveProductFeatures()     ─→ Commerce API
                                          │
                                   FeatureVisualService.resolveProductFeatures()
                                          │
                                   ├── listDefinitions()  (30s cache)
                                   ├── listVisuals()      (15s cache, scope filtered)
                                   └── findBestVisual()   (priority scoring)
                                          │
                                   FeatureWithVisual[]  ──→  ProductPageFeatures
                                                                  │
                                                           FeatureGrid + FeatureBadge
```

---

## Database Schema

### `feature_definitions`

Defines a feature type with a matching pattern for auto-detection from feature strings.

| Column         | Type     | Description |
|----------------|----------|-------------|
| `id`           | UUID PK  | |
| `slug`         | String   | Unique machine key, e.g. `leistung` |
| `names`        | JSON     | `{ de, en, es }` localized display name |
| `descriptions` | JSON?    | Optional admin descriptions |
| `match_pattern`| String?  | Pattern to match against feature strings |
| `match_type`   | Enum     | `exact \| contains \| starts \| ends \| regex` |
| `category_id`  | UUID?    | Null = global; set = category-scoped definition |
| `sort_order`   | Int      | Tie-breaking order |
| `is_active`    | Boolean  | Soft disable |

**Example**: Feature string `"Leistung: 400 W"` → Pattern `"Leistung:"` + match_type `starts` → matches definition `leistung`.

### `feature_visuals`

A visual asset (SVG or image) associated with a feature definition or specific value.

| Column                   | Type   | Description |
|--------------------------|--------|-------------|
| `id`                     | UUID   | |
| `feature_definition_id`  | UUID?  | Linked definition (null = standalone) |
| `feature_value`          | String?| Specific value match, e.g. `"IP65"` |
| `scope`                  | Enum   | `global \| category \| product` |
| `category_id`            | UUID?  | Required when scope=category |
| `product_id`             | UUID?  | Required when scope=product |
| `image_url`              | String?| CDN URL for PNG/JPG/GIF |
| `svg_content`            | Text?  | Inline `<svg>...</svg>` |
| `image_width/height`     | Int?   | Reserved for CLS prevention |
| `alt_texts`              | JSON?  | `{ de, en, es }` alt text |
| `labels`                 | JSON?  | `{ de, en, es }` display label |
| `tooltips`               | JSON?  | `{ de, en, es }` tooltip text |
| `link_url`               | String?| Optional click-through URL |
| `link_target`            | String | `_self` or `_blank` |
| `color_primary`          | String?| Hex CSS color override |
| `priority`               | Int    | Higher wins within same scope |
| `is_active`              | Boolean| |

### `feature_visual_settings`

Singleton row (id = `"singleton"`) for global display configuration.

Key fields:
- `enable_product_page`, `enable_miniature`, `enable_faceted_search` — location toggles
- `product_page_mode` — `FeatureDisplayMode` for product pages
- `product_page_columns` — responsive column count
- `miniature_max_icons` — max icons on product cards
- `responsive_config` — JSON override per breakpoint

---

## Priority & Resolution Rules

When matching a feature string to a visual, the engine scores all matching visuals and picks the highest:

```
score = scope_weight × 100 + priority + match_bonus

where:
  scope_weight:  product=3, category=2, global=1
  match_bonus:   feature_value exact match = +10
                 definition pattern match  = +0
                 catch-all (no filter)     = -5
```

**Example Scenario:**

Feature string: `"Schutzklasse: IP65"`

| Visual          | Scope    | feature_value | priority | Score |
|-----------------|----------|---------------|----------|-------|
| Global IP65     | global   | `IP65`        | 0        | 110   |
| Cat Schutz      | category | null          | 5        | 200   |
| Product IP65    | product  | `IP65`        | 0        | 310   |

→ Product-scoped visual wins.

---

## API Reference

### Public Endpoints

#### `GET /api/catalog/feature-visuals/resolve`

Resolves feature strings to visuals. Used by the storefront data layer.

**Query params:**
```
features[]    Array of feature strings
productId     UUID (optional)
categoryId    UUID (optional)
locale        Language code (default: de)
```

**Response:**
```json
{
  "data": [
    {
      "raw": "Leistung: 400 W",
      "key": "Leistung",
      "value": "400 W",
      "visual": {
        "id": "...",
        "label": "Leistung",
        "tooltip": "Nennleistung des Solarmoduls",
        "altText": "Leistung: 400 W",
        "imageUrl": null,
        "svgContent": "<svg...>",
        "scope": "global",
        ...
      }
    }
  ]
}
```

#### `GET /api/catalog/feature-visuals/settings`

Returns display settings for storefront rendering.

### Admin Endpoints (X-Admin-Key required)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/admin/feature-definitions` | List definitions |
| POST   | `/api/admin/feature-definitions` | Create |
| GET    | `/api/admin/feature-definitions/:id` | Get |
| PUT    | `/api/admin/feature-definitions/:id` | Update |
| DELETE | `/api/admin/feature-definitions/:id` | Delete |
| GET    | `/api/admin/feature-visuals` | List visuals |
| POST   | `/api/admin/feature-visuals` | Create |
| GET    | `/api/admin/feature-visuals/:id` | Get |
| PUT    | `/api/admin/feature-visuals/:id` | Update |
| DELETE | `/api/admin/feature-visuals/:id` | Delete |
| GET    | `/api/admin/feature-visual-settings` | Get settings |
| PUT    | `/api/admin/feature-visual-settings` | Update settings |

---

## Component Reference

### `<FeatureVisuals>`

Main orchestrator. Uses the hook system.

```tsx
<FeatureVisuals
  hook="afterProductGallery"       // predefined or custom hook
  features={resolvedFeatures}      // FeatureWithVisual[]
  settings={fvSettings}            // FeatureVisualSettings | null
  displayMode="grid"               // optional override
  iconSize="md"                    // xs | sm | md | lg | xl
  showLabels={true}
  showTooltips={true}
  maxItems={6}                     // limit rendered items
  title="Produktmerkmale"
/>
```

### `<ProductPageFeatures>`

Convenience wrapper for product detail pages.

```tsx
<ProductPageFeatures
  features={resolvedFeatures}
  settings={fvSettings}
/>
```

### `<FeatureMiniatureIcons>`

Compact icon strip for product cards.

```tsx
<FeatureMiniatureIcons
  visuals={miniatureVisuals}   // ResolvedFeatureVisual[]
  maxDisplay={5}
  iconSize="xs"
  showTooltips
/>
```

### `<FeatureBadge>`

Single visual item renderer.

```tsx
<FeatureBadge
  visual={resolvedVisual}
  displayMode="icon_value"
  iconSize="md"
  showLabel
  showTooltip
  animate
/>
```

### `<FeatureTooltip>`

Accessible CSS tooltip wrapper.

```tsx
<FeatureTooltip content="Tooltip text" position="top">
  <span>Hover me</span>
</FeatureTooltip>
```

### `<FeatureGrid>`

Responsive layout engine.

```tsx
<FeatureGrid
  features={featuresWithVisuals}
  displayMode="grid"
  columns={3}
  iconSize="md"
  showLabels
  gap="md"
  title="Technische Daten"
/>
```

### `<FeatureFilterGroup>` / `<FeatureFilterOption>`

Filter sidebar with optional icons.

```tsx
<FeatureFilterGroup
  title="Schutzklasse"
  options={[
    { value: "ip65", label: "IP65", visual: resolvedVisual, count: 12, isActive: false },
    { value: "ip54", label: "IP54", visual: resolvedVisual, count: 4, isActive: true },
  ]}
  onOptionClick={(value) => setFilter(value)}
  showIcons
  showCounts
/>
```

---

## Hook System

The hook system allows placing `<FeatureVisuals>` at any predefined or custom location:

```tsx
// Predefined hook locations:
<FeatureVisuals hook="afterProductGallery" features={...} />
<FeatureVisuals hook="belowDescription"    features={...} />
<FeatureVisuals hook="productCard"         features={...} />
<FeatureVisuals hook="quickView"           features={...} />
<FeatureVisuals hook="facetFilter"         features={...} />
<FeatureVisuals hook="collectionBanner"    features={...} />

// Custom hook (falls back to afterProductGallery defaults):
<FeatureVisuals hook="myCustomSection" features={...} displayMode="horizontal" />
```

Each hook has a default config (`HOOK_CONFIGS` in `FeatureVisuals.tsx`). Override individual props as needed.

---

## Display Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `grid` | Responsive grid with cards | Product page main section |
| `horizontal` | Horizontal scroll row | Quick view, banners |
| `vertical` | Stack list | Sidebar, mobile |
| `compact` | Icons only, no labels | Product card miniature |
| `grouped` | Group by feature key | Detailed specs |
| `icon_value` | Icon + value text | Filter options |
| `icon_name_value` | Icon + name + value | Full detail |
| `tooltip_only` | Hidden, tooltip on hover | Non-intrusive hints |

---

## Admin UI Guide

### Navigation

```
/feature-visuals          → List all visuals
/feature-visuals/new      → Create new visual
/feature-visuals/[id]     → Edit visual
/feature-visuals/settings → Global display settings
/feature-definitions      → Manage feature definitions
/feature-definitions/new  → Create definition
/feature-definitions/[id] → Edit definition
```

### Workflow: Adding a new feature icon

1. Go to `/feature-definitions` → **Definition anlegen**
2. Create definition: slug=`schutzklasse`, name=`Schutzklasse`, pattern=`Schutzklasse:`, type=`starts`
3. Go to `/feature-visuals` → **Visual anlegen**
4. Select definition `schutzklasse`, paste SVG content, set label `Schutzklasse`, tooltip `IP-Schutzklasse des Geräts`
5. Set scope=`global`, priority=0, is_active=true → Save
6. ✅ Any product with `"Schutzklasse: IP65"` in features now shows the icon

### Product-specific override

1. Create a second visual with scope=`product`, product_id=`<uuid>`, higher priority
2. This visual takes precedence for that specific product

---

## Integration Examples

### Product Page

```tsx
// apps/storefront/app/[locale]/products/[slug]/page.tsx

const fvSettings = await fetchFeatureVisualSettings();
const resolvedFeatures = isFeatureVisualsEnabled(fvSettings, "product_page")
  ? await resolveProductFeatures(p.features, {
      productId: p.id,
      categoryId: p.category?.id,
      locale: params.locale,
    })
  : [];

// In JSX:
<ProductPageFeatures features={resolvedFeatures} settings={fvSettings} />
```

### Product Card

```tsx
// apps/storefront/components/ProductCard.tsx

// Parent fetches miniature visuals once for the entire list:
const miniatureVisuals = await resolveMiniatureVisuals(product.features, {
  productId: product.id,
  categoryId: product.category?.id,
  locale,
  maxIcons: 4,
});

<ProductCard product={product} featureVisuals={miniatureVisuals} />
```

### Faceted Filter

```tsx
import { FeatureFilterGroup } from "@/components/features";

// Prepare options with resolved visuals
const filterOptions = availabilityOptions.map(opt => ({
  value: opt.value,
  label: opt.label,
  visual: visualMap.get(opt.value) ?? null,
  count: opt.count,
  isActive: activeFilters.includes(opt.value),
}));

<FeatureFilterGroup
  title="Schutzklasse"
  options={filterOptions}
  onOptionClick={handleFilterChange}
  showIcons
/>
```

---

## Performance Strategy

### Zero CLS (Cumulative Layout Shift)

- `image_width` + `image_height` fields reserved in DB → rendered as `<Image width={} height={}>` attributes
- SVGs rendered inline → no extra fetch, no layout shift
- Skeleton loaders in `FeatureGridSkeleton` before data loads

### Server-Side Rendering

- All data fetched in Server Components
- `resolveProductFeatures` runs on the server, never client
- Only `FeatureTooltip` is a Client Component (hover state)

### In-Memory Cache (Commerce Service)

```
Settings:      60s TTL   (change rarely)
Definitions:   30s TTL   (change occasionally)
Visuals:       15s TTL   (per product+category scope)
```

### Next.js Caching

```tsx
// Settings: cached 5 min in storefront
fetch(url, { next: { revalidate: 300 } })

// Resolved features: no-store (product-specific)
fetch(url, { cache: "no-store" })
```

### SVG Optimization

Before storing SVG content:
1. Run through SVGO (remove comments, metadata, unnecessary attributes)
2. Ensure `viewBox` is set, `width/height` attributes removed (sizing via CSS)
3. Remove `fill` attributes if using CSS `currentColor` for theming

### Lazy Loading

- `<img>` elements use `loading="lazy"` by default
- `<Image>` (Next.js) handles lazy loading automatically

---

## Accessibility Checklist

- [x] `role="list"` + `role="listitem"` on feature containers
- [x] `aria-label` on container (`"Produktmerkmale"`)
- [x] `alt` text for all images (from `alt_texts` JSON)
- [x] SVG icons marked `aria-hidden="true"` when label is present
- [x] Tooltips use `role="tooltip"` + `aria-describedby`
- [x] Keyboard navigable (focus shows tooltip)
- [x] Filter buttons use `aria-pressed` for toggle state
- [x] Color contrast: text uses `text-brand-text` (high contrast)
- [x] Touch targets minimum 44×44px (icon buttons padded)
- [x] `title` attribute fallback on icon containers
- [x] Focus rings visible (`focus-visible:ring-2`)
- [x] Animations respect `prefers-reduced-motion` (via Tailwind)

---

## Responsive Config

Override display behavior per breakpoint via the settings singleton:

```json
{
  "responsive_config": {
    "desktop": {
      "columns": 3,
      "gap": "md",
      "iconSize": "md",
      "showLabels": true
    },
    "tablet": {
      "columns": 2,
      "gap": "sm",
      "iconSize": "sm",
      "showLabels": true
    },
    "mobile": {
      "columns": 2,
      "gap": "xs",
      "iconSize": "xs",
      "showLabels": false
    }
  }
}
```

---

## Analytics & A/B Testing

### Interaction Tracking

Enable via settings: `track_interactions: true`

Events emitted (stub – wire up to your analytics provider):

```ts
// In FeatureBadge.tsx or FeatureVisuals.tsx
onVisualClick(visual) // ResolvedFeatureVisual with id, scope, definitionSlug
```

Example integration with Vercel Analytics:
```tsx
import { track } from "@vercel/analytics";

<FeatureVisuals
  onVisualClick={(v) => track("feature_visual_click", {
    definitionSlug: v.definitionSlug ?? "unknown",
    scope: v.scope,
    featureValue: v.featureValue ?? "",
  })}
  ...
/>
```

### A/B Testing

Enable via settings: `enable_ab_testing: true`

Implement by passing different `displayMode` props to variants:

```tsx
const variant = getABVariant(userId, "feature-display-mode");
<FeatureVisuals
  features={...}
  displayMode={variant === "B" ? "compact" : "grid"}
/>
```

---

## Caching Strategy

| Layer | TTL | Invalidation |
|-------|-----|-------------|
| Commerce service (settings) | 60s | On PUT /settings |
| Commerce service (definitions) | 30s | On any definition CUD |
| Commerce service (visuals) | 15s | On any visual CUD |
| Next.js (settings fetch) | 300s | Via ISR revalidation |
| Next.js (product page) | no-store | Always fresh |
| CDN (image assets) | Depends on CDN config | Use content hash in URL |

For production, add Redis-based caching to the `FeatureVisualService` to survive server restarts.

---

## Migration Guide

### From string-only features

Existing features in `ProductTranslation.features` are JSON arrays of strings:

```json
["Leistung: 400 W", "Schutzklasse: IP65", "Gewicht: 2.5 kg"]
```

**No data migration needed.** The Feature Visual Engine works on top of existing data:

1. Create `FeatureDefinition` entries with matching patterns
2. Assign `FeatureVisual` assets to definitions
3. The engine matches on-the-fly at render time

### Structured features (future)

If you later switch to structured features:

```json
[
  { "featureId": "leistung", "key": "Leistung", "value": "400 W" },
  { "featureId": "schutzklasse", "key": "Schutzklasse", "value": "IP65" }
]
```

The engine's `parseFeatureString()` and `matchesDefinition()` functions will need small updates to handle both formats.

---

## Future SaaS Extensions

The Feature Visual Engine is designed to become a standalone product:

### Planned Features

1. **Icon Library** — Built-in library of 500+ product icons (searchable, one-click assign)
2. **AI Icon Suggestions** — GPT-4V analyzes product descriptions and suggests matching icons
3. **Auto SVG Optimization** — SVGO runs automatically on upload
4. **Drag-and-Drop Editor** — Visual canvas for designing icon layouts
5. **Multi-tenant** — `store_id` field on all tables → white-label SaaS
6. **Analytics Dashboard** — Click rates, hover rates, conversion correlation
7. **Icon CDN** — Shared icon hosting with automatic WebP/AVIF conversion
8. **Import/Export** — JSON bundle import/export for migrating between stores
9. **Zapier/n8n Integration** — Webhook on visual assignment → trigger workflows
10. **Shopify/WooCommerce Bridge** — Publish visuals to other platforms

### Architecture for SaaS

```
wsp-feature-visuals-core/   (shared package)
  ├── types/
  ├── service/
  └── components/

wsp-feature-visuals-nextjs/ (Next.js adapter)
wsp-feature-visuals-remix/  (Remix adapter)
wsp-feature-visuals-admin/  (standalone admin SPA)

Pricing tiers:
  Starter:  100 visuals, 1 store
  Growth:   1000 visuals, 5 stores, analytics
  Enterprise: unlimited, multi-region, AI suggestions
```

---

*Last updated: 2026-05-25 — Feature Visual Engine v1.0*
