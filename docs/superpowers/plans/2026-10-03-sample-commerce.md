# Sample Brand Commerce Implementation Plan

> For agentic workers: use superpowers:executing-plans in this session. Steps use checkbox syntax. Native execution is preserved from the foundation plan.

**Goal:** Complete the sample CMS journey with location stock and a persisted COD development order.

**Architecture:** TanStack server commands use one Postgres transaction. Directus presents the same tables for staff review. Catalogue credentials remain read-only; private order access and inventory mutations have independent server authorisation.

**Tech stack:** existing TanStack/React/Directus stack, Postgres, node-postgres, Vitest and Playwright.

**Spec:** ../specs/2026-10-03-sample-commerce-design.md

## Constraints

- Development COD orders only; production gate closed.
- No paid provider, payment capture, OTP, courier, email or invoice integration.
- Never expose database or Directus credentials in output or clients.
- Integer PKR minor units; server computes every order amount.
- Stock keyed by variant/location; reservations shared across channels.
- Staff actor identity is server-authenticated, never trusted from form input.
- No em dashes. Preserve archived app and existing user content.
- A direct COMMERCE_DATABASE_URL or deployment access for an atomic Directus extension is required.

## Review focus

- Same idempotency key raced concurrently must return one order and one set of reservations.
- A SKU belonging to two departments must reserve one location balance.
- Catalogue edits while a checkout is submitted must not produce inconsistent price snapshots.
- Customer phone entry must not reveal existing orders or verify ownership.
- Cancellation retried after timeout must not release stock twice.

## Tasks

### 1. Sample catalogue onboarding

Files: directus/seed-sample-brand.ts, docs/sample-brand-guide.md.

- [x] Create explicitly fictitious supplier onboarding history, reference brand, hierarchy, two products, five variants, type specifications and merchandising.
- [ ] Add original labelled sample illustrations using the existing ImageKit account, recording real file IDs and dimensions.
- [ ] Verify the live storefront renders both products, complete option combinations and the default cap variant.

### 2. Transactional database foundation

Files: migrations/001-commerce.sql, directus/commerce-schema.ts, src/server/commerce-db.ts, tests/commerce/database.integration.test.ts.

Interface: commerceTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T>.

- [ ] Write database tests proving unique variant/location balances, nonnegative on-hand/reserved quantities, no reserved quantity above on-hand, unique idempotency keys, unique order numbers and rollback.
- [ ] Run integration tests and observe missing migration/transaction failure.
- [ ] Add locations, inventory_balances, stock_movements, customers, customer_addresses, orders, order_lines, inventory_reservations, reservation_allocations and order_events. UUID identities, FK restrictions, checked integer amounts, audit fields and immutable line snapshots. Reserve with row locks in deterministic UUID order.
- [ ] Give the runtime service only the required transaction capability. Register tables/fields and relational editor views in Directus, with private public access and read-only staff order tables.
- [ ] Apply migrations to the confirmed development database and verify the test suite passes. Reapplication must be idempotent. Database connection requires valid TLS; do not disable certificate verification.

### 3. Order command and reservation release

Files: src/features/commerce/input.ts, order-service.ts, orders.server.ts, tests/commerce/orders.integration.test.ts.

Interfaces: placeOrder(input: OrderInput, key: string, actor: TrustedActor): Promise<OrderReceipt>; cancelOrder(orderId: string, actor: TrustedActor): Promise<void>. TrustedActor is website or authenticated staff with a allowed staff channel. OrderReceipt returns orderNumber and opaque receipt capability, never customer history.

- [ ] Write failing tests for last-unit website/staff concurrency, identical concurrent keys, mismatched-key fingerprint reuse, false prices, drafts, insufficient stock, invalid quantities, staff spoofing and duplicate cancellation.
- [ ] Validate request, deduplicate lines, lock authoritative catalogue and balance rows, calculate prices, create snapshots/customer-address records without unverified account linking, reserve stock and record order/audit events in one transaction.
- [ ] Store hashed receipt capability. Receipt reads require the capability or authorised staff session. Resent receipt access may not leak private information.
- [ ] Cancellation locks order/reservation rows, releases active allocations once, and records an event. No fulfilment/RTO state mutations in this slice.
- [ ] Run live integration tests, including rollback and concurrent commands, then verify no test leftovers affect the sample stock.

### 4. Development checkout and staff workflow

Files: src/routes/checkout.tsx, src/routes/orders.$receipt.tsx, src/features/commerce/functions.ts, src/features/commerce/CheckoutForm.tsx, staff order command adapter, tests/e2e/sample-checkout.spec.ts.

- [ ] Write browser tests for COD address/contact validation, server-authoritative totals, order number on confirmation, reload/retry receipt recovery, insufficient-stock errors, private confirmation denial and closed production/fixture checkout.
- [ ] Enable checkout only for the connected development environment. Show explicit test-order text, zero development shipping, no invented tax calculations, no phone-verified or message-sent claim. Clear bag only after persisted success; retain on errors.
- [ ] Support authorised staff command input through the same service and a staff-only authenticated interface. No arbitrary database row editing that bypasses reservations.
- [ ] Test a sample order in the browser and inspect order/line/reservation records in CMS. Keep one documented sample order so the user can inspect the complete journey.

### 5. Stock seed and acceptance

Files: directus/seed-sample-stock.ts, docs/sample-brand-guide.md, docs/sample-commerce-validation.md.

- [ ] Seed Sample Warehouse, balances 5/3/1/0 for Navy S/Navy M/White S/White M, and 8 for the default cap. Record opening stock movements; repeat runs must not reset stock altered by orders.
- [ ] Derive catalogue availability from on-hand less reservations. Keep quantity out of the variant record.
- [ ] Run typecheck, unit tests, live database integration tests, production build, client-secret scan, and desktop/mobile browser tests. Inspect outputs and fix actual failures.
- [ ] Conduct one fresh independent review per executing-plans, fix important findings with regressions, and document remaining production gates.

## Handoff

The user approved the written scope. This executable plan requires review before commerce product implementation per writing-plans. Existing catalogue sample setup proceeds independently. Direct database credentials are pending locally. No complete checkout claim is allowed before persisted order/reservation verification.
