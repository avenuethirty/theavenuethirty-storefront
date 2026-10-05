# Development shipping and order confirmation

Implemented while Safepay production onboarding is pending. This is development commerce only. No card charge, Raast transfer, courier booking or production checkout activation is included.

## CMS controls

Open **Store Commerce Settings** in Directus. This private singleton separates operational rules from the public Store Settings identity fields. The public catalogue role has no permissions on this collection.

- `standard_shipping_fee`: 25000 paisa, equal to PKR 250.
- `free_shipping_threshold`: 500000 paisa, equal to PKR 5,000. The threshold is inclusive. Currently there are no discounts, so merchandise subtotal is the threshold basis.
- `enable_free_shipping`: enables the promotion for ordinary shipping items.
- `deposits_enabled`: false until the default amount and calculation base are confirmed. The draft values are PKR 250 fixed and 20% (2000 basis points).
- `deposit_type`: fixed amount, percentage or shipping cost only. Manual phone or WhatsApp review is a separate workflow, not a calculation type.
- `min_order_amount_for_deposit`: 1000000 paisa, equal to PKR 10,000. Orders must exceed this value to trigger the amount rule.
- `regional_deposit_trigger` and `primary_cities`: the regional rule applies outside Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan and Sialkot. Matching ignores case and surrounding whitespace; unknown names receive the regional rule when deposits are enabled.
- `deposit_calculation_base`: merchandise subtotal or total including shipping. The current inactive draft uses merchandise subtotal.
- Percentage deposits round upward to the nearest paisa and never exceed the order total.

Agreed hold and return settings are stored with database constraints: 15-minute online hold, 24-hour confirmation hold, 48-hour fault reporting, seven-day return handover deadline and three to seven business days for processing. These return settings do not yet implement a returns/refunds workflow. The online hold is preparatory until online checkout is integrated.

Product controls:

- `shipping_quote_required`: ordinary checkout is blocked. The team must agree a shipping quote through a future quoted-order workflow. Free shipping never overrides this flag.
- `advance_payment_review_required`: requires manual advance-payment review before confirmation. Use for mobile phones and other reviewed items. Required advance is not evidence that payment was collected.

## Checkout and order lifecycle

Website and staff orders now review a server-calculated quote before saving. Editing customer details or bag contents invalidates that review. Submission validates the quote against current prices, shipping settings and product flags; changed terms require a fresh review. Atomic product, publication, inventory and idempotency checks remain in place.

New COD orders are initially awaiting staff confirmation because phone ownership is not verified. They reserve stock for 24 hours. Their prices, required deposit and applied settings are snapshotted. The database rejects changes to a saved non-null snapshot and its associated order monetary fields. Existing development orders keep their original terms and have no automatic deadline added.

Staff use **Confirm COD order after customer follow-up**. The command requires an active Directus administrator and an unexpired active reservation. Confirmation does not mean payment received. It clears the confirmation deadline and protects the reservation from automatic expiry. Confirmation is blocked when any deposit or advance-payment review remains; financial verification is a later stage.

The expiry command locks one order per transaction, releases each active allocation once, cancels the order with `confirmation_timeout`, and records cancellation and reservation-expired events. Concurrent confirmation and expiry cannot both succeed. Paid, confirmed and legacy orders are excluded. Normal cancellation remains idempotent.

The private development order receipt and draft invoice show actual shipping. Invoices remain clearly labelled drafts while NTN/STRN and tax treatment are pending.

## Maintenance service: manual Render setup

The new maintenance account URL is in the private local `.env` as `COMMERCE_MAINTENANCE_DATABASE_URL`. It can execute only the reservation-expiry command; it has no direct order or inventory permissions.

1. Create a separate Docker Web Service from `avenuethirty/theavenuethirty-storefront`, using `infra/commerce/Dockerfile` and the repository root build context. Use a free development instance only.
2. Add these variables privately:

| Variable | Value |
| --- | --- |
| NODE_ENV | development |
| COMMERCE_MAINTENANCE_DEVELOPMENT_TARGET_CONFIRMED | true |
| COMMERCE_MAINTENANCE_ENABLED | true |
| COMMERCE_MAINTENANCE_DATABASE_URL | Scoped URL from private local .env |
| COMMERCE_DATABASE_CA_FILE | /etc/secrets/prod-ca-2021.crt |

3. Mount the existing Supabase certificate at the path above. Do not disable TLS verification. No Directus token, Resend key, administrative database URL or Safepay API key is needed.
4. Set health check path `/healthz`. A healthy response reports maintenance enabled, verified TLS and development-only operation.
5. The service checks expiry every 60 seconds while awake, handling up to 50 orders per run in separate transactions. It exposes no public mutation endpoint.

Free Render instances may sleep, so expiry timing can be delayed. This is suitable only for development verification. Production requires an always-running or externally scheduled worker, with hosting costs approved before activation.

No Render API key is available, and the user previously chose manual dashboard deployment. The worker has not been deployed or verified on Render. Database commands and account permissions have been verified directly.

## Validation and limitations

- Unit suite: quote parsing rejects inconsistent, negative, fractional and unsafe monetary values.
- Rollback-only database checks: threshold boundaries, free-shipping switch, fixed/percentage/shipping-only deposits, regional matching, stale quotes, quote-required products, snapshots, snapshot overwrite rejection, idempotent retry, expiry twice, stock release, staff confirmation and advance-review blocking.
- Live concurrency suite: website and staff last-unit purchases, duplicate submissions, publication/option checks, cancellation and scoped account access.
- Browser plugin was unavailable; Playwright was used. Browser validation attempted the connected checkout but the root catalogue service timed out and rendered the explicit store-unavailable state. Browser checkout acceptance remains incomplete.
- Directus Commerce Settings metadata was successfully registered after one transient setup failure and retry. A later catalogue read timed out; this availability issue needs rechecking before checkout browser acceptance.
- Automatic deposits remain disabled pending the default rule and calculation-base decision. No manual receipt review, payment allocations, refunds, fulfilment or RTO inspection has been implemented by this stage.
