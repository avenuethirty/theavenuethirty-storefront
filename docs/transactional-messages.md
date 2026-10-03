# Transactional messages

Resend is approved for transactional email. Sender: The Avenue Thirty <orders@mail.theavenuethirty.com>. The user configured Directus SMTP in Render using smtp.resend.com, port 587, username resend and the private Resend API key. Directus must run the updated environment for those settings to take effect. This configuration is user-reported; a Directus system email has not been independently tested.

## Implemented

Optional checkout and staff-order email is private contact information, separate from phone identity. Order placement and cancellation enqueue email events atomically with the order transaction. Orders without email remain awaiting_recipient. Private CMS queue fields are read-only.

The separate commerce worker uses a restricted Postgres account with only claim, acknowledgement and retry commands. Claims use exclusive leases. Provider requests use a stable event idempotency key, bounded retries and a 20-hour retry window, shorter than Resend's 24-hour idempotency retention. Exhausted or permanently rejected requests move to manual_review. Accepted means Resend accepted the request, not that an inbox received it. Signed provider delivery webhooks are implemented with deduplication and acknowledgement reconciliation. The public endpoint still needs manual deployment and Resend registration.

Development sending permits Resend's simulator plus a single explicitly configured test inbox. The approved test inbox is orders@theavenuethirty.com. Other recipients remain blocked. Production sending is disabled. A standalone webhook service and 60-second worker are prepared but not deployed. The worker requires NOTIFICATIONS_ENABLED=true. Directus SMTP configuration does not schedule this commerce worker.

## Verification

Run DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED=true npx tsx directus/verify-notifications.ts to check database leases, acknowledgement, retries and private contact capture. The transaction rolls back all test mutations. Add --resend to send a development message to the provider simulator using the locally configured key. Private verification state preserves the request identity across retries.

Directus password resets use its system email transport. No customer password-reset flow or shipping-label notification is claimed. Shipping events require the future shipment workflow. Before customer delivery, approve a test recipient, verify Directus SMTP from the running instance, activate provider webhook registration and deploy the prepared scheduled worker with monitoring and retention policies.

Provider references: [Resend SMTP](https://resend.com/docs/send-with-smtp), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

## WhatsApp Business App

The approved dedicated number is +923331458843. The bag has an optional click-to-chat link at https://wa.me/923331458843. It opens a customer-initiated conversation and does not send messages automatically, place an order, reserve stock or verify phone ownership. The URL contains no customer details or cart data. Website checkout remains the primary order path; staff can record agreed WhatsApp orders through /staff/orders.

The owner must register and verify this number in the WhatsApp Business App on their phone. Registration has not been verified by this implementation. No WhatsApp API, OTP provider or paid integration is added.

Manual deployment files, the complete environment list and dashboard steps are in [email-deployment.md](email-deployment.md). No Render API key is requested or required.

The full development order email journey DEV-100080 was verified: confirmation and cancellation were accepted by Resend; provider retrieval reported delivered for both, recorded as poll evidence. The order is cancelled and its stock was released. Inbox visibility remains pending recipient confirmation. Directus SMTP was attempted separately and remains unverified.
