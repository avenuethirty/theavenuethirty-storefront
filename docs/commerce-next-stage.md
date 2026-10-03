# Transactional commerce: next-stage design brief

This document records the agreed architecture and acceptance requirements. It does not authorise paid providers or represent implemented commerce.

## Shared operations

Website, staff-entered WhatsApp, and staff-entered phone orders call the same order service. Record channel, originating actor, timestamps, and an idempotency key. Draft staff orders do not reserve stock. Directus table permissions must prevent staff from bypassing the service.

Use stable customer and variant IDs independent of channel. Normalise phone numbers to E.164. Staff entry does not verify ownership. Customer-history access, account linking, and phone changes need separate permissions and audit events.

## Transactions and inventory

Proposed entities: sales_channels, customers, customer_identities, addresses, locations, inventory_balances, stock_movements, orders, order_lines, inventory_reservations, reservation_allocations, payment_attempts, payments, payment_allocations, refunds, shipments, shipment_events, returns, return_lines, invoices, invoice_lines, credit_notes, notification_outbox, and audit_events.

Create an order in one Postgres transaction: validate catalogue/pricing and delivery eligibility; snapshot product and address details; lock or atomically update eligible location balances; create reservations; create the order number; write outbox events. A unique idempotency key binds to a request fingerprint. A retry returns the same order. Conflicting key reuse fails.

Available stock equals on-hand minus active reservations. Shipment consumes the reservation and records physical stock movement. Cancellation/expiry releases reservations exactly once. Receiving an RTO parcel records inspection before sellable stock is restored. A courier status alone cannot restock it.

A proposed 24-hour bank-transfer deadline must distinguish unpaid orders from receipts awaiting staff verification. Never cancel an order already paid or under approved review because a delayed job used stale state. Pre-order supply and delivery promises are explicit policies, not invented estimates.

## Money and invoices

Use integer minor units and an explicit currency. Orders, payments, refunds, and invoices have separate identities and states. Snapshot line prices, discounts, tax components, shipping, and addresses at submission. Verify totals on the server.

Invoices capture immutable business/customer details, line amounts, numbering, issuance time, and source order. Corrections use credit notes or the confirmed local accounting procedure. Payment allocation and COD courier remittance are separate from invoice issuance. Authorised PDFs/print views must not be publicly enumerable. Confirm legal entity, tax registration, tax treatment, invoice series, and issuance timing before compliance-sensitive implementation.

## Providers and operational decisions still needed

- COD eligibility, partial-deposit rules, and verification thresholds.
- Phone verification provider, message channel, resend windows, expiry, attempt limits, and recovery.
- Selected prepaid provider and its actual enabled methods, webhook verification, reconciliation, and refund support.
- Courier provider, booking credentials, labels, tracking event mapping, COD settlements, and RTO process.
- Private receipt storage, upload type/size limits, malware handling, reviewer permissions, and retention.
- Transactional email/message provider, consent and delivery policy, retries, deduplication, and dead-letter review.
- Warehouse, service areas, shipping prices, handling times, return windows, and warranty policy.

Prefer open-source/self-hosted or local options. Present purpose, costs, and alternatives, then obtain explicit approval before integrating a paid service. No provider is approved by this document.

## Implementation order and acceptance

1. Postgres migrations, constrained money/status columns, immutable snapshots, ledger entries, and least-privilege service access.
2. Atomic order/reservation command with website and staff adapters. Test simultaneous last-unit purchases across both channels, deadlocks/retries, duplicate submissions, and insufficient stock.
3. Verified customer identity and staff authorisation. Test unverified account linking and cross-customer history denial.
4. Payment/deposit/receipt workflow. Test forged/duplicate/out-of-order webhooks, partial allocations, refunds, and expiry racing with approval.
5. Invoices, credit notes, and authorised PDF/print. Test numbering concurrency, immutable totals, adjustments, and channel consistency.
6. Fulfilment/RTO and notification outbox. Test duplicate events, failed delivery, inspection before restock, retry exhaustion, and reconciliation.
7. Recovery runbooks, backups, observability, and a release checklist based on real provider sandbox and operational evidence.

Separate executable implementation plans follow once the required policies and providers are confirmed. Do not open checkout before these acceptance gates pass.
