# Checkout Flow

## Steps

1. **Cart** — user reviews items, quantities, totals
2. **Address** — shipping and billing address
3. **Shipping** — shipping method selection (if applicable)
4. **Payment** — Stripe payment element
5. **Confirmation** — order summary + confirmation email

## Cart State
- Stored client-side (localStorage / Zustand) for anonymous users
- Merged into server-side cart on login

## Order Creation
- `POST /orders` with cart contents + customer info
- Returns `order_id` and `payment_intent_client_secret`
- Order starts in `pending_payment` status

## Order Statuses
`pending_payment` → `paid` → `processing` → `shipped` → `delivered`
`paid` → `cancelled` (before shipment)
`shipped` → `returned`
