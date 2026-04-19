# Skill: n8n + Firebase Lead Flow

This skill covers the automated lead flow:
1. Lead submits form on storefront
2. Firebase Function triggers n8n webhook
3. n8n enriches, routes, and stores lead data
4. Notification sent to sales team

## Webhook Endpoints
- See [n8n-webhooks.md](../../../docs/n8n-webhooks.md)

## Firebase Functions
- Located in `apps/firebase/functions/`

## Environment Variables
- `N8N_WEBHOOK_URL` — base URL of n8n instance
- `FIREBASE_PROJECT_ID`
