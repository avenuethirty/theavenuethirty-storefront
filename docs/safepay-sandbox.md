# Safepay sandbox receiver

The receiver records verified sandbox payment events in a private Postgres inbox. It does not mark orders paid, fulfil orders, reserve stock, send emails or initiate refunds. Live payments remain disabled. This is a diagnostic step before the transactional payment integration.

## Verified locally

- Sandbox API authentication issued a token with HTTP 200.
- Payment webhook boundary tests cover valid and invalid signatures, merchant mismatch, missing configuration, bounded bodies, separate attempt events and storage failure.
- Development database migration 006 and a dedicated login were applied. The login can execute the inbox command but cannot read or update orders or insert directly into the inbox.
- Duplicate event tokens are idempotent. Conflicting payloads using the same token are rejected. Database verification events were rolled back.

The dedicated [payment signature specification](https://safepay-docs.netlify.app/developers/webhooks/verify-hmac-signatures/) specifies SHA-512. This differs from the subscription guide. The receiver uses SHA-512 on the exact request bytes and constant-time comparison. A genuine sandbox delivery is still required to confirm the provider's actual wire format. It accepts version 2.0.0 events from the configured merchant only.

Only selected operational fields are stored. Customer details, card details, secret keys and entire raw payloads are not logged. Event receipt is evidence of delivery, not an order payment decision. Financial reconciliation, amount matching, refunds and reservation expiry remain subsequent work.

## Manual Render deployment

1. Publish these files to the GitHub repository before deploying.
2. Create a separate Docker Web Service from `avenuethirty/theavenuethirty-storefront`, using Dockerfile path `infra/safepay/Dockerfile` and repository root as build context. Use a free development instance. Do not modify the existing email service.
3. Add the variables below privately. The scoped database URL is now in the local `.env`; copy it directly into Render without posting it in chat.
4. Mount the existing Supabase certificate as `/etc/secrets/prod-ca-2021.crt`.
5. Set the health check path to `/healthz`, then deploy. The response must show `status: ok`, `environment: sandbox`, `verifiedDatabaseTls: true` and `orderUpdatesEnabled: false`.
6. Copy the actual Render service origin. The Safepay endpoint is that origin followed by `/webhooks/safepay`. Do not register an invented URL or the Directus admin URL.
7. In the sandbox dashboard, create the endpoint, open Details and select version 2.0.0: `payment.succeeded`, `payment.failed`, `payment.refunded`, `authorization.succeeded`, `authorization.reversed`, `void.succeeded`.
8. Send a sandbox test event and verify HTTP 200 plus a private inbox row. Re-send the same event and verify there is still one row. An unsigned request must return 400. Then test a genuine sandbox checkout before claiming payment delivery acceptance.

| Variable | Value |
| --- | --- |
| NODE_ENV | development |
| SAFEPAY_ENV | sandbox |
| SAFEPAY_DEVELOPMENT_TARGET_CONFIRMED | true |
| SAFEPAY_API_KEY | Sandbox public merchant API key |
| SAFEPAY_WEBHOOK_SECRET | Sandbox shared secret from Developers > Endpoints |
| SAFEPAY_EVENTS_DATABASE_URL | Dedicated scoped URL from private local .env |
| COMMERCE_DATABASE_CA_FILE | /etc/secrets/prod-ca-2021.crt |

The receiver does not need the Safepay API secret or an administrative database URL. Never enable `COMMERCE_ALLOW_UNVERIFIED_TLS` for this service. Render supplies `PORT` automatically.

Free instances may sleep and delay deliveries. This deployment is for sandbox verification only, with durable storage in Postgres. No paid hosting or production payment service has been enabled.

## Remaining acceptance

- Public deployment and verified health response.
- Genuine signed sandbox events, including failure and refund scenarios.
- Hosted checkout session persistence and payment reconciliation.
- Atomic order payment updates, amount/currency validation and late-payment handling after the 15-minute stock hold.
- Final deposit default and calculation base.
- Merchant eligibility for Google Pay and explicit live integration approval.
