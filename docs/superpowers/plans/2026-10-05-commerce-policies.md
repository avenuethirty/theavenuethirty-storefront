# Commerce policies implementation

User authorised provider-independent implementation and development deployment while Safepay production onboarding is pending.

1. Add private CMS commerce settings with PKR 250 shipping, free shipping at PKR 5,000, seven primary cities, configurable deposit types and triggers, 15-minute online holds and 24-hour manual-confirmation holds. Keep automatic deposits disabled pending the default amount and calculation-base answer.
2. Add product flags for shipping-quote requirement and advance-payment review. Do not silently charge a flat rate for bulky products. Block ordinary checkout for quoted-shipping items until a quote workflow exists.
3. Add server-authoritative quotes and a confirmation token. Requote when settings or pricing change. Snapshot applied policy and required deposit on new orders. Existing test orders retain their original terms.
4. Add reservation deadlines to new unconfirmed COD orders. Staff may confirm an order through an authorised command only if no deposit or advance-payment review remains. Expiry and confirmation lock the order, with exactly-once stock release. Do not expire confirmed or paid orders. Online hold settings are preparatory until online payments exist.
5. Show quotes before website and staff submissions. Show totals and review/deposit state on receipts and CMS records.
6. Verify quote boundaries, stale quotes, blocked bulky items, snapshots, duplicate orders, expiry, repeated expiry and confirmation protection against the development database with rollback-only fixtures. Run unit tests, type checking, build and client secret scan.
7. Prepare a separate maintenance worker for manual Render deployment. No Render API key, paid resources or live checkout activation are authorised. Publish tested files to the already-authorised GitHub repository.

No automatic refund, courier booking, OTP or production Safepay integration is included. Tax-compliant invoicing remains pending registration and tax treatment. Transactions remain development orders.
