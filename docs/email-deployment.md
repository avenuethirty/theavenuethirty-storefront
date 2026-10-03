# Email development deployment

This package is for the approved development database. It is not a production commerce release. Resend API order confirmations are separate from Directus SMTP system emails. The worker permits only Resend's simulator and the explicitly configured test inbox. WhatsApp work is deferred.

## Prepared files

- infra/email/Dockerfile: standalone email service, no storefront or admin credential.
- infra/email/render.yaml: optional manually applied Blueprint; sending disabled by default.
- infra/email/environment.example: environment variable checklist with placeholders.
- directus/email-service.ts: webhook receiver and a non-overlapping 60-second worker loop, maximum ten jobs per batch.

## Prerequisite

The project source is available in [avenuethirty/theavenuethirty-storefront](https://github.com/avenuethirty/theavenuethirty-storefront), on main. Connect this repository in Render. No hosted deployment has been created by this work. Do not publish .env or .local. Docker ignores both directories.

## Directus SMTP in the existing Render service

1. Open the Directus service, then Environment.
2. Keep EMAIL_TRANSPORT=smtp, EMAIL_SMTP_HOST=smtp.resend.com, EMAIL_SMTP_USER=resend and EMAIL_FROM=orders@mail.theavenuethirty.com. EMAIL_SMTP_PASSWORD is your private Resend API key.
3. If the service uses Render Free, change EMAIL_SMTP_PORT from 587 to 2587. Set EMAIL_SMTP_SECURE=false, EMAIL_SMTP_IGNORE_TLS=false and EMAIL_SMTP_TLS_REJECT_UNAUTHORIZED=true. Save and deploy. Do not disable TLS verification.
4. Check deployment logs for SMTP connection/authentication errors without sharing keys. A temporary SMTP test was dispatched but not observed in Resend; success is not confirmed.
5. After the environment is active, request another one-time Directus test. Check both Resend Emails and the approved inbox. An executed Flow alone does not prove that SMTP sent the message.

Render Free blocks ports 25, 465 and 587. Resend supports 2587 with STARTTLS. This avoids assuming a paid upgrade is required, although successful connectivity still needs verification. References: [Render SMTP restriction](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports), [Resend SMTP](https://resend.com/docs/send-with-smtp).

## Render email service dashboard

1. Choose New > Web Service and connect the prepared source. Use Docker, repository root as build context and infra/email/Dockerfile as Dockerfile path. Name it avenue-email-development.
2. Select a hosting plan yourself. Free services sleep when idle, so they are suitable for manual development checks and do not provide dependable scheduled sending. No paid plan or cron service has been created. A reliable always-on deployment requires an approved hosting choice. An existing always-on server can run the same container without a new platform service.
3. Set the health check path to /healthz. Set the following environment values:

| Variable | Value |
| --- | --- |
| NODE_ENV | development |
| EMAIL_SERVICE_DEVELOPMENT_TARGET_CONFIRMED | true |
| NOTIFICATIONS_ENABLED | false initially |
| COMMERCE_NOTIFY_DATABASE_URL | Private restricted worker URL from local .env |
| COMMERCE_ALLOW_UNVERIFIED_TLS | false |
| COMMERCE_DATABASE_CA_FILE | /etc/secrets/supabase-ca.crt |
| RESEND_API_KEY | Private Resend key |
| RESEND_WEBHOOK_SECRET | Set after creating the Resend webhook |
| NOTIFICATIONS_TEST_RECIPIENT | orders@theavenuethirty.com |

4. In Secret Files, add the Supabase database CA certificate as supabase-ca.crt. The local unverified TLS exception is not the deployment recommendation. If you cannot provide a CA, pause deployment configuration and resolve verified database connectivity.
5. Deploy with sending disabled. Confirm HTTPS /healthz responds successfully. Do not copy DIRECTUS_STATIC_TOKEN, COMMERCE_DATABASE_URL or customer/admin credentials into this service. The restricted worker can invoke notification commands only.

## Resend webhook dashboard

1. In Resend, open Webhooks > Add webhook. Enter https://YOUR-EMAIL-SERVICE.onrender.com/webhooks/resend using your actual deployed HTTPS URL.
2. Subscribe to email.sent, email.delivered, email.delivery_delayed, email.failed, email.suppressed, email.bounced and email.complained. Do not enable open/click tracking for this setup.
3. Copy the endpoint signing secret into RESEND_WEBHOOK_SECRET on the email service. Redeploy. Never paste it into chat or public CMS settings.
4. Send a Resend test event and inspect its successful HTTP response. Invalid signatures return 400; persistence failures return 503 so the provider can retry. Payloads are capped at 64 KiB. Only provider ID, event ID, event type and timestamp are stored, not recipient/body data.
5. After the endpoint and database connectivity are verified, set NOTIFICATIONS_ENABLED=true and redeploy. This activates only development notifications for the configured inbox/simulator. Do not remove recipient restrictions to enable customer mail.
6. Place a development order with the approved inbox, inspect notification_outbox in Directus and confirm status accepted and delivery_status delivered. Delivered means the recipient mail server accepted it; confirm inbox visibility separately. Repeat with cancellation and check that each event has one message.

## Operations and rollback

The worker claims one job immediately before sending, uses stable Resend idempotency keys, retries temporary failures and retains exhausted/permanent failures for manual review. Events received before acknowledgement are reconciled afterwards. Delivery failure does not initiate automatic resend of an already accepted message.

To stop sending, set NOTIFICATIONS_ENABLED=false and redeploy. Keep the webhook active to record late delivery outcomes. Do not clear idempotency history or manually reset accepted jobs. Review manual_review jobs privately in CMS. /healthz becomes unhealthy after five minutes of worker failures while sending is enabled. Logs intentionally omit recipients, message bodies, credentials and receipt capabilities.

Retention policy and production alerting remain launch work. Shipping notifications require the shipment workflow. Directus password resets use SMTP; customer login remains the separately planned phone authentication flow.

## Runtime readiness diagnostics

The email service logs readiness booleans at startup and returns them from /healthz: workerEnabled, webhookConfigured, testInboxConfigured and verifiedDatabaseTls. No key, recipient, database URL or certificate contents are exposed. For the enabled development deployment, all four should be true. If webhookConfigured is false despite the dashboard setting, Save and deploy the Environment changes on the email service and verify the selected deployment/source. A 200 health response alone does not prove enabled sending or webhook configuration.
