# Product Model

## Core Entities

### Product
- `id` (uuid)
- `slug` (unique, URL-safe)
- `name`
- `description` (rich text / markdown)
- `category_id`
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
