# Foundation implementation progress

Plan: docs/superpowers/plans/2026-10-03-foundation.md

User approved execution. Native implementation in this workspace.

## Rulings

- The user deliberately cleared the repository and deferred a new GitHub repository. Work directly in the fresh folder; do not create a worktree from the archived app or reconnect the old remote. Keep this ledger in docs because Git-based skill scripts do not apply to an uninitialised repository.
- Use bundled Node 24 locally: the system Node 20.17 does not meet current TanStack requirements. Document Node >=22.12 for other environments.
- The approved spec explicitly leaves final brand assets for visual review. Build functional preview surfaces with provisional tokens; do not claim visual sign-off or publish invented brand/product content.
- New live Directus schema changes require a reviewed diff and confirmed development target per Task 2. Continue with local schema declarations and fixtures until that target is confirmed; do not silently assume the existing admin host is a development environment.

## Interface preflight

- Tasks 1 to 3: Directus transport returns typed data envelopes; catalogue service owns decoding and publication checks.
- Tasks 3 to 4/6: domain products keep variants nested; filters match one eligible variant across all selected option groups.
- Tasks 2 to 5: page sections are validated discriminated types, never arbitrary executable CMS markup.
- Tasks 2 to 7: supplier records are private; runtime submission permissions do not imply public read/list permissions.
- Tasks 3 to 6: cart persists SKU/quantity only. Display prices are read from catalogue and not checkout authority.

## Tasks

1. Local implementation verified: TanStack skeleton, private transport, runtime validation, explicit fixtures. Client private-credential scan passed. Scoped live reads/writes and staff field restrictions verified.
2. Partial: 25 collection declarations and 28 relationships, timestamped dry-run snapshots, separate permission declarations. User confirmed development target and initial schema applied. Eleven relation editor aliases applied, so parent item editors expose nested records. Deeper schema drift validation remains; public/runtime/staff permissions verified live. User explicitly approved access creation after the initial auto-review block. Catalogue/supplier service accounts and an unassigned review role are now provisioned.
3. Partial: published catalogue mapping and domain tests. Live adapter integration and stronger malformed-data validation remain.
4. Local browsing verified on desktop/mobile: department URLs, URL filters, variant-aware facets. Full keyboard/accessibility review remains.
5. Partial: CMS decoder/server/sections, navigation, public settings, ImageKit delivery, shared manual Embla. Staff-authorised uploads and visual review remain.
6. Local variant/cart interactions verified, including reload and department switching. Full media gallery and complementary merchandising remain.
7. Partial: application form, validation, server-only dedicated token, durable throttle, idempotency and repository. Backend permissions verified; disabled by default pending staff acceptance and deployment abuse controls.
8. In progress: local acceptance, independent review and next-stage commerce brief. No production readiness claim.

## Verification checkpoint, 2026-10-03

- Unit tests: 37 passed.
- TypeScript: passed.
- Client secret scan: passed.
- Production build: passed; deprecated validator API updated.
- Browser tests: 10 passed across desktop and mobile.
- Live Directus writes: 25 collections, 28 relationships and 11 relational editor fields applied to the confirmed development instance. Scoped runtime and staff permissions verified live.
- No paid services, repository pushes, deployments, real orders or real supplier test data.

## Implementation details and remaining gates

CMS errors return unavailable content while catalogue navigation remains usable. Content is plain text, never injected HTML. Unsafe external/protocol navigation is discarded. Manual-only carousels avoid unapproved autoplay behaviour. Runtime, supplier submission and administrative credentials are separate. The supplier daily throttle uses a unique database key and allows the same request to retry after a failed write. Production anti-bot controls and throttle retention are still required.

The local preview uses a bounded whole-catalogue snapshot. Replace it with indexed server queries before a large catalogue. The schema planner only adds structures; it does not certify existing field shapes. User confirmed the development target. User approved scoped account creation, which has been completed.

## Fresh review and fixes

- Independent reviewer found two important correctness issues: ambiguous relational variant decoding and supplier retry identity lost on remount.
- Fixed duplicate option assignment and duplicate full combination detection through relational decoder tests, RED to GREEN.
- Fixed pending supplier identity persistence across remounts using session storage containing only a random key and SHA-256 fingerprint, cleared after confirmed receipt. Regression test RED to GREEN.
- Existing skill rulings stand: fresh uninitialised workspace, compatible Node runtime, provisional visuals and explicit development target. No reviewer minors deferred.

## Live development verification

- Repeat schema plan: zero missing collections, fields, relations or editor updates.
- Unauthenticated reads: denied for all 25 foundation collections.
- Persistent service accounts/tokens and unassigned review role: initially blocked by automatic approval review, then explicitly approved by the user and provisioned. Tokens are private; existing user roles and public access were unchanged.
- Local fixture preview is running at http://127.0.0.1:3000. Checkout and supplier intake remain closed.

## Scoped access verification

