# Payments

## Provider
**Stripe** (primary) — supports EU payment methods (SEPA, Klarna, PayPal via Stripe).

## Flow

1. Storefront creates order in commerce API → returns `order_id`
2. Storefront calls commerce API: `POST /payments/intent` with `order_id`
3. Commerce API creates Stripe PaymentIntent → returns `client_secret`
4. Storefront uses Stripe.js to confirm payment
5. Stripe webhook → commerce API `POST /webhooks/stripe` → order status update

## Webhook Events Handled
- `payment_intent.succeeded` → mark order as paid
- `payment_intent.payment_failed` → mark order as failed
- `charge.refunded` → mark order as refunded

## Environment Variables
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
