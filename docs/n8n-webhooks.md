# n8n Webhooks

## Base URL
`N8N_WEBHOOK_URL` env variable (e.g. `https://n8n.yourdomain.com`)

## Endpoints

### POST /webhook/lead
Triggered on new lead submission.

**Payload:**
```json
{
  "type": "lead",
  "leadType": "private | commercial | agriculture | partner | dealer | installer | general",
  "firstName": "string",
  "lastName": "string",
  "company": "string | null",
  "email": "string",
  "phone": "string",
  "message": "string",
  "productInterest": "solarzaun | skywind | kombi | consultation",
  "region": "string | null",
  "submittedAt": "ISO 8601 timestamp"
}
```

### POST /webhook/order
Triggered on new order placed.

**Payload:**
```json
{
  "type": "order",
  "orderId": "uuid",
  "customerEmail": "string",
  "total_cents": "integer",
  "currency": "EUR",
  "items": [],
  "createdAt": "ISO 8601 timestamp"
}
```
