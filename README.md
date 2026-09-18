# ClientLoop v2

ClientLoop is a first-party acquisition attribution system for campaigns that start with Reddit research/content and can use SproutGigs for paid task distribution.

## What changed in v2

The original prototype estimated much of the funnel. v2 records the funnel directly:

`campaign → tracked visit → lead → booking_started → booking → attended → client_won → revenue`

Each campaign receives a unique `/r/<token>` URL. ClientLoop records the visit first, creates a durable `clid` visitor ID, then redirects to the configured booking destination with:

- `ref=<campaign token>`
- `src=clientloop`
- `clid=<visitor id>`

The destination site should preserve `ref` and `clid` through forms/booking so later events map back to the original campaign.

## Database

Run:

```bash
npm run db:init
```

`schema.sql` is migration-safe for the original v1 tables and adds:

- unique campaign tracking tokens
- destination URLs
- actual spend field
- visitor IDs
- external event IDs for deduplication
- revenue fields
- webhook receipt deduplication

## Destination-page tracking

For lead capture or booking-flow starts:

```http
POST /api/track
Content-Type: application/json

{
  "ref": "CAMPAIGN_TOKEN",
  "clid": "VISITOR_ID",
  "type": "lead",
  "externalId": "lead_123"
}
```

Supported public page events are `lead` and `booking_started`.

## Booking / CRM webhook

Use:

```http
POST /api/webhooks/booking
X-ClientLoop-Secret: <BOOKING_WEBHOOK_SECRET>
Content-Type: application/json

{
  "ref": "CAMPAIGN_TOKEN",
  "clid": "VISITOR_ID",
  "type": "booking",
  "externalId": "booking_123",
  "email": "client@example.com",
  "provider": "calendly"
}
```

Supported conversion types:

- `booking`
- `attended`
- `client_won`
- `revenue`
- `booking_cancelled`

Revenue example. **Send normalized USD in `amount`** so dashboard ROAS remains mathematically valid:

```json
{
  "ref": "CAMPAIGN_TOKEN",
  "clid": "VISITOR_ID",
  "type": "revenue",
  "externalId": "invoice_123",
  "amount": 200,
  "currency": "USD"
}
```

## SproutGigs

The integration follows the current JSON API shape. Configure:

```env
SPROUTGIGS_USER_ID=
SPROUTGIGS_SECRET_KEY=
SPROUTGIGS_CATEGORY_ID=
SPROUTGIGS_ZONE_ID=int
SPROUTGIGS_WEBHOOK_SECRET=
```

ClientLoop creates Classic jobs using the chosen task value and derives `num_tasks` from the campaign task budget. The category is environment-configured because categories and minimum task values can change.

Configure the SproutGigs webhook URL as:

```text
https://YOUR_CLIENTLOOP_DOMAIN/api/webhooks/sproutgigs
```

The route verifies `X-Sproutgigs-Signature` against the exact raw request body and handles current batched `tasks_submitted` and `job_status_changed` events.

## Dashboard security

Set both values to protect `/dashboard/*` and campaign creation:

```env
DASHBOARD_USER=keith
DASHBOARD_PASSWORD=<strong password>
```

## Analytics semantics

ClientLoop no longer fabricates impressions, click-through rates, or 90-day booking projections. Dashboard values come from stored events. Once sufficient historical campaign data exists, a future forecasting layer can be trained on actual conversion rates rather than fixed coefficients.

Key metrics:

- **Spend**: actual spend when available, otherwise committed campaign budget
- **Cost per booked call**: spend / bookings
- **CAC**: spend / clients won
- **ROAS**: attributed USD revenue / spend

## Important operational note

SproutGigs worker-task events are not counted as website visits. The `/r/<token>` redirect is the first-party visit source of truth. This prevents worker submission data from inflating website traffic.
