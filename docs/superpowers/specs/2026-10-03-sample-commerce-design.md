# Sample brand through order creation

The user requested a complete sample brand journey in the development CMS and explicitly expanded scope to order creation and stock reservations. No paid provider integration is approved by this expansion.

## Sample catalogue

Use Polo Ralph Lauren as a reference from Ounass, explicitly labelled sample. A fictitious supplier application progresses from received through review to accepted, and links to the sample brand. This records the pattern without claiming a real supplier partnership. Clothing/Shirts and Accessories/Caps are global category classifications. Brand offerings are derived from its linked products. One shirt has colour/size variants; one cap has a default variant. Unique SKUs and canonical combinations identify the saleable units. Invented PKR prices and stock are development data. Media should use plainly labelled original sample illustrations, not invented manufacturer photography.

Staff can inspect products from the brand editor and variants/options/media from the product editor. Published department content merchandises the sample products. Published sample records remain restricted behind the existing server catalogue reader; Directus public access stays closed.

## Order and stock design

Implement server-authoritative COD order placement for development testing. No payment capture, OTP, courier booking or notification integration. Submitted phone numbers are unverified. The confirmation screen shows a persisted order number and a clear development-test notice. Do not claim an email/message was sent.

Both website and authorised staff callers use one order command. Origins are website, staff_whatsapp or staff_phone. The staff actor must be authenticated and recorded; user input cannot select an arbitrary actor. Draft staff orders do not reserve stock.

Required collections: locations, inventory_balances, stock_movements, customers, customer_addresses, orders, order_lines, inventory_reservations, reservation_allocations and order_events. Stable UUIDs identify records. Money is integer PKR minor units. Inventory belongs to variant/location, never department or channel. Availability is on-hand minus active reservations.

Use a single Postgres transaction through a server-only database connection or deployed Directus extension. Acquire stock row locks in deterministic order. Validate published product/brand/category/department, complete variants, prices and quantities. Calculate totals on the server, snapshot lines/address, create the order and reservation allocations, and commit together. Failure leaves neither a partial order nor held stock. Never emulate a transaction with sequential Directus REST writes.

A unique idempotency key plus request fingerprint returns the same receipt on retry and rejects mismatched reuse. The last-unit race across website/staff must allow exactly one successful order. Cancellation releases reservations exactly once. Shipment and RTO operations remain closed until their financial and physical stock policies are implemented.

Order status starts placed, payment status pending and payment method cod. This is a development order-processing slice, not a complete production commerce launch. No invoices, tax compliance claims, fulfilment or RTO automation are implied. No tax/shipping promises should be invented: development checkout explicitly uses zero shipping and no calculated tax, and must be gated from production.

## Privacy and access

Private customer/order details never enter the public catalogue response. Receipt retrieval requires an opaque secret capability or authenticated authorisation, not an enumerable order number. Store only a hash of receipt capability. Customer phone uniqueness is not proof of identity and must not link purchase history to an unverified requester. Directus staff order fields are read-only; stock adjustments and order cancellation use service commands with audit records.

## Verification

Prove real database transactions: concurrent last-unit purchases, duplicate same-key submissions, changed-key fingerprints, rollback after a failed write, price manipulation, insufficient stock, draft products, staff actor spoofing, reservation release retries, and private order reads. Browser test a sample product through persisted development order confirmation, then verify the order and reservation in CMS. Clearly distinguish fixtures from the live development database.

## Dependency

No direct Postgres connection exists in the current local environment. The user must configure COMMERCE_DATABASE_URL privately or provide Directus extension deployment access before atomic live transaction testing. Catalogue onboarding and CMS examples can proceed independently.