- Catalogue service reads approved catalogue/CMS collections and cannot read supplier applications/throttles or create departments.
- Supplier submission persists one application across identical retries, rejects key reuse with changed data, and cannot review applications or read products.
- A disposable staff-role test account could read/review an application, but could not edit its email.
- All disposable verification records and the temporary staff account were removed. The review role remains unassigned to human staff.
- Runtime credentials are now configured locally. Supplier intake remains disabled until remaining operational acceptance, privacy presentation and deployment abuse controls are complete.

- Storefront SSR using the scoped live Directus credential returned HTTP 200 without fixture fallback. Live backend preview is running at http://127.0.0.1:3001. The catalogue is empty until real content is added.

## Sample brand and commerce expansion

The user requested sample brand onboarding through checkout and explicitly chose order creation and stock reservations. Written design approved. Executable implementation plan prepared for review; COMMERCE_DATABASE_URL is to be supplied privately in the local environment.

- Seeded 55 catalogue/onboarding/content records for a labelled Polo Ralph Lauren sample: fictitious accepted supplier application, brand, Men department, category hierarchy, two products and five SKUs, specifications, collection and CMS landing/navigation.
- Uploaded two original sample illustrations to the configured ImageKit account, with real asset IDs and product media links. No external product photographs copied.
- Live browser confirmed correct variant selection and SAMPLE-PRL-SHIRT-NAVY-S in the bag at PKR 12,500.
- Intended opening quantities documented; inventory balances and persisted orders are not implemented. Checkout remains closed.
- docs/sample-brand-guide.md links the actual CMS records in journey order.

## Atomic development commerce acceptance

- Ruling: the approved commerce design, supplied database credentials and explicit TLS exception authorise implementation of the documented development order/reservation slice. No additional approval pause is necessary.
- Ruling: local encrypted TLS may skip certificate verification only with COMMERCE_ALLOW_UNVERIFIED_TLS=true, as explicitly requested. Production rejects this exception. Connection-string SSL overrides are stripped.
- Applied ten Postgres commerce tables, RLS and private SECURITY DEFINER commands. Provisioned a restricted runtime role with command execution only, verified direct orders-table reads are denied.
- Registered all commerce tables and order/inventory editor relations in Directus. State fields are read-only; sensitive receipt/idempotency hashes are hidden. Existing public and catalogue permissions were not expanded.
- Seeded five location-aware stock balances and opening stock movements without resetting stock on repeat.
- Development website COD checkout persists orders and reserves stock atomically. Prices and publication/complete-variant checks are server authoritative. Receipt capability is HMAC-derived, stored as a hash, and excludes contact/address data. Production and fixtures stay closed.
- Staff orders/cancellation use authenticated Directus administrator identity through the CLI. The staff CMS entry screen remains future work. Both website and staff calls use the same transaction command.
- Retained website order DEV-100004 (cap, PKR 4,500) and staff WhatsApp order DEV-100018 (Navy/M shirt, PKR 12,500) with active reservations. CMS API confirmed order line/reservation/event editor links. Sample guide contains direct CMS links and current balances.
- Independent fresh review found partial allocation, incomplete variant ordering and lost-response recovery issues. Fixed location locks/full allocation assertion, transactional option validation, department publication recheck, and persisted attempt recovery. Recovery subtracts only ordered quantities from the current bag.
- Real Postgres integration passed: website/staff last-unit race, concurrent identical keys, mismatched retries, rollback after the first line, invalid actor/receipt, draft and incomplete product rejection, repeated cancellation location deactivation and concurrent department unpublishing.
- Browser regression intentionally discarded the successful response, reloaded checkout and recovered the same persisted order without duplicate stock reservation; unrelated bag additions remained intact. Disposable integration products/orders/stock were removed; sample records preserved.
- Verification: 41 unit tests; live database integration and browser recovery; 10 desktop/mobile fixture browser tests; TypeScript, production build and configured client-secret scan passed. Final targeted TypeScript/build and secret checks passed.
- No payment provider, OTP, messaging, courier or invoicing integration added. Phone identity remains unverified. The implementation is a development commerce slice, not a production launch.

- Final independent re-review confirmed both remaining findings fixed and reported no further important findings in scope. Live commerce suite: six tests passed; final TypeScript passed.

## Staff interface, invoice preview and message preparation

- Ruling: the user's request to continue remaining work authorises completion of the staff interface already specified in the approved commerce plan. User-provided legal name/address and explicit instruction to leave tax as placeholders authorise draft previews only. Paid providers, production opening and legal invoice issuance remain outside this implementation.
- Staff UI added at /staff/orders: Directus administrator login, server-only tokens, HttpOnly strict cookie, bounded 15-minute in-memory sessions, per-action active administrator revalidation, shared order/cancel commands, and read-only CMS inspection links.
- Review found global login lockout via attempt-cache capacity and unsafe expired-session recovery. Fixed global cache lockout, distinct authentication-required response, same-actor reauthentication recovery and owner-bound saved attempts. Unexpired per-account counters are retained through their window; expected owner is checked server-side before mutation to handle account changes across tabs. Explicit logout clears customer details and saved attempt.
- User legal details stored in CMS store_settings with tax registration/treatment Pending setup. Private draft previews use validated persisted line/address snapshots, no invoice number or legal issuance; printable sample artifact generated. Anonymous preview requests reveal no customer details.
- notification_outbox created with private RLS/permissions, read-only CMS status and event-unique deduplication. Trigger writes with order_events atomically; no sending transport or recipient configured and schema permits only awaiting_configuration. Existing sample events backfilled idempotently.
- Explicit TanStack server-function CSRF middleware added after verifying the installed runtime does not enable it automatically. Existing same-origin checkout/staff flows must continue to pass.
- Directus administration requests encountered intermittent timeout. Admin-only scripts use bounded 30-second timeouts; catalogue runtime retains its 10-second default. Read-back verification confirms business settings persisted.
- Unit authentication/model tests, live commerce/outbox checks and invoice rendering/privacy checks passed. Full fixture browser suite initially had a navigation race under four workers; limited local concurrency to two and all twelve desktop/mobile checks passed. No product behaviour assertion removed.
- Authenticated browser staff flow awaits an actual staff administrator login. No password or new administrator account was invented. Atomic authenticated staff command had already passed with the approved local administrator token.
- Transactional channel/provider clarification is pending. No customer message, payment, courier action, OTP or tax invoice issued.

- Independent final re-review reported no remaining important findings within development scope. Hydration-disabled POST submissions prevent native pre-hydration GET submissions of customer/login fields.

## Resend development verification

- Resend approved with orders@mail.theavenuethirty.com sender. User configured SMTP directly in Render, so Render API credentials are no longer required. Running Directus SMTP remains unverified.
- Optional private checkout/staff email capture and atomic placement/cancellation email queue implemented. Restricted notification worker has no order table read or order placement permissions.
- Database lease, stale acknowledgement, retry delay, acceptance and exhausted retry checks passed in a rolled-back transaction. Resend accepted a development message to delivered@resend.dev. No shopper was emailed.
- Customer delivery stays blocked; production and scheduled worker deployment remain disabled. Acceptance is distinct from inbox delivery. Shipping notifications await the shipment workflow.
- Typecheck, production build, client secret scan and 55 unit tests passed.
- Fresh reviewer found batch lease timing and malformed-job isolation issues. Fixed by claiming one job immediately before delivery and quarantining invalid job content as INVALID_JOB without stopping later jobs. Regression test passed; reviewer reported no remaining important findings before the equivalent worker extraction for testability.
- Final verification: 59 unit/live integration tests passed; TypeScript, production build and client-secret scan passed. Restricted worker ran with zero pending jobs. Separate simulator sending was accepted.
- Latest browser lost-response recovery recheck did not complete: Directus returned HTTP 503 and the preview displayed its unavailable screen on load/reload. This check is not counted as passed. Earlier recovery acceptance remains recorded above; recheck is needed when the CMS is stable.

## Email completion package, 2026-10-04

- User approved orders@theavenuethirty.com as the test recipient and requested manual Render deployment files, environment variables and dashboard instructions. No Render API key is required or requested further.
- Signed, size-bounded Svix webhook verification added. Minimal private delivery events deduplicate by event ID; provider-ID locks reconcile events arriving before worker acknowledgement and prevent late sent/delayed events from downgrading delivered evidence. Delivery failures do not blindly resend accepted emails.
- Migration 005 and scoped worker command grants applied to the approved development database; read-only CMS delivery status metadata updated. Rolled-back checks covered pre-ack delivery evidence, deduplication and out-of-order events.
- Standalone webhook/60-second worker service, Dockerfile, manual Render manifest and environment checklist prepared. Sending defaults disabled. Free plan explicitly selected in example manifest, with sleeping-service limitations documented. No hosted service, paid resource, repository or deployment created.
- Full development email journey DEV-100080: confirmation accepted, order cancelled, stock released, cancellation accepted. Resend retrieval independently reported delivered for both; these statuses were stored as poll evidence in CMS. Customer inbox visibility is pending user confirmation. Other shoppers remain blocked by the development recipient restriction.
- Directus SMTP temporary Flow attempted once and cleaned up, but the message was not observed in Resend. User asked whether Render Free is used and to change blocked port 587 to Resend STARTTLS port 2587 if applicable. SMTP success is not claimed.
- Fresh review reported no important correctness/security findings. Final verification: 63 unit/live tests, TypeScript, production build and client secret scan passed. Standalone HTTP health smoke passed; an unconfigured webhook correctly returned 503. Test service stopped afterwards.
- Manual guide: docs/email-deployment.md. Actual endpoint registration, hosted scheduling and SMTP/inbox confirmation require the user's dashboard steps. Production launch, customer sending and shipping workflow remain closed.

## Hosted email acceptance, 2026-10-04

- Live /healthz returned all readiness flags true. Unsigned webhook probe returned 400, as expected.
- Hosted test DEV-100081: placement and cancellation both accepted/delivered, with two non-poll delivery events each. Verification used no local dispatch and no provider-poll writes. Hosted worker plus signed webhook delivery tracking are confirmed.
- Test order remains cancelled with zero active reservations. Recipient restriction remains the approved development inbox and simulator; production customer sending is closed.
- Directus /server/health timed out with zero response bytes after 15 seconds. System SMTP remains separately unverified until Directus availability is restored.
